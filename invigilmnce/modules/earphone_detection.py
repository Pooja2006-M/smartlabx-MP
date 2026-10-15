"""
Earphone / earbud detection using MediaPipe FaceMesh ear landmarks.

Strategy:
- MediaPipe FaceMesh provides ear tragion landmarks (ear area).
- We crop small ROIs around both ear regions and analyze them for:
  1. Color anomaly: Earphones are usually a different color from skin
  2. Edge density: Earphones introduce extra edges near the ear
  3. Contrast patterns: Earbuds create high-contrast spots

This is a lightweight heuristic detector — not 100% accurate, but flags
suspicious ear-area activity for proctoring review.
"""
import cv2
import numpy as np
from modules import config

# MediaPipe FaceMesh ear-region landmark indices
# These landmarks are near the ear tragion area
_LEFT_EAR_LANDMARKS = [234, 93, 132, 58, 172]   # left ear region
_RIGHT_EAR_LANDMARKS = [454, 323, 361, 288, 397]  # right ear region

# Ear tragion points (directly on the ear)
_LEFT_TRAGION = 234
_RIGHT_TRAGION = 454


def _get_ear_roi(frame, landmarks, ear_idx, w, h, pad_factor=0.06):
    """
    Extract a region of interest around the ear landmark.
    pad_factor controls how much area around the ear to crop.
    """
    lm = landmarks[ear_idx]
    cx, cy = int(lm.x * w), int(lm.y * h)
    pad_x = int(w * pad_factor)
    pad_y = int(h * pad_factor)

    x1 = max(0, cx - pad_x)
    y1 = max(0, cy - pad_y)
    x2 = min(w, cx + pad_x)
    y2 = min(h, cy + pad_y)

    if x2 - x1 < 10 or y2 - y1 < 10:
        return None, (x1, y1, x2, y2)

    roi = frame[y1:y2, x1:x2]
    return roi, (x1, y1, x2, y2)


def _analyze_ear_roi(roi):
    """
    Analyze an ear ROI for potential earphone presence.
    Returns a confidence score (0.0 - 1.0).
    """
    if roi is None or roi.size == 0:
        return 0.0

    score = 0.0

    # Convert to grayscale for edge analysis
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

    # 1. Edge density — earphones introduce more edges than bare ear
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.count_nonzero(edges) / max(edges.size, 1)
    if edge_density > 0.15:  # high edge density near ear
        score += 0.3

    # 2. Color variance — earphones (white/black) differ from skin tone
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    h_channel = hsv[:, :, 0]
    s_channel = hsv[:, :, 1]
    v_channel = hsv[:, :, 2]

    # Check for non-skin colored pixels (earphones are often white, black, or colored)
    # Skin hue is typically 0-25 in HSV
    non_skin_mask = (h_channel > 25) | (s_channel < 30) | (v_channel < 50) | (v_channel > 230)
    non_skin_ratio = np.count_nonzero(non_skin_mask) / max(non_skin_mask.size, 1)
    if non_skin_ratio > 0.35:
        score += 0.3

    # 3. Contrast analysis — earbuds create sudden brightness changes
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var > 500:  # high local contrast
        score += 0.2

    # 4. Circular object detection — earbuds are roughly circular
    circles = cv2.HoughCircles(
        gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=10,
        param1=80, param2=25, minRadius=3, maxRadius=min(gray.shape) // 3
    )
    if circles is not None and len(circles[0]) > 0:
        score += 0.3

    return min(score, 1.0)


class EarphoneDetector:
    """
    Stateful earphone detector — uses temporal smoothing to avoid
    false positives from single frame noise.
    """

    def __init__(self):
        self._left_scores = []
        self._right_scores = []
        self._max_history = 8  # frames to keep for smoothing
        self._detected = False
        self._detection_side = None

    def detect(self, frame_bgr, landmarks, w, h):
        """
        Analyze both ear regions for earphone presence.
        Returns: {"detected": bool, "confidence": float, "side": str|None}
        """
        try:
            # Left ear
            left_roi, left_box = _get_ear_roi(frame_bgr, landmarks, _LEFT_TRAGION, w, h)
            left_score = _analyze_ear_roi(left_roi) if left_roi is not None else 0.0

            # Right ear
            right_roi, right_box = _get_ear_roi(frame_bgr, landmarks, _RIGHT_TRAGION, w, h)
            right_score = _analyze_ear_roi(right_roi) if right_roi is not None else 0.0

            # Temporal smoothing
            self._left_scores.append(left_score)
            self._right_scores.append(right_score)
            if len(self._left_scores) > self._max_history:
                self._left_scores.pop(0)
            if len(self._right_scores) > self._max_history:
                self._right_scores.pop(0)

            avg_left = sum(self._left_scores) / len(self._left_scores)
            avg_right = sum(self._right_scores) / len(self._right_scores)

            max_conf = max(avg_left, avg_right)
            detected = max_conf >= config.EARPHONE_CONFIDENCE_THRESHOLD

            side = None
            if detected:
                if avg_left > avg_right:
                    side = "left"
                elif avg_right > avg_left:
                    side = "right"
                else:
                    side = "both"

            self._detected = detected
            self._detection_side = side

            return {
                "detected": detected,
                "confidence": round(max_conf, 2),
                "side": side,
                "left_conf": round(avg_left, 2),
                "right_conf": round(avg_right, 2),
            }

        except Exception:
            return {
                "detected": False,
                "confidence": 0.0,
                "side": None,
                "left_conf": 0.0,
                "right_conf": 0.0,
            }

    @property
    def is_detected(self):
        return self._detected
