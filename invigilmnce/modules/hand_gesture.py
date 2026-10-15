"""
Hand gesture / hand signal detection using MediaPipe Hands.

Detects when students make hand gestures or signals that could be used
to communicate answers during a proctored exam.

Uses the MediaPipe Tasks API HandLandmarker for hand detection and
landmark extraction, then analyzes hand position and gesture patterns.
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

_HAND_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
_MODEL_DIR = os.path.join(config.BASE_DIR, "models")
_HAND_MODEL_PATH = os.path.join(_MODEL_DIR, "hand_landmarker.task")


def _ensure_hand_model() -> str:
    """Download the HandLandmarker model on first run (~3 MB)."""
    os.makedirs(_MODEL_DIR, exist_ok=True)
    if not os.path.exists(_HAND_MODEL_PATH):
        urllib.request.urlretrieve(_HAND_MODEL_URL, _HAND_MODEL_PATH)
    return _HAND_MODEL_PATH


# Landmark indices
_WRIST = 0
_THUMB_TIP = 4
_INDEX_TIP = 8
_MIDDLE_TIP = 12
_RING_TIP = 16
_PINKY_TIP = 20
_INDEX_MCP = 5
_MIDDLE_MCP = 9


def _count_raised_fingers(landmarks):
    """
    Count how many fingers are raised/extended.
    Returns (count, finger_states_dict).
    """
    def _px(idx):
        lm = landmarks[idx]
        return np.array([lm.x, lm.y, lm.z])

    wrist = _px(_WRIST)
    finger_states = {}

    # Thumb: compare x-position (for right hand, thumb tip should be left of thumb IP)
    thumb_tip = _px(_THUMB_TIP)
    thumb_ip = _px(3)
    thumb_mcp = _px(2)
    # Use distance from wrist as a simpler heuristic
    finger_states["thumb"] = np.linalg.norm(thumb_tip - wrist) > np.linalg.norm(thumb_ip - wrist) * 1.1

    # Other fingers: tip should be further from wrist than PIP joint
    for name, tip_idx, pip_idx in [
        ("index", 8, 6),
        ("middle", 12, 10),
        ("ring", 16, 14),
        ("pinky", 20, 18),
    ]:
        tip = _px(tip_idx)
        pip = _px(pip_idx)
        finger_states[name] = tip[1] < pip[1]  # y increases downward, so tip.y < pip.y = raised

    count = sum(1 for v in finger_states.values() if v)
    return count, finger_states


def _classify_gesture(finger_count, finger_states):
    """
    Classify the hand gesture based on finger states.
    Returns a gesture name string.
    """
    if finger_count == 0:
        return "fist"
    elif finger_count == 1 and finger_states.get("index"):
        return "pointing"
    elif finger_count == 2 and finger_states.get("index") and finger_states.get("middle"):
        return "peace_sign"
    elif finger_count == 3:
        return "three_fingers"
    elif finger_count == 4:
        return "four_fingers"
    elif finger_count == 5:
        return "open_palm"
    elif finger_count == 1 and finger_states.get("thumb"):
        return "thumbs_up"
    else:
        return f"gesture_{finger_count}"


class HandGestureDetector:
    """
    Stateful hand gesture detector using MediaPipe HandLandmarker.
    Tracks hand presence and gestures over time.
    """

    def __init__(self):
        self._detector = None
        self._start_time = time.time()
        self._last_timestamp_ms = -1
        self._gesture_history = []
        self._max_history = 15
        self._hand_visible_frames = 0
        self._total_frames = 0
        self._suspicious_gesture_count = 0
        self._init_attempted = False
        self._init_failed = False

    def _ensure_detector(self):
        """Lazy init the hand detector."""
        if self._detector is not None:
            return True
        if self._init_failed:
            return False
        if self._init_attempted:
            return False

        self._init_attempted = True
        try:
            model_path = _ensure_hand_model()
            base_options = mp_python.BaseOptions(model_asset_path=model_path)
            options = mp_vision.HandLandmarkerOptions(
                base_options=base_options,
                running_mode=mp_vision.RunningMode.VIDEO,
                num_hands=2,
                min_hand_detection_confidence=0.35,
                min_hand_presence_confidence=0.35,
                min_tracking_confidence=0.35,
            )
            self._detector = mp_vision.HandLandmarker.create_from_options(options)
            return True
        except Exception as e:
            print(f"[HandGesture] Failed to init detector: {e}")
            self._init_failed = True
            return False

    def detect(self, frame_bgr):
        """
        Detect hands and classify gestures in the frame.
        Returns: {
            "hands_detected": int,
            "gestures": [{"gesture": str, "fingers": int, "side": str}],
            "suspicious": bool,
            "hand_raise_detected": bool,
        }
        """
        self._total_frames += 1
        default_result = {
            "hands_detected": 0,
            "gestures": [],
            "suspicious": False,
            "hand_raise_detected": False,
        }

        if not self._ensure_detector():
            return default_result

        try:
            rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms = int((time.time() - self._start_time) * 1000)
            if timestamp_ms <= self._last_timestamp_ms:
                timestamp_ms = self._last_timestamp_ms + 1
            self._last_timestamp_ms = timestamp_ms

            result = self._detector.detect_for_video(mp_image, timestamp_ms)

            if not result.hand_landmarks:
                self._gesture_history.append(None)
                if len(self._gesture_history) > self._max_history:
                    self._gesture_history.pop(0)
                return default_result

            self._hand_visible_frames += 1
            hands_count = len(result.hand_landmarks)
            gestures = []

            for i, hand_lm in enumerate(result.hand_landmarks):
                handedness = "unknown"
                if result.handedness and i < len(result.handedness):
                    handedness = result.handedness[i][0].category_name.lower()

                finger_count, finger_states = _count_raised_fingers(hand_lm)
                gesture_name = _classify_gesture(finger_count, finger_states)

                gestures.append({
                    "gesture": gesture_name,
                    "fingers": finger_count,
                    "side": handedness,
                    "finger_states": {k: bool(v) for k, v in finger_states.items()},
                })

            # Track gesture history
            self._gesture_history.append(gestures)
            if len(self._gesture_history) > self._max_history:
                self._gesture_history.pop(0)

            # Determine if suspicious
            suspicious = False

            # Suspicious patterns:
            # 1. Specific finger counts (1-4) held steadily = possible answer signaling
            for g in gestures:
                if g["fingers"] in [1, 2, 3, 4] and g["gesture"] != "open_palm":
                    # Check if same gesture held for multiple frames
                    recent = [
                        h for h in self._gesture_history[-5:]
                        if h is not None and len(h) > 0
                    ]
                    if len(recent) >= 3:
                        same_gesture = all(
                            any(gg["fingers"] == g["fingers"] for gg in frame_gestures)
                            for frame_gestures in recent
                        )
                        if same_gesture:
                            suspicious = True
                            self._suspicious_gesture_count += 1

            # 2. Hand raised high (wrist above face level)
            hand_raise = False
            for hand_lm in result.hand_landmarks:
                wrist_y = hand_lm[_WRIST].y
                if wrist_y < 0.25:  # top quarter of frame
                    hand_raise = True

            return {
                "hands_detected": hands_count,
                "gestures": gestures,
                "suspicious": suspicious,
                "hand_raise_detected": hand_raise,
            }

        except Exception as e:
            return default_result

    def close(self):
        if self._detector:
            self._detector.close()
