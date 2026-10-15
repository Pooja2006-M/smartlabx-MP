"""
Anomaly engine: turns raw per-frame signals (face count, identity match,
gaze, blink, emotion, objects, talking, earphones, hand gestures) into
discrete, timestamped violation events.

Uses grace periods so a single bad frame doesn't spam the log, and a
per-violation-type cooldown so repeated screenshots aren't taken every frame.
"""
from __future__ import annotations
import time
from dataclasses import dataclass
from modules import config


@dataclass
class ViolationEvent:
    timestamp: float
    v_type: str
    detail: str


class AnomalyEngine:
    def __init__(self):
        self._no_face_since = None
        self._look_away_since = None
        self._talking_since = None
        self._lateral_gaze_since = None  # for second monitor detection
        self._last_screenshot_time = {}  # v_type -> last time.time()
        self.events: list[ViolationEvent] = []

    def _cooldown_ok(self, v_type):
        last = self._last_screenshot_time.get(v_type, 0)
        return (time.time() - last) >= config.SCREENSHOT_COOLDOWN_SEC

    def _record(self, v_type, detail):
        self.events.append(ViolationEvent(time.time(), v_type, detail))
        self._last_screenshot_time[v_type] = time.time()
        return True  # signals caller: take a screenshot

    def evaluate(self, *, face_count, identity_ok, is_away, no_blink_suspect,
                 dominant_emotion, phone_detected, extra_persons,
                 # ── NEW signals ──
                 talking_detected=False,
                 earphone_detected=False, earphone_side=None,
                 hand_gesture_suspicious=False, hand_gestures=None,
                 book_detected=False,
                 gaze_h=None, yaw_deg=0.0,
                 ):
        """
        Call once per processed frame with the latest signals.
        Returns a list of (v_type, detail) tuples that just newly fired
        (i.e. should trigger a screenshot + log entry this frame).
        """
        fired = []
        now = time.time()

        # --- No face present ---
        if face_count == 0:
            if self._no_face_since is None:
                self._no_face_since = now
            elif now - self._no_face_since >= config.NO_FACE_GRACE_SECONDS:
                if self._cooldown_ok("NO_FACE"):
                    self._record("NO_FACE", "Student's face not visible.")
                    fired.append(("NO_FACE", "Student's face not visible."))
        else:
            self._no_face_since = None

        # --- Multiple faces / extra persons ---
        if face_count is not None and face_count > 1:
            if self._cooldown_ok("MULTIPLE_FACES"):
                self._record("MULTIPLE_FACES", f"{face_count} faces detected in frame.")
                fired.append(("MULTIPLE_FACES", f"{face_count} faces detected in frame."))
        elif extra_persons:
            if self._cooldown_ok("EXTRA_PERSON"):
                self._record("EXTRA_PERSON", "Additional person detected via object detection.")
                fired.append(("EXTRA_PERSON", "Additional person detected via object detection."))

        # --- Identity mismatch ---
        if identity_ok is False:
            if self._cooldown_ok("IDENTITY_MISMATCH"):
                self._record("IDENTITY_MISMATCH", "Face does not match registered student.")
                fired.append(("IDENTITY_MISMATCH", "Face does not match registered student."))

        # --- Looking away ---
        if is_away:
            if self._look_away_since is None:
                self._look_away_since = now
            elif now - self._look_away_since >= config.LOOK_AWAY_GRACE_SECONDS:
                if self._cooldown_ok("LOOKING_AWAY"):
                    self._record("LOOKING_AWAY", "Student looked away from the screen.")
                    fired.append(("LOOKING_AWAY", "Student looked away from the screen."))
        else:
            self._look_away_since = None

        # --- Liveness / possible spoof ---
        if no_blink_suspect:
            if self._cooldown_ok("NO_BLINK_SPOOF"):
                self._record("NO_BLINK_SPOOF", "No natural blink detected for an unusual duration.")
                fired.append(("NO_BLINK_SPOOF", "No natural blink detected for an unusual duration."))

        # --- Phone / prohibited object ---
        if phone_detected:
            if self._cooldown_ok("PHONE_DETECTED"):
                self._record("PHONE_DETECTED", "A mobile phone was detected in frame.")
                fired.append(("PHONE_DETECTED", "A mobile phone was detected in frame."))

        # --- NEW: Talking / Whispering ---
        if talking_detected:
            if self._talking_since is None:
                self._talking_since = now
            elif now - self._talking_since >= config.TALKING_GRACE_SECONDS:
                if self._cooldown_ok("TALKING_DETECTED"):
                    self._record("TALKING_DETECTED",
                                 "Student appears to be talking or whispering during exam.")
                    fired.append(("TALKING_DETECTED",
                                  "Student appears to be talking or whispering during exam."))
        else:
            self._talking_since = None

        # --- NEW: Earphone / Earbud ---
        if earphone_detected:
            side_str = f" ({earphone_side} ear)" if earphone_side else ""
            if self._cooldown_ok("EARPHONE_DETECTED"):
                self._record("EARPHONE_DETECTED",
                             f"Earphone/earbud detected{side_str}.")
                fired.append(("EARPHONE_DETECTED",
                              f"Earphone/earbud detected{side_str}."))

        # --- NEW: Hand Gesture / Signal ---
        if hand_gesture_suspicious and hand_gestures:
            gesture_names = ", ".join(
                g.get("gesture", "unknown") for g in hand_gestures
            )
            if self._cooldown_ok("HAND_SIGNAL"):
                self._record("HAND_SIGNAL",
                             f"Suspicious hand signal detected: {gesture_names}.")
                fired.append(("HAND_SIGNAL",
                              f"Suspicious hand signal detected: {gesture_names}."))

        # --- NEW: Book / Paper / Cheat Sheet ---
        if book_detected:
            if self._cooldown_ok("BOOK_DETECTED"):
                self._record("BOOK_DETECTED",
                             "Book, paper, or cheat sheet detected in frame.")
                fired.append(("BOOK_DETECTED",
                              "Book, paper, or cheat sheet detected in frame."))

        # --- NEW: Second Monitor / Screen Sharing Detection ---
        if gaze_h is not None:
            looking_far_lateral = (
                gaze_h < (1.0 - config.SECOND_MONITOR_GAZE_H_LIMIT)
                or gaze_h > config.SECOND_MONITOR_GAZE_H_LIMIT
            ) and abs(yaw_deg) > config.YAW_LIMIT_DEG
            if looking_far_lateral:
                if self._lateral_gaze_since is None:
                    self._lateral_gaze_since = now
                elif now - self._lateral_gaze_since >= config.SECOND_MONITOR_GAZE_SECONDS:
                    if self._cooldown_ok("SECOND_MONITOR"):
                        self._record("SECOND_MONITOR",
                                     "Student looking at possible second screen/monitor.")
                        fired.append(("SECOND_MONITOR",
                                      "Student looking at possible second screen/monitor."))
            else:
                self._lateral_gaze_since = None

        # --- Emotion (logged, not a hard violation) ---
        if dominant_emotion in config.WATCH_EMOTIONS:
            if self._cooldown_ok(f"EMOTION_{dominant_emotion.upper()}"):
                self._record(f"EMOTION_{dominant_emotion.upper()}",
                              f"Elevated '{dominant_emotion}' detected.")
                fired.append((f"EMOTION_{dominant_emotion.upper()}",
                               f"Elevated '{dominant_emotion}' detected."))

        return fired

    def summary_counts(self):
        counts = {}
        for e in self.events:
            counts[e.v_type] = counts.get(e.v_type, 0) + 1
        return counts

