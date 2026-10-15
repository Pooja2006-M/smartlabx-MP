"""
Head-pose + gaze direction estimation using MediaPipe's FaceLandmarker
(Tasks API). This replaces the older `mp.solutions.face_mesh` API, which
was dropped from mediapipe wheels for Python 3.13+ — the Tasks API is the
only option that installs cleanly there.

Head pose: solvePnP against a generic 3D face model gives yaw/pitch/roll.
Gaze: iris landmark position relative to the eye corners gives a simple
horizontal/vertical gaze ratio (works well enough to flag "looking away").
"""
import os
import time
import urllib.request
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

from modules import config

# Official MediaPipe-hosted model — same file used by Google's own examples.
_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
    "face_landmarker/float16/1/face_landmarker.task"
)
_MODEL_DIR = os.path.join(config.BASE_DIR, "models")
_MODEL_PATH = os.path.join(_MODEL_DIR, "face_landmarker.task")

# Landmark indices (same 478-point topology as legacy refine_landmarks=True)
_NOSE_TIP = 1
_CHIN = 152
_LEFT_EYE_CORNER = 33
_RIGHT_EYE_CORNER = 263
_LEFT_MOUTH = 61
_RIGHT_MOUTH = 291

_LEFT_IRIS = [468, 469, 470, 471]
_RIGHT_IRIS = [473, 474, 475, 476]
_LEFT_EYE_H = (33, 133)   # outer, inner corner
_RIGHT_EYE_H = (362, 263)
_LEFT_EYE_V = (159, 145)  # top, bottom lid
_RIGHT_EYE_V = (386, 374)

# Generic 3D model points (mm), matched to the 2D indices above
_MODEL_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),        # Nose tip
    (0.0, -63.6, -12.5),    # Chin
    (-43.3, 32.7, -26.0),   # Left eye corner
    (43.3, 32.7, -26.0),    # Right eye corner
    (-28.9, -28.9, -24.1),  # Left mouth corner
    (28.9, -28.9, -24.1),   # Right mouth corner
], dtype=np.float64)


def _ensure_model() -> str:
    """Download the FaceLandmarker .task model on first run (~4 MB),
    then reuse the cached copy on every later run."""
    os.makedirs(_MODEL_DIR, exist_ok=True)
    if not os.path.exists(_MODEL_PATH):
        urllib.request.urlretrieve(_MODEL_URL, _MODEL_PATH)
    return _MODEL_PATH


class FaceMeshTracker:
    """Wraps a persistent MediaPipe FaceLandmarker instance in VIDEO mode
    (creating one per frame is wasteful and slow)."""

    def __init__(self):
        model_path = _ensure_model()
        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.VIDEO,
            num_faces=5,  # detect up to 5 faces for multi-face invigilation
            min_face_detection_confidence=0.30,
            min_face_presence_confidence=0.30,
            min_tracking_confidence=0.30,
        )
        self._detector = mp_vision.FaceLandmarker.create_from_options(options)
        self._start_time = time.time()
        self._last_timestamp_ms = -1

    def process(self, frame_bgr):
        """Returns a FaceLandmarkerResult with `.face_landmarks`: a list
        (one per detected face) of lists of NormalizedLandmark(x, y, z)."""
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        timestamp_ms = int((time.time() - self._start_time) * 1000)
        # VIDEO mode requires strictly increasing timestamps
        if timestamp_ms <= self._last_timestamp_ms:
            timestamp_ms = self._last_timestamp_ms + 1
        self._last_timestamp_ms = timestamp_ms
        return self._detector.detect_for_video(mp_image, timestamp_ms)

    def close(self):
        self._detector.close()


def _landmark_px(landmarks, idx, w, h):
    lm = landmarks[idx]
    return np.array([lm.x * w, lm.y * h], dtype=np.float64)


def estimate_head_pose(landmarks, w, h):
    """Returns (yaw_deg, pitch_deg, roll_deg) or None if solvePnP fails."""
    try:
        image_points = np.array([
            _landmark_px(landmarks, _NOSE_TIP, w, h),
            _landmark_px(landmarks, _CHIN, w, h),
            _landmark_px(landmarks, _LEFT_EYE_CORNER, w, h),
            _landmark_px(landmarks, _RIGHT_EYE_CORNER, w, h),
            _landmark_px(landmarks, _LEFT_MOUTH, w, h),
            _landmark_px(landmarks, _RIGHT_MOUTH, w, h),
        ], dtype=np.float64)

        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))

        ok, rotation_vec, _ = cv2.solvePnP(
            _MODEL_POINTS_3D, image_points, camera_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not ok:
            return None

        rotation_mat, _ = cv2.Rodrigues(rotation_vec)
        proj_matrix = np.hstack((rotation_mat, np.zeros((3, 1))))
        euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)[6].flatten()
        pitch, yaw, roll = [float(a) for a in euler_angles]
        # Normalize pitch into a human-readable range
        pitch = pitch - 180 if pitch > 90 else (pitch + 180 if pitch < -90 else pitch)
        return yaw, pitch, roll
    except Exception:
        return None


def _eye_gaze_ratio(landmarks, iris_idxs, h_corners, v_corners, w, h):
    iris_pts = np.array([_landmark_px(landmarks, i, w, h) for i in iris_idxs])
    iris_center = iris_pts.mean(axis=0)

    left_h = _landmark_px(landmarks, h_corners[0], w, h)
    right_h = _landmark_px(landmarks, h_corners[1], w, h)
    top_v = _landmark_px(landmarks, v_corners[0], w, h)
    bottom_v = _landmark_px(landmarks, v_corners[1], w, h)

    eye_width = np.linalg.norm(right_h - left_h) + 1e-6
    eye_height = np.linalg.norm(bottom_v - top_v) + 1e-6

    h_ratio = np.linalg.norm(iris_center - left_h) / eye_width  # 0=left, 1=right
    v_ratio = np.linalg.norm(iris_center - top_v) / eye_height  # 0=top, 1=bottom
    return h_ratio, v_ratio


def estimate_gaze_ratio(landmarks, w, h):
    """Average horizontal/vertical iris ratio across both eyes.
    ~0.5/0.5 means looking straight at the center."""
    try:
        lh, lv = _eye_gaze_ratio(landmarks, _LEFT_IRIS, _LEFT_EYE_H, _LEFT_EYE_V, w, h)
        rh, rv = _eye_gaze_ratio(landmarks, _RIGHT_IRIS, _RIGHT_EYE_H, _RIGHT_EYE_V, w, h)
        return (lh + rh) / 2.0, (lv + rv) / 2.0
    except Exception:
        return None


def is_looking_away(yaw_deg, pitch_deg, gaze_h, gaze_v, yaw_limit, pitch_limit):
    """Combine head pose + iris gaze into a single 'looking away' verdict."""
    away_by_pose = abs(yaw_deg) > yaw_limit or abs(pitch_deg) > pitch_limit
    away_by_gaze = gaze_h is not None and (gaze_h < 0.30 or gaze_h > 0.70)
    return bool(away_by_pose or away_by_gaze)


def draw_hud(frame, face_box=None, is_away=False, status_text="SECURE", yaw=0.0, pitch=0.0, extra_alerts=None):
    """
    Renders a high-tech Cyber-Proctor HUD onto the video frame:
    - Corner brackets on face bounds
    - Glowing status header pill
    - Head pose telemetry
    """
    h, w = frame.shape[:2]
    canvas = frame.copy()

    # 1. Subtle top HUD banner
    overlay = canvas.copy()
    cv2.rectangle(overlay, (0, 0), (w, 42), (10, 15, 25), -1)
    cv2.addWeighted(overlay, 0.7, canvas, 0.3, 0, canvas)

    # Accent line below banner
    banner_color = (0, 210, 100) if not is_away else (0, 165, 255)
    if extra_alerts:
        banner_color = (60, 60, 245)  # Alert crimson in BGR
    cv2.line(canvas, (0, 42), (w, 42), banner_color, 2)

    # Status Pill / Title
    cv2.putText(canvas, "INVIGILMNCE AI HUD", (15, 27), cv2.FONT_HERSHEY_DUPLEX, 0.55, (220, 220, 220), 1)
    status_msg = f"[ {status_text.upper()} ]"
    cv2.putText(canvas, status_msg, (w - 180, 27), cv2.FONT_HERSHEY_DUPLEX, 0.55, banner_color, 2)

    # 2. Draw Face Reticle with Corner Brackets
    if face_box is not None:
        x1, y1, x2, y2 = face_box
        # Ensure bounds within frame
        x1, y1 = max(0, int(x1)), max(0, int(y1))
        x2, y2 = min(w - 1, int(x2)), min(h - 1, int(y2))

        box_color = (0, 210, 100) if not is_away else (0, 165, 255)
        if extra_alerts:
            box_color = (60, 60, 245)

        # Thin bounding box
        cv2.rectangle(canvas, (x1, y1), (x2, y2), box_color, 1)

        # Corner bracket accents (length = 20px)
        c_len = min(22, (x2 - x1) // 3, (y2 - y1) // 3)
        # Top-left
        cv2.line(canvas, (x1, y1), (x1 + c_len, y1), box_color, 3)
        cv2.line(canvas, (x1, y1), (x1, y1 + c_len), box_color, 3)
        # Top-right
        cv2.line(canvas, (x2, y1), (x2 - c_len, y1), box_color, 3)
        cv2.line(canvas, (x2, y1), (x2, y1 + c_len), box_color, 3)
        # Bottom-left
        cv2.line(canvas, (x1, y2), (x1 + c_len, y2), box_color, 3)
        cv2.line(canvas, (x1, y2), (x1, y2 - c_len), box_color, 3)
        # Bottom-right
        cv2.line(canvas, (x2, y2), (x2 - c_len, y2), box_color, 3)
        cv2.line(canvas, (x2, y2), (x2, y2 - c_len), box_color, 3)

        # Telemetry badge below box
        badge_y = min(h - 10, y2 + 18)
        telemetry = f"YAW:{yaw:+.1f} PITCH:{pitch:+.1f}"
        cv2.putText(canvas, telemetry, (x1, badge_y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 230, 255), 1)

    # 3. Bottom Alert Overlay if any
    if extra_alerts:
        alert_y = h - 20
        alert_str = " ! ".join(extra_alerts)
        cv2.rectangle(canvas, (10, h - 35), (w - 10, h - 8), (20, 20, 160), -1)
        cv2.putText(canvas, f"ALERT: {alert_str}", (20, alert_y), cv2.FONT_HERSHEY_DUPLEX, 0.48, (255, 255, 255), 1)

    return canvas

