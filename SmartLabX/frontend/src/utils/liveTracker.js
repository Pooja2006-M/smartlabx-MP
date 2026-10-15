import { io } from 'socket.io-client';

// Shared Broadcast Channel for instant zero-latency cross-tab sync in the browser
let channel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('smartlabx-live-channel');
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

// Socket.io client setup for multi-device / multi-browser real-time socket connection
let socket = null;
try {
  socket = io('http://localhost:5000', {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
  });
} catch (e) {
  console.warn('Socket.io connection initialization error:', e);
}

/**
 * Get active tab session user (isolated per tab using sessionStorage first, fallback to localStorage)
 */
export function getTabUser() {
  if (typeof window === 'undefined') return null;
  try {
    const sessionUser = sessionStorage.getItem('smartlabx-user');
    if (sessionUser) return JSON.parse(sessionUser);
    
    const localUser = localStorage.getItem('user');
    if (localUser) return JSON.parse(localUser);

    const labAuth = localStorage.getItem('smartlabx-auth');
    if (labAuth) return JSON.parse(labAuth);
  } catch (e) {
    console.error(e);
  }
  return null;
}

/**
 * Set active tab session user
 */
export function setTabUser(user) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      sessionStorage.setItem('smartlabx-user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('smartlabx-user');
      localStorage.removeItem('user');
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Broadcast Student Live Activity across tabs and sockets
 */
export function trackStudentActivity({ email, name, rollNo, experiment, status, progress, message, currentCode, actionType = 'ACTIVITY' }) {
  if (typeof window === 'undefined') return;

  const currentEmail = email || getTabUser()?.email || 'student@smartlabx.edu';
  const currentName = name || getTabUser()?.name || currentEmail.split('@')[0];
  const timestamp = Date.now();
  const timeFormatted = new Date().toLocaleTimeString();

  const activityPayload = {
    id: `act-${timestamp}-${Math.random().toString(36).substr(2, 4)}`,
    email: currentEmail,
    name: currentName,
    rollNo: rollNo || getTabUser()?.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
    experiment: experiment || 'Lab Workspace',
    status: status || 'Coding',
    progress: typeof progress === 'number' ? progress : 50,
    message: message || 'Active in workspace',
    currentCode: currentCode || '',
    actionType,
    timestamp,
    time: timeFormatted,
  };

  // 1. Update localStorage for persistent tracking
  try {
    const saved = localStorage.getItem('smartlabx-live-activities') || '[]';
    const activities = JSON.parse(saved);
    const updated = [activityPayload, ...activities.filter(a => a.id !== activityPayload.id)].slice(0, 50);
    localStorage.setItem('smartlabx-live-activities', JSON.stringify(updated));
  } catch (e) {
    console.error('Error writing activity to localStorage:', e);
  }

  // 2. Broadcast via BroadcastChannel
  if (channel) {
    try {
      channel.postMessage({ type: 'STUDENT_ACTIVITY', payload: activityPayload });
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }

  // 3. Emit via Socket.io
  if (socket && socket.connected) {
    socket.emit('student-activity', activityPayload);
  }
}

/**
 * Log and broadcast security violations & attack attempts (tab switch, copy-paste, SQL injection, F12)
 */
export function logSecurityEvent({ email, type, message, severity = 'MEDIUM' }) {
  if (typeof window === 'undefined') return;

  const user = getTabUser();
  const currentEmail = email || user?.email || 'student@smartlabx.edu';
  const timestamp = Date.now();
  const timeFormatted = `${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()})`;

  const logPayload = {
    id: timestamp,
    email: currentEmail,
    type: type || 'SECURITY_VIOLATION',
    message: message || 'Security policy event triggered',
    severity,
    time: timeFormatted,
    timestamp
  };

  try {
    const saved = localStorage.getItem('smartlabx-security-logs') || '[]';
    const logs = JSON.parse(saved);
    localStorage.setItem('smartlabx-security-logs', JSON.stringify([logPayload, ...logs].slice(0, 100)));
  } catch (e) {
    console.error(e);
  }

  if (channel) {
    channel.postMessage({ type: 'SECURITY_EVENT', payload: logPayload });
  }

  if (socket && socket.connected) {
    socket.emit('security-event', logPayload);
  }

  // Also update live activity feed
  trackStudentActivity({
    email: currentEmail,
    name: user?.name,
    status: type.includes('EXIT') ? 'Idle' : 'Coding',
    message: `[!] Threat Alert (${severity}): ${message}`,
    actionType: 'SECURITY'
  });
}

/**
 * Log and broadcast AI Questions asked
 */
export function logAiQuestion({ email, question }) {
  if (typeof window === 'undefined') return;

  const user = getTabUser();
  const currentEmail = email || user?.email || 'student@smartlabx.edu';
  const timestamp = Date.now();
  const timeFormatted = new Date().toLocaleTimeString();

  const aiPayload = {
    id: timestamp,
    email: currentEmail,
    question: question,
    time: timeFormatted,
    timestamp
  };

  try {
    const saved = localStorage.getItem('smartlabx-ai-logs') || '[]';
    const logs = JSON.parse(saved);
    localStorage.setItem('smartlabx-ai-logs', JSON.stringify([aiPayload, ...logs].slice(0, 100)));
  } catch (e) {
    console.error(e);
  }

  if (channel) {
    channel.postMessage({ type: 'AI_QUESTION', payload: aiPayload });
  }

  if (socket && socket.connected) {
    socket.emit('ai-question', aiPayload);
  }

  trackStudentActivity({
    email: currentEmail,
    name: user?.name,
    status: 'Coding',
    message: ` Asked AI: "${question.length > 30 ? question.slice(0, 30) + '...' : question}"`,
    actionType: 'AI'
  });
}

/**
 * Raise hand for faculty assistance
 */
export function raiseStudentHand({ email, name, message }) {
  if (typeof window === 'undefined') return;
  const user = getTabUser();
  const currentEmail = email || user?.email || 'student@smartlabx.edu';
  const currentName = name || user?.name || 'Student';

  trackStudentActivity({
    email: currentEmail,
    name: currentName,
    status: 'Idle',
    message: ` Raised Hand: ${message || 'Needs help with experiment!'}`,
    actionType: 'HAND_RAISE'
  });
}

/**
 * Lock or Unlock student workspace remotely from Staff Monitor
 */
export function lockStudentWorkspace({ targetEmail, isLocked, reason }) {
  if (typeof window === 'undefined') return;

  const timestamp = Date.now();
  const lockPayload = {
    targetEmail: targetEmail || '',
    isLocked: !!isLocked,
    reason: reason || 'Locked by Faculty Instructor due to security compliance review.',
    sender: 'Faculty Monitor',
    timestamp
  };

  try {
    localStorage.setItem('smartlabx-workspace-lock', JSON.stringify(lockPayload));
  } catch (e) {
    console.error(e);
  }

  if (channel) {
    channel.postMessage({ type: 'WORKSPACE_LOCK', payload: lockPayload });
  }

  if (socket && socket.connected) {
    socket.emit('workspace-lock', lockPayload);
  }
}

/**
 * Broadcast announcement message from Staff to all active students
 */
export function broadcastAnnouncement({ title, message, sender }) {
  if (typeof window === 'undefined') return;

  const timestamp = Date.now();
  const announcementPayload = {
    id: `ann-${timestamp}`,
    title: title || 'Faculty Announcement',
    message: message || 'Please pay attention to lab instructions.',
    sender: sender || 'Dr. Alan Turing',
    timestamp
  };

  try {
    localStorage.setItem('smartlabx-class-announcement', JSON.stringify(announcementPayload));
  } catch (e) {
    console.error(e);
  }

  if (channel) {
    channel.postMessage({ type: 'CLASS_ANNOUNCEMENT', payload: announcementPayload });
  }

  if (socket && socket.connected) {
    socket.emit('class-announcement', announcementPayload);
  }
}

/**
 * Send warning message from Staff to a Student tab
 */
export function sendStaffWarning({ targetEmail, studentName, message, sender }) {
  if (typeof window === 'undefined') return;

  const timestamp = Date.now();
  const warningPayload = {
    targetEmail: targetEmail || '',
    studentName: studentName || 'Student',
    message: message || 'Please adhere to lab rules.',
    sender: sender || 'Faculty Monitor',
    timestamp
  };

  try {
    localStorage.setItem('smartlabx-staff-warning', JSON.stringify(warningPayload));
  } catch (e) {
    console.error(e);
  }

  if (channel) {
    channel.postMessage({ type: 'STAFF_WARNING', payload: warningPayload });
  }

  if (socket && socket.connected) {
    socket.emit('send-warning', warningPayload);
  }
}

/**
 * Subscribe to live updates (for Staff Live Monitor)
 */
export function subscribeToLiveUpdates(onUpdateCallback) {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event) => {
    if (event.data) {
      onUpdateCallback(event.data);
    }
  };

  const handleStorage = (event) => {
    if (['smartlabx-live-activities', 'smartlabx-security-logs', 'smartlabx-ai-logs', 'smartlabx-students'].includes(event.key)) {
      onUpdateCallback({ type: 'STORAGE_CHANGE', key: event.key });
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }

  window.addEventListener('storage', handleStorage);

  let socketHandler = null;
  if (socket) {
    socketHandler = (data) => onUpdateCallback({ type: 'SOCKET_UPDATE', payload: data });
    socket.on('live-student-activity', socketHandler);
    socket.on('security-event', socketHandler);
    socket.on('ai-question', socketHandler);
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
    if (socket && socketHandler) {
      socket.off('live-student-activity', socketHandler);
      socket.off('security-event', socketHandler);
      socket.off('ai-question', socketHandler);
    }
  };
}

/**
 * Subscribe to incoming staff warnings (for Student Tabs)
 */
export function subscribeToStaffWarnings(onWarningCallback) {
  if (typeof window === 'undefined') return () => {};

  let lastWarningTime = 0;

  const checkWarningPayload = (payload) => {
    if (!payload || !payload.timestamp || payload.timestamp <= lastWarningTime) return;
    const currentTabUser = getTabUser();
    if (!payload.targetEmail || !currentTabUser?.email || payload.targetEmail.toLowerCase() === currentTabUser.email.toLowerCase()) {
      lastWarningTime = payload.timestamp;
      onWarningCallback(payload);
    }
  };

  const handleMessage = (event) => {
    if (event.data && event.data.type === 'STAFF_WARNING') {
      checkWarningPayload(event.data.payload);
    }
  };

  const handleStorage = (event) => {
    if (event.key === 'smartlabx-staff-warning' && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        checkWarningPayload(payload);
      } catch (e) {}
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }

  window.addEventListener('storage', handleStorage);

  if (socket) {
    socket.on('receive-staff-warning', checkWarningPayload);
  }

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    if (socket) socket.off('receive-staff-warning', checkWarningPayload);
  };
}

/**
 * Subscribe to remote workspace lock commands
 */
export function subscribeToWorkspaceLock(onLockCallback) {
  if (typeof window === 'undefined') return () => {};

  let lastLockTime = 0;

  const checkLockPayload = (payload) => {
    if (!payload || !payload.timestamp || payload.timestamp <= lastLockTime) return;
    const currentTabUser = getTabUser();
    if (!payload.targetEmail || !currentTabUser?.email || payload.targetEmail.toLowerCase() === currentTabUser.email.toLowerCase()) {
      lastLockTime = payload.timestamp;
      onLockCallback(payload);
    }
  };

  const handleMessage = (event) => {
    if (event.data && event.data.type === 'WORKSPACE_LOCK') {
      checkLockPayload(event.data.payload);
    }
  };

  const handleStorage = (event) => {
    if (event.key === 'smartlabx-workspace-lock' && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        checkLockPayload(payload);
      } catch (e) {}
    }
  };

  if (channel) channel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);
  if (socket) socket.on('workspace-lock', checkLockPayload);

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    if (socket) socket.off('workspace-lock', checkLockPayload);
  };
}

/**
 * Subscribe to broadcast announcements
 */
export function subscribeToAnnouncements(onAnnouncementCallback) {
  if (typeof window === 'undefined') return () => {};

  let lastAnnTime = 0;

  const checkAnnouncementPayload = (payload) => {
    if (!payload || !payload.timestamp || payload.timestamp <= lastAnnTime) return;
    lastAnnTime = payload.timestamp;
    onAnnouncementCallback(payload);
  };

  const handleMessage = (event) => {
    if (event.data && event.data.type === 'CLASS_ANNOUNCEMENT') {
      checkAnnouncementPayload(event.data.payload);
    }
  };

  const handleStorage = (event) => {
    if (event.key === 'smartlabx-class-announcement' && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        checkAnnouncementPayload(payload);
      } catch (e) {}
    }
  };

  if (channel) channel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);
  if (socket) socket.on('class-announcement', checkAnnouncementPayload);

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    if (socket) socket.off('class-announcement', checkAnnouncementPayload);
  };
}

// ─────────────────────────────────────────────────────────────
// LAB SCHEDULE FUNCTIONS (New — do not disturb above functions)
// Staff sets weekly lab schedule; students auto-track per lab day
// ─────────────────────────────────────────────────────────────

const DEFAULT_LAB_SCHEDULE = {
  Monday:    { subject: 'DBMS Lab',              subjectCode: 'CS301', room: 'Lab 1' },
  Wednesday: { subject: 'Computer Networks Lab', subjectCode: 'CS302', room: 'Lab 2' },
  Friday:    { subject: 'Operating Systems Lab', subjectCode: 'CS303', room: 'Lab 3' },
};

/**
 * Staff saves the weekly lab schedule (day → subject mapping)
 * @param {Object} schedule  e.g. { Monday: { subject, subjectCode, room }, ... }
 */
export function saveLabSchedule(schedule) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('smartlabx-lab-schedule', JSON.stringify(schedule));
    if (channel) {
      channel.postMessage({ type: 'LAB_SCHEDULE_UPDATED', payload: schedule });
    }
  } catch (e) {
    console.error('Error saving lab schedule:', e);
  }
}

/**
 * Read the saved weekly lab schedule
 * @returns {Object}  Day-keyed schedule object
 */
export function getLabSchedule() {
  if (typeof window === 'undefined') return DEFAULT_LAB_SCHEDULE;
  try {
    const saved = localStorage.getItem('smartlabx-lab-schedule');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading lab schedule:', e);
  }
  return DEFAULT_LAB_SCHEDULE;
}

/**
 * Returns today's lab info if today is a scheduled lab day, otherwise null.
 * @returns {{ day, subject, subjectCode, room } | null}
 */
export function getTodaysLab() {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = DAYS[new Date().getDay()];
  const schedule = getLabSchedule();
  if (schedule[today]) {
    return { day: today, ...schedule[today] };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// COGNITIVE FRICTION DETECTION SYSTEM (NEW)
// Track repeated errors, idle time, edit-run cycles, debugging behavior,
// friction score (0-100), and threshold-based faculty alerts.
// ─────────────────────────────────────────────────────────────

/**
 * Calculates Cognitive Friction Score (0 - 100) & Level
 */
export function calculateCognitiveFrictionScore(metrics = {}) {
  const repeatedErrors = metrics.repeatedErrorsCount || 0;
  const consecutiveFails = metrics.consecutiveFails || 0;
  const idleSeconds = metrics.idleSeconds || 0;
  const editRunCycles = metrics.editRunCycles || 0;
  const totalErrors = metrics.errorCount || 0;
  const aiHints = metrics.aiHintsUsed || 0;

  // Weight components
  const repeatedErrorScore = Math.min(35, repeatedErrors * 15);
  const consecutiveFailScore = Math.min(25, consecutiveFails * 10);
  const idleScore = Math.min(20, Math.floor(idleSeconds / 90) * 5);
  const cycleScore = editRunCycles > 5 && consecutiveFails > 2 ? 15 : Math.min(15, editRunCycles * 2);
  const hintsScore = Math.min(10, aiHints * 3);

  const rawScore = repeatedErrorScore + consecutiveFailScore + idleScore + cycleScore + hintsScore;
  const frictionScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let level = 'Low';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let isAlert = false;

  if (frictionScore >= 75) {
    level = 'Critical';
    badgeColor = 'bg-rose-600 text-white border-rose-700 animate-pulse';
    isAlert = true;
  } else if (frictionScore >= 55) {
    level = 'High';
    badgeColor = 'bg-amber-500 text-white border-amber-600';
    isAlert = true;
  } else if (frictionScore >= 30) {
    level = 'Moderate';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  }

  // Debugging behavior rating
  let debuggingBehavior = 'Smooth Progress';
  if (consecutiveFails >= 3 && repeatedErrors > 0) {
    debuggingBehavior = 'Stuck in Error Loop';
  } else if (editRunCycles >= 6) {
    debuggingBehavior = 'High Iteration / Trial-and-Error';
  } else if (idleSeconds >= 300) {
    debuggingBehavior = 'Prolonged Stagnation';
  } else if (totalErrors > 0) {
    debuggingBehavior = 'Active Debugging';
  }

  return {
    frictionScore,
    level,
    badgeColor,
    isAlert,
    debuggingBehavior,
    breakdown: {
      repeatedErrorScore,
      consecutiveFailScore,
      idleScore,
      cycleScore,
      hintsScore
    }
  };
}

/**
 * Log student code edit event & update cycle stats
 */
export function logStudentCodeEdit(email, studentName = '') {
  if (typeof window === 'undefined') return;
  const currentEmail = email || getTabUser()?.email || 'student@smartlabx.edu';
  const records = getAllCognitiveFrictionRecords();
  const current = records[currentEmail] || {
    email: currentEmail,
    name: studentName || getTabUser()?.name || currentEmail.split('@')[0],
    editEvents: 0,
    runEvents: 0,
    editRunCycles: 0,
    idleSeconds: 0,
    lastEditTime: Date.now(),
    lastRunTime: 0,
    errorCount: 0,
    consecutiveFails: 0,
    repeatedErrors: {},
    repeatedErrorsCount: 0,
    lastErrorMessage: ''
  };

  const now = Date.now();
  current.editEvents += 1;
  current.lastEditTime = now;

  // Track Edit -> Run cycle transition
  if (current.lastRunTime > 0 && now - current.lastRunTime < 180000) {
    current.editRunCycles += 1;
  }

  records[currentEmail] = current;
  saveCognitiveFrictionRecords(records);
}

/**
 * Log student execution run attempt and analyze error loops
 */
export function logStudentRunAttempt(email, { success = true, errorMessage = '', query = '', studentName = '' }) {
  if (typeof window === 'undefined') return;
  const currentEmail = email || getTabUser()?.email || 'student@smartlabx.edu';
  const records = getAllCognitiveFrictionRecords();
  const current = records[currentEmail] || {
    email: currentEmail,
    name: studentName || getTabUser()?.name || currentEmail.split('@')[0],
    editEvents: 0,
    runEvents: 0,
    editRunCycles: 0,
    idleSeconds: 0,
    lastEditTime: 0,
    lastRunTime: Date.now(),
    errorCount: 0,
    consecutiveFails: 0,
    repeatedErrors: {},
    repeatedErrorsCount: 0,
    lastErrorMessage: ''
  };

  current.runEvents += 1;
  current.lastRunTime = Date.now();

  if (!success && errorMessage) {
    current.errorCount += 1;
    current.consecutiveFails += 1;

    // Deduplicate & hash error string
    const normalizedErr = errorMessage.trim().toLowerCase().slice(0, 100);
    current.repeatedErrors = current.repeatedErrors || {};
    current.repeatedErrors[normalizedErr] = (current.repeatedErrors[normalizedErr] || 0) + 1;

    if (current.repeatedErrors[normalizedErr] > 1) {
      current.repeatedErrorsCount += 1;
    }

    current.lastErrorMessage = errorMessage;
  } else if (success) {
    current.consecutiveFails = 0; // reset consecutive fails on success
  }

  // Calculate new friction score
  const frictionAnalysis = calculateCognitiveFrictionScore(current);
  current.frictionScore = frictionAnalysis.frictionScore;
  current.frictionLevel = frictionAnalysis.level;
  current.debuggingBehavior = frictionAnalysis.debuggingBehavior;
  current.lastUpdated = new Date().toLocaleTimeString();

  records[currentEmail] = current;
  saveCognitiveFrictionRecords(records);

  // Broadcast friction alert if score is High or Critical
  if (frictionAnalysis.isAlert) {
    const alertPayload = {
      type: 'COGNITIVE_FRICTION_ALERT',
      email: currentEmail,
      studentName: current.name,
      score: current.frictionScore,
      level: current.frictionLevel,
      reason: `High cognitive friction detected (${current.debuggingBehavior})`,
      timestamp: Date.now()
    };
    if (channel) {
      try { channel.postMessage(alertPayload); } catch (e) {}
    }
    if (socket && socket.connected) {
      socket.emit('cognitive-friction-alert', alertPayload);
    }
  }

  return frictionAnalysis;
}

/**
 * Get stored cognitive friction record for a specific student
 */
export function getCognitiveFrictionData(email) {
  const records = getAllCognitiveFrictionRecords();
  return records[email] || null;
}

/**
 * Get all student cognitive friction records
 */
export function getAllCognitiveFrictionRecords() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem('smartlabx-cognitive-friction');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save cognitive friction dictionary to localStorage & broadcast update
 */

function saveCognitiveFrictionRecords(records) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('smartlabx-cognitive-friction', JSON.stringify(records));
    if (channel) {
      channel.postMessage({ type: 'COGNITIVE_FRICTION_UPDATED', payload: records });
    }
  } catch (e) {
    console.error('Error saving cognitive friction:', e);
  }
}

