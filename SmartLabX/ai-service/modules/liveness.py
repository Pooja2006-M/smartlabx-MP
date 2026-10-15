"""
Liveness detection via blink counting (Eye Aspect Ratio method).

A photo or static video-loop spoof will not blink naturally, so tracking
"time since last detected blink" is a lightweight, effective liveness signal
that piggybacks on the same FaceMesh landmarks used for gaze tracking.
"""
import time
import numpy as np
from modules import config

# 6-point eye contour landmark sets (MediaPipe FaceMesh)
_LEFT_EYE = [33, 160, 158, 133, 153, 144]
_RIGHT_EYE = [362, 385, 387, 263, 373, 380]


def _eye_aspect_ratio(landmarks, idxs, w, h):
    pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in idxs])
    p1, p2, p3, p4, p5, p6 = pts
    vertical1 = np.linalg.norm(p2 - p6)
    vertical2 = np.linalg.norm(p3 - p5)
    horizontal = np.linalg.norm(p1 - p4) + 1e-6
    return (vertical1 + vertical2) / (2.0 * horizontal)


class BlinkTracker:
    """Stateful blink counter — call `update()` once per frame."""

    def __init__(self):
        self._consec_closed = 0
        self.blink_count = 0
        self.last_blink_time = time.time()
        self.session_start = time.time()

    def update(self, landmarks, w, h):
        left_ear = _eye_aspect_ratio(landmarks, _LEFT_EYE, w, h)
        right_ear = _eye_aspect_ratio(landmarks, _RIGHT_EYE, w, h)
        ear = (left_ear + right_ear) / 2.0

        if ear < config.EAR_BLINK_THRESHOLD:
            self._consec_closed += 1
        else:
            if self._consec_closed >= config.EAR_CONSEC_FRAMES:
                self.blink_count += 1
                self.last_blink_time = time.time()
            self._consec_closed = 0

        return ear

    def seconds_since_last_blink(self):
        return time.time() - self.last_blink_time

    def suspect_no_blink(self):
        """True if it's been unnaturally long since a blink (possible photo/spoof)."""
        return self.seconds_since_last_blink() > config.NO_BLINK_SUSPECT_SECONDS
