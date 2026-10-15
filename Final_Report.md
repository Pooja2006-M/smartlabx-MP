# SmartLabX & InvigiLMNce: An AI-Powered Smart Virtual Laboratory & Exam Invigilation System

## 1. Abstract
The rapid shift towards remote education and online examinations has exposed significant vulnerabilities in traditional proctoring methods. Standard web-based examination platforms often struggle to prevent academic dishonesty and fail to differentiate between genuine exam anxiety and malicious behavior. **SmartLabX** combined with **InvigiLMNce** presents a comprehensive, AI-driven ecosystem designed to solve this problem. The system integrates a fully functional Virtual Laboratory (DBMS and Operating Systems) with a highly secure, emotionally-aware AI invigilation engine. Utilizing cutting-edge technologies such as YOLOv5, MediaPipe, DeepFace, and Google's Gemini LLM, the platform not only detects physical cheating artifacts (e.g., mobile phones, extra persons) but also evaluates the psychological state (stress, fear, neutrality) of the student, ensuring a fair, secure, and student-sensitive testing environment.

---

## 2. Introduction & Problem Statement
### 2.1 Existing System Limitations
Current online examination systems primarily rely on basic camera-on requirements or browser-locking mechanisms. They suffer from:
* **High False Positives:** Simple head movements trigger cheating alerts.
* **Lack of Emotional Context:** Traditional systems cannot distinguish between a student looking away to cheat vs. a student looking away to think due to exam stress.
* **Fragmented Tools:** Students have to use one platform for coding/labs and an entirely different software for proctoring.

### 2.2 Proposed Solution (SmartLabX)
SmartLabX unifies the learning and testing environment. It offers real-time interactive virtual labs running directly in the browser. While the student works, the **InvigiLMNce** engine runs seamlessly in the background. It analyzes live video feeds locally, flags anomalies with grace periods to avoid spam, and uses Large Language Models (LLMs) to provide context-aware suggestions to the human faculty observing the dashboard.

---

## 3. System Architecture & Tech Stack
The system follows a Microservices-oriented architecture:
* **Frontend (Client Tier):** Built using React.js, Vite, and TailwindCSS. Incorporates React Flow for visual lab simulations and SQL.js for in-browser database execution.
* **Backend (Logic & Real-time Tier):** Built on Node.js and Express.js. Utilizes Socket.io for ultra-low-latency real-time bidirectional communication between students and faculty. User data is persisted securely in MongoDB.
* **AI Service (Intelligence Tier):** A Python-based FastAPI microservice. Handles heavy computational tasks like Face Detection (OpenCV), Emotion Analysis (DeepFace), and LLM Prompting (Google GenAI).
* **InvigiLMNce Core:** Employs YOLOv5 for object detection and MediaPipe for precise 3D facial landmark tracking (Gaze and Liveness).

---

## 4. In-Depth Module Descriptions

### 4.1 Admin Module (System Governance)
The Admin module serves as the central nervous system for platform configuration and security oversight.
* **Secure Provisioning:** Role-Based Access Control (RBAC) securely separates permissions for Admins, Faculty, and Students using JWT (JSON Web Tokens). Passwords are cryptographically hashed using bcrypt.
* **Global Activity Dashboard:** Provides real-time metrics on how many students are currently online, which labs are active, and overall server health.
* **Audit & Logging:** Every violation flagged by the AI is permanently logged into the database and exported to Excel via the `logger.py` module. Admins can audit any past exam session to resolve disputes.

### 4.2 Faculty Module (Live Monitoring & Intervention)
The Faculty module transforms the teacher from a passive observer into an active, AI-assisted invigilator.
* **WebSocket Live Telemetry:** The dashboard is powered by Socket.io, receiving live, sub-second telemetry from every connected student. Faculty can see exactly what module (e.g., DBMS Lab, OS Lab) the student is viewing.
* **AI-Augmented Alert System:** Instead of watching 50 video feeds manually, the faculty sees a grid. If the AI detects a mobile phone, that student's grid turns red immediately.
* **Direct Intervention Protocols:** 
  * **Soft Warning:** Faculty can trigger a direct on-screen popup on the student's computer warning them of suspicious behavior.
  * **Hard Lock (Workspace Lock):** If severe malpractice is detected (e.g., another person sitting next to the student), the faculty can remotely lock the student's entire browser workspace, forcing them out of the exam.
* **Class-Wide Broadcasting:** Enables the transmission of instant global announcements (e.g., "10 minutes remaining") to all active sessions.

### 4.3 Student Module & Smart Virtual Labs
Designed to provide a frictionless, interactive learning experience without requiring students to install complex software on their local machines.
* **DBMS Virtual Lab:** Integrates `sql.js`, allowing students to write standard SQL queries (SELECT, INSERT, JOIN) and see output tables directly within the React interface.
* **OS & Networks Lab:** Uses `React Flow` to visualize complex Operating System algorithms (like process scheduling or memory management) and Computer Network topologies dynamically.
* **AI Guidance Chatbot:** A built-in LLM assistant. If a student is stuck on a lab exercise, they can query the AI (via the `ask_student_question` API) to get hints and conceptual explanations without leaving the lab environment.
* **Safe Exam Browser Integration:** An isolated page where right-clicks, copy-pasting, and tab-switching are strictly monitored and restricted.

---

## 5. InvigiLMNce: Core AI Proctoring Engine
This is the most advanced component of the project, executing complex computer vision pipelines in real-time.

### 5.1 Face Detection & Identity Verification
* **Algorithm:** Uses OpenCV's Haar Cascades for rapid initial face localization, followed by DeepFace's VGG-Face model for deep biometric feature extraction.
* **Workflow:** Before the exam, a reference image is captured. During the live exam, the current frame is continuously compared against the reference to prevent impersonation.

### 5.2 Liveness Detection & Anti-Spoofing
* **Algorithm:** Utilizes Google's MediaPipe FaceMesh to extract 468 3D facial landmarks.
* **Workflow:** Calculates the Eye Aspect Ratio (EAR) to detect and count blinks. If a student does not blink for a prolonged period, the system flags it as a potential spoofing attempt (e.g., holding up a static photograph).

### 5.3 Gaze & Head Pose Tracking
* **Workflow:** By mapping 3D facial coordinates to a 2D camera plane (using algorithms like `solvePnP`), the system calculates the pitch, yaw, and roll of the student's head. It accurately determines if the student is focusing on the screen, looking down at a paper, or looking off-screen.
* **Grace Period Logic:** A strictly threshold-based logic is applied (configured in `modules/config.py`). A 2-second glance away is ignored, but a 10-second look away triggers an anomaly.

### 5.4 Object & Multiple Person Detection (YOLOv5)
* **Algorithm:** Integrates Ultralytics YOLOv5 (You Only Look Once), a state-of-the-art real-time object detection model.
* **Workflow:** The model scans the background to detect unauthorized objects specifically trained to identify `cell phones` and `multiple persons` in the frame.

### 5.5 Emotionally Aware AI (DeepFace)
* **The Key Differentiator:** The system runs a DeepFace emotion classification model. It categorizes the student's facial expressions into states such as *Neutral*, *Happy*, *Sad*, *Fear*, or *Stressed*. 
* **Benefit:** Helps invigilators differentiate between genuine academic anxiety (stress) and deceptive behavior, adding a layer of empathy to the AI.

---

## 6. Large Language Model (LLM) Integration
Instead of raw data, the system provides human-readable context.
* **Context Generation:** Telemetry data (e.g., `face_count: 1, phone_detected: True, emotion: Stressed, blink_count: 12`) is packaged into a JSON payload.
* **Gemini AI Prompting:** The `llm_engine.py` sends this payload to the Google GenAI API with a strict system prompt.
* **Output:** The LLM returns a synthesized suggestion: *"Alert: Mobile device detected in frame. Student appears highly stressed. Immediate intervention recommended."* This drastically reduces the cognitive load on the faculty.

---

## 7. Report Generation & Analytics
* **PDF Auto-Generation:** Upon exam completion, `ReportLab` programmatically generates a structured PDF detailing the student's details, total session time, and a timestamped log of every single violation.
* **Visual Dashboards:** Using `openpyxl` and `Streamlit`, the system parses JSON logs into Excel files and renders graphical Bar Charts, allowing admins to instantly see the most common types of violations (e.g., 60% of flags were for 'Looking Away').

---

## 8. Conclusion & Future Scope
### 8.1 Conclusion
SmartLabX successfully bridges the gap between interactive virtual learning and highly secure examination environments. By utilizing a multi-layered AI approach (YOLO for objects, MediaPipe for liveness, DeepFace for emotion, and Gemini for context), the system effectively eliminates the high false-positive rates of traditional proctoring tools. It empowers educational institutions to conduct remote assessments with total integrity while remaining sensitive to the psychological well-being of the student.

### 8.2 Future Enhancements
* **Audio Analytics:** Integrating NLP and speech recognition to detect whispering, background conversations, or audio-based cheating.
* **Screen Sharing Analysis:** Implementing OCR (Optical Character Recognition) on the student's active screen to ensure they are not viewing unauthorized materials.
* **Advanced Biometrics:** Adding continuous keystroke dynamics to verify user identity based on typing rhythm.
