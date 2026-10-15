"""
Mouth open / talking detection via Mouth Aspect Ratio (MAR).

Uses MediaPipe FaceMesh landmarks to measure how wide the mouth is open.
If the mouth is open for several consecutive frames, it flags the student
as talking/whispering — a proctoring violation.
"""
import time
import numpy as np
from modules import config

# MediaPipe FaceMesh landmark indices for the inner lip contour
# Vertical points (top-lip inner to bottom-lip inner)
_UPPER_LIP_TOP = [13]       # top of inner upper lip
_LOWER_LIP_BOTTOM = [14]    # bottom of inner lower lip
# Additional vertical pairs for better accuracy
_UPPER_LIP_MID_LEFT = [312]
_LOWER_LIP_MID_LEFT = [317]
_UPPER_LIP_MID_RIGHT = [82]
_LOWER_LIP_MID_RIGHT = [87]

# Horizontal lip landmarks (left corner to right corner)
_MOUTH_LEFT = 61
_MOUTH_RIGHT = 291


def _mouth_aspect_ratio(landmarks, w, h):
    """
    Compute Mouth Aspect Ratio (MAR) — similar concept to EAR.
    Higher value = mouth more open.
    """
    def _px(idx):
        lm = landmarks[idx]
        return np.array([lm.x * w, lm.y * h], dtype=np.float64)

    # Vertical distances (3 pairs across the mouth opening)
    v1 = np.linalg.norm(_px(13) - _px(14))       # center vertical
    v2 = np.linalg.norm(_px(312) - _px(317))      # left vertical
    v3 = np.linalg.norm(_px(82) - _px(87))        # right vertical

    # Horizontal distance (mouth width)
    h_dist = np.linalg.norm(_px(_MOUTH_LEFT) - _px(_MOUTH_RIGHT)) + 1e-6

    mar = (v1 + v2 + v3) / (3.0 * h_dist)
    return mar


class TalkingDetector:
    """
    Stateful talking/whispering detector — call `update()` once per frame.
    Uses MAR thresholds and consecutive frame counts to distinguish
    genuine talking from momentary mouth movements.
    """

    def __init__(self):
        self._consec_open = 0
        self._talking_start = None
        self._is_talking = False
        self._talk_episodes = 0
        self._last_mar = 0.0

    def update(self, landmarks, w, h):
        """
        Process one frame. Returns current MAR value.
        """
        mar = _mouth_aspect_ratio(landmarks, w, h)
        self._last_mar = mar

        if mar > config.MAR_TALKING_THRESHOLD:
            self._consec_open += 1
            if self._consec_open >= config.MAR_CONSEC_FRAMES_TALKING:
                if not self._is_talking:
                    self._is_talking = True
                    self._talking_start = time.time()
                    self._talk_episodes += 1
        else:
            if self._is_talking and self._consec_open < 2:
                # Mouth closed, end talking episode
                self._is_talking = False
            self._consec_open = max(0, self._consec_open - 1)

        return mar

    @property
    def is_talking(self):
        return self._is_talking

    @property
    def talk_episodes(self):
        return self._talk_episodes

    @property
    def last_mar(self):
        return self._last_mar
