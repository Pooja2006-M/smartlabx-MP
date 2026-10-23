import { useState, useEffect, useRef, useCallback } from 'react';
import { logSecurityEvent } from '../utils/liveTracker';

const HTTP_PROCTOR_URL    = 'http://localhost:8000/api/proctor/frame';
const FALLBACK_PROCTOR_URL = '/api/proctor/process-frame';
const POLL_MS             = 350;   // send frame every 350ms (~3 FPS)
const DISCONNECT_MS       = 6000;  // 6s no response → show disconnected
const CAMERA_UNAVAILABLE_MESSAGE = 'Camera access is unavailable. Open the exam in a supported browser over HTTPS or localhost.';

function cameraErrorMessage(err) {
  if (err?.name === 'NotAllowedError') {
    return 'Allow camera access in your browser to enable live exam monitoring.';
  }
  if (err?.name === 'NotFoundError') {
    return 'No camera was found. Connect a camera to enable live exam monitoring.';
  }
  return 'Camera could not start. Check that it is connected and not being used by another app.';
}

export default function useProctoring({ studentId = 'STU_DEMO', enabled = true, onAlert = () => {} }) {
  const [isStreaming, setIsStreaming]     = useState(false);
  const [cameraError, setCameraError]     = useState(() => (
    navigator.mediaDevices?.getUserMedia ? '' : CAMERA_UNAVAILABLE_MESSAGE
  ));
  const [isConnected, setIsConnected]     = useState(false);
  const [warningCount, setWarningCount]   = useState(0);
  const [anomalies, setAnomalies]         = useState([]);
  const [telemetry, setTelemetry]         = useState({
    face_detected: null, face_count: null,
    gaze_state: 'looking_forward',
    head_pose: { yaw: 0, pitch: 0, roll: 0, warning: false },
    reticle_pct: [0.5, 0.5],
    liveness: { liveness_pass: true, total_blinks: 0 },
    identity_ok: null, dominant_emotion: 'neutral',
    phone_detected: false, extra_person_detected: false,
    detected_boxes: [], prohibited_items: [],
    object_detection_status: 'INITIALIZING', object_detection_error: null,
    anomaly_score: 0, risk_level: 'LOW', server_status: 'ONLINE',
  });

  // Offscreen capture element — ALWAYS alive, independent of what the UI renders.
  // This guarantees frames keep flowing even if the visible <video> unmounts
  // (e.g. the HUD is minimised) or the stream is swapped.
  const [captureVideo] = useState(() => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;
    return v;
  });

  // Refs — never trigger re-renders or effect restarts
  const videoRef        = useRef(null);   // visible display element (HUD)
  const canvasRef       = useRef(document.createElement('canvas'));
  const streamRef       = useRef(null);
  const timerRef        = useRef(null);
  const watchdogRef     = useRef(null);
  const busyRef         = useRef(false);
  const lastOkRef       = useRef(0);
  const sidRef          = useRef(studentId);
  const onAlertRef      = useRef(onAlert);

  // Keep ref values current
  useEffect(() => { sidRef.current = studentId; }, [studentId]);
  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);

  // ── Frame sender — sends camera frame to FastAPI ─────────────────────────
  const sendFrame = useCallback(async () => {
    if (busyRef.current) return; // skip if previous request still in flight

    const vid = captureVideo;
    // Only need readyState >= 1 (HAVE_METADATA) for a live camera stream
    if (!vid || vid.readyState < 1) return;

    busyRef.current = true;
    try {
      // Draw current camera frame to canvas
      const canvas = canvasRef.current;
      canvas.width  = 640;
      canvas.height = 480;
      canvas.getContext('2d').drawImage(vid, 0, 0, 640, 480);
      const b64 = canvas.toDataURL('image/jpeg', 0.82);
      const sid = sidRef.current;

      // Try direct FastAPI first, then fallback to Node proxy
      let res;
      try {
        res = await fetch(HTTP_PROCTOR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: sid, image_base64: b64 }),
        });
      } catch (_) {
        try {
          res = await fetch(FALLBACK_PROCTOR_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: sid, image_base64: b64 }),
          });
        } catch (_2) { /* both failed */ }
      }

      if (res?.ok) {
        const json = await res.json();
        const t = json?.telemetry;
        if (t) {
          lastOkRef.current = Date.now();
          setIsConnected(true);
          setTelemetry(t);

          if (t.anomalies?.length > 0) {
            setAnomalies(t.anomalies);
            setWarningCount(c => c + 1);
            const primary = t.anomalies[0];
            onAlertRef.current({ title: primary.message, code: primary.code, severity: primary.severity, score: t.anomaly_score });
            logSecurityEvent({ studentId: sid, type: 'PROCTOR_ANOMALY', message: `${primary.message} (Risk: ${t.risk_level})` });
          } else {
            setAnomalies([]);
          }
        }
      } else {
        if (Date.now() - lastOkRef.current > DISCONNECT_MS) setIsConnected(false);
      }
    } catch (_e) {
      if (Date.now() - lastOkRef.current > DISCONNECT_MS) setIsConnected(false);
    } finally {
      busyRef.current = false;
    }
  }, [captureVideo]); // stable

  // ── Main effect — runs once on mount ─────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const attach = (stream) => {
      streamRef.current = stream;

      // Offscreen capture element (always kept alive)
      captureVideo.srcObject = stream;
      const cp = captureVideo.play();
      if (cp && cp.catch) cp.catch(() => {});

      // Visible display element (may remount when HUD expands/collapses)
      const attachDisplay = (vid) => {
        vid.srcObject = stream;
        const p = vid.play();
        if (p && p.catch) p.catch(() => {});
      };
      if (videoRef.current) {
        attachDisplay(videoRef.current);
      } else {
        let attempts = 0;
        const poll = setInterval(() => {
          attempts++;
          if (videoRef.current) {
            attachDisplay(videoRef.current);
            clearInterval(poll);
          } else if (attempts > 25) {
            clearInterval(poll);
          }
        }, 200);
      }

      setIsStreaming(true);
      setCameraError('');
    };

    const getCamera = () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      navigator.mediaDevices
        .getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 20 } }, audio: false })
        .then((stream) => {
          if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
          attach(stream);
          // If a device disconnects / stream ends, auto-recover
          stream.getVideoTracks().forEach((track) => {
            track.onended = () => { if (alive) setTimeout(getCamera, 800); };
          });
        })
        .catch((err) => {
          console.error('[Proctor] ❌ Camera error:', err.name, err.message);
          if (alive) setCameraError(cameraErrorMessage(err));
        });
    };

    getCamera();

    // Poll frames
    timerRef.current = setInterval(sendFrame, POLL_MS);

    // Watchdog — re-acquire the camera if the stream dies for any reason
    watchdogRef.current = setInterval(() => {
      const st = streamRef.current;
      const hasLive = st && st.getVideoTracks().some((t) => t.readyState === 'live');
      if (!hasLive) getCamera();
    }, 3000);

    return () => {
      alive = false;
      clearInterval(timerRef.current);
      clearInterval(watchdogRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      captureVideo.srcObject = null;
      setIsStreaming(false);
      setCameraError('');
      setIsConnected(false);
    };
  }, [enabled, studentId, captureVideo, sendFrame]);

  return { videoRef, isStreaming, cameraError, isConnected, telemetry, anomalies, warningCount };
}
