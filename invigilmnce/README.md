# InvigiLMNce — AI-Powered Exam Invigilation System

An AI proctoring system that combines real-time monitoring with emotional
intelligence to make remote exams more secure, fair, and student-sensitive.

Built exactly to the tech stack specified in the project PPT:

| Layer | Technology |
|---|---|
| Frontend | Streamlit |
| Backend | Python |
| Data Storage | Excel, JSON |
| AI/ML | YOLOv5, MediaPipe, DeepFace |
| Reporting | ReportLab |

## Modules implemented

1. **Face Detection & Recognition** — `modules/face_utils.py` (DeepFace, VGG-Face model)
2. **Gaze & Head Pose Tracking** — `modules/gaze_pose.py` (MediaPipe FaceLandmarker Tasks API + solvePnP)
3. **Liveness Detection** — `modules/liveness.py` (Eye Aspect Ratio blink counting)
4. **Emotion Recognition** — `modules/emotion_utils.py` (DeepFace emotion model)
5. **Anomaly Detection** — `modules/anomaly_engine.py` (combines every signal above + YOLO)
6. **Report Generation** — `modules/report_generator.py` (ReportLab PDF)
7. **Screenshot Capture** — `modules/screenshot_utils.py`
8. **Excel Dashboard & Summarization** — `modules/logger.py` (openpyxl) + Page 3 of the app

Object detection (extra people / mobile phones in frame) uses YOLOv5 via
`modules/object_detection.py`.

## Setup

Requires **Python 3.13** (or 3.10–3.12 — the pinned package versions were chosen to work across all of these) and a webcam.

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

First run will auto-download model weights (needs internet once):
- DeepFace: VGG-Face + emotion model weights (~600 MB total, from GitHub)
- Ultralytics: YOLOv5 small weights (~15 MB)
- MediaPipe: FaceLandmarker task model (~4 MB, saved to `models/` in this project)

## Run

```bash
streamlit run app.py
```

This opens the app in your browser (usually `http://localhost:8501`).

## How to use it

1. **Register Student** — enter a Student ID, take a reference photo via
   the webcam, click Save. Do this once per student before their exam.
2. **Live Exam Monitoring** — pick the registered student, click **Start
   Exam**. The live feed shows face box (green = OK, orange = looking away)
   plus a live status panel (identity match, blink count, dominant emotion,
   phone detection, and the 5 most recent flags). Click **Stop Exam** when
   done — this automatically generates a PDF report and refreshes the Excel
   summary sheet.
3. **Reports & Dashboard** — browse every logged violation in a table and
   bar chart, and download the Excel log or any past PDF report.

## Tuning

All thresholds (how far you can look away, how many seconds of "no face"
counts as a violation, blink timeout for liveness, YOLO confidence, etc.)
are in one place: `modules/config.py`.

## Notes on this prototype

- Heavy models (YOLOv5, DeepFace identity check, DeepFace emotion) are
  throttled (see `HEAVY_MODEL_FRAME_SKIP` / `*_INTERVAL_SEC` in config) so
  the live video stays smooth — only MediaPipe face-mesh/gaze/blink run on
  every frame.
- Data is stored locally under `data/` (`registered_faces/`, `logs/`,
  `screenshots/`, `reports/`) — nothing leaves the machine.
- For a viva/demo, mention: modular pipeline design, threshold-based +
  grace-period anomaly logic (avoids false-positive spam), dual logging
  (Excel for humans, JSON for programmatic reporting), and the emotion
  signal as the "emotionally aware" differentiator over standard proctoring
  tools mentioned in your Existing System slide.
