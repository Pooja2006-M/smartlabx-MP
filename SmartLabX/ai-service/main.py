"""
InvigiLMNce — FastAPI Microservice & Real-Time AI Proctoring Gateway
Integrates AI Invigilation (MediaPipe, DeepFace, YOLO, Anomaly Engine) with SmartLabX
"""

import os
import time
import base64
import cv2
import numpy as np
import io
import threading
try:
    import winsound
except ImportError:
    winsound = None
from PIL import Image

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional

from modules import config
from modules import face_utils
from modules import gaze_pose
from modules import liveness
from modules import emotion_utils
from modules import object_detection
from modules import anomaly_engine
from modules import screenshot_utils
from modules import logger
from modules.llm_engine import get_llm_suggestion
from modules.mouth_detection import TalkingDetector
from modules.earphone_detection import EarphoneDetector
from modules.hand_gesture import HandGestureDetector

app = FastAPI(
    title="InvigiLMNce AI Proctoring API",
    description="Real-time AI proctoring backend microservice for SmartLabX Virtual Lab",
    version="1.0.0"
)

# Enable CORS for SmartLabX frontend & backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances for reuse
face_mesh_tracker = gaze_pose.FaceMeshTracker()
hand_gesture_detector = HandGestureDetector()

# In-memory session trackers per student
active_sessions = {}


@app.on_event("startup")
def _warmup_models():
    """Pre-load heavy models so the first exam frame is not slow."""
    def _warm():
        try:
            object_detection._get_model()
            dummy = np.zeros((480, 640, 3), dtype=np.uint8)
            object_detection.detect_objects(dummy)
            print("[warmup] YOLO ready")
        except Exception as e:
            print(f"[warmup] YOLO warmup failed: {e}")
    threading.Thread(target=_warm, daemon=True).start()

class EnrollRequest(BaseModel):
    student_id: str
    image_base64: str

class FrameProcessRequest(BaseModel):
    student_id: str
    image_base64: str
    timestamp: float = None

def _async_verify(sess: dict, student_id: str, frame_bgr) -> None:
    try:
        v_result = face_utils.verify_identity(student_id, frame_bgr)
        if v_result["error"] is None:
            sess["identity_ok"] = v_result["verified"]
    except Exception:
        pass
    finally:
        sess["verify_busy"] = False


def _async_emotion(sess: dict, frame_bgr) -> None:
    try:
        emo = emotion_utils.analyze_emotion(frame_bgr)
        if emo and emo.get("dominant_emotion"):
            sess["dominant_emotion"] = emo["dominant_emotion"]
    except Exception:
        pass
    finally:
        sess["emotion_busy"] = False


def _async_llm(sess: dict, telemetry: dict) -> None:
    try:
        sess["last_llm"] = get_llm_suggestion(telemetry)
    except Exception:
        pass
    finally:
        sess["llm_busy"] = False


def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decodes base64 string (with or without data header) into OpenCV BGR image."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        frame_rgb = np.array(img)
        frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
        return frame_bgr
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None


def _process_frame_full(student_id: str, frame_bgr: np.ndarray) -> dict:
    """
    Core frame processing pipeline shared by both HTTP and WebSocket handlers.
    Runs MediaPipe, head pose, gaze, blink, YOLO, emotion, identity, anomaly engine.
    Returns the full telemetry dict.
    """
    now = time.time()
    h, w = frame_bgr.shape[:2]

    # Initialize session if new student
    if student_id not in active_sessions:
        active_sessions[student_id] = {
            "session_start": now,
            "frame_idx": 0,
            "last_verify_t": 0,
            "last_emotion_t": 0,
            "identity_ok": None,
            "dominant_emotion": "neutral",
            "blink_tracker": liveness.BlinkTracker(),
            "anomaly_engine": anomaly_engine.AnomalyEngine(),
            "last_phone_detected": False,
            "last_phone_time": 0,
            "last_extra_persons": False,
            "last_extra_persons_time": 0,
            "last_persons_count": 1,
            "detected_boxes": [],
            "prohibited_items": [],
            "object_detection_status": "INITIALIZING",
            "object_detection_error": None,
            # ── New detectors ──
            "talking_detector": TalkingDetector(),
            "earphone_detector": EarphoneDetector(),
            "last_talking": False,
            "last_earphone": False,
            "last_earphone_side": None,
            "last_earphone_conf": 0.0,
            "last_hand_result": {},
            "last_book_detected": False,
            "last_book_time": 0,
            "verify_busy": False,
            "emotion_busy": False,
            "llm_busy": False,
            "last_llm": None,
        }

    sess = active_sessions[student_id]
    sess["frame_idx"] += 1
    frame_idx = sess["frame_idx"]

    # ── 1. MediaPipe FaceMesh ────────────────────────────────────────────
    mesh_result = face_mesh_tracker.process(frame_bgr)
    mp_face_count = len(mesh_result.face_landmarks) if (mesh_result and mesh_result.face_landmarks) else 0

    # Fast secondary cascade face detection (for side angles & background faces)
    cascade_count, cascade_boxes = face_utils.detect_faces_cascade(frame_bgr)

    yaw = pitch = roll = 0.0
    gaze_h = gaze_v = None
    is_away = False
    no_blink_suspect = False
    gaze_state = "looking_forward"
    reticle_pct = [0.5, 0.5]
    head_pose_warning = False

    if mp_face_count >= 1:
        landmarks = mesh_result.face_landmarks[0]

        # Head pose estimation
        pose = gaze_pose.estimate_head_pose(landmarks, w, h)
        if pose:
            yaw, pitch, roll = pose

        # Gaze estimation
        gaze = gaze_pose.estimate_gaze_ratio(landmarks, w, h)
        if gaze:
            gaze_h, gaze_v = gaze
            reticle_pct = [float(gaze_h), float(gaze_v)]

        # Looking away check with directional gaze state
        is_away = gaze_pose.is_looking_away(
            yaw, pitch, gaze_h, gaze_v,
            config.YAW_LIMIT_DEG, config.PITCH_LIMIT_DEG,
        )

        head_pose_warning = abs(yaw) > config.YAW_LIMIT_DEG or abs(pitch) > config.PITCH_LIMIT_DEG

        # Directional gaze state for frontend banner
        if not is_away:
            gaze_state = "looking_forward"
        elif pitch > config.PITCH_LIMIT_DEG:
            gaze_state = "looking_up"
        elif pitch < -config.PITCH_LIMIT_DEG:
            gaze_state = "looking_down"
        elif yaw > config.YAW_LIMIT_DEG:
            gaze_state = "looking_right"
        elif yaw < -config.YAW_LIMIT_DEG:
            gaze_state = "looking_left"
        else:
            gaze_state = "looking_away"

        # Blink liveness tracking
        sess["blink_tracker"].update(landmarks, w, h)
        no_blink_suspect = sess["blink_tracker"].suspect_no_blink()

        # ── NEW: Talking / Whispering Detection (MAR) ──
        try:
            sess["talking_detector"].update(landmarks, w, h)
            sess["last_talking"] = sess["talking_detector"].is_talking
        except Exception:
            pass

        # ── NEW: Earphone Detection (ear landmarks) ──
        if frame_idx % config.EARPHONE_DETECT_FRAME_SKIP == 0:
            try:
                ear_result = sess["earphone_detector"].detect(frame_bgr, landmarks, w, h)
                sess["last_earphone"] = ear_result.get("detected", False)
                sess["last_earphone_side"] = ear_result.get("side")
                sess["last_earphone_conf"] = ear_result.get("confidence", 0.0)
            except Exception:
                pass

    blink_stats = {
        "liveness_pass": not no_blink_suspect,
        "total_blinks": sess["blink_tracker"].blink_count,
        "seconds_since_last_blink": round(sess["blink_tracker"].seconds_since_last_blink(), 1),
    }

    # ── NEW: Talking state ──
    talking_detected = sess.get("last_talking", False)

    # ── NEW: Earphone state ──
    earphone_detected = sess.get("last_earphone", False)
    earphone_side = sess.get("last_earphone_side")
    earphone_confidence = sess.get("last_earphone_conf", 0.0)

    # ── 2. Periodic Identity Verification (DeepFace) — background thread ──
    if mp_face_count >= 1 and (now - sess["last_verify_t"]) >= config.FACE_VERIFY_INTERVAL_SEC:
        sess["last_verify_t"] = now
        if not sess.get("verify_busy"):
            sess["verify_busy"] = True
            ref_path = face_utils.get_reference_path(student_id)
            if ref_path:
                threading.Thread(target=_async_verify, args=(sess, student_id, frame_bgr.copy()), daemon=True).start()
            else:
                sess["identity_ok"] = True  # Grace mode if not enrolled
                sess["verify_busy"] = False

    # ── 3. Periodic Emotion Analysis (DeepFace) — background thread ───────
    if mp_face_count >= 1 and (now - sess["last_emotion_t"]) >= config.EMOTION_ANALYZE_INTERVAL_SEC:
        sess["last_emotion_t"] = now
        if not sess.get("emotion_busy"):
            sess["emotion_busy"] = True
            threading.Thread(target=_async_emotion, args=(sess, frame_bgr.copy()), daemon=True).start()

    # ── 4. YOLO Object & Person Detection ────────────────────────────────
    phone_detected = False
    book_detected = False
    extra_persons = False
    persons_count = sess["last_persons_count"]
    detected_boxes = sess["detected_boxes"]
    prohibited_items = sess["prohibited_items"]

    if frame_idx % config.HEAVY_MODEL_FRAME_SKIP == 0 or frame_idx <= 2:
        yolo_res = object_detection.detect_objects(frame_bgr)
        if yolo_res["error"] is None:
            sess["object_detection_status"] = "ONLINE"
            sess["object_detection_error"] = None
            raw_phone = yolo_res["phone_detected"]
            raw_book = yolo_res.get("book_detected", False)
            raw_persons = yolo_res.get("persons", 0) or 0
            detected_boxes = yolo_res.get("boxes", [])
            prohibited_items = yolo_res.get("prohibited_items", [])

            sess["last_persons_count"] = raw_persons
            sess["detected_boxes"] = detected_boxes
            sess["prohibited_items"] = prohibited_items

            if raw_phone:
                sess["last_phone_detected"] = True
                sess["last_phone_time"] = now
            elif (now - sess["last_phone_time"]) > 2.0:
                sess["last_phone_detected"] = False

            # Book / paper sticky detection
            if raw_book:
                sess["last_book_detected"] = True
                sess["last_book_time"] = now
            elif (now - sess.get("last_book_time", 0)) > 2.0:
                sess["last_book_detected"] = False

            # Extra persons with improved temporal smoothing
            if raw_persons > 1:
                sess["last_extra_persons"] = True
                sess["last_extra_persons_time"] = now
            elif (now - sess["last_extra_persons_time"]) > config.EXTRA_PERSON_STICKY_SECONDS:
                sess["last_extra_persons"] = False
        else:
            sess["object_detection_status"] = "ERROR"
            sess["object_detection_error"] = yolo_res["error"]

    phone_detected = sess["last_phone_detected"]
    book_detected = sess.get("last_book_detected", False)
    extra_persons = sess["last_extra_persons"]
    persons_count = sess["last_persons_count"]

    # ── 4b. Hand Gesture Detection ──────────────────────────────────────
    hand_result = sess.get("last_hand_result", {})
    if frame_idx % config.HAND_DETECT_FRAME_SKIP == 0:
        try:
            hand_result = hand_gesture_detector.detect(frame_bgr)
            sess["last_hand_result"] = hand_result
        except Exception:
            pass

    # Comprehensive multi-source face count
    face_landmarks = mesh_result.face_landmarks if mesh_result and mesh_result.face_landmarks else []
    face_count = face_utils.count_unique_faces(face_landmarks, cascade_boxes, w, h)
    face_count = max(face_count, mp_face_count, cascade_count)
    if persons_count > face_count and persons_count > 1:
        face_count = persons_count

    # ── 5. Anomaly Engine Evaluation ─────────────────────────────────────
    fired = sess["anomaly_engine"].evaluate(
        face_count=face_count,
        identity_ok=sess["identity_ok"],
        is_away=is_away,
        no_blink_suspect=no_blink_suspect,
        dominant_emotion=sess["dominant_emotion"],
        phone_detected=phone_detected,
        extra_persons=extra_persons or face_count > 1,
        # ── New signals ──
        talking_detected=talking_detected,
        earphone_detected=earphone_detected,
        earphone_side=earphone_side,
        hand_gesture_suspicious=hand_result.get("suspicious", False),
        hand_gestures=hand_result.get("gestures"),
        book_detected=book_detected,
        gaze_h=gaze_h,
        yaw_deg=yaw,
    )

    # Save violation screenshots for newly fired events
    for v_type, detail in fired:
        if winsound and v_type in ["PHONE_DETECTED", "NO_FACE", "MULTIPLE_FACES", "EXTRA_PERSON",
                                    "IDENTITY_MISMATCH", "TALKING_DETECTED", "EARPHONE_DETECTED",
                                    "HAND_SIGNAL", "BOOK_DETECTED", "SECOND_MONITOR"]:
            threading.Thread(target=winsound.MessageBeep, args=(winsound.MB_ICONEXCLAMATION,)).start()
        shot_path = screenshot_utils.save_violation_screenshot(
            frame_bgr, student_id, v_type
        )
        logger.log_violation(student_id, v_type, detail, shot_path)

    # Real-time active violations list for immediate UI feedback
    active_anomalies = []
    anomaly_score = 0

    if face_count > 1 or extra_persons:
        anomaly_score += 45
        active_anomalies.append({
            "code": "MULTIPLE_FACES",
            "message": f"MULTIPLE PEOPLE DETECTED ({face_count} in frame)! Exam rules permit 1 student only.",
            "severity": "HIGH",
        })
    elif face_count == 0:
        anomaly_score += 35
        active_anomalies.append({
            "code": "NO_FACE",
            "message": "NO FACE DETECTED: Please stay directly in front of the camera.",
            "severity": "HIGH",
        })

    if phone_detected:
        anomaly_score += 45
        items_str = ", ".join(prohibited_items) if prohibited_items else "Mobile Phone"
        active_anomalies.append({
            "code": "PHONE_DETECTED",
            "message": f"PROHIBITED DEVICE DETECTED: {items_str} in camera view!",
            "severity": "HIGH",
        })

    if is_away and face_count >= 1:
        anomaly_score += 25
        active_anomalies.append({
            "code": "LOOKING_AWAY",
            "message": "SUSPICIOUS GAZE: Student looking away from the exam screen.",
            "severity": "MEDIUM",
        })

    if sess["identity_ok"] is False:
        anomaly_score += 40
        active_anomalies.append({
            "code": "IDENTITY_MISMATCH",
            "message": "SECURITY VIOLATION: Face does not match registered student.",
            "severity": "HIGH",
        })

    if no_blink_suspect and face_count >= 1:
        anomaly_score += 20
        active_anomalies.append({
            "code": "NO_BLINK_SPOOF",
            "message": "LIVENESS WARNING: Unnatural blinking detected (possible photo spoof).",
            "severity": "MEDIUM",
        })

    # ── NEW: Talking / Whispering ──
    if talking_detected:
        anomaly_score += 30
        active_anomalies.append({
            "code": "TALKING_DETECTED",
            "message": "TALKING/WHISPERING DETECTED: Student appears to be speaking during exam.",
            "severity": "HIGH",
        })

    # ── NEW: Earphone / Earbud ──
    if earphone_detected:
        anomaly_score += 40
        side_info = f" ({earphone_side} ear)" if earphone_side else ""
        active_anomalies.append({
            "code": "EARPHONE_DETECTED",
            "message": f"EARPHONE/EARBUD DETECTED{side_info.upper()}: Prohibited audio device in use!",
            "severity": "HIGH",
        })

    # ── NEW: Hand Gesture / Signal ──
    if hand_result.get("suspicious"):
        anomaly_score += 25
        gesture_info = ", ".join(g["gesture"] for g in hand_result.get("gestures", []))
        active_anomalies.append({
            "code": "HAND_SIGNAL",
            "message": f"SUSPICIOUS HAND SIGNAL: {gesture_info} — possible answer communication!",
            "severity": "MEDIUM",
        })

    # ── NEW: Book / Paper / Cheat Sheet ──
    if book_detected:
        anomaly_score += 35
        active_anomalies.append({
            "code": "BOOK_DETECTED",
            "message": "BOOK/PAPER DETECTED: Unauthorized reading material visible in frame!",
            "severity": "HIGH",
        })

    # ── NEW: Second Monitor / Screen Sharing ──
    if (gaze_h is not None and
        (gaze_h < (1.0 - config.SECOND_MONITOR_GAZE_H_LIMIT) or
         gaze_h > config.SECOND_MONITOR_GAZE_H_LIMIT) and
        abs(yaw) > config.YAW_LIMIT_DEG):
        anomaly_score += 20
        active_anomalies.append({
            "code": "SECOND_MONITOR",
            "message": "SECOND SCREEN SUSPECTED: Student gaze consistently directed at another monitor.",
            "severity": "MEDIUM",
        })

    if sess["dominant_emotion"] in config.WATCH_EMOTIONS:
        anomaly_score += 5

    anomaly_score = min(anomaly_score, 100)
    risk_level = "HIGH" if anomaly_score >= 50 else ("MEDIUM" if anomaly_score >= 20 else "LOW")

    # ── 6. Build Telemetry Payload ───────────────────────────────────────
    telemetry = {
        "face_detected": bool(face_count >= 1),
        "face_count": int(face_count),
        "gaze_state": str(gaze_state),
        "head_pose": {
            "yaw": float(round(yaw, 1)),
            "pitch": float(round(pitch, 1)),
            "roll": float(round(roll, 1)),
            "warning": bool(head_pose_warning),
        },
        "reticle_pct": [float(reticle_pct[0]), float(reticle_pct[1])] if reticle_pct else [0.5, 0.5],
        "liveness": {
            "liveness_pass": bool(blink_stats["liveness_pass"]),
            "total_blinks": int(blink_stats["total_blinks"]),
            "seconds_since_last_blink": float(blink_stats["seconds_since_last_blink"]),
        },
        "identity_ok": bool(sess["identity_ok"]) if sess["identity_ok"] is not None else None,
        "dominant_emotion": str(sess["dominant_emotion"]),
        "phone_detected": bool(phone_detected),
        "extra_person_detected": bool(extra_persons or face_count > 1),
        "detected_boxes": detected_boxes,
        "prohibited_items": prohibited_items,
        "object_detection_status": sess["object_detection_status"],
        "object_detection_error": sess["object_detection_error"],
        # ── New detection fields ──
        "talking_detected": bool(talking_detected),
        "earphone_detected": bool(earphone_detected),
        "earphone_side": str(earphone_side) if earphone_side else None,
        "earphone_confidence": float(earphone_confidence),
        "hand_gesture": {
            "hands_detected": int(hand_result.get("hands_detected", 0)),
            "gestures": hand_result.get("gestures", []),
            "suspicious": bool(hand_result.get("suspicious", False)),
        },
        "book_detected": bool(book_detected),
        "second_monitor_suspect": bool(
            gaze_h is not None and
            (gaze_h < (1.0 - config.SECOND_MONITOR_GAZE_H_LIMIT) or
             gaze_h > config.SECOND_MONITOR_GAZE_H_LIMIT) and
            abs(yaw) > config.YAW_LIMIT_DEG
        ),
        "anomalies": active_anomalies,
        "anomaly_score": float(round(anomaly_score, 2)),
        "risk_level": str(risk_level),
        "server_status": "ONLINE",
    }

    return telemetry



# ═════════════════════════════════════════════════════════════════════════════
# REST API Endpoints
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "InvigiLMNce AI Proctoring Gateway", "version": "1.0.0"}

@app.post("/api/enroll")
def enroll_student_photo(req: EnrollRequest):
    student_id = req.student_id.strip()
    if not student_id:
        raise HTTPException(status_code=400, detail="Student ID is required.")
    
    frame_bgr = decode_base64_image(req.image_base64)
    if frame_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image payload.")
    
    res = face_utils.validate_and_register_face(student_id, frame_bgr)
    return res

@app.get("/api/enroll/status/{student_id}")
def check_enrollment_status(student_id: str):
    ref_path = face_utils.get_reference_path(student_id)
    is_registered = ref_path is not None
    return {
        "student_id": student_id,
        "is_registered": is_registered,
        "photo_path": ref_path if is_registered else None
    }

@app.post("/api/proctor/frame")
def process_proctor_frame(req: FrameProcessRequest):
    """Main HTTP endpoint: process a single webcam frame and return full telemetry."""
    student_id = req.student_id.strip()
    if not student_id:
        raise HTTPException(status_code=400, detail="Student ID is required.")
    
    frame_bgr = decode_base64_image(req.image_base64)
    if frame_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid frame payload.")

    telemetry = _process_frame_full(student_id, frame_bgr)

    # Keep frame analysis responsive; natural-language suggestions are not
    # needed on every camera frame. LLM runs in a background thread.
    frame_idx = active_sessions.get(student_id, {}).get("frame_idx", 0)
    sess = active_sessions.get(student_id, {})
    llm_result = sess.get("last_llm")
    if frame_idx % 5 == 0 and not sess.get("llm_busy"):
        sess["llm_busy"] = True
        threading.Thread(target=_async_llm, args=(sess, dict(telemetry)), daemon=True).start()

    return {
        "student_id": student_id,
        "timestamp": time.time(),
        "frame_idx": active_sessions.get(student_id, {}).get("frame_idx", 0),
        "telemetry": telemetry,
        "llm_suggestion": llm_result,
    }


class LLMSuggestionRequest(BaseModel):
    """Request body for getting LLM suggestion from pre-computed telemetry."""
    face_detected: bool = True
    gaze_state: str = "looking_forward"
    head_pose: dict = {}
    liveness: dict = {}
    identity_ok: bool = None
    dominant_emotion: str = "neutral"
    phone_detected: bool = False
    extra_person_detected: bool = False
    anomalies: list = []
    anomaly_score: float = 0
    risk_level: str = "LOW"

@app.post("/api/llm/suggest")
def llm_suggest(req: LLMSuggestionRequest):
    """Get LLM suggestion directly from telemetry data (without sending a frame)."""
    telemetry = req.model_dump()
    result = get_llm_suggestion(telemetry)
    return result


# ═════════════════════════════════════════════════════════════════════════════
# WebSocket Real-Time Proctoring Endpoint
# ═════════════════════════════════════════════════════════════════════════════

@app.websocket("/ws/proctor/{student_id}")
async def websocket_proctor_endpoint(websocket: WebSocket, student_id: str):
    await websocket.accept()
    print(f"[WS] Connected proctoring WebSocket stream for student: {student_id}")
    
    try:
        while True:
            data = await websocket.receive_json()
            image_b64 = data.get("image")
            if not image_b64:
                continue

            frame_bgr = decode_base64_image(image_b64)
            if frame_bgr is None:
                continue

            # Use the shared processing pipeline
            telemetry = _process_frame_full(student_id, frame_bgr)

            # LLM suggestion every 5th frame to reduce latency
            llm_result = None
            frame_idx = active_sessions.get(student_id, {}).get("frame_idx", 0)
            if frame_idx % 5 == 0:
                llm_result = get_llm_suggestion(telemetry)

            payload = {
                "student_id": student_id,
                "timestamp": time.time(),
                "telemetry": telemetry,
                "llm_suggestion": llm_result,
            }
            await websocket.send_json(payload)

    except WebSocketDisconnect:
        print(f"Disconnected proctoring WebSocket stream for student: {student_id}")


# ═════════════════════════════════════════════════════════════════════════════
# Report Generation Endpoints
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/report/generate")
def generate_pdf_report(student_id: str = Form(...)):
    from modules import report_generator

    student_id = student_id.strip()
    if not student_id:
        raise HTTPException(status_code=400, detail="Student ID required")

    from modules import logger as violation_logger
    from modules import report_generator

    sess = active_sessions.get(student_id)
    session_start = sess["session_start"] if sess else (time.time() - 1800)
    events = violation_logger.load_session_events(student_id)
    pdf_path = report_generator.generate_report(student_id, events, session_start, time.time())
    violation_logger.build_excel_summary_sheet()

    return {
        "status": "success",
        "student_id": student_id,
        "pdf_path": pdf_path,
        "download_url": f"/api/reports/{student_id}"
    }

@app.get("/api/reports/{student_id}")
def download_pdf_report(student_id: str):
    reports_dir = config.REPORTS_DIR
    files = [f for f in os.listdir(reports_dir) if f.startswith(f"{student_id}_report_") and f.endswith(".pdf")]
    if not files:
        # Fallback: check any report with student_id
        files = [f for f in os.listdir(reports_dir) if student_id in f and f.endswith(".pdf")]
    
    if not files:
        raise HTTPException(status_code=404, detail="No PDF report found for this student.")
    
    latest_file = sorted(files)[-1]
    full_path = os.path.join(reports_dir, latest_file)
    return FileResponse(full_path, media_type="application/pdf", filename=latest_file)


# ═════════════════════════════════════════════════════════════════════════════
# Legacy SmartLabX Frontend Endpoints
# ═════════════════════════════════════════════════════════════════════════════
from llm_engine import get_student_answer

class StudentQuestionRequest(BaseModel):
    question: str

@app.post("/api/student/ask")
async def ask_student_question(request: StudentQuestionRequest):
    answer = get_student_answer(request.question)
    return {"success": True, "answer": answer}

class FrameAnalysisRequest(BaseModel):
    image: str
    student_id: Optional[str] = None
    session_duration: Optional[int] = 0

@app.post("/api/analyze/frame")
async def analyze_frame(request: FrameAnalysisRequest):
    student_id = request.student_id or "unknown"
    frame_bgr = decode_base64_image(request.image)
    if frame_bgr is None:
        return {"success": False, "error": "Failed to decode image"}
    
    telemetry = _process_frame_full(student_id, frame_bgr)
    llm_result = get_llm_suggestion(telemetry)
    
    return {
        "success": True,
        "face_detection": {
            "face_count": telemetry.get("face_count", 0),
            "faces": telemetry.get("detected_boxes", []),
        },
        "emotion_analysis": {
            "dominant_emotion": telemetry.get("dominant_emotion", "neutral"),
            "scores": {},
        },
        "llm_suggestion": llm_result,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
