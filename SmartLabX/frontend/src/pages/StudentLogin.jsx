import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { setTabUser, trackStudentActivity } from '../utils/liveTracker';

export default function StudentLogin() {
  const [email, setEmail] = useState('student@smartlabx.edu');
  const [password, setPassword] = useState('password123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const finishStudentLogin = (student) => {
    localStorage.setItem('token', student.token || 'demo-student-token');
    setTabUser(student);
    const labAuth = { role: 'student', name: student.name, email: student.email };
    localStorage.setItem('user', JSON.stringify(labAuth));
    localStorage.setItem('smartlabx-auth', JSON.stringify(labAuth));
    localStorage.setItem('smartlabx-cn-auth', JSON.stringify(labAuth));
    localStorage.setItem('smartlabx-os-auth', JSON.stringify(labAuth));

    trackStudentActivity({
      email: student.email,
      name: student.name,
      rollNo: student.studentId || 'STU-2048',
      experiment: 'Student Dashboard',
      status: 'Coding',
      progress: 30,
      message: 'Logged in to Student Portal',
      actionType: 'LOGIN'
    });

    navigate(location.state?.from || '/student', { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo student credentials
      const demoStudents = [
        { email: 'student@smartlabx.edu', password: 'password123', role: 'student', name: 'Aarav Kumar', studentId: 'STU-2048', batch: 'Batch 43' },
        { email: 'priya@smartlabx.edu', password: 'password123', role: 'student', name: 'Priya Sharma', studentId: 'STU-2049', batch: 'Batch 43' },
      ];

      const normalizedEmail = email.trim().toLowerCase();
      const match = demoStudents.find(
        (s) => s.email === normalizedEmail && (s.password === password || s.password === 'student123' && password === 'student123')
      );

      if (match) {
        finishStudentLogin(match);
        return;
      }

      try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.role !== 'student') {
          setError('Access denied. Use the main portal for admin/faculty login.');
          return;
        }
        finishStudentLogin(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#f8fafc' }}>
      
      {/* Left Branding Panel */}
      <div style={{
        flex: '0 0 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-100px', left: '-100px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', right: '-80px',
          width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}>
            <svg width="26" height="26" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#0f172a', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>SmartLabX</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '1px' }}>Virtual Lab Platform</div>
          </div>
        </div>

        <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a', lineHeight: '1.15', letterSpacing: '-1px', marginBottom: '20px' }}>
          Your Virtual<br />
          <span style={{ background: 'linear-gradient(90deg, #6366f1, #4338ca)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lab Workspace
          </span><br />
          Awaits You.
        </h1>
        <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.7', maxWidth: '340px', marginBottom: '48px' }}>
          Access your experiments, track progress, and collaborate with AI-guided learning — all in one place.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: '[LAB]', label: 'DBMS, Networks & OS Labs' },
            { icon: '', label: 'AI-Guided Learning Assistant' },
            { icon: '[CHART]', label: 'Real-time Progress Analytics' },
            { icon: '[EDU]', label: 'Live Viva Evaluation' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0', borderRadius: '12px',
              padding: '12px 16px',
            }}>
              <span style={{ fontSize: '18px' }}>{f.icon}</span>
              <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Login Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
        background: '#f1f5f9',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid #e2e8f0',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          {/* Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '44px 40px',
            boxShadow: '0 24px 60px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.04)',
          }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                Student Sign In
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                Enter your college credentials to access your lab workspace
              </p>
            </div>



            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>
                  College Email
                </label>
                <input
                  id="student-email"
                  type="email"
                  required
                  placeholder="yourname@smartlabx.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '12px',
                    border: '1.5px solid #e2e8f0', background: '#f8fafc',
                    fontSize: '14px', color: '#0f172a', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="student-password"
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '13px 44px 13px 16px', borderRadius: '12px',
                      border: '1.5px solid #e2e8f0', background: '#f8fafc',
                      fontSize: '14px', color: '#0f172a', outline: 'none',
                      boxSizing: 'border-box', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0',
                    }}
                  >
                    {showPass ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: '10px', padding: '10px 14px',
                  fontSize: '13px', color: '#dc2626',
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="student-login-btn"
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: '12px',
                  color: 'white', fontSize: '15px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.35)',
                  transition: 'all 0.2s', letterSpacing: '0.2px',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: 'spin 1s linear infinite' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Signing in...
                  </span>
                ) : 'Access Lab Workspace →'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
              Faculty or Admin?{' '}
              <Link to="/login" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
                Use the main portal
              </Link>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
            SmartLabX · Secure Virtual Lab Platform · © 2026
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
