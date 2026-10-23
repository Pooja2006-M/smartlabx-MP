import React, { useState, useEffect } from 'react';
import { subscribeToLiveUpdates, sendStaffWarning, lockStudentWorkspace, broadcastAnnouncement, getLabSchedule, saveLabSchedule, getTodaysLab, getAllCognitiveFrictionRecords, calculateCognitiveFrictionScore } from '../../utils/liveTracker';
import { raiseApi } from '../../utils/api';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SUBJECT_OPTIONS = [
  { label: '— No Lab —',            value: '' },
  { label: 'DBMS Lab',              value: 'DBMS Lab',              code: 'CS301', room: 'Lab 1' },
  { label: 'Computer Networks Lab', value: 'Computer Networks Lab', code: 'CS302', room: 'Lab 2' },
  { label: 'Operating Systems Lab', value: 'Operating Systems Lab', code: 'CS303', room: 'Lab 3' },
];

export default function LiveMonitor() {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [notification, setNotification] = useState('');
  const [lockedStudents, setLockedStudents] = useState({});
  const [liveData, setLiveData] = useState({
    securityLogs: [],
    aiLogs: [],
    studentsList: []
  });

  // ── Lab Schedule state (NEW) ──
  const [labSchedule, setLabSchedule] = useState(() => getLabSchedule());
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [draftSchedule, setDraftSchedule] = useState(() => getLabSchedule());
  const [todaysLab, setTodaysLab] = useState(() => getTodaysLab());
  const [raiseDiag, setRaiseDiag] = useState(null);

  const fetchRealData = () => {
    try {
      const secLogs = JSON.parse(localStorage.getItem('smartlabx-security-logs') || '[]');
      const aiLogs = JSON.parse(localStorage.getItem('smartlabx-ai-logs') || '[]');
      const activityLogs = JSON.parse(localStorage.getItem('smartlabx-live-activities') || '[]');
      const registeredStudents = JSON.parse(localStorage.getItem('smartlabx-students') || '[]');
      const frictionRecords = getAllCognitiveFrictionRecords();

      // Base default students
      const baseStudents = [
        { id: 1, name: 'Aarav Kumar', email: 'student@smartlabx.edu', rollNo: 'STU-2048', experiment: 'Database Query Console / Lab', status: 'Coding', progress: 85 },
        { id: 2, name: 'Priya Sharma', email: 'priya@smartlabx.edu', rollNo: 'STU-2049', experiment: 'Computer Networks Exp 2', status: 'Executing', progress: 60 },
        { id: 3, name: 'Arjun', email: 'arjun@student.com', rollNo: 'STU-2050', experiment: 'CPU Scheduling Algorithms', status: 'Coding', progress: 75 },
        { id: 4, name: 'Meera', email: 'meera@student.com', rollNo: 'STU-2051', experiment: 'Memory Management', status: 'Idle', progress: 40 },
        { id: 5, name: 'Ravi', email: 'ravi@student.com', rollNo: 'STU-2052', experiment: 'Disk Scheduling Algorithms', status: 'Submitted', progress: 100 },
      ];

      // Merge registered students
      registeredStudents.forEach((s, idx) => {
        if (!baseStudents.find(b => b.email === s.email)) {
          baseStudents.push({
            id: 10 + idx,
            name: s.name,
            email: s.email,
            rollNo: `STU-${2053 + idx}`,
            experiment: 'Lab Workspace',
            status: 'Coding',
            progress: 50
          });
        }
      });

      // Merge dynamic activities from unknown student emails
      const activityStudents = activityLogs
        .filter((activity) => activity.email && !baseStudents.some((student) => student.email === activity.email))
        .reduce((students, activity, index) => {
          if (!students.some(s => s.email === activity.email)) {
            students.push({
              id: `live-${activity.email}`,
              name: activity.name || activity.email.split('@')[0],
              email: activity.email,
              rollNo: activity.rollNo || `LIVE-${2053 + index}`,
              experiment: activity.experiment || 'Lab Workspace',
              status: activity.status || 'Coding',
              progress: activity.progress || 50,
            });
          }
          return students;
        }, []);

      const enriched = [...baseStudents, ...activityStudents].map(student => {
        const sSecLogs = secLogs.filter(l => l.email === student.email);
        const sAiLogs = aiLogs.filter(l => l.email === student.email);
        const latestSecurity = sSecLogs[0];
        const latestAi = sAiLogs[0];
        const latestActivity = activityLogs
          .filter(l => l.email === student.email)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
        
        const exitCount = sSecLogs.filter(l => l.type && (l.type.includes('EXIT') || l.type.includes('LOGOUT') || l.type.includes('switch') || l.type.includes('TAB'))).length;
        const aiCount = sAiLogs.length;

        // Cognitive Friction Data
        const fRecord = frictionRecords[student.email] || {
          email: student.email,
          name: student.name,
          errorCount: exitCount > 0 ? exitCount : 0,
          consecutiveFails: 0,
          repeatedErrorsCount: 0,
          editRunCycles: 0,
          idleSeconds: 0,
          aiHintsUsed: aiCount
        };
        const frictionAnalysis = calculateCognitiveFrictionScore({
          ...fRecord,
          aiHintsUsed: aiCount
        });

        let currentStatus = latestActivity?.status || student.status;
        if (latestSecurity) {
          if (latestSecurity.type && (latestSecurity.type.includes('EXIT') || latestSecurity.type.includes('LOGOUT'))) {
            currentStatus = 'Idle';
          } else if (latestSecurity.type && latestSecurity.type.includes('ENTER')) {
            currentStatus = 'Coding';
          }
        }

        const currentActivity = latestActivity
          ? latestActivity.message
          : latestAi
          ? `Asked AI: "${latestAi.question}"`
          : latestSecurity?.message || 'No activity recorded yet';

        const hasHandRaised = latestActivity?.actionType === 'HAND_RAISE' || latestActivity?.message?.includes('');
        const isRecentlyActive = latestActivity?.timestamp && (Date.now() - latestActivity.timestamp < 300000);

        // Security Threat Analysis
        let threatLevel = 'NONE';
        if (exitCount >= 3 || sSecLogs.some(l => l.severity === 'CRITICAL' || l.message?.includes('Injection'))) {
          threatLevel = 'CRITICAL';
        } else if (exitCount >= 1 || sSecLogs.some(l => l.type?.includes('copy') || l.type?.includes('f12'))) {
          threatLevel = 'HIGH';
        }

        return {
          ...student,
          status: currentStatus,
          progress: latestActivity?.progress ?? student.progress,
          experiment: latestActivity?.experiment || student.experiment,
          isOnline: isRecentlyActive || student.email === 'student@smartlabx.edu',
          aiUsed: aiCount,
          exitCount: exitCount,
          hasHandRaised,
          threatLevel,
          frictionScore: frictionAnalysis.frictionScore,
          frictionLevel: frictionAnalysis.level,
          isFrictionAlert: frictionAnalysis.isAlert,
          debuggingBehavior: frictionAnalysis.debuggingBehavior,
          currentCode: latestActivity?.currentCode || 'SELECT * FROM students WHERE batch = 43;',
          aiQuestions: sAiLogs.map(a => ({ question: a.question, time: a.time })),
          securityHistory: sSecLogs.map(s => ({ text: s.message, time: s.time, type: s.type, severity: s.severity })),
          lastActivity: latestActivity?.time || latestSecurity?.time || latestAi?.time || 'Just now',
          currentActivity,
        };
      });

      setLiveData({
        securityLogs: secLogs,
        aiLogs: aiLogs,
        studentsList: enriched
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRealData();
    const unsubscribe = subscribeToLiveUpdates((msg) => {
      fetchRealData();
      // Refresh schedule if it was just updated by another tab
      if (msg && msg.type === 'LAB_SCHEDULE_UPDATED') {
        const fresh = getLabSchedule();
        setLabSchedule(fresh);
        setDraftSchedule(fresh);
        setTodaysLab(getTodaysLab());
      }
    });

    const timer = setInterval(fetchRealData, 2000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  // ── Save draft schedule ──
  const handleSaveSchedule = () => {
    // Convert draft (day -> subject value) into full objects
    const full = {};
    ALL_DAYS.forEach(day => {
      const val = draftSchedule[day];
      if (!val) return;
      if (typeof val === 'object' && val.subject) {
        full[day] = val;
      } else if (typeof val === 'string' && val) {
        const opt = SUBJECT_OPTIONS.find(o => o.value === val);
        if (opt && opt.value) full[day] = { subject: opt.value, subjectCode: opt.code, room: opt.room };
      }
    });
    saveLabSchedule(full);
    setLabSchedule(full);
    setTodaysLab(getTodaysLab());
    setEditingSchedule(false);
    setNotification('✅ Lab Schedule saved & broadcast to all student tabs!');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleDraftChange = (day, subjectValue) => {
    setDraftSchedule(prev => ({ ...prev, [day]: subjectValue }));
  };

  const activeStudents = liveData.studentsList;
  const selectedStudent = activeStudents.find((student) => student.id === selectedStudentId);

  useEffect(() => {
    if (!selectedStudent?.email) {
      setRaiseDiag(null);
      return;
    }
    let cancelled = false;
    raiseApi.state(selectedStudent.email)
      .then((diag) => { if (!cancelled) setRaiseDiag(diag); })
      .catch(() => { if (!cancelled) setRaiseDiag(null); });
    return () => { cancelled = true; };
  }, [selectedStudentId]);

  const statusColors = { 
    Coding: 'bg-indigo-50 text-indigo-700 border border-indigo-100', 
    Idle: 'bg-amber-50 text-amber-700 border border-amber-100', 
    Executing: 'bg-emerald-50 text-emerald-700 border border-emerald-100', 
    Submitted: 'bg-purple-50 text-purple-700 border border-purple-100' 
  };

  const codingCount = activeStudents.filter(s => s.status === 'Coding').length;
  const executingCount = activeStudents.filter(s => s.status === 'Executing').length;
  const idleCount = activeStudents.filter(s => s.status === 'Idle').length;
  const submittedCount = activeStudents.filter(s => s.status === 'Submitted').length;
  const handRaisedCount = activeStudents.filter(s => s.hasHandRaised).length;

  const handleSendWarning = (student) => {
    const msg = window.prompt(`Enter real-time warning message for ${student.name}:`, 'Please focus on your lab experiment and follow security guidelines.');
    if (msg) {
      sendStaffWarning({
        targetEmail: student.email,
        studentName: student.name,
        message: msg,
        sender: 'Faculty Monitor'
      });
      setNotification(`[OK] Real-time warning dispatched to ${student.name}!`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleToggleWorkspaceLock = (student) => {
    const isCurrentlyLocked = !!lockedStudents[student.email];
    const newLockState = !isCurrentlyLocked;

    lockStudentWorkspace({
      targetEmail: student.email,
      isLocked: newLockState,
      reason: newLockState ? 'Workspace locked by Faculty for lab review.' : 'Unlocked by Faculty.'
    });

    setLockedStudents(prev => ({ ...prev, [student.email]: newLockState }));
    setNotification(newLockState ? `[LOCK] Workspace locked for ${student.name}` : ` Workspace unlocked for ${student.name}`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleBroadcastAnnouncement = () => {
    const msg = window.prompt('Enter Class Announcement message (will pop up on all active student screens):', 'Attention class: 15 minutes remaining to submit your SQL lab assignment.');
    if (msg) {
      broadcastAnnouncement({
        title: ' Faculty Announcement',
        message: msg,
        sender: 'Dr. Alan Turing'
      });
      setNotification(' Live Broadcast Announcement sent to all active students!');
      setTimeout(() => setNotification(''), 4000);
    }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      {notification && (
        <div className="mb-4 p-4 rounded-xl bg-indigo-900 text-white text-sm font-semibold flex items-center justify-between shadow-lg animate-bounce">
          <span>{notification}</span>
          <button onClick={() => setNotification('')} className="text-indigo-200 font-bold">&times;</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Live Workspace Monitor
            <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold border border-indigo-200">
               Real-time Socket &amp; Channel Connected
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Real-time live student tracking, attack detection &amp; remote control.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBroadcastAnnouncement}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-semibold text-sm shadow-sm flex items-center gap-2"
          >
             Broadcast Class Announcement
          </button>
          <span className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full border ${sessionPaused ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${sessionPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span> {sessionPaused ? 'Session Paused' : 'Live Tracking Active'}
          </span>
          <button onClick={() => setSessionPaused((paused) => !paused)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition font-medium text-sm shadow-xs">
            {sessionPaused ? 'Resume Session' : 'Pause Session'}
          </button>
        </div>
      </div>

      {/* ── LAB SCHEDULE MANAGER (NEW) ─────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <div>
              <p className="font-bold text-sm">Weekly Lab Schedule</p>
              <p className="text-xs text-indigo-200">Staff sets which subject runs on which lab day — students are tracked only on these days</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingSchedule(e => !e); setDraftSchedule(labSchedule); }}
            className="text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl border border-white/30 transition"
          >
            {editingSchedule ? '✕ Cancel' : '✏ Edit Schedule'}
          </button>
        </div>

        {/* Today's Lab Banner */}
        {todaysLab ? (
          <div className="mx-6 my-4 flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Today is a Lab Day — Tracking Active</p>
              <p className="text-sm font-semibold text-emerald-900 mt-0.5">
                {todaysLab.day} · <span className="text-indigo-700">{todaysLab.subject}</span>
                <span className="ml-2 text-xs font-normal text-slate-500">({todaysLab.subjectCode}) · {todaysLab.room}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-6 my-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <span className="w-3 h-3 rounded-full bg-slate-300 flex-shrink-0"></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No Lab Scheduled Today</p>
              <p className="text-xs text-slate-400 mt-0.5">Lab tracking is active only on configured lab days.</p>
            </div>
          </div>
        )}

        {/* Schedule Grid (view mode) */}
        {!editingSchedule && (
          <div className="px-6 pb-5">
            <div className="grid grid-cols-7 gap-2">
              {ALL_DAYS.map(day => {
                const entry = labSchedule[day];
                const isToday = todaysLab?.day === day;
                return (
                  <div key={day} className={`rounded-xl border p-3 text-center ${
                    isToday ? 'border-emerald-300 bg-emerald-50' :
                    entry ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50'
                  }`}>
                    <p className={`text-xs font-bold mb-1 ${ isToday ? 'text-emerald-700' : entry ? 'text-indigo-700' : 'text-slate-400' }`}>
                      {day.slice(0,3)}
                    </p>
                    {entry ? (
                      <>
                        <p className="text-[10px] font-semibold text-slate-700 leading-tight">{entry.subject}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{entry.room}</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic">No Lab</p>
                    )}
                    {isToday && <span className="mt-1 inline-block text-[9px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 font-bold">TODAY</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Edit mode */}
        {editingSchedule && (
          <div className="px-6 pb-5">
            <p className="text-xs text-slate-500 mb-3">Select which subject lab runs on each day. Leave blank for no lab.</p>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {ALL_DAYS.map(day => {
                const currentVal = typeof draftSchedule[day] === 'object' ? draftSchedule[day]?.subject || '' : draftSchedule[day] || '';
                return (
                  <div key={day} className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600 text-center">{day.slice(0,3)}</label>
                    <select
                      value={currentVal}
                      onChange={e => handleDraftChange(day, e.target.value)}
                      className="text-[11px] rounded-lg border border-slate-200 px-1.5 py-2 text-slate-700 focus:border-indigo-400 focus:outline-none bg-white w-full"
                    >
                      {SUBJECT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleSaveSchedule}
              className="bg-indigo-600 text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-indigo-700 transition shadow-sm"
            >
              💾 Save & Broadcast Schedule
            </button>
          </div>
        )}
      </div>
      {/* ── END LAB SCHEDULE MANAGER ─────────────────────────────── */}

      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{activeStudents.length}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Total Students</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{codingCount}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Coding</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{executingCount}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Executing</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{idleCount}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Idle</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-rose-600">{handRaisedCount}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5"> Hand Raised</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{submittedCount}</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Submitted</p>
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStudents.map(student => {
          const isLocked = !!lockedStudents[student.email];
          return (
            <div
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`bg-white rounded-2xl shadow-xs border p-5 hover:shadow-md transition cursor-pointer relative ${isLocked ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-indigo-300'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {student.name.charAt(0)}
                    </div>
                    {student.isOnline && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-ping" title="Live Online"></span>
                    )}
                    {student.isOnline && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Live Online"></span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      {student.name}
                      {student.hasHandRaised && (
                        <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold animate-bounce"> Help</span>
                      )}
                      {isLocked && (
                        <span className="text-xs px-2 py-0.5 bg-rose-600 text-white rounded-full font-bold">[LOCK] Locked</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">{student.rollNo}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[student.status] || statusColors.Coding}`}>{student.status}</span>
                  {student.isFrictionAlert && (
                    <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                      FRICTION ALERT ({student.frictionScore}/100)
                    </span>
                  )}
                  {student.threatLevel === 'CRITICAL' && (
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-extrabold animate-pulse">[SEC] CRITICAL THREAT</span>
                  )}
                  {student.threatLevel === 'HIGH' && (
                    <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">[SEC] HIGH ALERT</span>
                  )}
                </div>
              </div>

              <div className="mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-700 truncate"> {student.currentActivity}</p>
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                  <span className="truncate">Lab: {student.experiment}</span>
                  <span className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                    student.frictionScore >= 75 ? 'bg-rose-100 text-rose-700' :
                    student.frictionScore >= 55 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Friction: {student.frictionScore || 0} ({student.frictionLevel || 'Low'})
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-700">{student.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500" style={{ width: `${student.progress}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-400 font-medium pt-1">
                <span> AI: {student.aiUsed} {student.aiUsed > 2 && '[!]'}</span>
                <span> Exits: {student.exitCount}</span>
                <span className="text-indigo-600 font-semibold">{student.lastActivity}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Detail Modal with Live Code Mirroring & Controls */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl border border-indigo-200">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    {selectedStudent.name}
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Live Active</span>
                    {lockedStudents[selectedStudent.email] && (
                      <span className="text-xs px-2.5 py-0.5 bg-rose-600 text-white rounded-full font-bold">[LOCK] Workspace Locked</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500 font-mono">{selectedStudent.email} • {selectedStudent.rollNo}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentId(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
            </div>

            {/* Current Activity Banner */}
            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Live Current Activity</p>
              <p className="mt-1 text-sm font-semibold text-indigo-950">{selectedStudent.currentActivity}</p>
              <p className="mt-1 text-xs text-indigo-600">Last activity timestamp: {selectedStudent.lastActivity}</p>
            </div>

            {/*  Feature 2: Live Code & Query Mirroring Terminal */}
            <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-100 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
                   Live Code & Query Terminal Mirror (Real-time View)
                </span>
                <span className="text-[11px] text-slate-400">Live Synchronized</span>
              </div>
              <pre className="text-xs text-emerald-400 bg-slate-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {selectedStudent.currentCode || '-- No live code typed yet.'}
              </pre>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-700">{selectedStudent.aiUsed} Questions</p>
                <p className="text-xs font-semibold text-amber-900 mt-0.5"> AI Hints Used</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-red-700">{selectedStudent.exitCount || 0} Alerts</p>
                <p className="text-xs font-semibold text-red-900 mt-0.5"> Tab / Window Exits</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{selectedStudent.progress}%</p>
                <p className="text-xs font-semibold text-emerald-900 mt-0.5">[CHART] Task Completion</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                <p className={`text-xl font-black ${selectedStudent.frictionScore >= 55 ? 'text-rose-600' : 'text-orange-700'}`}>
                  {selectedStudent.frictionScore || 0}/100
                </p>
                <p className="text-xs font-semibold text-orange-950 mt-0.5">Friction Score ({selectedStudent.frictionLevel || 'Low'})</p>
              </div>
            </div>

            {/* Cognitive Friction Diagnostic Details */}
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Cognitive Friction Diagnostics</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  selectedStudent.frictionScore >= 75 ? 'bg-rose-600 text-white' :
                  selectedStudent.frictionScore >= 55 ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  State: {selectedStudent.debuggingBehavior || 'Smooth Progress'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Error Loops</p>
                  <p className="text-sm font-bold text-slate-800">{selectedStudent.frictionScore >= 30 ? 'Tracked' : '0 Loops'}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Edit-Run Cycles</p>
                  <p className="text-sm font-bold text-slate-800">Active</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Faculty Action</p>
                  <p className="text-xs font-semibold text-indigo-700">
                    {selectedStudent.isFrictionAlert ? 'Send Guidance Warning' : 'No Action Needed'}
                  </p>
                </div>
              </div>
            </div>

            {raiseDiag && (
              <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-900">RAISE Adaptive Diagnostics</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    raiseDiag.lastAction === 'FACULTY_ALERT' ? 'bg-rose-600 text-white'
                    : raiseDiag.lastAction === 'SUPPORT_NOTIFY' ? 'bg-amber-500 text-white'
                    : raiseDiag.lastAction === 'DELIVER_INTERVENTION' ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {raiseDiag.lastAction || 'WAIT'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Friction S_k</p>
                    <p className="text-sm font-bold text-slate-800">{Number(raiseDiag.S_k || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Momentum M_k</p>
                    <p className="text-sm font-bold text-slate-800">{Number(raiseDiag.M_k || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">HDI</p>
                    <p className="text-sm font-bold text-slate-800">{Number(raiseDiag.HDI || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">P_sr</p>
                    <p className="text-sm font-bold text-slate-800">{Number(raiseDiag.P_sr || 0).toFixed(2)}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-indigo-800">
                  {raiseDiag.stuck ? 'Stagnation detected • ' : ''}{raiseDiag.lastReason || 'No decision yet.'} • Hints: {raiseDiag.hintRequests || 0}
                </p>
              </div>
            )}

            {/* Security & Activity Timeline */}
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">Activity & Security Timeline</h4>
            <div className="space-y-2 mb-6 max-h-44 overflow-y-auto">
              {selectedStudent.securityHistory && selectedStudent.securityHistory.length > 0 ? (
                selectedStudent.securityHistory.map((act, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${act.type && (act.type.includes('EXIT') || act.type.includes('LOGOUT')) ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      <span className={`font-medium ${act.type && (act.type.includes('EXIT') || act.type.includes('LOGOUT')) ? 'text-red-700 font-semibold' : 'text-slate-700'}`}>{act.text}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{act.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No security violations recorded for this student.</p>
              )}
            </div>

            {/* Remote Controls Action Toolbar */}
            <div className="flex gap-3">
              <button 
                onClick={() => handleSendWarning(selectedStudent)}
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition shadow-sm text-xs"
              >
                [!] Send Warning
              </button>

              <button 
                onClick={() => handleToggleWorkspaceLock(selectedStudent)}
                className={`flex-1 text-white py-2.5 rounded-xl font-semibold transition shadow-sm text-xs ${lockedStudents[selectedStudent.email] ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {lockedStudents[selectedStudent.email] ? ' Unlock Workspace' : '[LOCK] Lock Workspace'}
              </button>

              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/proctor/generate-report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ student_id: selectedStudent.name.replace(' ', '_') })
                    });
                    const data = await res.json();
                    if (data.download_url) {
                      window.open(`http://localhost:8000${data.download_url}`, '_blank');
                    } else {
                      alert('PDF report generation complete.');
                    }
                  } catch (e) {
                    alert('Requesting report from InvigiLMNce backend...');
                  }
                }}
                className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-900 transition shadow-sm text-xs"
              >
                [NOTE] PDF Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



