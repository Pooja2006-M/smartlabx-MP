"""
InvigiLMNce — Enterprise AI Proctoring & Invigilation Command Center.
Features:
- Glassmorphism Cyber-Proctor Dark Theme
- Dual-Mode Biometric Enrollment (Webcam + Photo Upload)
- Live AI Invigilation HUD (Corner Reticles, Head-Pose Telemetry, Blink Liveness, Emotion Radar)
- Multi-Input Video Sources (Webcam, Uploaded Demo Video, Snapshot Testing)
- Executive Audit Dashboard (Integrity KPIs, Evidence Screenshot Gallery, PDF & Excel Exports)
- Viva & Architecture Walkthrough
"""
import os
import time
import cv2
import numpy as np
import streamlit as st
import threading
try:
    import winsound
except ImportError:
    winsound = None

from modules import config
from modules import face_utils
from modules import gaze_pose
from modules import liveness
from modules import emotion_utils
from modules import object_detection
from modules import anomaly_engine
from modules import screenshot_utils
from modules import logger
from modules import report_generator

# ----------------------------- Streamlit Page Configuration -----------------------------
st.set_page_config(
    page_title="InvigiLMNce — AI Proctoring Command Center",
    page_icon="[AI]",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ----------------------------- Load Custom CSS -----------------------------
css_path = os.path.join(config.BASE_DIR, "assets", "style.css")
if os.path.exists(css_path):
    with open(css_path, "r") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# ----------------------------- Session State Initialization -----------------------------
if "monitoring" not in st.session_state:
    st.session_state.monitoring = False
if "student_id" not in st.session_state:
    st.session_state.student_id = ""
if "session_start" not in st.session_state:
    st.session_state.session_start = None
if "frame_idx" not in st.session_state:
    st.session_state.frame_idx = 0
if "last_face_verify_t" not in st.session_state:
    st.session_state.last_face_verify_t = 0
if "last_emotion_t" not in st.session_state:
    st.session_state.last_emotion_t = 0
if "identity_ok" not in st.session_state:
    st.session_state.identity_ok = None
if "dominant_emotion" not in st.session_state:
    st.session_state.dominant_emotion = "neutral"
if "last_report_path" not in st.session_state:
    st.session_state.last_report_path = None
if "blink_tracker" not in st.session_state:
    st.session_state.blink_tracker = liveness.BlinkTracker()
if "anomaly_engine" not in st.session_state:
    st.session_state.anomaly_engine = anomaly_engine.AnomalyEngine()

@st.cache_resource
def get_face_mesh_tracker():
    return gaze_pose.FaceMeshTracker()

# ----------------------------- Sidebar Navigation & System Diagnostics -----------------------------
with st.sidebar:
    st.markdown("""
    <div style="padding: 10px 0 18px 0; border-bottom: 1px solid rgba(99,102,241,0.25);">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 2.2rem;">[AI]</div>
            <div>
                <div style="font-weight: 800; font-size: 1.35rem; letter-spacing: -0.02em; background: linear-gradient(135deg, #a5b4fc 0%, #ffffff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">InvigiLMNce</div>
                <div style="font-size: 0.72rem; color: #818cf8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">AI Proctor Command Center</div>
            </div>
        </div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; padding: 3px 10px; font-size: 0.75rem; color: #6ee7b7; font-weight: 600;">
            <span class="pulsing-dot"></span> SYSTEM ENFORCEMENT READY
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)
    page = st.radio(
        "Navigation",
        [
            "1.  Biometric Enrollment",
            "2. ️ Live AI Invigilation HUD",
            "3.  Executive Audit & Reports",
            "4.  Architecture & Viva Guide",
        ],
        label_visibility="collapsed"
    )

    st.markdown("---")
    st.markdown("""
    <div style="font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">
        Core AI Engine Matrix
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(15,23,42,0.6); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(99,102,241,0.15);">
            <span style="color: #cbd5e1;">MediaPipe FaceMesh</span>
            <span style="color: #34d399; font-weight:700; font-size: 0.72rem;">ACTIVE (30 FPS)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(15,23,42,0.6); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(99,102,241,0.15);">
            <span style="color: #cbd5e1;">DeepFace VGG-Face</span>
            <span style="color: #818cf8; font-weight:700; font-size: 0.72rem;">STANDBY</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(15,23,42,0.6); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(99,102,241,0.15);">
            <span style="color: #cbd5e1;">YOLOv5 Guard</span>
            <span style="color: #818cf8; font-weight:700; font-size: 0.72rem;">READY</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(15,23,42,0.6); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(99,102,241,0.15);">
            <span style="color: #cbd5e1;">Emotion Classifier</span>
            <span style="color: #38bdf8; font-weight:700; font-size: 0.72rem;">ACTIVE</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.session_state.monitoring:
        st.markdown("---")
        st.markdown(f"""
        <div style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.4); border-radius: 10px; padding: 12px; text-align: center;">
            <div style="color: #fda4af; font-weight: 700; font-size: 0.85rem;"> EXAM SESSION ACTIVE</div>
            <div style="color: #fff; font-size: 1.1rem; font-weight: 800; margin-top: 4px;">{st.session_state.student_id}</div>
        </div>
        """, unsafe_allow_html=True)

# ==============================================================================
# PAGE 1: BIOMETRIC ENROLLMENT
# ==============================================================================
if page == "1.  Biometric Enrollment":
    st.markdown("""
    <div class="proctor-hero">
        <div class="brand-header">
            <span class="brand-badge"><span class="pulsing-dot"></span> Phase 1</span>
            <span class="brand-badge" style="background: rgba(6,182,212,0.15); border-color: rgba(6,182,212,0.3); color: #67e8f9;">Identity Vault</span>
        </div>
        <h1 style="margin: 0; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; color: #f8fafc;">
            Biometric Student Enrollment
        </h1>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 1rem; max-width: 800px;">
            Securely register candidates by capturing or uploading a reference portrait. The biometric identity is verified periodically during examinations using cosine feature similarity.
        </p>
    </div>
    """, unsafe_allow_html=True)

    col_form, col_preview = st.columns([1.1, 1], gap="large")

    with col_form:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("<h3 style='margin-top:0; font-size: 1.25rem;'>Candidate Profile Details</h3>", unsafe_allow_html=True)
        student_id_input = st.text_input(
            "Student Roll Number / Identity Code",
            placeholder="e.g. 2312085 or CS-2026-042",
            help="Unique identifier used for logs, PDF reports, and facial verification."
        )

        st.markdown("<div style='margin-top: 15px;'></div>", unsafe_allow_html=True)
        enroll_method = st.radio(
            "Enrollment Capture Method",
            [" Live Webcam Capture", " Upload Image File (PNG / JPG)"],
            horizontal=True
        )

        captured_frame = None

        if enroll_method == " Live Webcam Capture":
            st.info(" **Webcam Permission Tip**: If accessing over LAN IP (e.g. `172.20.10.2`), Chrome requires HTTPS for camera access. You can open `http://localhost:8501` locally or use the **Upload Image File** option below.")
            cam_image = st.camera_input("Position face squarely inside the frame")
            if cam_image is not None:
                file_bytes = np.frombuffer(cam_image.getvalue(), dtype=np.uint8)
                captured_frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        else:
            uploaded_file = st.file_uploader(
                "Upload clear front-facing portrait",
                type=["jpg", "jpeg", "png"],
                help="Recommended: Well-lit, forward-looking passport or ID photo."
            )
            if uploaded_file is not None:
                file_bytes = np.frombuffer(uploaded_file.getvalue(), dtype=np.uint8)
                captured_frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        st.markdown("</div>", unsafe_allow_html=True)

    with col_preview:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("<h3 style='margin-top:0; font-size: 1.25rem;'>Biometric Quality Assurance</h3>", unsafe_allow_html=True)

        if captured_frame is not None:
            # Run quick face check
            rgb_preview = cv2.cvtColor(captured_frame, cv2.COLOR_BGR2RGB)
            st.image(rgb_preview, caption="Captured Enrollment Image", use_container_width=True)

            gray = cv2.cvtColor(captured_frame, cv2.COLOR_BGR2GRAY)
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            face_cascade = cv2.CascadeClassifier(cascade_path)
            detected_faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

            if len(detected_faces) == 1:
                st.markdown("""
                <div style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); border-radius: 8px; padding: 10px 14px; color: #6ee7b7; font-weight: 600; font-size: 0.9rem;">
                    [OK] Optimal Portrait: Single face detected with high clarity.
                </div>
                """, unsafe_allow_html=True)
            elif len(detected_faces) > 1:
                st.markdown(f"""
                <div style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); border-radius: 8px; padding: 10px 14px; color: #fcd34d; font-weight: 600; font-size: 0.9rem;">
                    [!] Warning: {len(detected_faces)} faces detected in frame. Only one candidate should be present.
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown("""
                <div style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.4); border-radius: 8px; padding: 10px 14px; color: #fda4af; font-weight: 600; font-size: 0.9rem;">
                    [!] No frontal face detected. Ensure good lighting and look directly at camera.
                </div>
                """, unsafe_allow_html=True)

            st.markdown("<div style='margin-top: 15px;'></div>", unsafe_allow_html=True)
            if st.button(" Save Biometric Enrollment", use_container_width=True):
                if not student_id_input.strip():
                    st.error("Please provide a valid Student Roll Number / ID before saving.")
                else:
                    res = face_utils.validate_and_register_face(student_id_input, captured_frame)
                    if res["success"]:
                        st.success(f" Biometric profile for '{student_id_input}' successfully enrolled!")
                        time.sleep(1)
                        st.rerun()
                    else:
                        st.error(res["error"])
        else:
            st.markdown("""
            <div style="text-align: center; padding: 40px 20px; color: #64748b; border: 2px dashed rgba(99,102,241,0.25); border-radius: 12px;">
                <div style="font-size: 3rem; margin-bottom: 8px;"></div>
                <div style="font-weight: 600; color: #cbd5e1;">Awaiting Image Input</div>
                <div style="font-size: 0.85rem; margin-top: 4px;">Use the webcam capture or upload an image on the left to verify face quality.</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("</div>", unsafe_allow_html=True)

    # ---------------- Registered Candidates Directory ----------------
    st.markdown("<div style='margin-top: 20px;'></div>", unsafe_allow_html=True)
    st.markdown("<h3 style='font-size: 1.4rem; font-weight: 700;'>Enrolled Candidate Directory</h3>", unsafe_allow_html=True)

    students = face_utils.list_registered_students()
    if not students:
        st.info("No candidates registered in the biometric vault yet. Enroll your first candidate above.")
    else:
        cols = st.columns(min(4, max(1, len(students))))
        for idx, sid in enumerate(students):
            col = cols[idx % len(cols)]
            with col:
                st.markdown("<div class='student-avatar-card'>", unsafe_allow_html=True)
                ref_path = face_utils.get_reference_path(sid)
                if ref_path and os.path.exists(ref_path):
                    st.image(ref_path, use_container_width=True)
                meta = face_utils.get_student_metadata(sid)
                mod_str = time.strftime("%Y-%m-%d %H:%M", time.localtime(meta["modified_time"])) if meta else "—"
                st.markdown(f"""
                <div style="font-weight: 800; font-size: 1.05rem; color: #f8fafc; margin-top: 8px;">{sid}</div>
                <div style="font-size: 0.72rem; color: #94a3b8;">Enrolled: {mod_str}</div>
                <div style="margin-top: 8px; display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; padding: 2px 8px; font-size: 0.7rem; color: #6ee7b7; font-weight: 700;">BIOMETRIC VERIFIED</div>
                """, unsafe_allow_html=True)
                if st.button(f"️ Remove", key=f"del_{sid}", use_container_width=True):
                    face_utils.delete_student(sid)
                    st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# PAGE 2: LIVE AI INVIGILATION HUD
# ==============================================================================
elif page == "2. ️ Live AI Invigilation HUD":
    st.markdown("""
    <div class="proctor-hero">
        <div class="brand-header">
            <span class="brand-badge"><span class="pulsing-dot"></span> Mission Control</span>
            <span class="brand-badge" style="background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.3); color: #d8b4fe;">Real-Time AI Telemetry</span>
        </div>
        <h1 style="margin: 0; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; color: #f8fafc;">
            Live AI Invigilation Command Center
        </h1>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 1rem; max-width: 800px;">
            Continuous 360° exam monitoring: Gaze deviation, facial landmarks, eye-blink liveness tracking, emotional sentiment classification, and prohibited object / mobile phone detection.
        </p>
    </div>
    """, unsafe_allow_html=True)

    registered = face_utils.list_registered_students()
    if not registered:
        st.warning("[!] No enrolled candidates found in the biometric vault. Please register a student in Step 1 first.")
    else:
        # Top Control Bar
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        col_std, col_src, col_act1, col_act2 = st.columns([1.5, 1.5, 1.2, 1.2], gap="medium")

        with col_std:
            selected_student = st.selectbox("Candidate for this session", registered, disabled=st.session_state.monitoring)

        with col_src:
            media_source = st.selectbox(
                "Input Video Feed Source",
                ["Webcam (Device 0)", "Upload Video File (Audit / Simulation)", "Diagnostic Snapshot Mode"],
                disabled=st.session_state.monitoring
            )

        with col_act1:
            st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
            start_clicked = st.button("▶ START EXAM", disabled=st.session_state.monitoring, use_container_width=True)

        with col_act2:
            st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
            st.markdown("<div class='stop-btn'>", unsafe_allow_html=True)
            stop_clicked = st.button("⏹ STOP EXAM", disabled=not st.session_state.monitoring, use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)

        # Uploaded video file handler if in Simulation mode
        uploaded_video_path = None
        if media_source == "Upload Video File (Audit / Simulation)" and not st.session_state.monitoring:
            vid_file = st.file_uploader("Select MP4/AVI exam video for simulation test", type=["mp4", "avi", "mov"])
            if vid_file is not None:
                temp_vid_path = os.path.join(config.DATA_DIR, "temp_demo_video.mp4")
                with open(temp_vid_path, "wb") as f:
                    f.write(vid_file.getvalue())
                uploaded_video_path = temp_vid_path
                st.success(f"Loaded simulation video: {vid_file.name}")

        st.markdown("</div>", unsafe_allow_html=True)

        # Start Session Trigger
        if start_clicked:
            st.session_state.monitoring = True
            st.session_state.student_id = selected_student
            st.session_state.session_start = time.time()
            st.session_state.anomaly_engine = anomaly_engine.AnomalyEngine()
            st.session_state.blink_tracker = liveness.BlinkTracker()
            st.session_state.identity_ok = None
            st.session_state.dominant_emotion = "neutral"
            st.session_state.frame_idx = 0
            st.session_state.last_face_verify_t = 0
            st.session_state.last_emotion_t = 0
            st.rerun()

        # Stop Session Trigger
        if stop_clicked:
            st.session_state.monitoring = False
            session_end = time.time()
            events = logger.load_session_events(st.session_state.student_id)
            if st.session_state.session_start:
                start_iso = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.session_state.session_start))
                events = [e for e in events if e["timestamp"] >= start_iso]

            report_path = report_generator.generate_report(
                st.session_state.student_id, events, st.session_state.session_start or time.time(), session_end
            )
            logger.build_excel_summary_sheet()
            st.session_state.last_report_path = report_path
            st.success(f" Exam session concluded! Official PDF audit report created: `{os.path.basename(report_path)}`")
            st.rerun()

        # ---------------- Active Monitoring Stream Loop ----------------
        if st.session_state.monitoring:
            col_feed, col_telemetry = st.columns([1.8, 1.2], gap="large")

            with col_feed:
                feed_placeholder = st.empty()

            with col_telemetry:
                telemetry_placeholder = st.empty()

            # Initialize capture source
            video_input = 0
            temp_vid_path = os.path.join(config.DATA_DIR, "temp_demo_video.mp4")
            if media_source == "Upload Video File (Audit / Simulation)" and os.path.exists(temp_vid_path):
                video_input = temp_vid_path

            if isinstance(video_input, int):
                # Fix Windows webcam issues
                cap = cv2.VideoCapture(video_input, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(video_input)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)

            tracker = get_face_mesh_tracker()

            try:
                while st.session_state.monitoring:
                    ok, frame = cap.read()
                    if not ok:
                        # If video file ended, loop back for demo continuity
                        if isinstance(video_input, str):
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            ok, frame = cap.read()
                        if not ok:
                            st.error("Cannot access video stream. Ensure camera device is connected and accessible.")
                            break

                    if isinstance(video_input, int):
                        frame = cv2.flip(frame, 1)

                    h, w = frame.shape[:2]
                    st.session_state.frame_idx += 1
                    now = time.time()

                    results = tracker.process(frame)
                    face_count = len(results.face_landmarks) if results.face_landmarks else 0

                    yaw = pitch = 0.0
                    gaze_h = gaze_v = None
                    is_away = False
                    no_blink_suspect = False
                    face_box = None

                    if face_count >= 1:
                        landmarks = results.face_landmarks[0]
                        pose = gaze_pose.estimate_head_pose(landmarks, w, h)
                        if pose:
                            yaw, pitch, _roll = pose
                        gaze = gaze_pose.estimate_gaze_ratio(landmarks, w, h)
                        if gaze:
                            gaze_h, gaze_v = gaze
                        is_away = gaze_pose.is_looking_away(
                            yaw, pitch, gaze_h, gaze_v,
                            config.YAW_LIMIT_DEG, config.PITCH_LIMIT_DEG,
                        )
                        st.session_state.blink_tracker.update(landmarks, w, h)
                        no_blink_suspect = st.session_state.blink_tracker.suspect_no_blink()

                        xs = [lm.x * w for lm in landmarks]
                        ys = [lm.y * h for lm in landmarks]
                        face_box = (min(xs), min(ys), max(xs), max(ys))

                    # Heavy models: throttled execution
                    phone_detected = False
                    extra_persons = False
                    if st.session_state.frame_idx % config.HEAVY_MODEL_FRAME_SKIP == 0:
                        obj_result = object_detection.detect_objects(frame)
                        if obj_result["error"] is None:
                            phone_detected = obj_result["phone_detected"]
                            extra_persons = (obj_result["persons"] or 0) > 1

                    if face_count == 1 and (now - st.session_state.last_face_verify_t) >= config.FACE_VERIFY_INTERVAL_SEC:
                        v_result = face_utils.verify_identity(st.session_state.student_id, frame)
                        if v_result["error"] is None:
                            st.session_state.identity_ok = v_result["verified"]
                        st.session_state.last_face_verify_t = now

                    if face_count == 1 and (now - st.session_state.last_emotion_t) >= config.EMOTION_ANALYZE_INTERVAL_SEC:
                        e_result = emotion_utils.analyze_emotion(frame)
                        if e_result["error"] is None:
                            st.session_state.dominant_emotion = e_result["dominant_emotion"]
                        st.session_state.last_emotion_t = now

                    # Evaluate rules in Anomaly Engine
                    fired = st.session_state.anomaly_engine.evaluate(
                        face_count=face_count,
                        identity_ok=st.session_state.identity_ok,
                        is_away=is_away,
                        no_blink_suspect=no_blink_suspect,
                        dominant_emotion=st.session_state.dominant_emotion,
                        phone_detected=phone_detected,
                        extra_persons=extra_persons,
                    )
                    for v_type, detail in fired:
                        if winsound and v_type in ["PHONE_DETECTED", "NO_FACE", "MULTIPLE_FACES", "EXTRA_PERSON", "IDENTITY_MISMATCH"]:
                            threading.Thread(target=winsound.MessageBeep, args=(winsound.MB_ICONEXCLAMATION,)).start()
                        shot_path = screenshot_utils.save_violation_screenshot(
                            frame, st.session_state.student_id, v_type
                        )
                        logger.log_violation(st.session_state.student_id, v_type, detail, shot_path)

                    # Compose High-Tech HUD
                    alerts = []
                    status_text = "SECURE"
                    if face_count == 0:
                        status_text = "FACE ABSENT"
                        alerts.append("NO FACE DETECTED")
                    elif is_away:
                        status_text = "LOOKING AWAY"
                        alerts.append("GAZE DEVIATION")
                    if phone_detected:
                        status_text = "BREACH DETECTED"
                        alerts.append("PROHIBITED PHONE DETECTED")
                    if extra_persons or face_count > 1:
                        status_text = "MULTIPLE PERSONS"
                        alerts.append("EXTRA PERSON IN FRAME")
                    if st.session_state.identity_ok is False:
                        status_text = "IDENTITY MISMATCH"
                        alerts.append("UNVERIFIED CANDIDATE")

                    hud_frame = gaze_pose.draw_hud(
                        frame, face_box=face_box, is_away=is_away,
                        status_text=status_text, yaw=yaw, pitch=pitch,
                        extra_alerts=alerts if alerts else None
                    )

                    # Stream HUD frame to Streamlit
                    feed_placeholder.image(cv2.cvtColor(hud_frame, cv2.COLOR_BGR2RGB), channels="RGB", use_container_width=True)

                    # Stream Live Telemetry Dashboard
                    with telemetry_placeholder.container():
                        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)

                        # Top Candidate Badge + Reference Photo Comparison
                        ref_path = face_utils.get_reference_path(st.session_state.student_id)
                        t_col1, t_col2 = st.columns([1, 2])
                        with t_col1:
                            if ref_path and os.path.exists(ref_path):
                                st.image(ref_path, caption="Enrolled Photo", width=90)
                        with t_col2:
                            st.markdown(f"**Candidate:** `{st.session_state.student_id}`")
                            match_badge = "🟢 VERIFIED" if st.session_state.identity_ok else (" MISMATCH" if st.session_state.identity_ok is False else "🟡 VERIFYING...")
                            st.markdown(f"**Identity:** {match_badge}")
                            elapsed = int(now - (st.session_state.session_start or now))
                            st.markdown(f"**Duration:** `{elapsed // 60:02d}:{elapsed % 60:02d}`")

                        st.markdown("<hr style='margin: 10px 0; border-color: rgba(99,102,241,0.2);'>", unsafe_allow_html=True)

                        # Telemetry Grid
                        m1, m2 = st.columns(2)
                        with m1:
                            st.markdown(f"""
                            <div class="hud-metric-box">
                                <span class="hud-metric-label">Faces in Frame</span>
                                <span class="hud-metric-value">{face_count}</span>
                            </div>
                            """, unsafe_allow_html=True)
                        with m2:
                            st.markdown(f"""
                            <div class="hud-metric-box">
                                <span class="hud-metric-label">Blinks Counted</span>
                                <span class="hud-metric-value">{st.session_state.blink_tracker.blink_count}</span>
                            </div>
                            """, unsafe_allow_html=True)

                        st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)
                        m3, m4 = st.columns(2)
                        with m3:
                            emo = str(st.session_state.dominant_emotion).capitalize()
                            st.markdown(f"""
                            <div class="hud-metric-box">
                                <span class="hud-metric-label">Dominant Emotion</span>
                                <span class="hud-metric-value" style="font-size: 1.15rem; color: #38bdf8;">{emo}</span>
                            </div>
                            """, unsafe_allow_html=True)
                        with m4:
                            phone_txt = "DETECTED" if phone_detected else "CLEAR"
                            phone_color = "#f43f5e" if phone_detected else "#10b981"
                            st.markdown(f"""
                            <div class="hud-metric-box">
                                <span class="hud-metric-label">Phone Radar</span>
                                <span class="hud-metric-value" style="font-size: 1.15rem; color: {phone_color};">{phone_txt}</span>
                            </div>
                            """, unsafe_allow_html=True)

                        st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

                        # Recent Incident Ticker
                        st.markdown("<div style='font-size: 0.85rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;'>Real-Time Anomaly Ticker</div>", unsafe_allow_html=True)
                        recent_events = st.session_state.anomaly_engine.events[-4:][::-1]
                        if not recent_events:
                            st.caption("[OK] No anomalies detected in current window.")
                        else:
                            for ev in recent_events:
                                t_str = time.strftime("%H:%M:%S", time.localtime(ev.timestamp))
                                is_crit = any(k in ev.v_type for k in ["PHONE", "EXTRA", "MISMATCH"])
                                pill_class = "danger" if is_crit else "warning"
                                st.markdown(f"""
                                <div class="alert-timeline-item {pill_class}">
                                    <span><strong>{ev.v_type}</strong> — {ev.detail}</span>
                                    <span style="color: #94a3b8; font-size: 0.72rem;">{t_str}</span>
                                </div>
                                """, unsafe_allow_html=True)

                        st.markdown("</div>", unsafe_allow_html=True)

                    time.sleep(0.02)
            finally:
                cap.release()
        else:
            st.markdown("""
            <div class="proctor-card" style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 3.5rem; margin-bottom: 12px;">️</div>
                <h3 style="margin: 0; color: #f8fafc;">Proctoring HUD in Standby</h3>
                <p style="color: #94a3b8; max-width: 600px; margin: 10px auto 20px auto;">
                    Select an enrolled candidate and video source above, then click <strong>▶ START EXAM</strong> to initialize real-time AI invigilation, feature tracking, and anomaly recording.
                </p>
            </div>
            """, unsafe_allow_html=True)

            if st.session_state.last_report_path and os.path.exists(st.session_state.last_report_path):
                st.markdown(f"""
                <div class="proctor-card" style="border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 800; font-size: 1.1rem; color: #6ee7b7;"> Latest Exam Audit Report Generated</div>
                            <div style="color: #cbd5e1; font-size: 0.85rem; margin-top: 2px;">{os.path.basename(st.session_state.last_report_path)}</div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                with open(st.session_state.last_report_path, "rb") as f:
                    st.download_button(
                        " Download Latest PDF Audit Report",
                        f,
                        file_name=os.path.basename(st.session_state.last_report_path),
                        mime="application/pdf",
                        use_container_width=True
                    )

# ==============================================================================
# PAGE 3: EXECUTIVE AUDIT & REPORTS
# ==============================================================================
elif page == "3.  Executive Audit & Reports":
    st.markdown("""
    <div class="proctor-hero">
        <div class="brand-header">
            <span class="brand-badge"><span class="pulsing-dot"></span> Audit Station</span>
            <span class="brand-badge" style="background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #6ee7b7;">Proctor Analytics</span>
        </div>
        <h1 style="margin: 0; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; color: #f8fafc;">
            Executive Audit & Incident Dashboard
        </h1>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 1rem; max-width: 800px;">
            Comprehensive post-exam review: Aggregated violation statistics, high-resolution evidence screenshots, and downloadable PDF/Excel compliance reports.
        </p>
    </div>
    """, unsafe_allow_html=True)

    all_events = logger.load_session_events(None)
    students = face_utils.list_registered_students()

    # Top Executive KPI Cards
    total_incidents = len(all_events)
    unique_candidates = len(set(e["student_id"] for e in all_events)) if all_events else 0
    phone_breaches = sum(1 for e in all_events if "PHONE" in e.get("violation_type", ""))
    identity_breaches = sum(1 for e in all_events if "MISMATCH" in e.get("violation_type", ""))
    integrity_score = max(0, 100 - (phone_breaches * 15 + identity_breaches * 10 + total_incidents * 2)) if all_events else 100

    k1, k2, k3, k4 = st.columns(4)
    with k1:
        st.markdown(f"""
        <div class="hud-metric-box" style="border-color: rgba(99,102,241,0.3);">
            <span class="hud-metric-label">Integrity Index Score</span>
            <span class="hud-metric-value" style="color: #818cf8;">{integrity_score}%</span>
        </div>
        """, unsafe_allow_html=True)
    with k2:
        st.markdown(f"""
        <div class="hud-metric-box" style="border-color: rgba(6,182,212,0.3);">
            <span class="hud-metric-label">Candidates Audited</span>
            <span class="hud-metric-value" style="color: #38bdf8;">{unique_candidates}</span>
        </div>
        """, unsafe_allow_html=True)
    with k3:
        st.markdown(f"""
        <div class="hud-metric-box" style="border-color: rgba(245,158,11,0.3);">
            <span class="hud-metric-label">Flagged Incidents</span>
            <span class="hud-metric-value" style="color: #fbbf24;">{total_incidents}</span>
        </div>
        """, unsafe_allow_html=True)
    with k4:
        st.markdown(f"""
        <div class="hud-metric-box" style="border-color: rgba(244,63,94,0.3);">
            <span class="hud-metric-label">Severe Breaches</span>
            <span class="hud-metric-value" style="color: #f43f5e;">{phone_breaches + identity_breaches}</span>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)

    # Filter Bar
    c_filt, _ = st.columns([2, 3])
    with c_filt:
        filter_student = st.selectbox("Filter Audit Log by Candidate", ["All Candidates"] + students)

    filtered_events = all_events
    if filter_student != "All Candidates":
        filtered_events = [e for e in all_events if e.get("student_id") == filter_student]

    if not filtered_events:
        st.info("No exam incidents recorded matching current filter.")
    else:
        import pandas as pd
        df = pd.DataFrame(filtered_events)

        c_chart, c_table = st.columns([1.2, 1.8], gap="large")

        with c_chart:
            st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
            st.markdown("<h4 style='margin-top:0;'>Incident Breakdown</h4>", unsafe_allow_html=True)
            v_counts = df["violation_type"].value_counts()
            st.bar_chart(v_counts, color="#6366f1")
            st.markdown("</div>", unsafe_allow_html=True)

        with c_table:
            st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
            st.markdown("<h4 style='margin-top:0;'>Detailed Violation Audit Stream</h4>", unsafe_allow_html=True)
            display_cols = [c for c in ["timestamp", "student_id", "violation_type", "detail"] if c in df.columns]
            st.dataframe(df[display_cols], use_container_width=True, height=280)
            st.markdown("</div>", unsafe_allow_html=True)

        # ---------------- Evidence Screenshot Gallery ----------------
        st.markdown("<div style='margin-top: 15px;'></div>", unsafe_allow_html=True)
        st.markdown("<h3 style='font-size: 1.4rem; font-weight: 700;'> Flagged Evidence Screenshot Vault</h3>", unsafe_allow_html=True)

        evidence_events = [e for e in filtered_events if e.get("screenshot_path") and os.path.exists(e["screenshot_path"])]

        if not evidence_events:
            st.caption("No violation screenshots recorded for this selection.")
        else:
            # Display up to 8 most recent evidence shots
            shots_to_show = evidence_events[-8:][::-1]
            e_cols = st.columns(min(4, max(1, len(shots_to_show))))
            for idx, ev in enumerate(shots_to_show):
                col = e_cols[idx % len(e_cols)]
                with col:
                    st.markdown("<div class='proctor-card' style='padding: 12px;'>", unsafe_allow_html=True)
                    st.image(ev["screenshot_path"], use_container_width=True)
                    st.markdown(f"""
                    <div style="font-size: 0.8rem; font-weight: 700; color: #f43f5e; margin-top: 6px;">{ev['violation_type']}</div>
                    <div style="font-size: 0.72rem; color: #cbd5e1;">Candidate: {ev['student_id']}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">{ev['timestamp']}</div>
                    """, unsafe_allow_html=True)
                    st.markdown("</div>", unsafe_allow_html=True)

    # ---------------- Export Station ----------------
    st.markdown("<div style='margin-top: 25px;'></div>", unsafe_allow_html=True)
    st.markdown("<h3 style='font-size: 1.4rem; font-weight: 700;'> Compliance Export Center</h3>", unsafe_allow_html=True)

    exp_col1, exp_col2 = st.columns(2, gap="large")

    with exp_col1:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("<h4>Excel Audit Workbook</h4>", unsafe_allow_html=True)
        st.write("Full forensic audit spreadsheet with violation logs and summary sheets.")
        if os.path.exists(config.EXCEL_LOG_PATH):
            with open(config.EXCEL_LOG_PATH, "rb") as f:
                st.download_button(
                    " Download Excel Workbook (.xlsx)",
                    f,
                    file_name="invigilmnce_session_log.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    use_container_width=True
                )
        else:
            st.caption("No Excel log generated yet.")
        st.markdown("</div>", unsafe_allow_html=True)

    with exp_col2:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("<h4>Official PDF Proctor Reports</h4>", unsafe_allow_html=True)
        st.write("ReportLab generated PDF summaries with candidate metadata and embedded evidence.")
        if os.path.isdir(config.REPORTS_DIR):
            reports = sorted(os.listdir(config.REPORTS_DIR), reverse=True)
            if reports:
                chosen_rep = st.selectbox("Select PDF Report to download", reports)
                with open(os.path.join(config.REPORTS_DIR, chosen_rep), "rb") as f:
                    st.download_button(
                        " Download PDF Proctor Report",
                        f,
                        file_name=chosen_rep,
                        mime="application/pdf",
                        use_container_width=True
                    )
            else:
                st.caption("No PDF reports generated yet. Reports are created upon stopping an exam session.")
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# PAGE 4: ARCHITECTURE & VIVA GUIDE
# ==============================================================================
elif page == "4.  Architecture & Viva Guide":
    st.markdown("""
    <div class="proctor-hero">
        <div class="brand-header">
            <span class="brand-badge"><span class="pulsing-dot"></span> System Documentation</span>
            <span class="brand-badge" style="background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.3); color: #fcd34d;">Viva Defense Ready</span>
        </div>
        <h1 style="margin: 0; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; color: #f8fafc;">
            System Architecture & Viva Defense Kit
        </h1>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 1rem; max-width: 800px;">
            Key architectural talking points, pipeline design choices, and emotional intelligence differentiation for examiners and evaluators.
        </p>
    </div>
    """, unsafe_allow_html=True)

    tab_arch, tab_emo, tab_engine, tab_stack = st.tabs([
        "️ Multi-Tier AI Pipeline",
        " Emotional Intelligence Differentiator",
        "️ Grace-Period Anomaly Engine",
        " Technical Stack & Specifications"
    ])

    with tab_arch:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("""
        ### Multi-Tier AI Processing Pipeline
        To maintain smooth 30 FPS video on standard consumer laptops without burning GPU resources, InvigiLMNce decouples lightweight continuous tracking from heavyweight periodic verification:

        1. **Tier 1 — High-Frequency Tracking (Every Frame / 30 FPS)**:
           - **MediaPipe FaceLandmarker (Tasks API)**: Tracks 478 3D facial landmarks.
           - **solvePnP Head Pose**: Computes Euler angles (Yaw, Pitch, Roll) relative to a canonical 3D facial model.
           - **Iris Gaze Ratio**: Measures eye pupil deviation to flag looking away.
           - **Eye Aspect Ratio (EAR)**: Computes blink frequency for photo-spoof liveness detection.

        2. **Tier 2 — Throttled Neural Networks (Every 4–5 Seconds)**:
           - **DeepFace (VGG-Face)**: Periodically verifies the candidate's live face embedding against the registered reference.
           - **DeepFace Emotion Analyzer**: Classifies facial sentiment into 7 categories (Neutral, Happy, Fear, Angry, Sad, Surprise, Disgust).
           - **Ultralytics YOLOv5**: Detects prohibited items (e.g. mobile phones) and flags extra persons in frame.
        """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with tab_emo:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("""
        ### Why "Emotional Intelligence" Matters in Remote Proctoring
        Traditional invigilation software (Proctorio, Examity) acts strictly as a punitive tool, often misinterpreting nervousness or eye-strain as cheating.

        - **Human-Centered Proctoring**: By tracking dominant emotional states (e.g. elevated Fear, Confusion, or Sadness), the system provides context to human proctors.
        - **Fairness & Reduced False Disqualifications**: If a student looks down momentarily with high anxiety or confusion, the anomaly engine marks it as an emotional stress indicator rather than an instant disqualification.
        - **Post-Exam Mental Health / Stress Metrics**: Examination boards can correlate question difficulty with candidate stress levels.
        """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with tab_engine:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("""
        ### Grace-Period Anomaly Engine & Anti-Spam Logic
        A common pitfall in naive computer-vision proctoring is spamming hundreds of violation logs when a candidate blinks or momentarily glances aside.

        - **Grace Periods (`LOOK_AWAY_GRACE_SECONDS = 4s`)**: The candidate must be looking away continuously for more than 4 seconds before an official violation is logged.
        - **Face Absent Grace (`NO_FACE_GRACE_SECONDS = 3s`)**: Brief momentary occlusions (e.g. adjusting glasses) are tolerated.
        - **Screenshot Cooldown (`SCREENSHOT_COOLDOWN_SEC = 8s`)**: Prevents flooding disk storage with duplicate screenshots of the same ongoing event.
        - **Dual Persistence Architecture**: Every event is simultaneously committed to **openpyxl Excel** (for human administrative browsing) and structured **JSON** (for automated ReportLab PDF building).
        """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with tab_stack:
        st.markdown("<div class='proctor-card'>", unsafe_allow_html=True)
        st.markdown("""
        ### Tech Stack Specifications

        | Component | Technology | Rationale |
        |---|---|---|
        | **Frontend UI** | Streamlit + Custom Glassmorphism CSS | Rapid, interactive, native Python dashboard with cyber-proctor HUD styling |
        | **Gaze & Pose Tracking** | MediaPipe FaceLandmarker Tasks API | Python 3.13 compatible, 478 3D landmarks at native 30+ FPS on CPU |
        | **Biometric Face Verification** | DeepFace (VGG-Face Cosine Distance) | High-accuracy facial feature vectors, pre-trained on millions of faces |
        | **Liveness Detection** | Eye Aspect Ratio (EAR) Blink Counter | Lightweight, passive, non-intrusive spoof rejection |
        | **Prohibited Object Detection** | Ultralytics YOLOv5 (Small) | Real-time mobile phone and multi-person bounding boxes |
        | **Reporting Engine** | ReportLab Platypus | Generates vector PDF reports with summary tables and evidence images |
        | **Audit Storage** | OpenPyXL + JSON | Human-readable Excel spreadsheets with automated count summaries |
        """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)
