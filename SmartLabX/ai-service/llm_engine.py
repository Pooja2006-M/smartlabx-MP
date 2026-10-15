"""
LLM Engine — Gemini AI Integration for SmartLabX Proctoring.
Takes face detection results (emotion, gaze, violations) and generates
intelligent, context-aware suggestions using Google Gemini.
"""
import os
import google.generativeai as genai

# ─── Configuration ───────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-2.0-flash"

# System prompt that defines the LLM's persona
SYSTEM_PROMPT = """You are an intelligent AI proctoring assistant for SmartLabX — 
an enterprise exam invigilation system. You analyze real-time facial detection data 
(emotion, gaze direction, blink rate, face count, prohibited objects) and provide:

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


def get_llm_suggestion(analysis_data: dict) -> dict:
    """
    Takes proctoring analysis data and returns an LLM-generated suggestion.
    
    Args:
        analysis_data: dict with keys like:
            - emotion: str (e.g., "happy", "sad", "fear", "angry")
            - face_count: int
            - is_looking_away: bool
            - phone_detected: bool
            - identity_verified: bool | None
            - blink_count: int
            - duration_seconds: int
    
    Returns:
        dict with: suggestion, severity, recommended_action
    """
    model = _get_model()

    # ── Build the prompt from analysis data ──────────────────────────────
    emotion = analysis_data.get("emotion", "neutral")
    face_count = analysis_data.get("face_count", 1)
    is_looking_away = analysis_data.get("is_looking_away", False)
    phone_detected = analysis_data.get("phone_detected", False)
    identity_verified = analysis_data.get("identity_verified", None)
    blink_count = analysis_data.get("blink_count", 0)
    duration = analysis_data.get("duration_seconds", 0)

    prompt = f"""Analyze this real-time exam proctoring data and provide a suggestion:

📊 **Current Telemetry Snapshot:**
- Dominant Emotion: {emotion}
- Faces Detected: {face_count}
- Looking Away from Screen: {is_looking_away}
- Phone/Prohibited Object Detected: {phone_detected}
- Identity Match with Enrolled Photo: {identity_verified}
- Blink Count (session): {blink_count}
- Session Duration: {duration} seconds

Respond in this exact JSON format:
{{
    "suggestion": "<your 2-3 sentence suggestion for the proctor>",
    "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "recommended_action": "<MONITOR|WARN_STUDENT|FLAG_FOR_REVIEW|IMMEDIATE_INTERVENTION>",
    "emotion_insight": "<brief note about the student's emotional state>"
}}"""

    # ── If no API key, use rule-based fallback ───────────────────────────
    if model is None:
        return _fallback_suggestion(analysis_data)

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Try parsing JSON from LLM response
        import json
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
        # Fallback to rule-based if LLM fails
        fallback = _fallback_suggestion(analysis_data)
        fallback["llm_error"] = str(e)
        return fallback


def _fallback_suggestion(data: dict) -> dict:
    """
    Rule-based fallback when Gemini API is unavailable.
    Still provides intelligent suggestions based on heuristics.
    """
    emotion = data.get("emotion", "neutral")
    face_count = data.get("face_count", 1)
    is_looking_away = data.get("is_looking_away", False)
    phone_detected = data.get("phone_detected", False)
    identity_verified = data.get("identity_verified", None)

    severity = "LOW"
    action = "MONITOR"
    suggestion = "All parameters appear normal. Continue standard monitoring."
    emotion_insight = f"Student appears {emotion}."

    # ── Critical violations ──────────────────────────────────────────────
    if phone_detected:
        severity = "CRITICAL"
        action = "IMMEDIATE_INTERVENTION"
        suggestion = (
            "🚨 A prohibited device (mobile phone) has been detected in the frame. "
            "Immediately verify whether the student is using it for unauthorized assistance. "
            "Consider pausing the exam for this candidate."
        )
    elif identity_verified is False:
        severity = "HIGH"
        action = "FLAG_FOR_REVIEW"
        suggestion = (
            "⚠️ The person in front of the camera does NOT match the enrolled biometric profile. "
            "This could indicate an impersonation attempt. Verify the candidate's identity manually."
        )
    elif face_count == 0:
        severity = "HIGH"
        action = "WARN_STUDENT"
        suggestion = (
            "No face detected in the camera frame. The student may have left the seat, "
            "covered the camera, or moved out of view. Send a warning notification."
        )
    elif face_count > 1:
        severity = "HIGH"
        action = "FLAG_FOR_REVIEW"
        suggestion = (
            f"{face_count} people detected in the frame. Only one candidate should be visible. "
            "This may indicate external assistance. Review the recorded footage."
        )
    elif is_looking_away:
        severity = "MEDIUM"
        action = "WARN_STUDENT"
        suggestion = (
            "The student has been looking away from the screen for an extended period. "
            "This could indicate reading from external notes or consulting another device."
        )

    # ── Emotion-based insights ───────────────────────────────────────────
    if emotion in ("fear", "surprise") and severity == "LOW":
        severity = "LOW"
        action = "MONITOR"
        emotion_insight = (
            "Student shows signs of anxiety/surprise. This is common during exams. "
            "No action needed unless combined with other violations."
        )
    elif emotion == "angry":
        emotion_insight = (
            "Student appears frustrated. Consider checking if they are facing "
            "technical difficulties or difficult questions."
        )
    elif emotion == "sad":
        emotion_insight = (
            "Student appears sad or dejected. This might indicate they are struggling "
            "with the exam. Monitor for signs of giving up."
        )
    elif emotion == "happy":
        emotion_insight = "Student appears comfortable and confident. Positive indicator."

    return {
        "success": True,
        "suggestion": suggestion,
        "severity": severity,
        "recommended_action": action,
        "emotion_insight": emotion_insight,
        "source": "rule-based-fallback",
    }


def get_student_answer(question: str) -> str:
    """Uses Gemini to answer a student's learning query."""
    model = _get_model()
    if model is None:
        return "I'm sorry, but the AI service is currently unavailable because the GEMINI_API_KEY is not configured in the environment. Please add it to your .env file."
    
    prompt = f"""You are a strict but helpful AI Lab Assistant for students.
Your ONLY goal is to provide HINTS and GUIDING QUESTIONS. 
NEVER give the direct answer or full code. 
Instead, give a small clue or hint, and ask a follow-up question to make the student think and solve it themselves.
Use markdown for formatting.
Student's Question: {question}"""
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error connecting to AI service: {str(e)}"
