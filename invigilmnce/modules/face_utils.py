"""
Face registration + identity verification, powered by DeepFace.

Registration: store one reference photo per student (by name/roll no).
Verification: during the exam, periodically compare the live frame against
the registered reference to make sure the same person is still present.
"""
import os
import cv2
import numpy as np

from modules import config

_deepface = None


def _get_deepface():
    """Lazy import so the Streamlit app boots fast and gives a clear error
    if TensorFlow/DeepFace aren't installed correctly."""
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
    return _deepface


def register_face(student_id: str, frame_bgr: np.ndarray) -> str:
    """Save a reference face image for a student. Returns the saved path."""
    student_id = "".join(c for c in student_id if c.isalnum() or c in ("_", "-")).strip()
    if not student_id:
        raise ValueError("Invalid student ID.")
    path = os.path.join(config.REGISTERED_FACES_DIR, f"{student_id}.jpg")
    cv2.imwrite(path, frame_bgr)
    return path


def validate_and_register_face(student_id: str, frame_bgr: np.ndarray) -> dict:
    """Validates face presence and saves reference photo."""
    student_id = "".join(c for c in student_id if c.isalnum() or c in ("_", "-")).strip()
    if not student_id:
        return {"success": False, "path": None, "error": "Invalid Student ID (use alphanumeric, underscores or dashes)."}
    if frame_bgr is None or frame_bgr.size == 0:
        return {"success": False, "path": None, "error": "Invalid or empty image frame provided."}

    # Lightweight Haar cascade check for quick registration feedback
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

    if len(faces) == 0:
        # Save anyway if user confirmed, but warn
        path = register_face(student_id, frame_bgr)
        return {
            "success": True,
            "path": path,
            "face_count": 0,
            "warning": "No clear front face detected in reference. Identity verification might be less reliable.",
            "error": None,
        }

    path = register_face(student_id, frame_bgr)
    return {"success": True, "path": path, "face_count": len(faces), "warning": None, "error": None}


def delete_student(student_id: str) -> bool:
    """Deletes a registered student face file."""
    ref_path = get_reference_path(student_id)
    if ref_path and os.path.exists(ref_path):
        try:
            os.remove(ref_path)
            return True
        except OSError:
            return False
    return False


def list_registered_students():
    if not os.path.isdir(config.REGISTERED_FACES_DIR):
        return []
    return sorted(
        f[:-4] for f in os.listdir(config.REGISTERED_FACES_DIR) if f.endswith(".jpg")
    )


def get_reference_path(student_id: str):
    path = os.path.join(config.REGISTERED_FACES_DIR, f"{student_id}.jpg")
    return path if os.path.exists(path) else None


def get_student_metadata(student_id: str):
    path = get_reference_path(student_id)
    if not path:
        return None
    stat = os.stat(path)
    return {
        "student_id": student_id,
        "path": path,
        "modified_time": stat.st_mtime,
        "size_kb": round(stat.st_size / 1024, 1),
    }


def verify_identity(student_id: str, frame_bgr: np.ndarray):
    """
    Compare the current frame to the student's registered reference.

    Returns a dict: {"verified": bool, "distance": float, "error": str|None}
    Never raises — proctoring must keep running even if a single check fails
    (e.g. no face in this particular frame).
    """
    ref_path = get_reference_path(student_id)
    if ref_path is None:
        return {"verified": False, "distance": None, "error": "No registered face on file."}

    try:
        DeepFace = _get_deepface()
        result = DeepFace.verify(
            img1_path=ref_path,
            img2_path=frame_bgr,
            model_name="VGG-Face",
            detector_backend="opencv",
            distance_metric="cosine",
            enforce_detection=True,
            silent=True,
        )
        verified = bool(result.get("verified", False)) and (
            result.get("distance", 1.0) <= config.FACE_VERIFY_THRESHOLD
        )
        return {"verified": verified, "distance": result.get("distance"), "error": None}
    except Exception as exc:  # DeepFace raises if no face is found, etc.
        return {"verified": False, "distance": None, "error": str(exc)}


_frontal_cascade = None
_profile_cascade = None

def get_face_cascades():
    global _frontal_cascade, _profile_cascade
    if _frontal_cascade is None:
        _frontal_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    if _profile_cascade is None:
        _profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
    return _frontal_cascade, _profile_cascade


def detect_faces_cascade(frame_bgr):
    """
    Ultra-fast secondary face detector using frontal and profile cascades.
    Returns (face_count, bounding_boxes_list).
    """
    if frame_bgr is None or frame_bgr.size == 0:
        return 0, []
    try:
        frontal, profile = get_face_cascades()
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]
        
        # Scale down for speed (~2-3ms)
        target_w = 320
        scale = target_w / max(w, 1)
        small_gray = cv2.resize(gray, (target_w, int(h * scale)))

        frontal_faces = frontal.detectMultiScale(small_gray, scaleFactor=1.12, minNeighbors=3, minSize=(20, 20))
        profile_faces = profile.detectMultiScale(small_gray, scaleFactor=1.12, minNeighbors=3, minSize=(20, 20))

        boxes = []
        for (x, y, fw, fh) in frontal_faces:
            boxes.append([int(x / scale), int(y / scale), int(fw / scale), int(fh / scale)])

        for (x, y, fw, fh) in profile_faces:
            bx, by, bw, bh = int(x / scale), int(y / scale), int(fw / scale), int(fh / scale)
            # Avoid duplicating existing frontal boxes
            overlaps = False
            for (ox, oy, ow, oh) in boxes:
                if abs(bx - ox) < ow * 0.6 and abs(by - oy) < oh * 0.6:
                    overlaps = True
                    break
            if not overlaps:
                boxes.append([bx, by, bw, bh])

        return len(boxes), boxes
    except Exception:
        return 0, []

