"""
Central configuration for InvigiLMNce.
All paths and tunable thresholds live here so modules stay in sync.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")
REGISTERED_FACES_DIR = os.path.join(DATA_DIR, "registered_faces")
LOGS_DIR = os.path.join(DATA_DIR, "logs")
SCREENSHOTS_DIR = os.path.join(DATA_DIR, "screenshots")
REPORTS_DIR = os.path.join(DATA_DIR, "reports")

for _d in (DATA_DIR, REGISTERED_FACES_DIR, LOGS_DIR, SCREENSHOTS_DIR, REPORTS_DIR):
    os.makedirs(_d, exist_ok=True)

EXCEL_LOG_PATH = os.path.join(LOGS_DIR, "session_log.xlsx")
JSON_LOG_PATH = os.path.join(LOGS_DIR, "session_log.json")

# ---------------- Thresholds (tuned for robust real-time proctoring) ----------------

# Head pose (degrees) beyond which the student is considered "looking away"
YAW_LIMIT_DEG = 22
PITCH_LIMIT_DEG = 18

# Eye Aspect Ratio (EAR) below this = eye considered closed
EAR_BLINK_THRESHOLD = 0.21
# Consecutive closed-eye frames required to count as one blink
EAR_CONSEC_FRAMES = 2
# If no blink is detected for this many seconds, flag possible spoof/photo
NO_BLINK_SUSPECT_SECONDS = 15

# Seconds a student may look away before it's logged as an anomaly
LOOK_AWAY_GRACE_SECONDS = 2.5
# Seconds with no face detected before flagging "face absent"
NO_FACE_GRACE_SECONDS = 2.0

# Face recognition: run DeepFace.verify at most once every N seconds (expensive)
FACE_VERIFY_INTERVAL_SEC = 5
FACE_VERIFY_THRESHOLD = 0.68  # cosine distance threshold (lower = stricter)

# Emotion analysis: run DeepFace.analyze at most once every N seconds
EMOTION_ANALYZE_INTERVAL_SEC = 4
# Emotions considered noteworthy for the report (not auto-violations)
WATCH_EMOTIONS = {"fear", "angry", "sad", "disgust"}

# YOLOv5 / YOLOv8 object/person detection
YOLO_MODEL_NAME = "yolov5su"
YOLO_CONF_THRESHOLD = 0.15
PHONE_CLASS_NAMES = {"cell phone", "phone", "telephone", "mobile phone"}
PERSON_CLASS_NAME = "person"

# ── Mouth / Talking Detection (MAR — Mouth Aspect Ratio) ──
# MAR above this threshold = mouth is "open" (possibly talking/whispering)
MAR_TALKING_THRESHOLD = 0.35
# Consecutive open-mouth frames required to flag as "talking"
MAR_CONSEC_FRAMES_TALKING = 4
# Grace period (seconds) before talking is logged as a violation
TALKING_GRACE_SECONDS = 3.0

# ── Earphone / Earbud Detection ──
# Confidence threshold for earphone detection (0.0 - 1.0)
EARPHONE_CONFIDENCE_THRESHOLD = 0.45
# Run earphone detection every Nth frame (lightweight but still periodic)
EARPHONE_DETECT_FRAME_SKIP = 3

# ── Hand Gesture / Signal Detection ──
# Run hand detection every Nth frame (expensive model)
HAND_DETECT_FRAME_SKIP = 3
# Minimum consecutive frames of same gesture to flag as suspicious signaling
HAND_GESTURE_CONSEC_FRAMES = 3

# ── Book / Paper / Cheat Sheet Detection (via YOLO) ──
BOOK_CLASS_NAMES = {"book", "notebook", "paper", "laptop"}
# Combine with existing prohibited items for detection
PROHIBITED_CLASS_NAMES = {"cell phone", "phone", "telephone", "mobile phone",
                          "laptop", "book", "remote", "scissors", "keyboard"}

# ── Second Monitor / Screen Sharing Detection ──
# If gaze stays laterally away (left/right) for this many seconds => suspect 2nd screen
SECOND_MONITOR_GAZE_SECONDS = 5.0
# Horizontal gaze ratio beyond which is considered "looking at another screen"
SECOND_MONITOR_GAZE_H_LIMIT = 0.78

# ── Multi-Person Detection Improvements ──
# Temporal smoothing: keep "extra person" flag active for N seconds after last detection
EXTRA_PERSON_STICKY_SECONDS = 3.0
# Lower YOLO confidence for person class to catch background people
YOLO_PERSON_CONF_THRESHOLD = 0.12

# Minimum seconds between two saved screenshots for the SAME violation type
SCREENSHOT_COOLDOWN_SEC = 4

# Webcam frame processing
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
# Run heavy models (YOLO) every Nth frame
HEAVY_MODEL_FRAME_SKIP = 2

