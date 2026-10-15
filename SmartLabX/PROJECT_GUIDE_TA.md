# SmartLabX — முழுமையான Project Guide (தமிழ்)

இந்த ஆவணம் `SmartLabX` folder-இல் உள்ள source code-ஐ அடிப்படையாகக் கொண்டு எழுதப்பட்டது. Project-ன் நோக்கம், ஒவ்வொரு முக்கிய feature ஏன் உள்ளது, எந்த technology பயன்படுத்தப்படுகிறது, data எப்படி நகர்கிறது, UI colors-ன் பயன்பாடு ஆகியவற்றை விளக்குகிறது. Code-இல் நேரடியாகக் குறிப்பிடப்படாத design காரணங்கள், பொதுவான UI/UX நடைமுறைகளை வைத்து விளக்கப்பட்டுள்ளன.

> **Scope:** இது feature/module அளவிலான விளக்கம்; ஒவ்வொரு source file-இன் ஒவ்வொரு வரிக்கும் line-by-line commentary அல்ல.

## 1. Project நோக்கம்

**SmartLabX** என்பது கல்லூரி practical lab-களையும் online assessment-ஐயும் ஒரே web application-ல் நடத்தும் learning platform. மாணவர்கள் DBMS, Computer Networks, Operating Systems போன்ற பாடங்களுக்கான browser-based simulations-ஐப் பயன்படுத்தலாம். Faculty மாணவர்களின் activity, experiments, viva, marks போன்றவற்றைப் பார்க்கலாம். Admin கல்வி அமைப்பின் users, departments, subjects, lab resources போன்றவற்றை நிர்வகிக்கும் interface-ஐப் பெறுகிறார்.

Project-இல் **InvigiLMNce** என்ற தனி Python AI service-உம் உள்ளது. அது webcam frame-களை ஆய்ந்து proctoring telemetry, alerts, screenshots, reports ஆகியவற்றை உருவாக்குகிறது. இங்கு “virtual lab” என்பது browser-இல் இயங்கும் guided simulation/workspace; source code-இல் முழுமையான cloud virtual machine provisioning இருப்பதாகத் தெரியவில்லை.

## 2. பெரிய அமைப்பு — எந்த பகுதி என்ன செய்கிறது?

| பகுதி | Technology | ஏன் பயன்படுத்தப்படுகிறது? |
|---|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router | UI-ஐ மீண்டும் பயன்படுத்தக்கூடிய components-ஆக அமைக்கவும், வேகமாக develop/build செய்யவும், routes உருவாக்கவும். |
| Backend | Node.js, Express | Login, lab data, reports, admin APIs போன்ற HTTP endpoints-ஐ வழங்குகிறது. |
| Live communication | Socket.IO + Browser `BroadcastChannel` | Faculty/student activity, warnings, announcements போன்றவற்றை live-ஆகப் பகிர. BroadcastChannel ஒரே browser-இன் tabs-க்கு; Socket.IO பல clients/devices-க்கு. |
| Main database | MongoDB + Mongoose | Users, student records, OS experiment progress போன்ற structured data-ஐ சேமிக்க. |
| SQL practice database | SQLite | DBMS lab-இல் மாணவர்கள் SQL statements இயக்குவதற்கான local database. |
| RAISE storage | SQLite | Hint/recovery history, intervention state, evidence, test comparison போன்றவற்றைச் சேமிக்க. |
| AI service | Python, FastAPI, OpenCV, MediaPipe, DeepFace, Ultralytics YOLO | Webcam frame analysis, face/gaze/liveness/object detection, proctoring event generation ஆகியவற்றைச் செய்ய. |
| LLM | Google Gemini integration | மாணவர் கேள்விகளுக்குப் பதில்/AI suggestions உருவாக்கவும்; API key இருந்தால் LLM ஆதரவு செயல்படவும். |

### Request/data flow

1. Browser-இல் React page திறக்கப்படுகிறது.
2. Frontend REST calls-ஐ `http://localhost:5000/api` என்ற Node backend-க்கு அனுப்புகிறது. Vite development server `/api` proxy-யையும் அமைக்கிறது.
3. Backend MongoDB/SQLite-ஐ அணுகலாம்; live நிகழ்வுகளை Socket.IO வழியாக ஒளிபரப்பலாம்.
4. Proctoring-இல் browser webcam frame-ஐ JPEG/base64-ஆக மாற்றி Python service-க்கு (பொதுவாக port `8000`) அனுப்புகிறது. Backend proxy route-களும் உள்ளன.
5. Python service telemetry-ஐத் திருப்பி, தேவையான anomaly-களை log செய்து screenshot/report உருவாக்குகிறது.

## 3. User வகைகள் மற்றும் அவர்களுக்கான அம்சங்கள்

### மாணவர்

- Dashboard-இல் subjects, experiments, lab materials, viva, AI assistant, workspace, marks, reports, notifications, profile ஆகிய பகுதிகளுக்குச் செல்லலாம்.
- Lab activity, progress, warning, announcement, workspace lock போன்றவை `liveTracker` வழியாக broadcast செய்யப்படும்.
- DBMS-இல் SQL query எழுதிச் result பார்க்கலாம்.
- Computer Networks மற்றும் Operating Systems-இல் interactive experiments/simulations செய்யலாம்.
- Safe Exam page-இல் experiment செய்வதோடு proctoring HUD-ஐப் பார்க்கலாம்.
- Face enrollment, viva practice, report/progress review போன்ற flows உள்ளன.

### Faculty

- Subjects, experiments, workspaces, live monitor, viva/evaluation, marks/feedback, resources, reports/analytics, performance predictions போன்ற sections-ஐ dashboard-இல் திறக்கலாம்.
- Live Monitor மாணவர் activity மற்றும் proctoring events-ஐக் காட்டும் நோக்கத்துடன் அமைக்கப்பட்டுள்ளது.
- மாணவர்களுக்கு warning அனுப்புதல், workspace lock, announcement, support notification போன்ற realtime events-க்கு Socket.IO events உள்ளன.
- OS experiment submissions-ஐப் பெறவும் grade/feedback அளிக்கவும் backend routes மற்றும் `OSExperiment` model உள்ளன.

### Admin

- Dashboard-இல் departments, users, subjects, laboratories, academic management, resources, announcements, reports, settings போன்ற management sections உள்ளன.
- Admin UI-இல் காணப்படும் சில dashboard totals/activity உதாரணத் தரவுகள்; அவை அனைத்தும் database-லிருந்து live-ஆக வருவதாகக் கருதக்கூடாது.
- Backend-இல் உறுதியாகத் தெரியும் admin API தற்போது `/api/admin/users` GET/POST routes-ஐ வழங்குகிறது. எல்லா UI sections-க்கும் backend CRUD முழுமையாக இணைக்கப்பட்டிருக்கிறது என்று source-இல் இருந்து உறுதிப்படுத்த முடியாது.

## 4. முக்கிய Labs மற்றும் learning features

### 4.1 DBMS Lab

- SQL query எழுதுதல், execute செய்தல், output rows/error பார்க்குதல் போன்ற பயிற்சிக்காக.
- `DatabaseLab.jsx`, Safe Exam page, `DbmsLab.jsx` ஆகிய frontend பகுதிகள் DBMS query UI-யைக் கொண்டுள்ளன.
- Backend-இன் `/api/dbms/execute` endpoint SQLite database-இல் SQL statement இயக்குகிறது.
- Query examples-ல் `SELECT`, `JOIN`, `WHERE`, `GROUP BY`, `ORDER BY`, `INSERT`, `CREATE TABLE`, `UPDATE`, `DELETE`, index போன்றவை உள்ளன.
- இந்த lab-ன் நோக்கம் query syntax-ஐ மட்டும் படிப்பதல்ல; query-ஐ இயக்கி அதன் விளைவைக் கற்றுக்கொள்வது.

### 4.2 Computer Networks Lab

`ComputerNetworksLab.jsx` மற்றும் `components/ComputerNetworks/`-இல் ஐந்து practical experiments உள்ளன:

1. Network topology design
2. IP address configuration
3. Routing மற்றும் packet forwarding
4. DHCP/DNS network services
5. Network troubleshooting

Experiment-கள் topology/canvas, device configuration, routing, report, viva, live tracking ஆகியவற்றைச் சுற்றி அமைந்துள்ளன. Network canvas-க்கு `@xyflow/react`/React Flow dependency உள்ளது. Safe Exam tab-இல் experiment completion தகவல் `BroadcastChannel` வழியாக lab tab-க்கு அனுப்பப்படுகிறது.

### 4.3 Operating Systems Lab

`OperatingSystemsLab.jsx`-இல் பின்வரும் simulation-கள் உள்ளன:

1. **CPU Scheduling:** FCFS, SJF, Priority, Round Robin; process order மற்றும் Gantt chart.
2. **Memory Management:** First Fit, Best Fit, Worst Fit memory allocation.
3. **Page Replacement:** FIFO, LRU, Optimal; page faults-ஐக் கண்காணித்தல்.
4. **Deadlock / Banker’s Algorithm:** allocation, deadlock detection, safe sequence.
5. **Disk Scheduling:** FCFS, SSTF, SCAN, C-SCAN, LOOK head movement.

இந்த simulations algorithm-ன் படிகளை visual-ஆகப் புரிய வைக்கின்றன. OS experiment progress, submission, grade ஆகியவற்றுக்கான Mongoose model/backend routes-உம் உள்ளன; ஆனால் OS route-களின் authentication middleware சில இடங்களில் demo/mock என்று code-இல் குறிப்பிட்டுள்ளது.

### 4.4 Viva Portal

- DBMS, Computer Networks, Operating Systems ஆகிய subject-களுக்கான கேள்விகள்.
- ஒவ்வொரு subject-க்கும் ஐந்து கேள்விகள்; கேள்விகளுக்கு keyword list/weight பயன்படுத்தப்படுகிறது.
- 5 நிமிட timer, webcam start/stop, browser speech recognition ஆகியவை code-இல் உள்ளன.
- Viva session history browser `localStorage`-இல் வைக்கப்படுகிறது.
- இதன் answer evaluation keyword அடிப்படையிலானது; இதை முழுமையான LLM viva examiner என்று கருத வேண்டாம்.

## 5. Safe Exam மற்றும் AI Proctoring

### Safe Exam UI/security behavior

- `App.jsx` route `/safe-exam/:lab/:experimentId`-ஐ `SafeExamPage`-க்கு இணைக்கிறது.
- `useLabSecurity` safe mode-இல் copy/cut/paste, context menu, சில keyboard shortcuts மற்றும் tab visibility/fullscreen exit ஆகியவற்றைக் கண்காணித்து event பதிவு செய்கிறது.
- Drag-and-drop lab devices வேலை செய்ய அனுமதிக்கும் exception உள்ளது.
- Violations browser-இல் log செய்யப்படுவதோடு BroadcastChannel/Socket.IO வழியாகவும் பகிரப்படலாம்.
- இவை browser-side controls மட்டுமே; OS/browser-level முழுமையான lock-down அல்ல.

### Webcam AI pipeline

`useProctoring.js` webcam stream-ஐப் பெற்று frame-களை சுமார் 350 ms இடைவெளியில் (சுமார் 3 FPS) Python AI service-க்கு அனுப்புகிறது. ஒவ்வொரு frame-ஐயும் முழு resolution-ல் ஒவ்வொரு முறையும் அனுப்பாமல், 640×480 canvas frame பயன்படுத்தப்படுகிறது.

Python `main.py` மற்றும் `modules/` பின்வருவனைக் கையாள்கின்றன:

- **Face detection / enrollment / identity:** முகத்தைப் பதிவு செய்தல், தற்போதைய முகத்தைப் பதிவுசெய்த முகத்துடன் ஒப்பிடுதல்.
- **Face count:** முகம் இல்லை அல்லது ஒன்றுக்கு மேற்பட்ட முகங்கள் உள்ளனவா எனக் கண்காணித்தல்.
- **Gaze மற்றும் head pose:** முக landmark-களிலிருந்து yaw/pitch மற்றும் பார்வை திசை கணித்தல்; நீண்ட நேரம் விலகிப் பார்ப்பதை event ஆக்குதல்.
- **Liveness:** கண் இமைப்பை (blink/EAR) கண்காணித்து இயல்பான blink இல்லாத சந்தேக நிலையை குறித்தல்.
- **Object/person detection:** YOLO மூலம் phone, book/paper போன்ற prohibited objects மற்றும் கூடுதல் நபர்களைக் கண்டறிய முயற்சித்தல்.
- **Emotion signal:** DeepFace மூலம் emotion estimate; code-இல் சில emotion-கள் report/event-க்கு பதிவு செய்யப்படுகின்றன. Emotion மட்டும் cheating-க்கான உறுதியான ஆதாரம் அல்ல.
- **Talking, earphone, hand gesture:** mouth aspect ratio, முக/காது பகுதிகள், hand landmarks ஆகியவற்றைப் பயன்படுத்தி கூடுதல் signals உருவாக்குதல்.
- **Anomaly engine:** ஒவ்வொரு frame-இலிருந்தும் வந்த signals-ஐ grace-period/cooldown விதிகளால் event-ஆக மாற்றுகிறது. ஒரே frame-இல் ஏற்பட்ட தவறான detection உடனே பல alert-களாக மாறாமல் இருக்க இது உதவுகிறது.
- **Evidence/report:** violation நேரத்தில் screenshot, JSON/Excel log மற்றும் PDF report உருவாக்கும் modules உள்ளன.
- **LLM suggestions:** telemetry-ஐ அடிப்படையாகக் கொண்ட suggestion endpoint மற்றும் student question endpoint உள்ளன; LLM செயல்பட API key/service availability தேவைப்படலாம்.

Python configuration-இல் gaze, blink, no-face, talking, object confidence, cooldown போன்ற tunable thresholds மையப்படுத்தப்பட்டுள்ளன. இது module-கள் ஒரே thresholds-ஐப் பயன்படுத்த உதவுகிறது.

> Proctoring output-கள் automated estimates; false positive/false negative ஏற்படலாம். Emotion அல்லது gaze signal-ஐ மட்டும் வைத்து மாணவரின் நோக்கம்/தவறை உறுதிப்படுத்தக் கூடாது. ஆசிரியரின் review தேவை.

## 6. AI Learning Guidance மற்றும் RAISE

- `AIGuidance.jsx`-இல் DBMS, Networks, OS topic-களுக்கான keyword-matching predefined hints உள்ளன. இந்த component தானாகவே Gemini model call செய்கிறது என்று கருத வேண்டாம்.
- Student Dashboard-இல் Python `/api/student/ask` endpoint-ஐ அழைக்கும் வேறு AI question flow உள்ளது; backend-இன் Gemini key/LLM availability-ஐப் பொறுத்து அதன் பதில் மாறலாம்.
- **RAISE** என்பது backend-இல் தனியாக உள்ள recovery-aware hint/intervention engine. `/api/raise/attempt`, `/hint`, `/verify`, `/state`, `/ledger`, `/evidence` போன்ற routes உள்ளன.
- RAISE-ன் நோக்கம் மாணவர் எத்தனை முறை சிக்கினார், progress மேம்பட்டதா, முன்பு எந்த hint உதவியது என்பதைக் கணக்கிட்டு L1–L3 அளவிலான உதவியைத் தேர்வு செய்தல். அதன் state, hint ledger, evidence ஆகியவை `raise_engine.sqlite`-இல் சேமிக்கப்படுகின்றன.
- Route/service உள்ளது என்பதால், எல்லா lab screens-உம் தற்போது அதனுடன் முழுமையாக இணைக்கப்பட்டுள்ளன என்று உறுதியாகக் கூற முடியாது.
- Faculty-க்கான “AI Predictions” component-இல் K-Means/Random Forest என்று பெயரிடப்பட்ட analysis UI உள்ளது. ஆனால் source code-இல் deterministic seeded values மற்றும் எளிய threshold logic உருவாக்கப்படுகிறது; பயிற்சி செய்யப்பட்ட production ML model என்று கருதக்கூடாது.

## 7. Realtime communication

Backend `server.js`-இல் Socket.IO events-ன் நோக்கங்கள்:

- `student-activity`: மாணவர் எந்த lab-இல் என்ன செய்கிறார் என்பதைப் பகிர்தல்.
- `proctor-telemetry`, `proctor-alert`, `security-event`: proctoring status/event-கள்.
- `send-warning`, `workspace-lock`, `class-announcement`: faculty-யிலிருந்து மாணவருக்கு.
- `ai-question`, `raise-support-notify`, `raise-evidence`: AI/support/evidence தொடர்பான updates.

`liveTracker.js` browser-இல் activity-ஐச் சேமித்து, BroadcastChannel வழியாக tabs-க்கு, Socket.IO வழியாக backend-க்கும் அனுப்புகிறது. சில live records `localStorage`-இல் வைக்கப்படுவதால் அவை அந்த browser-இன் local data; அவை தானாகவே MongoDB-யில் இருப்பதாக அர்த்தமில்லை.

## 8. UI நிறங்கள் ஏன்?

குறியீட்டில் நிறங்களைத் தேர்ந்தெடுத்த காரணத்தை நேரடியாக விளக்கும் design note இல்லை. கீழே உள்ளவை பயன்படுத்திய palette-ஐ வைத்து சொல்லப்படும் UI/UX விளக்கங்கள்:

| நிறம் / எடுத்துக்காட்டு | பயன்பாடு | ஏன் இந்த நிறம் பொருத்தம்? |
|---|---|---|
| Indigo `#4f46e5` | Global primary token, spinner, முக்கிய action accent | கல்வி/technology dashboard-க்கு நவீனமான, நம்பகமான primary accent; button/state-ஐ எளிதில் கவனிக்கச் செய்கிறது. |
| Dark slate `#1f2937`, text `#0f172a` | Headings/body text, secondary token | Light background-இல் தெளிவான contrast; நீண்ட நேரம் வாசிக்க உதவும். |
| Light slate `#f8fafc`, body `#f0f4fc` | பொதுவான page/card background | வெள்ளை card-களை தனித்துக் காட்டி, dashboard-ஐ சுத்தமாகவும் குறைந்த visual-noise-உடனும் வைக்கிறது. |
| Blue (Home/buttons/labs) | Navigation, primary CTA, link, DBMS/CN accents | Link/action-ஐ அடையாளம் காண எளிது; ஒரே application-க்கு consistent brand feel தருகிறது. |
| Emerald/green | Success, healthy, completed/positive status | “சரி/முடிந்தது” என்ற பொதுவான visual signal. |
| Amber/orange | கவனம் தேவை, நடுநிலை warning | பிழை என்று உடனே காட்டாமல் கவனத்தை ஈர்க்கிறது. |
| Rose/red | Error, violation, high-risk | முக்கியமான அபாயம்/பிழையை உடனடியாக வேறுபடுத்திக் காட்டுகிறது. |
| Violet/indigo gradients | Admin/faculty hero panels, AI emphasis | Dashboard section-களுக்கு visual hierarchy கொடுத்து, management/AI பகுதிகளை முன்னிலைப்படுத்துகிறது. |

`index.css`-இல் global tokens இருக்கின்றன; ஆனால் page/component-களில் Tailwind classes மற்றும் inline CSS-லும் தனித்த நிறங்கள் பயன்படுத்தப்படுகின்றன. எனவே முழு application-க்கும் ஒரே நிறமுறை கட்டாயமாகப் பயன்படுத்தப்படவில்லை. `App.css`-இல் Vite starter-template CSS உள்ளது; `App.jsx` நேரடியாக `index.css`-ஐ import செய்கிறது.

## 9. `App.jsx` — முக்கிய blocks என்ன செய்கின்றன?

- `React`, `lazy`, `Suspense` import: React component உருவாக்கவும், page-களைத் தேவையானபோது load செய்யவும், load ஆகும் நேரத்தில் fallback காட்டவும்.
- `BrowserRouter`, `Routes`, `Route`, `Navigate`, `useLocation`: URL அடிப்படையிலான navigation, redirect, current path தகவல் ஆகியவற்றுக்கு.
- `./index.css`: application-ன் global Tailwind theme/base styles.
- `lazy(() => import(...))`: Home, Login, dashboards, labs, viva போன்ற page-களை code-split செய்கிறது. பயனர் அந்த page-ஐத் திறக்கும் வரை அதன் JavaScript load ஆகாமல் initial load அளவு குறையும்.
- `ProtectedRoute`: `localStorage`-இல் token/user உள்ளதா என்பதைப் பார்த்து சில dashboard routes-ஐ அனுமதிக்கிறது; இல்லையெனில் `/student-login`-க்கு அனுப்புகிறது.
- `StudentLabRoute`: lab page-க்கு முன் stored user/auth தகவலைப் பார்க்கிறது; login இல்லாவிட்டால் login route-க்கு அனுப்பும் அமைப்பு. `safePath` கொடுக்கப்பட்டால் அங்கு redirect செய்யும் optional logic-உம் உள்ளது.
- `PageLoader`: lazy page load ஆகும் இடைவெளியில் மையத்தில் spinner காட்டுகிறது. `@keyframes slx-spin` அதன் சுழற்சி animation.
- `App`: Router-க்குள் `Suspense` மற்றும் எல்லா URL routes-ஐ வரையறுக்கிறது. `/os-lab` மற்றும் `/operating-systems` போன்ற alias-களையும், `/viva` மற்றும் `/viva-portal` போன்ற alias-களையும் ஒரே page-க்கு இணைக்கிறது.
- `export default App`: `main.jsx` இதை root DOM element-இல் render செய்யப் பயன்படுத்துகிறது.

**முக்கிய பாதுகாப்புக் குறிப்பு:** `ProtectedRoute` போன்ற browser-side checks மட்டும் உண்மையான authorization அல்ல. Browser storage-ஐ மாற்ற முடியும். Production-இல் ஒவ்வொரு protected backend endpoint-லும் JWT signature, user role, ownership ஆகியவற்றை server verify செய்ய வேண்டும்.

## 10. முக்கிய folder/file வழிகாட்டி

| Path | பங்கு |
|---|---|
| `frontend/src/App.jsx` | Routes, lazy loading, route guards, loading spinner. |
| `frontend/src/pages/` | Home, login, role dashboards, DBMS/CN/OS labs, Safe Exam, Viva. |
| `frontend/src/components/admin/` | Admin management panels. |
| `frontend/src/components/faculty/` | Faculty monitoring, evaluation, workspace, prediction panels. |
| `frontend/src/components/ComputerNetworks/` | CN experiment, topology, report/viva/live tracking components. |
| `frontend/src/components/OperatingSystems/` | OS dashboard, theory, workspace, report, viva, five simulations. |
| `frontend/src/components/proctor/` | Proctoring HUD. |
| `frontend/src/hooks/useLabSecurity.js` | Safe lab browser-side restrictions/event logging. |
| `frontend/src/hooks/useProctoring.js` | Webcam stream/frame submission/telemetry state. |
| `frontend/src/utils/api.js` | Axios API base URL மற்றும் request interceptor. |
| `frontend/src/utils/liveTracker.js` | Browser activity, warning, socket/broadcast helper-கள். |
| `backend/server.js` | Express app, routes, Socket.IO, database startup, demo-user seeding. |
| `backend/routes/` | Auth, admin, lab, DBMS, OS, proctoring, RAISE endpoints. |
| `backend/models/` | MongoDB User, StudentRecord, OSExperiment schemas. |
| `backend/services/raiseEngine.js` | Hint selection, recovery/friction tracking, intervention logic. |
| `backend/services/raiseStore.js` | RAISE SQLite persistence. |
| `ai-service/main.py` | FastAPI entry point; enrollment, frame processing, LLM, report endpoints. |
| `ai-service/modules/` | Face, gaze, liveness, emotion, object, mouth, earphone, hand, anomaly, logging/report helpers. |
| `ai-service/data/` | Proctoring logs, registered faces, screenshots, generated reports. |

## 11. Run செய்வதற்கான பொதுவான படிகள்

Development-இல் frontend, backend, AI service ஆகியவற்றைத் தனித்தனி terminal-களில் இயக்க வேண்டும்.

1. `backend/.env.example`-ஐப் பார்த்து தேவையான values-ஐ local `backend/.env`-இல் அமைக்கவும். MongoDB-backed features-க்கு `MONGODB_URI`; JWT-க்கு தனித்துவமான `JWT_SECRET`; Gemini-க்கு API key தேவை. `.env`-ஐ Git-இல் commit செய்ய வேண்டாம்.
2. Backend folder-இல் dependencies நிறுவி `npm start` இயக்கவும். Default port `5000`.
3. Frontend folder-இல் dependencies நிறுவி `npm run dev` இயக்கவும். Vite default port `5173`.
4. AI service dependencies-ஐ நிறுவி `python main.py` இயக்கவும்; source-இன் default FastAPI port `8000`. Camera permission மற்றும் model files கிடைக்க வேண்டும்.
5. MongoDB இல்லாமல் backend தொடங்கலாம் என்று `server.js` குறிப்பிடுகிறது; அப்போது DB சார்ந்த features முழுமையாக வேலை செய்யாது. AI service இல்லாதபோது proctoring endpoints-க்கு அதன் health/error நிலை தெரியும்.

## 12. Demo, implementation நிலை, கவனிக்க வேண்டியவை

- சில dashboards-இல் cards, sample students, task lists, predicted marks போன்றவை hardcoded/demo data. அவற்றை production database-இன் உண்மைத் தகவல் என எடுத்துக்கொள்ள வேண்டாம்.
- Authentication-இல் demo user logic உள்ளது; சில lab pages-லும் localStorage-based demo auth/sample data காணப்படுகிறது.
- OS lab route-இல் mock authentication என்று code comment உள்ளது; faculty grade/submission endpoints-க்கும் production role validation சேர்க்கப்பட வேண்டும்.
- `ProtectedRoute` என்பது client-side navigation barrier மட்டுமே. Server-side authorization இல்லாமல் அதை security guarantee ஆகக் கருதக்கூடாது.
- Browser safe mode-ல் copy/paste/shortcut தடுப்பது சாதாரண browser-ஐ முழுமையாகக் கட்டுப்படுத்தாது; வேறு device, browser tools, OS-level actions ஆகியவற்றை முழுமையாகத் தடுக்காது.
- Webcam, face enrollment, screenshots ஆகியவை தனிப்பட்ட biometric/sensitive data. Production-க்கு முன் consent, retention/deletion policy, access control, secure transport, audit trail ஆகியவை தேவை.
- YOLO/DeepFace/MediaPipe/LLM முடிவுகள் சூழல், camera, light, model confidence ஆகியவற்றால் மாறக்கூடும். அவை கல்வி உதவி/ஆசிரியர் review-க்கு உதவும் signals; இறுதி தண்டனை/மதிப்பீட்டை தனியாகத் தீர்மானிக்கக் கூடாது.

## 13. சுருக்கம்

SmartLabX-ன் முக்கிய நோக்கம் **interactive practical learning + faculty/admin workflow + AI-assisted exam monitoring** ஆகியவற்றை ஒரே platform-ஆக இணைப்பது. React UI routes மற்றும் lab simulations-ஐ வழங்குகிறது; Express backend data/API/realtime communication-ஐ கையாளுகிறது; Python FastAPI service webcam/AI analysis-ஐ செய்கிறது. நீல/indigo primary accent, slate light surfaces, green/amber/red status colors ஆகியவை interface-ஐ வாசிக்க எளிதாகவும் status-களை விரைவில் புரியும்படியும் அமைக்கப் பயன்படுத்தப்பட்டுள்ளன.
