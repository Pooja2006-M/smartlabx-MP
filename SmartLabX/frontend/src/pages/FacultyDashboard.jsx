import React, { useState } from 'react';
import '../index.css';
import FacultySubjects from '../components/faculty/FacultySubjects';
import ExperimentManagement from '../components/faculty/ExperimentManagement';
import WorkspaceManagement from '../components/faculty/WorkspaceManagement';
import LiveMonitor from '../components/faculty/LiveMonitor';
import VivaManagement from '../components/faculty/VivaManagement';
import MarksAndFeedback from '../components/faculty/MarksAndFeedback';
import ResourceManagement from '../components/admin/ResourceManagement';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import StudentPerformancePrediction from '../components/faculty/StudentPerformancePrediction';

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  
  const handleAddLateStudent = async () => {
    if (!newStudentName || !newStudentRoll) return alert("Enter Name and Roll Number");
    try {
      // In a real app this would be a POST to /faculty/students
      alert(`Late Student ${newStudentName} (Roll ${newStudentRoll}) created successfully!`);
      setShowAddStudent(false);
      setNewStudentName('');
      setNewStudentRoll('');
    } catch (e) {
      alert("Error adding student");
    }
  };

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { key: 'subjects', label: 'My Subjects', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { key: 'experiments', label: 'Experiments', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
    { key: 'resources', label: 'Resources', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
    { key: 'workspaces', label: 'Workspaces', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
    { key: 'live', label: 'Live Monitor', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { key: 'viva', label: 'Viva & Evaluation', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg> },
    { key: 'marks', label: 'Marks & Feedback', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'predictions', label: 'AI Predictions', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { key: 'reports', label: 'Reports', icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'subjects': return <FacultySubjects />;
      case 'experiments': return <ExperimentManagement />;
      case 'workspaces': return <WorkspaceManagement />;
      case 'live': return <LiveMonitor />;
      case 'viva': return <VivaManagement />;
      case 'marks': return <MarksAndFeedback />;
      case 'resources': return <ResourceManagement />;
      case 'reports': return <ReportsAnalytics />;
      case 'predictions': return <StudentPerformancePrediction />;
      case 'dashboard':
      default:
        return (
          <div className="p-8">
            <div className="mb-8 rounded-[1.5rem] border border-indigo-100 bg-gradient-to-r from-slate-900 to-indigo-700 p-6 text-white shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">Faculty overview</p>
              <h3 className="mt-2 text-2xl font-semibold">You can manage lessons, experiments, and evaluations from one dashboard.</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Assigned Subjects', value: '3' },
                { title: 'Students', value: '173' },
                { title: 'Experiments', value: '37' },
                { title: 'Active Workspaces', value: '2' },
              ].map((stat, i) => (
                <div key={i} className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800">Quick Actions</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <button onClick={() => setActiveTab('experiments')} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-left text-sm font-medium text-indigo-700 transition hover:bg-indigo-100">Create Experiment</button>
                  <button onClick={() => setActiveTab('workspaces')} className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-100">Allocate Workspace</button>
                  <button onClick={() => setActiveTab('live')} className="rounded-2xl border border-green-100 bg-green-50 p-4 text-left text-sm font-medium text-green-700 transition hover:bg-green-100">Monitor Live Session</button>
                  <button onClick={() => setShowAddStudent(true)} className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-left text-sm font-medium text-orange-700 transition hover:bg-orange-100">
                    <span className="block font-bold mb-1">+ Add Late Student</span>
                    <span className="text-xs opacity-80">Quickly enroll roll 121 etc.</span>
                  </button>
                  <button onClick={() => setActiveTab('viva')} className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-left text-sm font-medium text-purple-700 transition hover:bg-purple-100 sm:col-span-2">Evaluate Submission</button>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="font-semibold text-slate-800">Recent Activities</h3>
                </div>
                <div className="space-y-4 p-6">
                  {[
                    { text: 'New Workspace created for DBMS Exp 1', time: '10 min ago' },
                    { text: 'John Doe submitted SQL DDL Experiment', time: '1 hour ago' },
                    { text: 'Viva completed for Jane Smith (24/25)', time: '2 hours ago' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                      <p className="flex-1 text-sm text-slate-700">{act.text}</p>
                      <span className="text-xs text-slate-400">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-slate-900 text-white">
        <div className="cursor-pointer p-6" onClick={() => setActiveTab('dashboard')}>
          <h1 className="text-2xl font-bold tracking-wider text-indigo-400">SmartLabX</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-green-400" /> Faculty Portal</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeTab === item.key ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {activeTab === 'dashboard' ? 'Faculty Dashboard Overview' : sidebarItems.find((i) => i.key === activeTab)?.label}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600">Dr. Alan Turing</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 font-bold text-indigo-600">AT</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </main>

      {/* Add Late Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800">Add Late Student</h3>
            <p className="mt-1 text-sm text-slate-500">Quickly create a portal account for a late enrollee.</p>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Student Name</label>
                <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Rahul K" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Roll Number / Email ID</label>
                <input type="text" value={newStudentRoll} onChange={e => setNewStudentRoll(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. roll121" />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowAddStudent(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleAddLateStudent} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create Student</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
