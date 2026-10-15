import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { getTabUser, trackStudentActivity, subscribeToStaffWarnings, logAiQuestion, raiseStudentHand, subscribeToWorkspaceLock, subscribeToAnnouncements, getTodaysLab } from '../utils/liveTracker';
import ProctorHUD from '../components/proctor/ProctorHUD';

/* ─────────── Sidebar nav items ─────────── */
const navItems = [
  {
    key: 'dashboard', label: 'My Learning',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    key: 'subjects', label: 'My Subjects',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    key: 'experiments', label: 'Experiments',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  },
  {
    key: 'materials', label: 'Lab Materials',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18 5.754 18 7.5 19.253m4.5-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 19.253" /></svg>,
  },
  {
    key: 'viva', label: 'Viva',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>,
  },
  {
    key: 'assistant', label: 'AI Assistant',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l3-2 3 2-.75-3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    key: 'workspace', label: 'Lab Workspace',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
  },
  {
    key: 'marks', label: 'Marks',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    key: 'reports', label: 'My Reports',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    key: 'notifications', label: 'Notifications',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  },
  {
    key: 'profile', label: 'Profile',
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" /></svg>,
  },
];

/* ─────────── Mini bar chart (pure CSS/SVG) ─────────── */
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '120px', marginTop: '16px' }}>
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '100%', height: `${pct}%`,
              background: 'linear-gradient(180deg, #6366f1, #818cf8)',
              borderRadius: '6px 6px 0 0',
              transition: 'height 0.5s ease',
              minHeight: '8px',
            }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Main Component ─────────── */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([
    { role: 'assistant', text: 'I can guide you through SQL logic, debugging hints, and experiment steps without giving final answers.' },
  ]);
  const [workspaceQuery, setWorkspaceQuery] = useState('SELECT * FROM students WHERE batch = 43;');
  const [workspaceOutput, setWorkspaceOutput] = useState('Execution ready. Run your query to inspect DBMS results.');
  const [vivaAnswers, setVivaAnswers] = useState({ q1: '', q2: '' });
  const [vivaSubmitted, setVivaSubmitted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeWarning, setActiveWarning] = useState(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');

  const storedUser = getTabUser() || {};
  const studentName = storedUser?.name || 'Aarav Kumar';
  const studentEmail = storedUser?.email || 'student@smartlabx.edu';
  const studentId = storedUser?.studentId || 'STU-2048';
  const batch = storedUser?.batch || 'Batch 43';
  const initials = studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'student') {
      // Allow demo viewing if logged in or fallback
    }

    // Broadcast initial dashboard load only if today is a lab day
    const todaysLab = getTodaysLab();
    if (todaysLab) {
      trackStudentActivity({
        email: studentEmail,
        name: studentName,
        rollNo: studentId,
        experiment: todaysLab.subject,
        status: 'Coding',
        progress: 78,
        message: 'Active on Student Dashboard'
      });
    }

    // Subscribe to real-time Faculty warnings
    const unsubscribeWarnings = subscribeToStaffWarnings((warning) => {
      setActiveWarning(warning);
    });

    // Subscribe to Class Announcements
    const unsubscribeAnnouncements = subscribeToAnnouncements((announcement) => {
      setActiveAnnouncement(announcement);
    });

    // Subscribe to Remote Workspace Lock
    const unsubscribeLock = subscribeToWorkspaceLock((lockData) => {
      setIsWorkspaceLocked(lockData.isLocked);
      setLockReason(lockData.reason || 'Workspace locked by Faculty Instructor.');
    });

    return () => {
      unsubscribeWarnings();
      unsubscribeAnnouncements();
      unsubscribeLock();
    };
  }, []);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    const tabLabels = {
      dashboard: 'Viewing Analytics Dashboard',
      subjects: 'Viewing Assigned Subjects',
      experiments: 'Browsing Experiments List',
      materials: 'Viewing Lab Materials',
      workspace: 'Working in SQL Lab Workspace',
      assistant: 'Using AI Learning Assistant',
      viva: 'Attending AI Viva Session',
      marks: 'Checking Marks & Feedback',
      reports: 'Viewing & Downloading Reports',
      notifications: 'Viewing Notifications',
      profile: 'Viewing Student Profile'
    };

    const todaysLab = getTodaysLab();
    if (todaysLab) {
      trackStudentActivity({
        email: studentEmail,
        name: studentName,
        rollNo: studentId,
        experiment: todaysLab.subject,
        status: tabKey === 'workspace' ? 'Executing' : 'Coding',
        progress: tabKey === 'viva' ? 90 : 78,
        message: tabLabels[tabKey] || `Navigated to ${tabKey}`
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('smartlabx-user');
    navigate('/');
  };

  const handleAssistantSubmit = async (e) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;
    const q = assistantInput.trim();
    
    setAssistantMessages((prev) => [...prev, { role: 'student', text: q }]);
    setAssistantInput('');
    logAiQuestion({ email: studentEmail, question: q });
    
    try {
      const res = await fetch('http://localhost:8000/api/student/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      if (data.success) {
        setAssistantMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
      } else {
        throw new Error("Failed to get answer");
      }
    } catch (err) {
      let answer = 'I can explain the concept and point you in the right direction, but I will not give the final answer.';
      if (q.toLowerCase().includes('sql')) answer = 'For SQL practice, focus on SELECT, WHERE, and JOIN clauses. Build the query step by step.';
      else if (q.toLowerCase().includes('debug')) answer = 'Check the error line first, then verify the table name and column spelling.';
      else if (q.toLowerCase().includes('join')) answer = 'Use JOINs only after confirming the common column between tables and the expected output.';
      setAssistantMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    }
  };

  /* ── Weekly activity data ── */
  const weekActivity = [
    { day: 'Mon', value: 3 }, { day: 'Tue', value: 5 }, { day: 'Wed', value: 4 },
    { day: 'Thu', value: 7 }, { day: 'Fri', value: 6 }, { day: 'Sat', value: 2 }, { day: 'Sun', value: 1 },
  ];

  const topExperiments = [
    { rank: 1, name: 'SQL Joins and Constraints', subject: 'DBMS', completion: 92, status: 'Submitted' },
    { rank: 2, name: 'Packet Flow Simulation', subject: 'Networks', completion: 78, status: 'In Progress' },
    { rank: 3, name: 'CPU Scheduling Report', subject: 'OS', completion: 65, status: 'Pending' },
  ];

  /* ──────────── RENDER CONTENT ──────────── */
  const renderContent = () => {
    switch (activeTab) {

      /* ── DASHBOARD ── */
      case 'dashboard':
      default:
        return (
          <div style={{ padding: '32px' }}>

            {/* Top stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
              {[
                { label: 'Completion Rate', value: '78%', sub: '↑ 4% this week', color: '#6366f1' },
                { label: 'Average Score', value: '8.4 / 10', sub: '↑ 0.3 last viva', color: '#8b5cf6' },
                { label: 'Labs Completed', value: '7', sub: '↑ 2 this month', color: '#06b6d4' },
              ].map((s) => (
                <div key={s.label} style={{
                  background: 'white', borderRadius: '16px',
                  padding: '24px 28px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', marginBottom: '8px' }}>{s.label}</p>
                  <p style={{ fontSize: '30px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600', marginTop: '6px' }}>{s.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Lab Activity Chart */}
              <div style={{
                background: 'white', borderRadius: '16px', padding: '24px',
                border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Lab Activity This Week</h3>
                  <span style={{
                    fontSize: '12px', padding: '4px 12px', borderRadius: '20px',
                    background: '#eef2ff', color: '#6366f1', fontWeight: '600',
                  }}>Last 7 days</span>
                </div>
                <BarChart data={weekActivity} />
              </div>

              {/* Top Experiments */}
              <div style={{
                background: 'white', borderRadius: '16px', padding: '24px',
                border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Top Experiments</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px', gap: '6px 12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>#</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>EXPERIMENT</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>COMPLETION</span>
                  {topExperiments.map((exp) => (
                    <React.Fragment key={exp.rank}>
                      <span style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: exp.rank === 1 ? '#6366f1' : exp.rank === 2 ? '#8b5cf6' : '#e2e8f0',
                        color: exp.rank <= 2 ? 'white' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '700',
                      }}>{exp.rank}</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{exp.name}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{exp.subject}</p>
                      </div>
                      <div>
                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${exp.completion}%`,
                            background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                            borderRadius: '99px',
                          }} />
                        </div>
                        <p style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600', marginTop: '3px' }}>{exp.completion}%</p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div style={{
              marginTop: '20px', background: 'white', borderRadius: '16px',
              border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Recent Activity</h3>
              </div>
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { text: 'Workspace activated for your DBMS experiment', time: '10 min ago', dot: '#6366f1' },
                  { text: 'Submission completed for Operating Systems lab', time: '1 hour ago', dot: '#8b5cf6' },
                  { text: 'Faculty feedback received on your last viva', time: '2 hours ago', dot: '#06b6d4' },
                  { text: 'New experiment assigned: SQL Joins and Constraints', time: 'Yesterday', dot: '#f59e0b' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px', borderRadius: '10px', background: '#fafafa' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.dot, flexShrink: 0 }} />
                    <p style={{ flex: 1, fontSize: '13px', color: '#475569' }}>{a.text}</p>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── SUBJECTS ── */
      case 'subjects':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Assigned Subjects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { name: 'Database Management Systems', faculty: 'Dr. Asha Rao', schedule: 'Tue & Thu · 10:00 AM', color: '#6366f1', icon: '[DBMS]', route: '/database-lab' },
                  { name: 'Computer Networks', faculty: 'Prof. Ramesh Nair', schedule: 'Mon & Wed · 2:00 PM', color: '#8b5cf6', icon: '[WEB]', route: '/computer-networks' },
                  { name: 'Operating Systems', faculty: 'Dr. Meera Pillai', schedule: 'Fri · 11:00 AM', color: '#06b6d4', icon: '', route: '/operating-systems' },
                ].map((s) => (
                  <div key={s.name} style={{ borderRadius: '12px', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ height: '6px', background: s.color }} />
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>{s.icon}</div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{s.name}</p>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>Faculty: {s.faculty}</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Schedule: {s.schedule}</p>
                      </div>
                    </div>
                    <div style={{ padding: '0 16px 16px' }}>
                      <button
                        onClick={() => navigate(s.route)}
                        style={{
                          width: '100%', padding: '9px', borderRadius: '10px',
                          background: '#f8fafc', border: '1px solid #e2e8f0',
                          color: '#4338ca', fontSize: '12px', fontWeight: '700',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        [EDU] Open Lab Workspace →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── EXPERIMENTS ── */
      case 'experiments': {
        const experimentsList = [
          { title: 'SQL Joins and Constraints', lab: 'DBMS', deadline: 'Today · 6:00 PM', status: 'In Progress', statusColor: '#f59e0b', bg: '#fffbeb', safeExamUrl: '/safe-exam/dbms/1', marks: null },
          { title: 'Packet Flow Simulation', lab: 'Computer Networks', deadline: 'Tomorrow · 12:00 PM', status: 'Pending', statusColor: '#6366f1', bg: '#eef2ff', safeExamUrl: '/safe-exam/cn/1', marks: null },
          { title: 'CPU Scheduling Algorithms', lab: 'Operating Systems', deadline: 'Friday · 4:00 PM', status: 'Submitted', statusColor: '#22c55e', bg: '#f0fdf4', safeExamUrl: '/safe-exam/os/1', marks: '27/30' },
          { title: 'Memory Management (Paging)', lab: 'Operating Systems', deadline: 'Next Mon · 11:00 AM', status: 'Pending', statusColor: '#06b6d4', bg: '#ecfeff', safeExamUrl: '/safe-exam/os/2', marks: null },
          { title: 'Normalization & Schema Design', lab: 'DBMS', deadline: 'Completed', status: 'Submitted', statusColor: '#22c55e', bg: '#f0fdf4', safeExamUrl: '/safe-exam/dbms/2', marks: '24/30' },
          { title: 'ER Model & Relational Mapping', lab: 'DBMS', deadline: 'Completed', status: 'Submitted', statusColor: '#22c55e', bg: '#f0fdf4', safeExamUrl: '/safe-exam/dbms/3', marks: '28/30' },
          { title: 'OSI Model Layer Analysis', lab: 'Computer Networks', deadline: 'Completed', status: 'Submitted', statusColor: '#22c55e', bg: '#f0fdf4', safeExamUrl: '/safe-exam/cn/2', marks: '21/30' },
          { title: 'Process Synchronization', lab: 'Operating Systems', deadline: 'Completed', status: 'Submitted', statusColor: '#22c55e', bg: '#f0fdf4', safeExamUrl: '/safe-exam/os/3', marks: '25/30' },
        ];

        const downloadExpReport = (exp) => {
          const now = new Date();
          const lines = [
            '═══════════════════════════════════════════════════════════',
            '        SMARTLABX — EXPERIMENT COMPLETION REPORT         ',
            '═══════════════════════════════════════════════════════════',
            '',
            `  Student Name    : ${studentName}`,
            `  Student ID      : ${studentId}`,
            `  Batch           : ${batch}`,
            `  Email           : ${studentEmail}`,
            '',
            '───────────────────────────────────────────────────────────',
            '  EXPERIMENT DETAILS',
            '───────────────────────────────────────────────────────────',
            '',
            `  Experiment      : ${exp.title}`,
            `  Laboratory      : ${exp.lab}`,
            `  Status          : ${exp.status}`,
            `  Marks Obtained  : ${exp.marks || 'N/A'}`,
            `  Deadline        : ${exp.deadline}`,
            `  Downloaded On   : ${now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-IN')}`,
            '',
            '───────────────────────────────────────────────────────────',
            '  SUBMISSION CONFIRMATION',
            '───────────────────────────────────────────────────────────',
            '',
            '  This certifies that the above experiment has been',
            '  successfully completed and submitted by the student.',
            '',
            '═══════════════════════════════════════════════════════════',
            '  Auto-generated by SmartLabX Platform',
            '  © 2026 SmartLabX — All Rights Reserved',
            '═══════════════════════════════════════════════════════════',
          ];
          const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${studentName.replace(/\s+/g, '_')}_${exp.title.replace(/\s+/g, '_')}_Report.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Assigned Experiments</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Completed experiments can be downloaded. Click "Launch Safe Exam Browser" for pending ones.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {experimentsList.map((item) => (
                  <div key={item.title} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: '14px',
                    background: item.bg, border: '1px solid #f1f5f9',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{item.title}</p>
                        <span style={{ fontSize: '11px', background: '#ffffff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600' }}>{item.lab}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Deadline: {item.deadline}</p>
                        {item.marks && <p style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>Marks: {item.marks}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '5px 14px', borderRadius: '20px',
                        background: item.statusColor + '20', color: item.statusColor,
                        fontSize: '12px', fontWeight: '600',
                      }}>{item.status}</span>
                      {item.status === 'Submitted' ? (
                        <button
                          onClick={() => downloadExpReport(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', color: 'white',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download Report
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(item.safeExamUrl)}
                          style={{
                            padding: '8px 16px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            border: 'none', color: 'white',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          [LOCK] Launch Safe Exam Browser
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      /* ── MATERIALS ── */
      case 'materials':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>Lab-wise Materials</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Study notes and reference material for each laboratory.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { lab: 'Database Management Systems', topics: ['SQL joins and constraints', 'Normalization and indexing', 'ER modelling'], color: '#6366f1' },
                  { lab: 'Computer Networks', topics: ['OSI and TCP/IP models', 'Routing and addressing', 'Packet analysis'], color: '#8b5cf6' },
                  { lab: 'Operating Systems', topics: ['CPU scheduling', 'Memory management', 'Deadlocks and paging'], color: '#06b6d4' },
                ].map((material) => (
                  <div key={material.lab} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ height: '6px', background: material.color }} />
                    <div style={{ padding: '18px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>{material.lab}</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: '#64748b', fontSize: '12px', lineHeight: 1.9 }}>
                        {material.topics.map((topic) => <li key={topic}>{topic}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── WORKSPACE ── */
      case 'workspace':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Allocated Laboratory Workspace</h3>
              <div style={{
                background: '#eef2ff', border: '1px solid #c7d2fe',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '24px',
                fontSize: '13px', color: '#4338ca',
              }}>
                Workspace access for {batch} is active. You can only access workspaces assigned by your faculty.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>SQL Editor</p>
                  <textarea
                    value={workspaceQuery}
                    onChange={(e) => setWorkspaceQuery(e.target.value)}
                    rows={8}
                    style={{
                      width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0',
                      background: 'white', padding: '12px', fontSize: '13px',
                      fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setWorkspaceOutput('Query executed successfully. Showing 3 matching rows for ' + batch + '.')}
                    style={{
                      marginTop: '10px', padding: '9px 20px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      border: 'none', borderRadius: '8px', color: 'white',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >▶ Run Query</button>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '12px', padding: '18px', color: '#e2e8f0' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa', marginBottom: '10px' }}>Output Console</p>
                  <pre style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{workspaceOutput}</pre>
                </div>
              </div>
            </div>
          </div>
        );

      /* ── AI ASSISTANT ── */
      case 'assistant':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>AI Learning Assistant</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Use this for guidance only. It stays disabled during the viva session.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                {assistantMessages.map((msg, i) => (
                  <div key={i} style={{
                    padding: '12px 16px', borderRadius: '12px', fontSize: '13px',
                    background: msg.role === 'assistant' ? '#eef2ff' : '#f8fafc',
                    color: msg.role === 'assistant' ? '#4338ca' : '#374151',
                    alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                    maxWidth: '80%',
                  }}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAssistantSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="Ask about SQL, debugging, or networking concepts…"
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', background: '#f8fafc',
                    fontSize: '13px', outline: 'none',
                  }}
                />
                <button type="submit" style={{
                  padding: '12px 20px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>Ask</button>
              </form>
            </div>
          </div>
        );

      /* ── VIVA ── */
      case 'viva':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>AI Viva Session</h3>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#92400e' }}>
                [!] AI assistance is disabled during viva. Camera and timer are enabled for live evaluation.
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setVivaSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { key: 'q1', question: 'Explain the role of a primary key in a relational database.' },
                  { key: 'q2', question: 'Why is normalization important in schema design?' },
                ].map((q) => (
                  <div key={q.key}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>{q.question}</label>
                    <textarea
                      value={vivaAnswers[q.key]}
                      onChange={(e) => setVivaAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                      rows={3}
                      style={{ width: '100%', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <button type="submit" style={{
                  padding: '12px 24px', borderRadius: '10px', width: 'fit-content',
                  background: '#0f172a', border: 'none', color: 'white',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}>Submit Viva Answers</button>
                {vivaSubmitted && <p style={{ color: '#22c55e', fontSize: '13px', fontWeight: '600' }}>[OK] Your viva answers were recorded successfully.</p>}
              </form>
            </div>
          </div>
        );

      /* ── MARKS ── */
      case 'marks':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Marks & Feedback</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { title: 'DBMS Practical', score: '24/30', pct: 80, feedback: 'Good SQL logic and clear explanation.', color: '#6366f1' },
                  { title: 'Viva Score', score: '18/20', pct: 90, feedback: 'Strong understanding of normalization.', color: '#22c55e' },
                  { title: 'Network Lab', score: '21/30', pct: 70, feedback: 'Work on packet analysis concepts.', color: '#f59e0b' },
                  { title: 'OS Lab', score: '27/30', pct: 90, feedback: 'Excellent CPU scheduling explanation.', color: '#06b6d4' },
                ].map((item) => (
                  <div key={item.title} style={{ borderRadius: '12px', border: '1px solid #f1f5f9', padding: '20px', background: '#fafafa' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{item.title}</p>
                    <p style={{ fontSize: '32px', fontWeight: '800', color: item.color, margin: '10px 0 4px' }}>{item.score}</p>
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', marginBottom: '10px' }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: '99px' }} />
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{item.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── REPORTS / MY COMPLETED EXPERIMENTS ── */
      case 'reports': {
        const completedExps = [
          { sno: 1, title: 'SQL Joins and Constraints', lab: 'DBMS', submittedOn: '2026-09-15', marks: '24/30', viva: '18/20', attendance: 'Present', status: 'Submitted', remarks: 'Good SQL logic and clear explanation.' },
          { sno: 2, title: 'Normalization & Schema Design', lab: 'DBMS', submittedOn: '2026-09-20', marks: '26/30', viva: '17/20', attendance: 'Present', status: 'Submitted', remarks: 'Strong understanding of 3NF.' },
          { sno: 3, title: 'ER Model & Relational Mapping', lab: 'DBMS', submittedOn: '2026-09-25', marks: '28/30', viva: '19/20', attendance: 'Present', status: 'Submitted', remarks: 'Excellent ER diagram quality.' },
          { sno: 4, title: 'Packet Flow Simulation', lab: 'Computer Networks', submittedOn: '2026-09-18', marks: '21/30', viva: '16/20', attendance: 'Present', status: 'Submitted', remarks: 'Work on packet analysis concepts.' },
          { sno: 5, title: 'OSI Model Layer Analysis', lab: 'Computer Networks', submittedOn: '2026-09-22', marks: '23/30', viva: '17/20', attendance: 'Present', status: 'Submitted', remarks: 'Good layer understanding.' },
          { sno: 6, title: 'CPU Scheduling Algorithms', lab: 'Operating Systems', submittedOn: '2026-09-28', marks: '27/30', viva: '19/20', attendance: 'Present', status: 'Submitted', remarks: 'Excellent CPU scheduling explanation.' },
          { sno: 7, title: 'Process Synchronization', lab: 'Operating Systems', submittedOn: '2026-09-30', marks: '25/30', viva: '18/20', attendance: 'Present', status: 'Submitted', remarks: 'Clear semaphore concepts.' },
          { sno: 8, title: 'Memory Management (Paging)', lab: 'Operating Systems', submittedOn: '2026-10-01', marks: '26/30', viva: '18/20', attendance: 'Present', status: 'Submitted', remarks: 'Good understanding of paging.' },
        ];

        // Download Single Exp as Excel (.xlsx)
        const downloadSingleExpExcel = (exp) => {
          const expData = [
            { 'Field': 'Student Name', 'Details': studentName },
            { 'Field': 'Student ID', 'Details': studentId },
            { 'Field': 'Batch', 'Details': batch },
            { 'Field': 'Email', 'Details': studentEmail },
            { 'Field': 'Experiment Name', 'Details': exp.title },
            { 'Field': 'Laboratory', 'Details': exp.lab },
            { 'Field': 'Submission Date', 'Details': exp.submittedOn },
            { 'Field': 'Practical Marks Obtained', 'Details': `${exp.marks} / 30` },
            { 'Field': 'Viva Score', 'Details': `${exp.viva} / 20` },
            { 'Field': 'Attendance', 'Details': exp.attendance },
            { 'Field': 'Status', 'Details': exp.status },
            { 'Field': 'Faculty Remarks', 'Details': exp.remarks },
            { 'Field': 'Report Generated', 'Details': new Date().toLocaleString('en-IN') },
          ];

          const ws = XLSX.utils.json_to_sheet(expData);
          ws['!cols'] = [{ wch: 28 }, { wch: 45 }];
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Experiment Report');
          XLSX.writeFile(wb, `${studentName.replace(/\s+/g, '_')}_${exp.title.replace(/\s+/g, '_')}.xlsx`);
        };

        const downloadSingleExp = (exp) => {
          const now = new Date();
          const lines = [
            '═══════════════════════════════════════════════════════════',
            '        SMARTLABX — EXPERIMENT COMPLETION REPORT         ',
            '═══════════════════════════════════════════════════════════',
            '',
            `  Student Name    : ${studentName}`,
            `  Student ID      : ${studentId}`,
            `  Batch           : ${batch}`,
            `  Email           : ${studentEmail}`,
            '',
            '───────────────────────────────────────────────────────────',
            `  Experiment      : ${exp.title}`,
            `  Laboratory      : ${exp.lab}`,
            `  Submitted On    : ${exp.submittedOn}`,
            `  Marks Obtained  : ${exp.marks}`,
            `  Viva Score      : ${exp.viva}`,
            `  Attendance      : ${exp.attendance}`,
            `  Faculty Remarks : ${exp.remarks}`,
            '───────────────────────────────────────────────────────────',
            '',
            '  This certifies that the above experiment was completed',
            '  and submitted successfully by the student.',
            '',
            `  Generated: ${now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            '  © 2026 SmartLabX — All Rights Reserved',
            '═══════════════════════════════════════════════════════════',
          ];
          const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${studentName.replace(/\s+/g, '_')}_${exp.title.replace(/\s+/g, '_')}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        // Download All Reports as Excel (.xlsx)
        const downloadAllReportsExcel = () => {
          const rows = completedExps.map((exp) => ({
            'S.No': exp.sno,
            'Experiment Title': exp.title,
            'Laboratory': exp.lab,
            'Submitted On': exp.submittedOn,
            'Practical Marks (30)': exp.marks,
            'Viva Score (20)': exp.viva,
            'Attendance': exp.attendance,
            'Status': exp.status,
            'Faculty Remarks': exp.remarks
          }));

          const ws = XLSX.utils.json_to_sheet(rows);
          ws['!cols'] = [
            { wch: 6 },
            { wch: 38 },
            { wch: 20 },
            { wch: 15 },
            { wch: 20 },
            { wch: 16 },
            { wch: 14 },
            { wch: 12 },
            { wch: 35 },
          ];

          const summary = [
            { 'Metric': 'Student Name', 'Value': studentName },
            { 'Metric': 'Student ID', 'Value': studentId },
            { 'Metric': 'Batch', 'Value': batch },
            { 'Metric': 'Total Experiments', 'Value': completedExps.length },
            { 'Metric': 'Avg Practical Marks', 'Value': `${Math.round(completedExps.reduce((s, e) => s + parseInt(e.marks), 0) / completedExps.length)} / 30` },
            { 'Metric': 'Avg Viva Score', 'Value': `${Math.round(completedExps.reduce((s, e) => s + parseInt(e.viva), 0) / completedExps.length)} / 20` },
            { 'Metric': 'Attendance Rate', 'Value': `${Math.round(completedExps.filter(e => e.attendance === 'Present').length / completedExps.length * 100)}%` },
            { 'Metric': 'Generated On', 'Value': new Date().toLocaleString('en-IN') },
          ];
          const wsSummary = XLSX.utils.json_to_sheet(summary);
          wsSummary['!cols'] = [{ wch: 25 }, { wch: 35 }];

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Completed Experiments');
          XLSX.utils.book_append_sheet(wb, wsSummary, 'Semester Summary');

          XLSX.writeFile(wb, `${studentName.replace(/\s+/g, '_')}_Semester_Report.xlsx`);
        };

        const downloadAllReports = () => {
          const now = new Date();
          const header = [
            '═══════════════════════════════════════════════════════════════════════════════════',
            '                    SMARTLABX — FULL SEMESTER PERFORMANCE REPORT                  ',
            '═══════════════════════════════════════════════════════════════════════════════════',
            '',
            `  Student Name    : ${studentName}`,
            `  Student ID      : ${studentId}`,
            `  Batch           : ${batch}`,
            `  Email           : ${studentEmail}`,
            `  Generated On    : ${now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-IN')}`,
            '',
            '═══════════════════════════════════════════════════════════════════════════════════',
            '',
            '  S.No | Experiment                         | Lab        | Marks  | Viva   | Status    | Remarks',
            '  ─────┼────────────────────────────────────┼────────────┼────────┼────────┼───────────┼──────────────────────────────',
          ];
          completedExps.forEach((exp) => {
            header.push(
              `  ${String(exp.sno).padStart(4)} | ${exp.title.padEnd(38)} | ${exp.lab.padEnd(10)} | ${exp.marks.padEnd(6)} | ${exp.viva.padEnd(6)} | ${exp.status.padEnd(9)} | ${exp.remarks}`
            );
          });
          header.push(
            '  ─────┼────────────────────────────────────┼────────────┼────────┼────────┼───────────┼──────────────────────────────',
            '',
            '  SUMMARY:',
            `  Total Experiments Completed : ${completedExps.length}`,
            `  Total Practical Marks       : ${completedExps.reduce((s, e) => s + parseInt(e.marks), 0)} / ${completedExps.length * 30}`,
            `  Total Viva Marks            : ${completedExps.reduce((s, e) => s + parseInt(e.viva), 0)} / ${completedExps.length * 20}`,
            `  Attendance                  : ${completedExps.filter(e => e.attendance === 'Present').length}/${completedExps.length} (${Math.round(completedExps.filter(e => e.attendance === 'Present').length / completedExps.length * 100)}%)`,
            '',
            '═══════════════════════════════════════════════════════════════════════════════════',
            '  Auto-generated by SmartLabX Platform · © 2026 SmartLabX — All Rights Reserved  ',
            '═══════════════════════════════════════════════════════════════════════════════════',
          );
          const blob = new Blob([header.join('\n')], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${studentName.replace(/\s+/g, '_')}_Full_Semester_Report.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        const thStyle = { padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' };
        const tdStyle = { padding: '12px 14px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #f1f5f9' };

        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>My Completed Experiments</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>All your submitted experiments with marks, viva scores, and faculty remarks. Download individually or as full Excel report.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={downloadAllReportsExcel}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 18px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      border: 'none', color: 'white',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.45)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 14.8l-1.4 2.2-1.4-2.2H11l2 3.1-2 3.1h2l1.4-2.2 1.4 2.2h2l-2-3.1 2-3.1h-2zM13 9V3.5L18.5 9H13z"/></svg>
                    Download Excel (.xlsx)
                  </button>
                  <button
                    onClick={downloadAllReports}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '12px',
                      background: '#eef2ff',
                      border: '1px solid #c7d2fe', color: '#4338ca',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Text (.txt)
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', margin: '20px 0' }}>
                {[
                  { label: 'Experiments Done', value: String(completedExps.length), color: '#6366f1', bg: '#eef2ff' },
                  { label: 'Avg Marks', value: `${Math.round(completedExps.reduce((s, e) => s + parseInt(e.marks), 0) / completedExps.length)}/30`, color: '#22c55e', bg: '#f0fdf4' },
                  { label: 'Avg Viva', value: `${Math.round(completedExps.reduce((s, e) => s + parseInt(e.viva), 0) / completedExps.length)}/20`, color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Attendance', value: `${Math.round(completedExps.filter(e => e.attendance === 'Present').length / completedExps.length * 100)}%`, color: '#06b6d4', bg: '#ecfeff' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '16px', borderRadius: '12px', background: s.bg, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <p style={{ fontSize: '26px', fontWeight: '800', color: s.color, marginBottom: '4px' }}>{s.value}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Experiments Table */}
              <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>S.No</th>
                      <th style={thStyle}>Experiment</th>
                      <th style={thStyle}>Lab</th>
                      <th style={thStyle}>Submitted</th>
                      <th style={thStyle}>Marks</th>
                      <th style={thStyle}>Viva</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Remarks</th>
                      <th style={{...thStyle, textAlign: 'center'}}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedExps.map((exp, idx) => (
                      <tr key={exp.sno} style={{ background: idx % 2 === 0 ? 'white' : '#fafbfc' }}>
                        <td style={{...tdStyle, fontWeight: '600', color: '#6366f1'}}>{exp.sno}</td>
                        <td style={{...tdStyle, fontWeight: '600', color: '#1e293b'}}>{exp.title}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                            background: exp.lab === 'DBMS' ? '#eef2ff' : exp.lab === 'Computer Networks' ? '#faf5ff' : '#ecfeff',
                            color: exp.lab === 'DBMS' ? '#6366f1' : exp.lab === 'Computer Networks' ? '#8b5cf6' : '#06b6d4',
                          }}>{exp.lab}</span>
                        </td>
                        <td style={{...tdStyle, fontSize: '12px', color: '#64748b'}}>{exp.submittedOn}</td>
                        <td style={{...tdStyle, fontWeight: '700', color: parseInt(exp.marks) >= 25 ? '#22c55e' : parseInt(exp.marks) >= 20 ? '#f59e0b' : '#ef4444'}}>{exp.marks}</td>
                        <td style={{...tdStyle, fontWeight: '700', color: parseInt(exp.viva) >= 17 ? '#22c55e' : parseInt(exp.viva) >= 15 ? '#f59e0b' : '#ef4444'}}>{exp.viva}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '600' }}>{exp.status}</span>
                        </td>
                        <td style={{...tdStyle, fontSize: '12px', color: '#64748b', maxWidth: '200px'}}>{exp.remarks}</td>
                        <td style={{...tdStyle, textAlign: 'center'}}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => downloadSingleExpExcel(exp)}
                              title={`Download Excel report for ${exp.title}`}
                              style={{
                                padding: '5px 10px', borderRadius: '7px',
                                background: '#059669',
                                border: 'none', color: 'white',
                                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 14.8l-1.4 2.2-1.4-2.2H11l2 3.1-2 3.1h2l1.4-2.2 1.4 2.2h2l-2-3.1 2-3.1h-2zM13 9V3.5L18.5 9H13z"/></svg>
                              .xlsx
                            </button>
                            <button
                              onClick={() => downloadSingleExp(exp)}
                              title={`Download Text report for ${exp.title}`}
                              style={{
                                padding: '5px 8px', borderRadius: '7px',
                                background: '#eef2ff',
                                border: '1px solid #c7d2fe', color: '#4338ca',
                                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              .txt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      /* ── NOTIFICATIONS ── */
      case 'notifications':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { text: 'New experiment assigned: SQL Joins and Constraints', time: '10 min ago', icon: '[LAB]', bg: '#eef2ff' },
                  { text: 'Your workspace was activated for ' + batch, time: '30 min ago', icon: '', bg: '#f0fdf4' },
                  { text: 'Viva schedule released for Friday 3:00 PM', time: '2 hours ago', icon: '[EDU]', bg: '#fffbeb' },
                  { text: 'Faculty feedback received for DBMS practical', time: 'Yesterday', icon: '[MARKS]', bg: '#faf5ff' },
                ].map((n, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 18px', borderRadius: '12px', background: n.bg,
                    border: '1px solid #f1f5f9',
                  }}>
                    <span style={{ fontSize: '22px' }}>{n.icon}</span>
                    <p style={{ flex: 1, fontSize: '13px', color: '#374151', fontWeight: '500' }}>{n.text}</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── PROFILE ── */
      case 'profile':
        return (
          <div style={{ padding: '32px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', fontWeight: '700', color: 'white',
                }}>{initials}</div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{studentName}</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>{studentId} · {batch}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {[
                  { label: 'Student Name', value: studentName },
                  { label: 'Student ID', value: studentId },
                  { label: 'Batch', value: batch },
                  { label: 'Subjects Enrolled', value: '3' },
                  { label: 'Labs Completed', value: '7' },
                  { label: 'Attendance', value: '91%' },
                ].map((item) => (
                  <div key={item.label} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>{item.label}</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  /* ─────────── Layout ─────────── */
  const sidebarWidth = sidebarCollapsed ? '72px' : '240px';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#f8fafc', overflow: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarWidth, flexShrink: 0,
        background: '#0f172a',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}>
        {/* Brand */}
        <div style={{ padding: sidebarCollapsed ? '20px 0' : '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <div>
                <p style={{ color: 'white', fontSize: '15px', fontWeight: '700' }}>SmartLabX</p>
                <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '10px' }}>Student Portal</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '8px',
            padding: '6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center',
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} /></svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleTabSelect(item.key)}
                title={sidebarCollapsed ? item.label : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: sidebarCollapsed ? '11px' : '11px 14px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: active ? 'white' : 'rgba(148,163,184,0.85)',
                  fontSize: '13px', fontWeight: active ? '600' : '500',
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.icon}
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginBottom: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', color: 'white',
              }}>{initials}</div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{studentName}</p>
                <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '11px' }}>{studentId}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title={sidebarCollapsed ? 'Logout' : ''}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '10px', padding: sidebarCollapsed ? '11px' : '11px 14px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'rgba(148,163,184,0.7)',
              fontSize: '13px', fontWeight: '500', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!sidebarCollapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Header */}
        <header style={{
          height: '64px', flexShrink: 0,
          background: 'white', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
              {activeTab === 'dashboard' ? 'Analytics Dashboard' : navItems.find((n) => n.key === activeTab)?.label}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Raise Hand / Ask Help btn */}
            <button 
              onClick={() => {
                raiseStudentHand({ email: studentEmail, name: studentName, message: 'Needs guidance on lab task.' });
                alert(' Hand raised! Faculty has been notified on the Live Monitor.');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                border: '1.5px solid #fecaca', background: '#fef2f2',
                fontSize: '12px', fontWeight: '700', color: '#dc2626', cursor: 'pointer',
              }}
            >
               Ask Staff Help
            </button>
            {/* Export CSV btn */}
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px',
              border: '1.5px solid #e2e8f0', background: 'white',
              fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer',
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{studentName}</span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', color: 'white', cursor: 'pointer',
              }}>{initials}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>

      {/* Staff Real-time Warning Modal Overlay */}
      {activeWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '32px',
            maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '2px solid #f59e0b', textAlign: 'center'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7',
              color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 16px'
            }}>
              [!]
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#92400e', marginBottom: '8px' }}>
              Faculty Live Warning Received
            </h3>
            <p style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', textTransform: 'uppercase', tracking: '0.05em', marginBottom: '16px' }}>
              Message from {activeWarning.sender || 'Faculty Monitor'}
            </p>
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px',
              padding: '16px', fontSize: '14px', color: '#78350f', fontWeight: '500',
              lineHeight: '1.6', marginBottom: '24px', textAlign: 'left'
            }}>
              "{activeWarning.message}"
            </div>
            <button
              onClick={() => setActiveWarning(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', background: '#d97706',
                color: 'white', fontWeight: '700', fontSize: '15px', border: 'none',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(217,119,6,0.4)'
              }}
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}
      {/* Staff Announcement Popup */}
      {activeAnnouncement && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9998,
          background: '#0f172a', color: 'white', padding: '16px 20px', borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid #38bdf8', maxWidth: '380px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}> {activeAnnouncement.title}</span>
            <button onClick={() => setActiveAnnouncement(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
          </div>
          <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5' }}>"{activeAnnouncement.message}"</p>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>From: {activeAnnouncement.sender}</p>
        </div>
      )}

      {/* [LOCK] Feature 1: Remote Workspace Lock Screen */}
      {isWorkspaceLocked && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '40px',
            maxWidth: '500px', width: '100%', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '2px solid #ef4444'
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', background: '#fef2f2',
              color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 20px'
            }}>
              [LOCK]
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#991b1b', marginBottom: '8px' }}>
              Workspace Remote Locked
            </h2>
            <p style={{ fontSize: '13px', color: '#7f1d1d', fontWeight: '600', textTransform: 'uppercase', tracking: '0.05em', marginBottom: '20px' }}>
              Action Enforced by Faculty Instructor
            </p>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px',
              padding: '18px', fontSize: '14px', color: '#991b1b', fontWeight: '500',
              lineHeight: '1.6', marginBottom: '24px', textAlign: 'left'
            }}>
              "{lockReason}"
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Please raise your hand or speak to your lab instructor to unlock your workspace.
            </p>
          </div>
        </div>
      )}

      {/* Proctor HUD overlay */}
      <ProctorHUD studentId={studentId} studentName={studentName} />
    </div>
  );
}
