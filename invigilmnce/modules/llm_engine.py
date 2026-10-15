"""
LLM Engine — Gemini AI Integration for InvigiLMNce Proctoring.
Uses the existing proctoring telemetry (emotion, gaze, violations) from
the invigilmnce modules and generates intelligent suggestions via Google Gemini.
"""
import os
import json
import google.generativeai as genai

# ─── Configuration ───────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-2.0-flash"

SYSTEM_PROMPT = """You are an intelligent AI proctoring assistant for InvigiLMNce — 
an enterprise exam invigilation system built into SmartLabX Virtual Lab. You analyze 
real-time facial detection data (emotion, gaze direction, head pose, blink rate, 
face count, prohibited objects, identity verification) and provide:

1. **Concise actionable suggestions** for the proctor/invigilator (max 2-3 sentences).
2. **Severity classification**: LOW / MEDIUM / HIGH / CRITICAL.
3. **Recommended action**: MONITOR / WARN_STUDENT / FLAG_FOR_REVIEW / IMMEDIATE_INTERVENTION.

Be professional, fair, and avoid false accusations. Consider that students may 
naturally look away briefly or show stress without cheating. Only escalate for 
clear, sustained violations."""


def _get_model():
    """Initialize and return the Gemini generative model."""
    if not GEMINI_API_KEY:
        return None
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
    )


def get_llm_suggestion(telemetry: dict) -> dict:
    """
    Takes proctoring telemetry data (from api_server.py frame processing)
    and returns an LLM-generated suggestion.
    
    Args:
        telemetry: dict from the existing proctoring pipeline with keys like:
            - face_detected, gaze_state, head_pose, liveness
            - identity_ok, dominant_emotion
            - phone_detected, extra_person_detected
            - anomalies, anomaly_score, risk_level
    """
    model = _get_model()

    # Extract telemetry fields
    face_detected = telemetry.get("face_detected", True)
    gaze_state = telemetry.get("gaze_state", "looking_forward")
    head_pose = telemetry.get("head_pose", {})
    liveness_data = telemetry.get("liveness", {})
    identity_ok = telemetry.get("identity_ok", None)
    emotion = telemetry.get("dominant_emotion", "neutral")
    phone_detected = telemetry.get("phone_detected", False)
    extra_person = telemetry.get("extra_person_detected", False)
    anomalies = telemetry.get("anomalies", [])
    anomaly_score = telemetry.get("anomaly_score", 0)
    risk_level = telemetry.get("risk_level", "LOW")

    prompt = f"""Analyze this real-time exam proctoring telemetry and provide a suggestion:

 **Live Proctoring Telemetry:**
- Face Detected: {face_detected}
- Gaze State: {gaze_state}
- Head Pose: Yaw={head_pose.get('yaw', 0)}°, Pitch={head_pose.get('pitch', 0)}°, Warning={head_pose.get('warning', False)}
- Blink Liveness: {json.dumps(liveness_data) if liveness_data else 'N/A'}
- Identity Match: {identity_ok}
- Dominant Emotion: {emotion}
- Phone/Prohibited Object: {phone_detected}
- Extra Person in Frame: {extra_person}
- Active Anomalies: {json.dumps(anomalies) if anomalies else 'None'}
- Anomaly Score: {anomaly_score}/100
- Risk Level: {risk_level}

Respond in this exact JSON format:
{{
    "suggestion": "<your 2-3 sentence suggestion for the proctor>",
    "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "recommended_action": "<MONITOR|WARN_STUDENT|FLAG_FOR_REVIEW|IMMEDIATE_INTERVENTION>",
    "emotion_insight": "<brief note about the student's emotional state>"
}}"""

    if model is None:
        return _fallback_suggestion(telemetry)

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Remove markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        result = json.loads(text)
        return {
            "success": True,
            "suggestion": result.get("suggestion", "No suggestion available."),
            "severity": result.get("severity", "LOW"),
            "recommended_action": result.get("recommended_action", "MONITOR"),
            "emotion_insight": result.get("emotion_insight", ""),
            "source": "gemini-llm",
        }
    except Exception as e:
        fallback = _fallback_suggestion(telemetry)
        fallback["llm_error"] = str(e)
        return fallback


def _fallback_suggestion(telemetry: dict) -> dict:
    """Rule-based fallback when Gemini API is unavailable."""
    phone_detected = telemetry.get("phone_detected", False)
    identity_ok = telemetry.get("identity_ok", None)
    face_detected = telemetry.get("face_detected", True)
    extra_person = telemetry.get("extra_person_detected", False)
    gaze_state = telemetry.get("gaze_state", "looking_forward")
    emotion = telemetry.get("dominant_emotion", "neutral")
    anomaly_score = telemetry.get("anomaly_score", 0)

    severity = "LOW"
    action = "MONITOR"
    suggestion = "All parameters appear normal. Continue standard monitoring."
    emotion_insight = f"Student appears {emotion}."

    if phone_detected:
        severity = "CRITICAL"
        action = "IMMEDIATE_INTERVENTION"
        suggestion = ("[!!] Prohibited device (mobile phone) detected. "
                      "Verify immediately and consider pausing the exam.")
    elif identity_ok is False:
        severity = "HIGH"
        action = "FLAG_FOR_REVIEW"
        suggestion = ("[!] Person does NOT match enrolled biometric. "
                      "Possible impersonation — verify identity manually.")
    elif not face_detected:
        severity = "HIGH"
        action = "WARN_STUDENT"
        suggestion = ("No face visible. Student may have left or covered camera. "
                      "Send a warning notification.")
    elif extra_person:
        severity = "HIGH"
        action = "FLAG_FOR_REVIEW"
        suggestion = ("Extra person detected. Only one candidate should be visible. "
                      "Review recorded footage for external assistance.")
    elif gaze_state != "looking_forward":
        severity = "MEDIUM"
        action = "WARN_STUDENT"
        suggestion = ("Student looking away from screen for extended period. "
                      "May indicate reading external notes.")
    elif anomaly_score > 50:
        severity = "MEDIUM"
        action = "FLAG_FOR_REVIEW"
        suggestion = (f"Anomaly score elevated at {anomaly_score}/100. "
                      "Multiple minor infractions accumulating.")

    if emotion in ("fear", "surprise") and severity == "LOW":
        emotion_insight = "Student shows anxiety — common during exams, no action needed."
    elif emotion == "angry":
        emotion_insight = "Student appears frustrated. Check for technical difficulties."
    elif emotion == "sad":
        emotion_insight = "Student appears dejected. May be struggling with the exam."
    elif emotion == "happy":
        emotion_insight = "Student appears comfortable and confident."

    return {
        "success": True,
        "suggestion": suggestion,
        "severity": severity,
        "recommended_action": action,
        "emotion_insight": emotion_insight,
        "source": "rule-based-fallback",
    }
