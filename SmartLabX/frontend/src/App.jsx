import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';

// ── Lazy-loaded pages (code splitting for scalability) ────────────────────────
const Home               = lazy(() => import('./pages/Home.jsx'));
const Login              = lazy(() => import('./pages/Login.jsx'));
const StudentLogin       = lazy(() => import('./pages/StudentLogin.jsx'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard.jsx'));
const FacultyDashboard   = lazy(() => import('./pages/FacultyDashboard.jsx'));
const StudentDashboard   = lazy(() => import('./pages/StudentDashboard.jsx'));
const DatabaseLab        = lazy(() => import('./pages/DatabaseLab.jsx'));
const ComputerNetworksLab = lazy(() => import('./pages/ComputerNetworksLab.jsx'));
const DbmsLab            = lazy(() => import('./components/student/DbmsLab.jsx'));
const OperatingSystemsLab = lazy(() => import('./pages/OperatingSystemsLab.jsx'));
const SafeExamPage       = lazy(() => import('./pages/SafeExamPage.jsx'));
const VivaPortal         = lazy(() => import('./pages/VivaPortal.jsx'));

// ── Protected Route Helper ───────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user') || localStorage.getItem('smartlabx-auth');

  if (!token && !userStr) {
    return <Navigate to="/student-login" replace />;
  }
  return children;
}

function StudentLabRoute({ children, safePath }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user') || localStorage.getItem('smartlabx-auth');

  try {
    const userObj = JSON.parse(userStr || '{"role":"student"}');
    if (!token && !userStr) {
      return <Navigate to="/student-login" state={{ from: location.pathname }} replace />;
    }
  } catch {
    // Continue cleanly
  }

  if (safePath) {
    return <Navigate to={safePath} replace />;
  }

  return children;
}

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTop: '4px solid #4f46e5',
        animation: 'slx-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes slx-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                   element={<Home />} />
          <Route path="/login"              element={<Login />} />
          <Route path="/home"               element={<Home />} />
          <Route path="/student-login"      element={<StudentLogin />} />
          <Route path="/admin"              element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/faculty"            element={<ProtectedRoute><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/student"            element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/database-lab"       element={<StudentLabRoute><DatabaseLab /></StudentLabRoute>} />
          <Route path="/computer-networks"  element={<StudentLabRoute><ComputerNetworksLab /></StudentLabRoute>} />
          <Route path="/dbms-lab"           element={<StudentLabRoute><DbmsLab /></StudentLabRoute>} />
          <Route path="/operating-systems/*" element={<StudentLabRoute><OperatingSystemsLab /></StudentLabRoute>} />
          <Route path="/os-lab/*"           element={<StudentLabRoute><OperatingSystemsLab /></StudentLabRoute>} />
          <Route path="/viva-portal"        element={<VivaPortal />} />
          <Route path="/viva"               element={<VivaPortal />} />

          {/* ── Safe Exam Browser: dedicated tab per experiment ── */}
          <Route path="/safe-exam/:lab/:experimentId" element={<StudentLabRoute><SafeExamPage /></StudentLabRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
