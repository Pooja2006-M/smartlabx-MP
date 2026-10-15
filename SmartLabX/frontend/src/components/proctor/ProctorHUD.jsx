import React, { useState, useMemo, useRef } from 'react';
import useProctoring from '../../hooks/useProctoring';

export default function ProctorHUD({ studentId = 'STU_DEMO', studentName = 'Student', onExamEnd = () => {} }) {
  const [minimized, setMinimized] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const { videoRef, isStreaming, cameraError, isConnected, telemetry, anomalies, warningCount } = useProctoring({
    studentId,
    enabled: true,
  });

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      default: return '#10b981';
    }
  };

  // Play short subtle beep on critical violation
  const lastBeepRef = React.useRef(0);
  React.useEffect(() => {
    if (anomalies.length > 0 && (telemetry.phone_detected || (telemetry.face_count && telemetry.face_count > 1) || !telemetry.face_detected)) {
      const now = Date.now();
      if (now - lastBeepRef.current > 4000) {
        lastBeepRef.current = now;
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          }
        } catch (e) {}
      }
    }
  }, [anomalies, telemetry]);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await fetch('/api/proctor/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });
      const data = await res.json();
      if (data.download_url) {
        window.open(`http://localhost:8000${data.download_url}`, '_blank');
        setPdfDownloaded(true);
      }
    } catch (e) {
      alert('Report server is processing logs. Please retry in a moment.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const faceCount = telemetry.face_count !== undefined ? telemetry.face_count : (telemetry.face_detected ? 1 : 0);
  const isMultipleFaces = faceCount > 1 || telemetry.extra_person_detected;

  // bannerKey: only tracks CRITICAL booleans — NOT gaze_state (which flickers every frame)
  // gaze info still displayed live but doesn't cause banner re-animation
  const bannerKey = [
    isConnected ? 'connected' : 'waiting',
    telemetry.face_detected ? '1' : '0',
    telemetry.phone_detected ? '1' : '0',
    (telemetry.extra_person_detected || isMultipleFaces) ? '1' : '0',
  ].join('-');

  const bannerTimestampRef = useRef(new Date().toLocaleTimeString());
  const prevBannerKeyRef = useRef(bannerKey);
  if (prevBannerKeyRef.current !== bannerKey) {
    prevBannerKeyRef.current = bannerKey;
    bannerTimestampRef.current = new Date().toLocaleTimeString();
  }

  // Live gaze / head pose shown in banner (updates without re-animating)
  const gazeState  = telemetry.gaze_state || 'looking_forward';
  const headPose   = telemetry.head_pose;

  const bannerData = useMemo(() => {
    if (!isConnected) {
      return { icon: '⏳', title: 'AI PROCTOR — WAITING FOR DETECTION', message: 'AI Analysis: Waiting for a response from the proctoring engine. Detection status is not available yet.', bg: 'rgba(120, 53, 15, 0.97)', border: '#fbbf24', severity: 'WAITING' };
    } else if (!telemetry.face_detected) {
      return { icon: '⚠️', title: 'FACE NOT DETECTED — Student Absent', message: 'AI Analysis: Student has moved out of frame. Possible reasons: left seat, camera covered, or turned away. Immediate return required.', bg: 'rgba(185, 28, 28, 0.97)', border: '#fca5a5', severity: 'CRITICAL' };
    } else if (telemetry.phone_detected) {
      return { icon: '📱', title: 'PROHIBITED DEVICE — Mobile Phone Detected', message: 'AI Analysis: A mobile phone or electronic device is visible in frame. Direct exam violation. Incident logged.', bg: 'rgba(185, 28, 28, 0.97)', border: '#f87171', severity: 'CRITICAL' };
    } else if (telemetry.extra_person_detected || isMultipleFaces) {
      return { icon: '👥', title: `MULTIPLE PERSONS — ${faceCount} faces in frame`, message: 'AI Analysis: More than one person visible. Only the enrolled student should be present. Possible external assistance.', bg: 'rgba(157, 23, 77, 0.97)', border: '#fda4af', severity: 'CRITICAL' };
    } else {
      return { icon: '✅', title: 'EXAM MONITOR — ALL CLEAR', message: 'AI Analysis: Student focused on screen. No critical violations detected. Proctoring active.', bg: 'rgba(6, 95, 70, 0.97)', border: '#6ee7b7', severity: 'OK' };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerKey]);

  // Gaze warning shown as live overlay on banner (no re-animation)
  const gazeWarning = gazeState !== 'looking_forward' ? (
    gazeState === 'looking_left'  ? '👁️ GAZE: Looking Left' :
    gazeState === 'looking_right' ? '👁️ GAZE: Looking Right' :
    gazeState === 'looking_down'  ? '👇 GAZE: Looking Down' :
    gazeState === 'looking_up'    ? '☝️ GAZE: Looking Up' : null
  ) : null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Full-Screen Warning for Multiple People Detection */}
      {isMultipleFaces && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(153, 27, 27, 0.95)',
          backdropFilter: 'blur(12px)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          textAlign: 'center',
          padding: 40,
        }}>
          <span style={{ fontSize: '100px', animation: 'pulse 1.5s infinite' }}>👥</span>
          <h1 style={{ fontSize: '48px', fontWeight: 900, marginTop: '20px', letterSpacing: '0.05em' }}>
            MULTIPLE PEOPLE DETECTED
          </h1>
          <p style={{ fontSize: '24px', maxWidth: '800px', marginTop: '20px', lineHeight: 1.5 }}>
            Our AI has detected <b>{faceCount} people</b> in the camera frame.<br/>
            Safe Exam Browser requires you to be completely alone during the exam.
          </p>
          <div style={{ 
            marginTop: '40px', 
            background: 'rgba(0,0,0,0.5)', 
            padding: '16px 32px', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <p style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: '#fca5a5' }}>
              ⚠️ Please ask others to leave the room immediately.
            </p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.8 }}>
              This violation has been logged. The exam will remain locked until you are alone.
            </p>
          </div>
        </div>
      )}

      {minimized ? (
        /* Minimized Pill View */
        <button
          onClick={() => setMinimized(false)}
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${getRiskColor(telemetry.risk_level)}`,
            borderRadius: 30,
            padding: '10px 18px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isConnected ? getRiskColor(telemetry.risk_level) : '#94a3b8',
            boxShadow: isConnected ? `0 0 10px ${getRiskColor(telemetry.risk_level)}` : 'none',
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>
            {isConnected ? `AI PROCTOR (${telemetry.risk_level})` : 'AI CONNECTING...'}
          </span>
          {anomalies.length > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 800,
            }}>
              🚨 {anomalies.length}
            </span>
          )}
        </button>
      ) : (
        /* Expanded HUD Window */
        <div style={{
          width: 330,
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(16px)',
          border: `2px solid ${anomalies.length > 0 || isMultipleFaces || telemetry.phone_detected ? '#ef4444' : 'rgba(99, 102, 241, 0.3)'}`,
          borderRadius: 16,
          boxShadow: anomalies.length > 0 
            ? '0 0 35px rgba(239, 68, 68, 0.35), 0 20px 50px rgba(0, 0, 0, 0.7)'
            : '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
          color: '#e2e8f0',
        }}>
          {/* HUD Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: isConnected ? (isMultipleFaces || telemetry.phone_detected ? '#ef4444' : '#10b981') : '#f59e0b',
                boxShadow: `0 0 8px ${isConnected ? (isMultipleFaces || telemetry.phone_detected ? '#ef4444' : '#10b981') : '#f59e0b'}`,
              }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', color: '#f8fafc' }}>
                  INVIGILMNCE AI HUD — {studentName}
                </span>
                <div style={{ fontSize: 9, color: isConnected ? '#10b981' : '#f59e0b', fontWeight: 600, marginTop: -2 }}>
                  {cameraError
                    ? '○ CAMERA ACCESS REQUIRED'
                    : isConnected
                      ? '● REAL-TIME PROCTOR ACTIVE'
                      : isStreaming
                        ? '○ CONNECTING TO AI ENGINE (Port 8000)...'
                        : '○ STARTING CAMERA...'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setMinimized(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                —
              </button>
            </div>
          </div>

          {cameraError && (
            <div role="alert" style={{
              background: 'rgba(127, 29, 29, 0.92)',
              borderBottom: '1px solid rgba(248, 113, 113, 0.5)',
              padding: '8px 12px',
              color: '#fecaca',
              fontSize: 10.5,
              fontWeight: 700,
              lineHeight: 1.5,
            }}>
              {cameraError}
            </div>
          )}

          {/* Active Warnings Alert Box */}
          {anomalies.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.25)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'pulse 1.5s infinite',
            }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#fca5a5', letterSpacing: '0.02em' }}>
                  PROCTORING VIOLATION DETECTED
                </div>
                {anomalies.map((anomaly) => (
                  <div key={anomaly.code} style={{ fontSize: 10.5, color: '#ffffff', fontWeight: 600, marginTop: 2 }}>
                    {anomaly.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          {telemetry.object_detection_status === 'ERROR' && (
            <div
              title={telemetry.object_detection_error || 'Object detection could not start.'}
              style={{
                background: 'rgba(127, 29, 29, 0.92)',
                borderBottom: '1px solid rgba(248, 113, 113, 0.5)',
                padding: '6px 12px',
                color: '#fecaca',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              OBJECT DETECTION UNAVAILABLE: {telemetry.object_detection_error || 'Check AI service setup.'}
            </div>
          )}

          {/* Camera Feed Visualizer & Gaze Reticle */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: 170,
            background: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {/* Live Camera Feed */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.85,
                transform: 'scaleX(-1)', // Mirror effect
              }}
            />

            {/* Grid Reticle background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }} />

            {/* Detected Object Overlays */}
            {telemetry.detected_boxes && telemetry.detected_boxes.map((boxItem, bIdx) => {
              if (!boxItem.box) return null;
              const [x1, y1, x2, y2] = boxItem.box;
              const leftPct = (x1 / 640) * 100;
              const topPct = (y1 / 480) * 100;
              const widthPct = ((x2 - x1) / 640) * 100;
              const heightPct = ((y2 - y1) / 480) * 100;
              const isPhone = boxItem.label.includes('phone');
              const isPerson = boxItem.label.includes('person');
              const color = isPhone ? '#ef4444' : (isPerson ? '#3b82f6' : '#f59e0b');

              return (
                <div key={bIdx} style={{
                  position: 'absolute',
                  // Because video is mirrored scaleX(-1), mirror X coordinates
                  right: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                  border: `2px dashed ${color}`,
                  borderRadius: 4,
                  pointerEvents: 'none',
                  zIndex: 12,
                }}>
                  <span style={{
                    position: 'absolute',
                    top: -16,
                    left: 0,
                    background: color,
                    color: '#fff',
                    fontSize: 8.5,
                    fontWeight: 800,
                    padding: '1px 4px',
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                  }}>
                    {boxItem.label.toUpperCase()} {boxItem.conf ? `${Math.round(boxItem.conf * 100)}%` : ''}
                  </span>
                </div>
              );
            })}

            {/* Gaze Pointer Reticle */}
            <div style={{
              position: 'absolute',
              left: `${telemetry.reticle_pct ? telemetry.reticle_pct[0] * 100 : 50}%`,
              top: `${telemetry.reticle_pct ? telemetry.reticle_pct[1] * 100 : 50}%`,
              width: 22,
              height: 22,
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${telemetry.gaze_state === 'looking_forward' ? '#10b981' : '#ef4444'}`,
              borderRadius: '50%',
              boxShadow: `0 0 12px ${telemetry.gaze_state === 'looking_forward' ? '#10b981' : '#ef4444'}`,
              transition: 'all 0.15s ease-out',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <div style={{
                width: 4,
                height: 4,
                background: telemetry.gaze_state === 'looking_forward' ? '#10b981' : '#ef4444',
                borderRadius: '50%',
                margin: '7px auto',
              }} />
            </div>

            {/* Top-Left: ID Status */}
            <div style={{
              position: 'absolute',
              top: 6,
              left: 8,
              background: 'rgba(0,0,0,0.7)',
              padding: '3px 7px',
              borderRadius: 5,
              fontSize: 9.5,
              fontWeight: 700,
              color: telemetry.identity_ok ? '#6ee7b7' : '#fca5a5',
              border: `1px solid ${telemetry.identity_ok ? 'rgba(110,231,183,0.3)' : 'rgba(252,165,165,0.3)'}`,
            }}>
              ID: {telemetry.identity_ok === true ? 'VERIFIED [OK]' : (telemetry.identity_ok === false ? 'MISMATCH [!]' : 'CHECKING...')}
            </div>

            {/* Top-Right: Face Count Badge (Critical!) */}
            <div style={{
              position: 'absolute',
              top: 6,
              right: 8,
              background: isMultipleFaces ? 'rgba(220, 38, 38, 0.9)' : (faceCount === 0 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(0,0,0,0.7)'),
              padding: '3px 8px',
              borderRadius: 5,
              fontSize: 9.5,
              fontWeight: 800,
              color: '#fff',
              border: `1px solid ${isMultipleFaces ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: isMultipleFaces ? '0 0 10px rgba(239, 68, 68, 0.8)' : 'none',
            }}>
              {!isConnected ? '⏳ CHECKING...' : (isMultipleFaces ? `⚠️ ${faceCount} PEOPLE DETECTED!` : (faceCount === 0 ? '❌ NO FACE' : `👤 ${faceCount} PERSON [OK]`))}
            </div>

            {/* Bottom-Left: Head Pose Angle */}
            <div style={{
              position: 'absolute',
              bottom: 6,
              left: 8,
              background: 'rgba(0,0,0,0.7)',
              padding: '3px 7px',
              borderRadius: 5,
              fontSize: 9,
              fontFamily: 'monospace',
              color: telemetry.head_pose?.warning ? '#fca5a5' : '#94a3b8',
              border: `1px solid ${telemetry.head_pose?.warning ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              YAW: {telemetry.head_pose?.yaw || 0}° | PITCH: {telemetry.head_pose?.pitch || 0}°
            </div>

            {/* Bottom-Right: Phone / Prohibited Item Badge */}
            <div style={{
              position: 'absolute',
              bottom: 6,
              right: 8,
              background: telemetry.phone_detected ? 'rgba(220, 38, 38, 0.95)' : 'rgba(0,0,0,0.7)',
              padding: '3px 8px',
              borderRadius: 5,
              fontSize: 9.5,
              fontWeight: 800,
              color: telemetry.phone_detected ? '#fff' : '#94a3b8',
              border: `1px solid ${telemetry.phone_detected ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: telemetry.phone_detected ? '0 0 12px rgba(239, 68, 68, 0.8)' : 'none',
            }}>
              {telemetry.phone_detected ? '📱 PHONE DETECTED! 🚨' : '📱 NO PHONE'}
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div style={{ padding: '10px 12px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              fontSize: 11,
              marginBottom: 10,
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 600 }}>GAZE TRACKING</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: telemetry.gaze_state === 'looking_forward' ? '#10b981' : '#f59e0b', marginTop: 1 }}>
                  {telemetry.gaze_state.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 600 }}>RISK SCORE</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: getRiskColor(telemetry.risk_level), marginTop: 1 }}>
                  {telemetry.anomaly_score} / 100 ({telemetry.risk_level})
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                }}
              >
                {isGeneratingPdf ? 'Generating PDF...' : '📄 Download PDF Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Proctor Bottom Banner — STATIC, no animation, no blink */}
      {bannerData && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: bannerData.bg,
            color: 'white',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderTop: `3px solid ${bannerData.border}`,
            boxShadow: '0 -6px 24px rgba(0,0,0,0.35)',
            // NO animation property — completely static, never blinks
          }}
        >
          <span style={{ fontSize: '26px', flexShrink: 0, lineHeight: 1 }}>{bannerData.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontWeight: '900', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {bannerData.title}
              <span style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 800,
                background: bannerData.severity === 'CRITICAL' ? 'rgba(127,29,29,0.9)' : 'rgba(6,78,59,0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>{bannerData.severity}</span>
              {/* Live gaze warning — updates without re-animating banner */}
              {gazeWarning && (
                <span style={{
                  fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                  background: 'rgba(120,53,15,0.85)', border: '1px solid rgba(252,211,77,0.4)',
                }}>{gazeWarning}</span>
              )}
            </div>
            <div style={{ fontSize: '11px', fontWeight: '500', marginTop: '2px', opacity: 0.85, lineHeight: 1.4 }}>
              {bannerData.message}
            </div>
          </div>
          <div style={{ fontSize: '9px', opacity: 0.55, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'monospace' }}>
            🕐 {bannerTimestampRef.current}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.88; }
        }
      `}</style>
    </div>
  );
}
