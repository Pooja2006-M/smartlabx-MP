import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useLabSecurity from '../hooks/useLabSecurity';
import AIGuidance from '../components/AIGuidance';
import StaffMonitorWidgets from '../components/StaffMonitorWidgets';
import { getTabUser, trackStudentActivity } from '../utils/liveTracker';
import ExperimentDashboard from '../components/ComputerNetworks/ExperimentDashboard';
import ReportModal from '../components/ComputerNetworks/ReportModal';
import VivaPanel from '../components/ComputerNetworks/VivaPanel';
import LiveTrackModal from '../components/ComputerNetworks/LiveTrackModal';

const staffAccount = {
  email: 'staff@smartlabx.edu',
  password: 'staff123',
  name: 'Dr. Priya',
};

const initialStudents = [
  { id: 1, name: 'Arjun', email: 'arjun@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [] },
  { id: 2, name: 'Meera', email: 'meera@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [] },
  { id: 3, name: 'Ravi', email: 'ravi@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [] },
];

const workspaceData = {
  batchName: 'CN Batch A',
  memberCount: 35,
  assignedStaff: 'Dr. Priya',
  assignedTasks: [
    { id: 1, title: 'Topology Design & Packet Simulation', due: '2026-08-01', status: 'Pending' },
    { id: 2, title: 'IP Address Configuration', due: '2026-08-05', status: 'Pending' },
    { id: 3, title: 'Routing Configuration', due: '2026-08-10', status: 'Pending' },
    { id: 4, title: 'Network Services (DHCP/DNS)', due: '2026-08-15', status: 'Pending' },
    { id: 5, title: 'Network Troubleshooting', due: '2026-08-20', status: 'Pending' },
  ],
  schema: ['routers', 'switches', 'end_devices'],
};

export default function ComputerNetworksLab() {
  const navigate = useNavigate();

  const [students, setStudents] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-cn-students');
      if (saved) return JSON.parse(saved);
    }
    return initialStudents;
  });

  const [auth, setAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-cn-auth');
      if (saved) return JSON.parse(saved);
    }
    return null;
  });

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  
  const [activeExperiment, setActiveExperiment] = useState(null);
  const [completedExperiments, setCompletedExperiments] = useState(() => {
    try {
      const saved = localStorage.getItem('smartlabx-cn-completed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ── BroadcastChannel: receive EXPERIMENT_COMPLETE from SafeExamPage tab ──────
  useEffect(() => {
    const user = getTabUser() || auth || {};
    if (user.email) {
      trackStudentActivity({
        email: user.email,
        name: user.name,
        rollNo: user.studentId || 'STU-2048',
        experiment: 'Computer Networks Lab',
        status: 'Coding',
        progress: 60,
        message: 'Opened Computer Networks Laboratory'
      });
    }

    const channel = new BroadcastChannel('smartlabx-cn');
    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'EXPERIMENT_COMPLETE' && payload?.experimentId) {
        setCompletedExperiments((prev) =>
          prev.includes(payload.experimentId) ? prev : [...prev, payload.experimentId]
        );
      }
      if (type === 'STUDENT_LOGOUT') {
        // Student was auto-logged out from safe exam tab due to violations
        setAuth(null);
      }
    };
    // Broadcast current auth to any open safe exam tabs
    return () => channel.close();
  }, []);

  // --- Safe Exam Browser: NOT active on main lab page (security runs in dedicated tab) ---
  const isInExperiment = false; // Security is now handled inside SafeExamPage

  const showViolationToast = useCallback(({ type, count, max }) => {
    const messages = {
      'copy':             '[!] Copy is not allowed during the experiment!',
      'paste':            '[!] Paste is not allowed during the experiment!',
      'cut':              '[!] Cut is not allowed during the experiment!',
      'right-click':      '[!] Right-click is disabled during the experiment!',
      'devtools-f12':     '[!] Developer tools are blocked during the experiment!',
      'devtools-shortcut':'[!] Developer tools are blocked during the experiment!',
      'view-source':      '[!] View Source is blocked during the experiment!',
      'tab-switch':       '[!] Tab switching detected! Stay on your experiment.',
      'print':            '[!] Printing is disabled during the experiment!',
    };
    alert(`[!] Warning ${count}/${max}: ${messages[type] || 'Action not allowed!'}\n\nYou will be logged out after ${max} violations.`);
  }, []);

  const handleAutoLogout = useCallback(() => {
    alert('[!!] You have been logged out due to repeated security violations during the experiment.');
    window.localStorage.removeItem('smartlabx-cn-auth');
    navigate('/');
  }, [navigate]);

  useLabSecurity({
    enabled: false, // Security disabled on main lab page; handled inside SafeExamPage
    onViolation: showViolationToast,
    onAutoLogout: handleAutoLogout,
    maxViolations: 3,
  });

  // Modals state
  const [activeReportStudent, setActiveReportStudent] = useState(null);
  const [activeVivaStudent, setActiveVivaStudent] = useState(null);
  const [activeLiveTrackStudent, setActiveLiveTrackStudent] = useState(null);

  useEffect(() => {
    window.localStorage.setItem('smartlabx-cn-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (auth) {
      window.localStorage.setItem('smartlabx-cn-auth', JSON.stringify(auth));
    } else {
      window.localStorage.removeItem('smartlabx-cn-auth');
    }
  }, [auth]);

  const handleLogin = (event) => {
    event.preventDefault();
    setMessage('');

    if (role === 'staff') {
      if (email === staffAccount.email && password === staffAccount.password) {
        setAuth({ role: 'staff', name: staffAccount.name, email });
        return;
      }
      setMessage('Staff login failed. Use staff@smartlabx.edu and staff123.');
      return;
    }

    const student = students.find((item) => item.email === email);
    if (student && password === student.password) {
      setAuth({ role: 'student', name: student.name, email: student.email });
      return;
    }

    if (email === 'student@smartlabx.edu' && password === 'password123') {
      setAuth({ role: 'student', name: 'Demo Student', email: 'student@smartlabx.edu' });
      return;
    }

    setMessage('Student login failed. First-time password is password123.');
  };

  const handleAddStudent = (event) => {
    event.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) {
      setMessage('Please enter both student name and email.');
      return;
    }

    const newStudent = {
      id: Date.now(),
      name: studentName.trim(),
      email: studentEmail.trim(),
      password: 'password123',
      assignedTasks: [],
      vivaNotes: '',
      reports: [],
    };

    setStudents([...students, newStudent]);
    setStudentName('');
    setStudentEmail('');
    setMessage(`${newStudent.name} was added to Batch 43.`);
  };

  const assignTaskToStudent = (studentId) => {
    const title = window.prompt('Task title (e.g. SQL: SELECT practice)');
    if (!title) return;
    const due = window.prompt('Due date (YYYY-MM-DD) — optional') || '';
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, assignedTasks: [...(s.assignedTasks||[]), { id: Date.now(), title, due, status: 'Assigned' }] } : s)));
    setMessage('Task assigned.');
  };

  const saveVivaNotes = (studentId, notes) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, vivaNotes: notes } : s)));
    setMessage('Viva notes saved locally.');
  };

  const generateReportForStudent = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    setActiveReportStudent(student);
  };

  const handleExperimentComplete = (id) => {
    setCompletedExperiments((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">SmartLabX</p>
            <h1 className="text-2xl font-semibold text-slate-900">Computer Networks Virtual Lab</h1>
          </div>
          <Link to="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Safe Exam Browser Banner — visible only during experiments */}
      {isInExperiment && (
        <div style={{
          background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
          color: '#fff',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.02em',
          boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}>
          <span style={{ fontSize: '18px' }}>[LOCK]</span>
          <span>Safe Exam Mode Active — Copy, paste, tab switching & dev tools are blocked during this experiment</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '700',
          }}>3 violations = auto-logout</span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!auth ? (
          <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Access portal</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">Batch 43 networks lab</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  This workspace is assigned to staff member Dr. Priya. Students in Batch 43 can log in with their first-time password as password123.
                </p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Demo access</p>
                  <p className="mt-2">Staff: staff@smartlabx.edu / staff123</p>
                  <p>Student: student@smartlabx.edu / password123</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex gap-2 rounded-2xl bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${role === 'student' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${role === 'staff' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                  >
                    Staff
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
                      placeholder={role === 'staff' ? 'staff@smartlabx.edu' : 'student@smartlabx.edu'}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{message}</div>}
                  <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700">
                    Sign In
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Active session</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Welcome, {auth.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {auth.role === 'staff'
                      ? 'You are monitoring Batch 43 and can add students to the workspace.'
                      : 'You are logged into Batch 43 as a student user.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate('/viva-portal?lab=cn')}
                    className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    [EDU] Open Viva Portal
                  </button>
                  <button
                    onClick={() => setAuth(null)}
                    className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{workspaceData.batchName} Workspace</h3>
                    <p className="mt-1 text-sm text-slate-500">Assigned staff: {workspaceData.assignedStaff}</p>
                  </div>
                  {auth.role === 'staff' ? (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                      {workspaceData.memberCount} members
                    </span>
                  ) : (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">Members</span>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Workspace details</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>• Batch leader: {workspaceData.assignedStaff}</li>
                    <li>• Network modules: {workspaceData.schema.join(', ')}</li>
                    <li>• First-login password for students: password123</li>
                  </ul>
                </div>

                {auth.role === 'staff' ? (
                  <>
                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">Students in this batch</h4>
                        <span className="text-xs font-medium text-slate-500">{students.length} active</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {students.map((student) => (
                          <div key={student.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-slate-800">{student.name}</p>
                                <p className="text-slate-500">{student.email}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <button onClick={() => setActiveLiveTrackStudent(student)} className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">Live Track</button>
                                  <button onClick={() => setActiveVivaStudent(student)} className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">Start Viva</button>
                                  <button onClick={() => assignTaskToStudent(student.id)} className="rounded-2xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">Assign Work</button>
                                  <button onClick={() => generateReportForStudent(student.id)} className="rounded-2xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">Report</button>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-5">
                    {(() => {
                      const student = students.find((s) => s.email === auth.email);
                      if (!student) return null;
                      return (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm">
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">My Tasks & Feedback</h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-2">Assigned work</p>
                              <ul className="text-sm text-slate-600">
                                {(student.assignedTasks || []).length === 0 && <li className="text-xs text-slate-500">No tasks assigned yet.</li>}
                                {(student.assignedTasks || []).map((t) => (
                                  <li key={t.id} className="mt-1 rounded-lg border border-slate-200 bg-white p-2 flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-slate-800">{t.title}</p>
                                      <p className="text-xs text-slate-500">Due: {t.due || 'n/a'}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-indigo-700">{t.status}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-semibold text-slate-900">My Viva Notes</label>
                              <textarea
                                value={student.vivaNotes || ''}
                                onChange={(e) => saveVivaNotes(student.id, e.target.value)}
                                rows={3}
                                placeholder="Write your notes here..."
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                              />
                            </div>
                            <div className="flex flex-col gap-2 mt-4">
                              <button onClick={() => setActiveVivaStudent(student)} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                                Attend AI Viva
                              </button>
                              <button onClick={() => navigate('/viva-portal?lab=cn')} className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 flex items-center justify-center gap-2">
                                [EDU] Open AI Viva Portal
                              </button>
                              <button onClick={() => generateReportForStudent(student.id)} className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700">
                                View My Report
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* AI Guidance & Staff Security Tracking */}
                <div className="mt-6">
                  <AIGuidance auth={auth} />
                </div>
              </div>

              {/* Right-side: Experiment Dashboard */}
              <div>
                <ExperimentDashboard
                  onSelectExperiment={(id) => setActiveExperiment(id)}
                  completedExperiments={completedExperiments}
                  authEmail={auth?.email || ''}
                />
              </div>
            </div>
            <StaffMonitorWidgets auth={auth} />
          </div>
        )}
      </div>

      {activeReportStudent && (
        <ReportModal 
          student={activeReportStudent} 
          batchName={workspaceData.batchName} 
          completedExperiments={completedExperiments} 
          onClose={() => setActiveReportStudent(null)} 
        />
      )}
      
      {activeVivaStudent && (
        <VivaPanel 
          student={activeVivaStudent} 
          onClose={() => setActiveVivaStudent(null)} 
        />
      )}

      {activeLiveTrackStudent && (
        <LiveTrackModal 
          student={activeLiveTrackStudent} 
          onClose={() => setActiveLiveTrackStudent(null)} 
        />
      )}

    </div>
  );
}
