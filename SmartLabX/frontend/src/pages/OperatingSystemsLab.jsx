import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useLabSecurity from '../hooks/useLabSecurity';
import AIGuidance from '../components/AIGuidance';
import StaffMonitorWidgets from '../components/StaffMonitorWidgets';
import { getTabUser, trackStudentActivity } from '../utils/liveTracker';
import CPUScheduling from '../components/OperatingSystems/experiments/CPUScheduling';
import MemoryManagement from '../components/OperatingSystems/experiments/MemoryManagement';
import PageReplacement from '../components/OperatingSystems/experiments/PageReplacement';
import DeadlockDetection from '../components/OperatingSystems/experiments/DeadlockDetection';
import DiskScheduling from '../components/OperatingSystems/experiments/DiskScheduling';
import OSVivaPanel from '../components/OperatingSystems/OSVivaPanel';

const staffAccount = {
  email: 'staff@smartlabx.edu',
  password: 'staff123',
  name: 'Dr. Alan Turing',
};

const initialStudents = [
  { id: 1, name: 'Arjun', email: 'arjun@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [] },
  { id: 2, name: 'Meera', email: 'meera@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [] },
  { id: 3, name: 'Ravi', email: 'ravi@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [] },
];

const workspaceData = {
  batchName: 'OS Batch A',
  memberCount: 38,
  assignedStaff: 'Dr. Alan Turing',
  assignedTasks: [
    { id: 1, title: 'CPU Scheduling Algorithms', due: '2026-08-01', status: 'Pending' },
    { id: 2, title: 'Memory Management', due: '2026-08-05', status: 'Pending' },
    { id: 3, title: 'Page Replacement Algorithms', due: '2026-08-10', status: 'Pending' },
    { id: 4, title: "Deadlock & Banker's Algorithm", due: '2026-08-15', status: 'Pending' },
    { id: 5, title: 'Disk Scheduling Algorithms', due: '2026-08-20', status: 'Pending' },
  ],
  schema: ['processes', 'memory_blocks', 'disk_queues'],
};

const osExperiments = [
  { id: 1, title: 'CPU Scheduling Algorithms', description: 'Simulate FCFS, SJF, Priority, and Round Robin scheduling with Gantt charts.', difficulty: 'Medium', estimatedTime: '90 min' },
  { id: 2, title: 'Memory Management', description: 'Visualize RAM allocation with First Fit, Best Fit, and Worst Fit algorithms.', difficulty: 'Medium', estimatedTime: '75 min' },
  { id: 3, title: 'Page Replacement Algorithms', description: 'Animate page loading with FIFO, LRU, and Optimal algorithms and track faults.', difficulty: 'Hard', estimatedTime: '80 min' },
  { id: 4, title: "Deadlock & Banker's Algorithm", description: 'Build allocation graphs, detect deadlocks, and find safe sequences.', difficulty: 'Hard', estimatedTime: '100 min' },
  { id: 5, title: 'Disk Scheduling Algorithms', description: 'Simulate disk head movement with FCFS, SSTF, SCAN, C-SCAN and LOOK algorithms.', difficulty: 'Medium', estimatedTime: '85 min' },
];

export default function OperatingSystemsLab() {
  const navigate = useNavigate();

  const [students, setStudents] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-os-students');
      if (saved) return JSON.parse(saved);
    }
    return initialStudents;
  });

  const [auth, setAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-os-auth');
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
      const saved = localStorage.getItem('smartlabx-os-completed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // --- Safe Exam Browser: NOT active on main lab page (runs in dedicated SafeExamPage tab) ---
  const isInExperiment = false;

  useEffect(() => {
    const user = getTabUser() || auth || {};
    if (user.email) {
      trackStudentActivity({
        email: user.email,
        name: user.name,
        rollNo: user.studentId || 'STU-2048',
        experiment: 'Operating Systems Lab',
        status: 'Coding',
        progress: 75,
        message: 'Opened Operating Systems Laboratory'
      });
    }
  }, []);

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
    window.localStorage.removeItem('smartlabx-os-auth');
    navigate('/');
  }, [navigate]);

  useLabSecurity({
    enabled: false, // Security handled inside SafeExamPage dedicated tab
    onViolation: showViolationToast,
    onAutoLogout: handleAutoLogout,
    maxViolations: 3,
  });

  // Modals state
  const [activeVivaStudent, setActiveVivaStudent] = useState(null);
  const [activeReportStudent, setActiveReportStudent] = useState(null);
  const [activeLiveTrackStudent, setActiveLiveTrackStudent] = useState(null);

  useEffect(() => {
    window.localStorage.setItem('smartlabx-os-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (auth) {
      window.localStorage.setItem('smartlabx-os-auth', JSON.stringify(auth));
    } else {
      window.localStorage.removeItem('smartlabx-os-auth');
    }
  }, [auth]);

  // ── BroadcastChannel: receive EXPERIMENT_COMPLETE from SafeExamPage tab ──────
  useEffect(() => {
    const channel = new BroadcastChannel('smartlabx-os');
    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'EXPERIMENT_COMPLETE' && payload?.experimentId) {
        setCompletedExperiments((prev) => {
          const next = prev.includes(payload.experimentId) ? prev : [...prev, payload.experimentId];
          localStorage.setItem('smartlabx-os-completed', JSON.stringify(next));
          return next;
        });
      }
      if (type === 'STUDENT_LOGOUT') {
        setAuth(null);
      }
    };
    return () => channel.close();
  }, []);

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
    setMessage(`${newStudent.name} was added to OS Batch A.`);
  };

  const assignTaskToStudent = (studentId) => {
    const title = window.prompt('Task title (e.g. CPU Scheduling: Round Robin practice)');
    if (!title) return;
    const due = window.prompt('Due date (YYYY-MM-DD) — optional') || '';
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, assignedTasks: [...(s.assignedTasks || []), { id: Date.now(), title, due, status: 'Assigned' }] }
          : s
      )
    );
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
    setCompletedExperiments((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const renderExperiment = () => {
    const commonProps = {
      darkMode: false,
      onBack: () => {
        handleExperimentComplete(activeExperiment);
        setActiveExperiment(null);
      },
    };
    switch (activeExperiment) {
      case 1: return <CPUScheduling {...commonProps} />;
      case 2: return <MemoryManagement {...commonProps} />;
      case 3: return <PageReplacement {...commonProps} />;
      case 4: return <DeadlockDetection {...commonProps} />;
      case 5: return <DiskScheduling {...commonProps} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">SmartLabX</p>
            <h1 className="text-2xl font-semibold text-slate-900">Operating Systems Virtual Lab</h1>
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
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">OS Batch A operating systems lab</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  This workspace is assigned to staff member Dr. Alan Turing. Students in OS Batch A can log in with their first-time password as password123.
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
                      ? 'You are monitoring OS Batch A and can manage students in the workspace.'
                      : 'You are logged into OS Batch A as a student user.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate('/viva-portal?lab=os')}
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
                    <li>• OS modules: {workspaceData.schema.join(', ')}</li>
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
                                  <button
                                    onClick={() => setActiveLiveTrackStudent(student)}
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    Live Track
                                  </button>
                                  <button
                                    onClick={() => setActiveVivaStudent(student)}
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    Start Viva
                                  </button>
                                  <button
                                    onClick={() => assignTaskToStudent(student.id)}
                                    className="rounded-2xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                                  >
                                    Assign Work
                                  </button>
                                  <button
                                    onClick={() => generateReportForStudent(student.id)}
                                    className="rounded-2xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                                  >
                                    Report
                                  </button>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleAddStudent} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-slate-900">Add student to OS Batch A</h4>
                      <div className="mt-3 space-y-3">
                        <input
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Student name"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                        />
                        <input
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="Student email"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                        />
                        <button type="submit" className="w-full rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                          Add Student
                        </button>
                      </div>
                      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
                    </form>
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
                              <button
                                onClick={() => navigate('/viva-portal?lab=os')}
                                className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 flex items-center justify-center gap-2"
                              >
                                [EDU] Open AI Viva Portal
                              </button>
                              <button
                                onClick={() => generateReportForStudent(student.id)}
                                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
                              >
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

              {/* Right-side: Experiment Dashboard (experiments open in new Safe Exam tab) */}
              <div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">OS Experiments</h3>
                      <p className="mt-1 text-sm text-slate-500">Select an experiment to begin your interactive simulation</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      {completedExperiments.length}/5 Done
                    </span>
                  </div>
                  {/* Safe Exam info banner */}
                  <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-700 mb-5">
                    <span style={{ fontSize: 18 }}>[LOCK]</span>
                    <span>Each experiment opens in a <strong>Safe Exam Browser tab</strong> with security restrictions active.</span>
                  </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {osExperiments.map((exp) => {
                        const isDone = completedExperiments.includes(exp.id);
                        return (
                          <div
                            key={exp.id}
                            className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                          >


                            <div className="p-5">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold flex-shrink-0">
                                    {exp.id.toString().padStart(2, '0')}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Experiment {exp.id}</p>
                                    <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">{exp.title}</h4>
                                  </div>
                                </div>
                                {isDone && (
                                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                    Done
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">{exp.description}</p>

                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs text-slate-400">Est. {exp.estimatedTime}</span>
                                <button
                                  onClick={() => window.location.href = `/safe-exam/os/${exp.id}`}
                                  className="flex items-center gap-1 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                                >
                                  {isDone ? 'Review' : 'Start'}
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            <StaffMonitorWidgets auth={auth} />
          </div>
        )}
      </div>

      {/* Viva Modal */}
      {activeVivaStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <OSVivaPanel
              experimentId={null}
              darkMode={false}
              student={activeVivaStudent}
              onBack={() => setActiveVivaStudent(null)}
            />
          </div>
        </div>
      )}

      {/* Report Modal */}
      {activeReportStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Report — {activeReportStudent.name}</h3>
              <button onClick={() => setActiveReportStudent(null)} className="rounded-xl p-2 hover:bg-slate-100 text-slate-500">[X]</button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
              <div>
                <p className="font-semibold text-slate-900">Student</p>
                <p>{activeReportStudent.name} &lt;{activeReportStudent.email}&gt;</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Completed Experiments</p>
                <p>{completedExperiments.length} / 5</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Assigned Tasks</p>
                {(activeReportStudent.assignedTasks || []).length === 0 ? (
                  <p className="text-slate-400">None assigned yet.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {(activeReportStudent.assignedTasks || []).map((t) => (
                      <li key={t.id}>{t.title} — {t.status}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">Viva Notes</p>
                <p className="italic">{activeReportStudent.vivaNotes || 'No notes recorded.'}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveReportStudent(null)}
              className="mt-4 w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Live Track Modal */}
      {activeLiveTrackStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Live Track — {activeLiveTrackStudent.name}</h3>
              <button onClick={() => setActiveLiveTrackStudent(null)} className="rounded-xl p-2 hover:bg-slate-100 text-slate-500">[X]</button>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900 mb-2">Current Status</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-medium">Active — working on experiments</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900 mb-1">Experiments Progress</p>
                <p className="text-slate-500">{completedExperiments.length} out of 5 experiments completed</p>
              </div>
            </div>
            <button
              onClick={() => setActiveLiveTrackStudent(null)}
              className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
