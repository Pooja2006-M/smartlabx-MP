"""
Emotion recognition using DeepFace. Analysis is throttled (see config) since
it's the most expensive per-frame call in the pipeline.
"""
_deepface = None


def _get_deepface():
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
    return _deepface


def analyze_emotion(frame_bgr):
    """
    Returns {"dominant_emotion": str, "scores": dict, "error": str|None}.
    Never raises — caller should treat error!=None as "no reading this cycle".
    """
    try:
        DeepFace = _get_deepface()
        result = DeepFace.analyze(
            img_path=frame_bgr,
            actions=["emotion"],
            detector_backend="opencv",
            enforce_detection=True,
            silent=True,
        )
        if isinstance(result, list):
            result = result[0]
        return {
            "dominant_emotion": result.get("dominant_emotion"),
            "scores": result.get("emotion", {}),
            "error": None,
        }
    except Exception as exc:
        return {"dominant_emotion": None, "scores": {}, "error": str(exc)}
