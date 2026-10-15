"""Save a frame to disk whenever a violation fires, named for easy lookup."""
import os
import time
import cv2
from modules import config


def save_violation_screenshot(frame_bgr, student_id: str, v_type: str) -> str:
    ts = time.strftime("%Y%m%d_%H%M%S")
    fname = f"{student_id}_{v_type}_{ts}.jpg"
    path = os.path.join(config.SCREENSHOTS_DIR, fname)
    cv2.imwrite(path, frame_bgr)
    return path
