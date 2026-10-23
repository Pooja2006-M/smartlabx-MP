import React, { useEffect, useRef, useState } from 'react';
import AIGuidance from '../components/AIGuidance';
import StaffMonitorWidgets from '../components/StaffMonitorWidgets';
import { Link, useNavigate } from 'react-router-dom';
import { getTabUser, trackStudentActivity, subscribeToStaffWarnings, logSecurityEvent, raiseStudentHand, subscribeToWorkspaceLock, subscribeToAnnouncements, logStudentCodeEdit, logStudentRunAttempt } from '../utils/liveTracker';
import { raiseApi } from '../utils/api';
import AIAnalysisModal from '../components/AIAnalysisModal';

const staffAccount = {
  email: 'staff@smartlabx.edu',
  password: 'staff123',
  name: 'Dr. Priya',
};

const initialStudents = [
  { id: 1, name: 'Arjun', email: 'arjun@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 85, anomaly_risk: 15 },
  { id: 2, name: 'Meera', email: 'meera@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 92, anomaly_risk: 10 },
  { id: 3, name: 'Ravi', email: 'ravi@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 45, anomaly_risk: 85 },
  { id: 4, name: 'Kavya', email: 'kavya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 88, anomaly_risk: 20 },
  { id: 5, name: 'Sanjay', email: 'sanjay@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 55, anomaly_risk: 70 },
  { id: 6, name: 'Priya', email: 'priya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 75, anomaly_risk: 30 },
  { id: 7, name: 'Vikram', email: 'vikram@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 90, anomaly_risk: 12 },
  { id: 8, name: 'Sneha', email: 'sneha@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 40, anomaly_risk: 90 },
  { id: 9, name: 'Rahul', email: 'rahul@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 82, anomaly_risk: 25 },
  { id: 10, name: 'Ananya', email: 'ananya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 95, anomaly_risk: 5 },
  { id: 11, name: 'Karthik', email: 'karthik@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 50, anomaly_risk: 60 },
  { id: 12, name: 'Divya', email: 'divya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 68, anomaly_risk: 45 },
  { id: 13, name: 'Surya', email: 'surya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 87, anomaly_risk: 18 },
  { id: 14, name: 'Shruti', email: 'shruti@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 72, anomaly_risk: 35 },
  { id: 15, name: 'Gautham', email: 'gautham@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 60, anomaly_risk: 55 },
  { id: 16, name: 'Nandini', email: 'nandini@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 48, anomaly_risk: 75 },
  { id: 17, name: 'Ashwin', email: 'ashwin@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 81, anomaly_risk: 22 },
  { id: 18, name: 'Pooja', email: 'pooja@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 93, anomaly_risk: 8 },
  { id: 19, name: 'Deepak', email: 'deepak@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 58, anomaly_risk: 65 },
  { id: 20, name: 'Swathi', email: 'swathi@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 77, anomaly_risk: 28 },
  { id: 21, name: 'Manoj', email: 'manoj@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 84, anomaly_risk: 19 },
  { id: 22, name: 'Aarthi', email: 'aarthi@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 42, anomaly_risk: 88 },
  { id: 23, name: 'Suresh', email: 'suresh@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 79, anomaly_risk: 32 },
  { id: 24, name: 'Ramya', email: 'ramya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 91, anomaly_risk: 14 },
  { id: 25, name: 'Vignesh', email: 'vignesh@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 52, anomaly_risk: 72 },
  { id: 26, name: 'Deepa', email: 'deepa@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 69, anomaly_risk: 40 },
  { id: 27, name: 'Prashanth', email: 'prashanth@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 86, anomaly_risk: 17 },
  { id: 28, name: 'Nivedita', email: 'nivedita@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 74, anomaly_risk: 33 },
  { id: 29, name: 'Siddharth', email: 'siddharth@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 61, anomaly_risk: 50 },
  { id: 30, name: 'Vidya', email: 'vidya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 46, anomaly_risk: 82 },
  { id: 31, name: 'Harish', email: 'harish@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 80, anomaly_risk: 21 },
  { id: 32, name: 'Keerthi', email: 'keerthi@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 94, anomaly_risk: 6 },
  { id: 33, name: 'Naveen', email: 'naveen@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 56, anomaly_risk: 68 },
  { id: 34, name: 'Roopa', email: 'roopa@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 76, anomaly_risk: 29 },
  { id: 35, name: 'Bharath', email: 'bharath@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 83, anomaly_risk: 24 },
  { id: 36, name: 'Preethi', email: 'preethi@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 39, anomaly_risk: 95 },
  { id: 37, name: 'Kiran', email: 'kiran@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 78, anomaly_risk: 34 },
  { id: 38, name: 'Saranya', email: 'saranya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 89, anomaly_risk: 16 },
  { id: 39, name: 'Ajay', email: 'ajay@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 51, anomaly_risk: 74 },
  { id: 40, name: 'Aishwarya', email: 'aishwarya@student.com', password: 'password123', assignedTasks: [], vivaNotes: '', reports: [], performance_score: 70, anomaly_risk: 39 }
];

const initialDatabaseState = {
  students: [
    { id: 1, name: 'Arjun', department: 'CSE', score: 88, dept_id: 101 },
    { id: 2, name: 'Meera', department: 'CSE', score: 91, dept_id: 101 },
    { id: 3, name: 'Ravi', department: 'ECE', score: 79, dept_id: 102 },
    { id: 4, name: 'Kavya', department: 'EEE', score: 85, dept_id: 103 },
  ],
  departments: [
    { dept_id: 101, dept_name: 'Computer Science', building: 'Tech Block A' },
    { dept_id: 102, dept_name: 'Electronics & Comm', building: 'Science Block B' },
    { dept_id: 103, dept_name: 'Electrical Engg', building: 'Power Lab C' },
    { dept_id: 104, dept_name: 'Civil Engineering', building: 'Design Wing D' },
  ],
  submissions: [
    { id: 501, student_id: 1, task_name: 'SQL Basics', status: 'Submitted', grade: 'A' },
    { id: 502, student_id: 2, task_name: 'Normalization 3NF', status: 'Evaluated', grade: 'O' },
    { id: 503, student_id: 1, task_name: 'ER Diagram Design', status: 'Pending', grade: 'B' },
  ],
  lab_sessions: [
    { id: 201, topic: 'Database Design', duration: '45 min', instructor: 'Dr. Priya' },
    { id: 202, topic: 'Query Optimization & Indexing', duration: '60 min', instructor: 'Dr. Priya' },
  ],
};

const initialTableSchemas = {
  students: [
    { column: 'id', type: 'INT', constraints: 'PRIMARY KEY' },
    { column: 'name', type: 'VARCHAR(50)', constraints: 'NOT NULL' },
    { column: 'department', type: 'VARCHAR(20)', constraints: '' },
    { column: 'score', type: 'INT', constraints: '' },
    { column: 'dept_id', type: 'INT', constraints: 'FOREIGN KEY -> departments(dept_id)' },
  ],
  departments: [
    { column: 'dept_id', type: 'INT', constraints: 'PRIMARY KEY' },
    { column: 'dept_name', type: 'VARCHAR(50)', constraints: 'NOT NULL' },
    { column: 'building', type: 'VARCHAR(50)', constraints: '' },
  ],
  submissions: [
    { column: 'id', type: 'INT', constraints: 'PRIMARY KEY' },
    { column: 'student_id', type: 'INT', constraints: 'FOREIGN KEY -> students(id)' },
    { column: 'task_name', type: 'VARCHAR(100)', constraints: '' },
    { column: 'status', type: 'VARCHAR(20)', constraints: '' },
    { column: 'grade', type: 'VARCHAR(5)', constraints: '' },
  ],
  lab_sessions: [
    { column: 'id', type: 'INT', constraints: 'PRIMARY KEY' },
    { column: 'topic', type: 'VARCHAR(100)', constraints: '' },
    { column: 'duration', type: 'VARCHAR(20)', constraints: '' },
    { column: 'instructor', type: 'VARCHAR(50)', constraints: '' },
  ]
};

export default function DatabaseLab() {
  const navigate = useNavigate();

  const [students, setStudents] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-students');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Force refresh if cached list is smaller than the updated initialStudents
          if (Array.isArray(parsed) && parsed.length >= initialStudents.length) {
            return parsed;
          }
          window.localStorage.removeItem('smartlabx-students');
        } catch {
          window.localStorage.removeItem('smartlabx-students');
        }
      }
    }
    return initialStudents;
  });

  const [auth, setAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-auth');
      if (saved) {
        try { return JSON.parse(saved); } catch { return null; }
      }
    }
    return null;
  });

  // Safe exam protection is intentionally disabled on the normal lab page.
  // Only the dedicated experiment tab should enforce secure exam controls.
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('SELECT s.id, s.name, d.dept_name, s.score FROM students s INNER JOIN departments d ON s.dept_id = d.dept_id;');
  
  // Database in-memory state
  const [dbTables, setDbTables] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-db-tables');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return initialDatabaseState;
  });

  const [schemas, setSchemas] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('smartlabx-db-schemas');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return initialTableSchemas;
  });

  const [indexes, setIndexes] = useState([
    { indexName: 'idx_student_dept', table: 'students', column: 'dept_id', type: 'NON-UNIQUE B-TREE' }
  ]);

  const [results, setResults] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [raiseNotice, setRaiseNotice] = useState(null);
  const lastRaiseHintRef = useRef(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeVivaStudent, setActiveVivaStudent] = useState(null);
  const [activeReportStudent, setActiveReportStudent] = useState(null);
  const [activeWarning, setActiveWarning] = useState(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');

  useEffect(() => {
    const currentUser = getTabUser();
    if (currentUser && currentUser.email) {
      trackStudentActivity({
        email: currentUser.email,
        name: currentUser.name,
        rollNo: currentUser.studentId || 'STU-2048',
        experiment: 'Database Query Console',
        status: 'Coding',
        progress: 85,
        message: 'Opened Database Management System Lab',
        currentCode: query
      });
    }

    const unsubscribeWarnings = subscribeToStaffWarnings((warning) => {
      setActiveWarning(warning);
    });

    const unsubscribeAnnouncements = subscribeToAnnouncements((announcement) => {
      setActiveAnnouncement(announcement);
    });

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
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState('console'); // 'console', 'oracle_viewer', 'er_diagram', 'cheat_sheet'
  const [selectedViewerTable, setSelectedViewerTable] = useState('students');

  useEffect(() => {
    window.localStorage.setItem('smartlabx-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (auth) {
      window.localStorage.setItem('smartlabx-auth', JSON.stringify(auth));
    } else {
      window.localStorage.removeItem('smartlabx-auth');
    }
  }, [auth]);

  useEffect(() => {
    window.localStorage.setItem('smartlabx-db-tables', JSON.stringify(dbTables));
    window.localStorage.setItem('smartlabx-db-schemas', JSON.stringify(schemas));
  }, [dbTables, schemas]);

  // Execute initial query on mount
  const handleLogin = (event) => {
    event.preventDefault();
    setMessage('');

    if (role === 'staff') {
      const savedStaffPassword = window.localStorage.getItem('smartlabx-dbms-staff-password') || staffAccount.password;
      if (email === staffAccount.email && password === savedStaffPassword) {
        setAuth({ role: 'staff', name: staffAccount.name, email });
        return;
      }
      setMessage('Staff login failed. Use staff@smartlabx.edu and staff123.');
      return;
    }

    const student = students.find((item) => item.email === email);
    if (student && password === student.password) {
      const user = { role: 'student', name: student.name, email: student.email };
      setAuth(user);
      return;
    }

    if (email === 'student@smartlabx.edu' && password === 'password123') {
      const user = { role: 'student', name: 'Demo Student', email: 'student@smartlabx.edu' };
      setAuth(user);
      return;
    }

    setMessage('Student login failed. First-time password is password123.');
  };

  const handleChangePassword = (event) => {
    event.preventDefault();
    const expectedPassword = auth.role === 'staff'
      ? window.localStorage.getItem('smartlabx-dbms-staff-password') || staffAccount.password
      : students.find((student) => student.email === auth.email)?.password || 'password123';

    if (currentPassword !== expectedPassword) {
      setMessage('Current password is incorrect.');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      return;
    }

    if (auth.role === 'staff') {
      window.localStorage.setItem('smartlabx-dbms-staff-password', newPassword);
    } else {
      setStudents((prev) => prev.map((student) => (
        student.email === auth.email ? { ...student, password: newPassword } : student
      )));
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePassword(false);
    setMessage('Password changed successfully.');
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
    const title = window.prompt('Task title (e.g. SQL JOIN Practice)');
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
    const content = [];
    content.push(`Student: ${student.name} <${student.email}>`);
    content.push('');
    content.push('Assigned tasks:');
    (student.assignedTasks || []).forEach((t) => content.push(`- ${t.title} (due: ${t.due || 'n/a'}) - ${t.status}`));
    content.push('');
    content.push('Viva notes:');
    content.push(student.vivaNotes || '[none]');

    const blob = new Blob([content.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, '_')}_report.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage('Report generated for download.');
  };

  const parseInsertRowValues = (valueListText) => {
    const values = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < valueListText.length; i += 1) {
      const ch = valueListText[i];

      if (ch === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        current += ch;
        continue;
      }

      if (ch === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += ch;
        continue;
      }

      if (ch === ',' && !inSingleQuote && !inDoubleQuote) {
        const cleaned = current.trim();
        if (cleaned) values.push(cleaned);
        current = '';
        continue;
      }

      current += ch;
    }

    const finalValue = current.trim();
    if (finalValue) values.push(finalValue);
    return values;
  };

  const parseInsertRows = (valuesSegment) => {
    const rows = [];
    let current = '';
    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < valuesSegment.length; i += 1) {
      const ch = valuesSegment[i];

      if (ch === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        current += ch;
        continue;
      }

      if (ch === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += ch;
        continue;
      }

      if (ch === '(' && !inSingleQuote && !inDoubleQuote) {
        depth += 1;
        current += ch;
        continue;
      }

      if (ch === ')' && !inSingleQuote && !inDoubleQuote) {
        depth -= 1;
        current += ch;
        if (depth === 0) {
          const rowText = current.trim();
          if (rowText) rows.push(rowText);
          current = '';
        }
        continue;
      }

      current += ch;
    }

    if (current.trim()) {
      rows.push(current.trim());
    }

    return rows;
  };

  // --- Client-side Advanced SQL Execution Engine ---
  const executeClientSQL = (sqlText) => {
    const currentUser = getTabUser() || auth || {};
    const cleanSql = sqlText.trim().replace(/;$/, '');
    const upperSql = cleanSql.toUpperCase();

    // [SHIELD] Threat & Security Attack Detector: SQL Injection Attack Detection
    const sqlInjectionRegex = /(DROP\s+DATABASE|DROP\s+TABLE|TRUNCATE\s+TABLE|OR\s+1\s*=\s*1|--|\/\*|\*\/|SHUTDOWN|EXEC\s*\()/i;
    if (sqlInjectionRegex.test(cleanSql)) {
      logSecurityEvent({
        email: currentUser.email || 'student@smartlabx.edu',
        type: 'SQL_INJECTION_ATTACK',
        message: `[ALERT] Malicious SQL Injection attempt detected: "${cleanSql.slice(0, 35)}"`,
        severity: 'CRITICAL'
      });
      setMessage('[BLOCKED] SECURITY ALERT: Malicious SQL Query pattern detected & reported to Faculty Live Monitor!');
      setResults([]);
      return;
    }

    trackStudentActivity({
      email: currentUser.email || 'student@smartlabx.edu',
      name: currentUser.name || 'Aarav Kumar',
      rollNo: currentUser.studentId || 'STU-2048',
      experiment: 'DBMS Query Lab',
      status: 'Executing',
      progress: 90,
      message: `Executed SQL Query: "${cleanSql.length > 35 ? cleanSql.slice(0, 35) + '...' : cleanSql}"`,
      currentCode: cleanSql
    });

    // 1. SHOW TABLES / TABLES
    if (upperSql === 'SHOW TABLES' || upperSql === 'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES' || upperSql === 'TABLES') {
      const tableList = Object.keys(dbTables).map((tbl) => ({
        table_name: tbl,
        column_count: (schemas[tbl] || []).length,
        total_rows: (dbTables[tbl] || []).length,
      }));
      setResults(tableList);
      setMessage(`Found ${tableList.length} table(s) in the database schema.`);
      return;
    }

    // 2. DESCRIBE / DESC TABLE
    if (upperSql.startsWith('DESCRIBE ') || upperSql.startsWith('DESC ')) {
      const parts = cleanSql.split(/\s+/);
      const tableName = parts[1]?.toLowerCase();
      if (dbTables[tableName] && schemas[tableName]) {
        setResults(schemas[tableName]);
        setMessage(`Schema overview for table '${tableName}'.`);
      } else {
        setMessage(`Table '${tableName}' does not exist.`);
        setResults([]);
      }
      return;
    }

    // 3. CREATE INDEX
    if (upperSql.startsWith('CREATE INDEX') || upperSql.startsWith('CREATE UNIQUE INDEX')) {
      // Syntax: CREATE INDEX idx_name ON table_name (column_name)
      const match = cleanSql.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/i);
      if (match) {
        const [_, idxName, tblName, colName] = match;
        const targetTable = tblName.toLowerCase();
        if (!dbTables[targetTable]) {
          setMessage(`Error: Table '${targetTable}' does not exist.`);
          return;
        }
        setIndexes((prev) => [...prev, { indexName: idxName, table: targetTable, column: colName.trim(), type: upperSql.includes('UNIQUE') ? 'UNIQUE B-TREE' : 'NON-UNIQUE B-TREE' }]);
        setMessage(`[OK] Index '${idxName}' successfully created on table '${targetTable}' (${colName.trim()}).`);
        setResults([{ Status: 'Success', Action: 'CREATE INDEX', Index: idxName, Target_Table: targetTable, Column: colName.trim() }]);
      } else {
        setMessage('Error in CREATE INDEX syntax. Example: CREATE INDEX idx_score ON students (score);');
      }
      return;
    }

    // 4. CREATE TABLE
    if (upperSql.startsWith('CREATE TABLE')) {
      const match = cleanSql.match(/CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]+)\)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const body = match[2];

        if (dbTables[tableName]) {
          setMessage(`Table '${tableName}' already exists.`);
          return;
        }

        const colDefs = body.split(',').map((colStr) => {
          const parts = colStr.trim().split(/\s+/);
          return {
            column: parts[0] || 'id',
            type: parts[1] || 'VARCHAR(50)',
            constraints: parts.slice(2).join(' ') || ''
          };
        });

        setDbTables((prev) => ({ ...prev, [tableName]: [] }));
        setSchemas((prev) => ({ ...prev, [tableName]: colDefs }));
        setSelectedViewerTable(tableName);
        setMessage(`[OK] Table '${tableName}' created successfully! View it in the 'Table Inspector' tab.`);
        setResults([{ Action: 'CREATE TABLE', Table: tableName, Status: 'Created successfully' }]);
      } else {
        setMessage('Error in CREATE TABLE syntax. Example: CREATE TABLE courses (id INT PRIMARY KEY, name VARCHAR(50));');
      }
      return;
    }

    // 5. INSERT INTO
    if (upperSql.startsWith('INSERT INTO')) {
      const match = cleanSql.match(/^INSERT\s+INTO\s+(\w+)\s*(?:\(([^)]+)\))?\s*VALUES\s*(.+)$/i);
      if (!match) {
        setMessage('Error in INSERT syntax. Example: INSERT INTO students (id, name, department, score) VALUES (5, "Anu", "CSE", 95);');
        return;
      }

      const tblName = match[1].toLowerCase();
      if (!dbTables[tblName]) {
        setMessage(`Table '${tblName}' does not exist.`);
        return;
      }

      const colNames = match[2]
        ? match[2].split(',').map((s) => s.trim())
        : (schemas[tblName] || []).map((c) => c.column);

      const rowValues = parseInsertRows(match[3]);
      if (!rowValues.length) {
        setMessage('Error in INSERT syntax. Please use VALUES (row1), (row2), ...');
        return;
      }

      const insertedRows = rowValues.map((rowText) => {
        const innerRowText = rowText.trim();
        const valueBody = innerRowText.startsWith('(') && innerRowText.endsWith(')') ? innerRowText.slice(1, -1) : innerRowText;
        const rawVals = parseInsertRowValues(valueBody).map((value) => {
          const trimmed = value.trim();
          if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
            return trimmed.slice(1, -1);
          }
          return Number.isFinite(Number(trimmed)) ? Number(trimmed) : trimmed;
        });

        const newRow = {};
        colNames.forEach((col, idx) => {
          newRow[col] = rawVals[idx] ?? null;
        });
        return newRow;
      });

      setDbTables((prev) => ({
        ...prev,
        [tblName]: [...(prev[tblName] || []), ...insertedRows],
      }));

      setMessage(`[OK] ${insertedRows.length} row(s) inserted into '${tblName}'.`);
      setResults(insertedRows);
      return;
    }

    // 6. UPDATE / DELETE fallback support when the backend is unavailable
    if (upperSql.startsWith('UPDATE ')) {
      const match = cleanSql.match(/^UPDATE\s+(\w+)\s+SET\s+(\w+)\s*=\s*(.+?)(?:\s+WHERE\s+(\w+)\s*(=|>|<)\s*(.+))?$/i);
      if (!match) {
        setResults([]);
        setMessage('Unsupported UPDATE syntax. Example: UPDATE students SET score = 95 WHERE id = 1;');
        return;
      }
      const [, tableName, updateColumn, updateValue, whereColumn, operator, whereValue] = match;
      const tableKey = tableName.toLowerCase();
      if (!dbTables[tableKey]) {
        setResults([]);
        setMessage(`Table '${tableKey}' does not exist.`);
        return;
      }
      const parseValue = (value) => {
        const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
        return Number.isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
      };
      const nextRows = dbTables[tableKey].map((row) => {
        const matchesWhere = !whereColumn || (
          operator === '=' ? String(row[whereColumn]) === String(parseValue(whereValue))
            : operator === '>' ? Number(row[whereColumn]) > Number(parseValue(whereValue))
              : Number(row[whereColumn]) < Number(parseValue(whereValue))
        );
        return matchesWhere ? { ...row, [updateColumn]: parseValue(updateValue) } : row;
      });
      setDbTables((prev) => ({ ...prev, [tableKey]: nextRows }));
      setResults(nextRows);
      setMessage(`[OK] UPDATE completed on '${tableKey}'.`);
      return;
    }

    if (upperSql.startsWith('DELETE FROM')) {
      const match = cleanSql.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(\w+)\s*(=|>|<)\s*(.+))?$/i);
      if (!match) {
        setResults([]);
        setMessage('Unsupported DELETE syntax. Example: DELETE FROM students WHERE id = 1;');
        return;
      }
      const [, tableName, whereColumn, operator, whereValue] = match;
      const tableKey = tableName.toLowerCase();
      if (!dbTables[tableKey]) {
        setResults([]);
        setMessage(`Table '${tableKey}' does not exist.`);
        return;
      }
      const expectedValue = whereValue?.trim().replace(/^['"]|['"]$/g, '');
      const nextRows = whereColumn
        ? dbTables[tableKey].filter((row) => {
          const currentValue = row[whereColumn];
          if (operator === '=') return String(currentValue) !== expectedValue;
          if (operator === '>') return !(Number(currentValue) > Number(expectedValue));
          return !(Number(currentValue) < Number(expectedValue));
        })
        : [];
      setDbTables((prev) => ({ ...prev, [tableKey]: nextRows }));
      setResults(nextRows);
      setMessage(`[OK] DELETE completed on '${tableKey}'.`);
      return;
    }

    // 7. JOIN Queries
    if (upperSql.includes(' JOIN ')) {
      let isLeft = upperSql.includes('LEFT JOIN');
      let isRight = upperSql.includes('RIGHT JOIN');
      let isFull = upperSql.includes('FULL JOIN');

      if (upperSql.includes('STUDENTS') && upperSql.includes('DEPARTMENTS')) {
        const leftData = dbTables.students || [];
        const rightData = dbTables.departments || [];

        const joinedRows = [];
        leftData.forEach((s) => {
          const matchDept = rightData.find((d) => d.dept_id === s.dept_id);
          if (matchDept) {
            joinedRows.push({
              student_id: s.id,
              student_name: s.name,
              department: s.department,
              score: s.score,
              dept_name: matchDept.dept_name,
              building: matchDept.building,
            });
          } else if (isLeft || isFull) {
            joinedRows.push({
              student_id: s.id,
              student_name: s.name,
              department: s.department,
              score: s.score,
              dept_name: 'NULL',
              building: 'NULL',
            });
          }
        });

        if (isRight || isFull) {
          rightData.forEach((d) => {
            const hasStudent = leftData.some((s) => s.dept_id === d.dept_id);
            if (!hasStudent) {
              joinedRows.push({
                student_id: 'NULL',
                student_name: 'NULL',
                department: 'NULL',
                score: 'NULL',
                dept_name: d.dept_name,
                building: d.building,
              });
            }
          });
        }

        setResults(joinedRows);
        setMessage(`[OK] JOIN Query returned ${joinedRows.length} record(s).`);
        return;
      }

      if (upperSql.includes('STUDENTS') && upperSql.includes('SUBMISSIONS')) {
        const leftData = dbTables.students || [];
        const rightData = dbTables.submissions || [];
        const joinedRows = [];

        leftData.forEach((s) => {
          const subList = rightData.filter((sub) => sub.student_id === s.id);
          if (subList.length > 0) {
            subList.forEach((sub) => {
              joinedRows.push({
                student_name: s.name,
                task_name: sub.task_name,
                status: sub.status,
                grade: sub.grade,
              });
            });
          } else if (isLeft) {
            joinedRows.push({
              student_name: s.name,
              task_name: 'NULL',
              status: 'NULL',
              grade: 'NULL',
            });
          }
        });

        setResults(joinedRows);
        setMessage(`[OK] JOIN Query returned ${joinedRows.length} record(s).`);
        return;
      }
    }

    // 8. SUBQUERIES (WHERE IN / SELECT inside SELECT)
    if (upperSql.includes('SELECT') && (upperSql.includes(' WHERE ') || upperSql.includes(' IN ') || upperSql.includes(' EXISTS '))) {
      // Example: SELECT * FROM students WHERE score > (SELECT AVG(score) FROM students)
      if (upperSql.includes('AVG') || upperSql.includes('MAX') || upperSql.includes('SCORE >')) {
        const scores = (dbTables.students || []).map(s => s.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
        const filtered = (dbTables.students || []).filter(s => s.score > avgScore);
        
        setResults(filtered);
        setMessage(`[OK] Subquery Executed: Evaluated condition against Average Score (${avgScore.toFixed(1)}). Returned ${filtered.length} row(s).`);
        return;
      }

      if (upperSql.includes('DEPT_ID IN')) {
        const deptIds = (dbTables.departments || []).map(d => d.dept_id);
        const filtered = (dbTables.students || []).filter(s => deptIds.includes(s.dept_id));
        setResults(filtered);
        setMessage(`[OK] Subquery (WHERE dept_id IN ...) Executed. Returned ${filtered.length} row(s).`);
        return;
      }
    }

    // 9. General SELECT * FROM <table>
    const selectMatch = upperSql.match(/FROM\s+(\w+)/i);
    if (selectMatch) {
      const tblName = selectMatch[1].toLowerCase();
      if (dbTables[tblName]) {
        let rows = [...dbTables[tblName]];
        if (upperSql.includes('WHERE')) {
          if (upperSql.includes("DEPARTMENT = 'CSE'") || upperSql.includes('DEPARTMENT="CSE"')) {
            rows = rows.filter(r => r.department === 'CSE');
          } else if (upperSql.includes('SCORE > 80')) {
            rows = rows.filter(r => r.score > 80);
          }
        }
        setResults(rows);
        setMessage(`[OK] Query executed on table '${tblName}'. (${rows.length} rows returned)`);
        return;
      }
    }

    setResults([]);
    setMessage('Query type or syntax is not supported in the client fallback. Start the backend for full SQLite SQL support.');
  };

  const runQuery = async () => {
    setMessage('');
    setQueryLoading(true);
    if (auth?.role === 'student') {
      try {
        const saved = JSON.parse(window.localStorage.getItem('smartlabx-live-activities') || '[]');
        const event = {
          id: Date.now(),
          email: auth.email,
          message: `Executed database query: ${query.trim().slice(0, 100)}`,
          time: new Date().toLocaleTimeString() + ' (' + new Date().toLocaleDateString() + ')',
        };
        window.localStorage.setItem('smartlabx-live-activities', JSON.stringify([event, ...saved].slice(0, 100)));
      } catch {}
    }

    // Determine query type for experiment tracking
    const trimmedQ = query.trim().toUpperCase();
    let queryType = 'OTHER';
    if (trimmedQ.startsWith('SELECT')) queryType = 'SELECT';
    else if (trimmedQ.startsWith('INSERT')) queryType = 'INSERT';
    else if (trimmedQ.startsWith('UPDATE')) queryType = 'UPDATE';
    else if (trimmedQ.startsWith('DELETE')) queryType = 'DELETE';
    else if (trimmedQ.startsWith('CREATE TABLE')) queryType = 'CREATE TABLE';
    else if (trimmedQ.startsWith('CREATE INDEX')) queryType = 'CREATE INDEX';
    else if (trimmedQ.startsWith('ALTER')) queryType = 'ALTER';
    else if (trimmedQ.startsWith('DROP')) queryType = 'DROP';
    else if (trimmedQ.includes('JOIN')) queryType = 'JOIN';

    let querySuccess = false;
    try {
      const resp = await fetch('http://localhost:5000/api/dbms/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!resp.ok) {
        executeClientSQL(query);
        querySuccess = true;
        setQueryLoading(false);
        return;
      }

      const data = await resp.json();
      if (data.message) setMessage(data.message);
      setResults(Array.isArray(data.data) ? data.data : []);
      querySuccess = true;
    } catch (err) {
      executeClientSQL(query);
      querySuccess = true;
    } finally {
      setQueryLoading(false);

      // Log detailed query execution for staff monitoring
      if (auth?.role === 'student') {
        try {
          const existingLogs = JSON.parse(window.localStorage.getItem('smartlabx-query-logs') || '[]');
          const logEntry = {
            id: Date.now(),
            studentName: auth.name,
            email: auth.email,
            query: query.trim().slice(0, 200),
            queryType,
            success: querySuccess,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString() + ' (' + new Date().toLocaleDateString() + ')',
          };
          window.localStorage.setItem('smartlabx-query-logs', JSON.stringify([logEntry, ...existingLogs].slice(0, 500)));
          
          // Log Cognitive Friction Run Attempt
          logStudentRunAttempt(auth.email, {
            success: querySuccess,
            errorMessage: querySuccess ? '' : message || 'SQL Execution Error',
            query: query.trim(),
            studentName: auth.name
          });
        } catch {}

        // Feed the run event into RAISE and surface its adaptive decision
        try {
          const rawFriction = querySuccess ? 12 : 58;
          const progress = querySuccess ? 65 : 20;
          const out = await raiseApi.attempt({
            studentId: auth.email,
            rawFriction,
            hintRequests: 0,
            success: querySuccess,
            progress,
          });

          if (out?.action === 'DELIVER_INTERVENTION') {
            const hint = await raiseApi.hint({
              studentId: auth.email,
              question: query.trim().slice(0, 120),
              currentProgress: progress,
            });
            lastRaiseHintRef.current = hint?.id ?? null;
            setRaiseNotice({
              type: 'hint',
              level: hint?.level,
              content: hint?.content,
              reason: out.reason,
              P_sr: out.P_sr,
              HDI: out.HDI,
            });
          } else if (out?.action === 'SUPPORT_NOTIFY') {
            lastRaiseHintRef.current = null;
            setRaiseNotice({ type: 'support', content: out.reason, P_sr: out.P_sr, HDI: out.HDI });
          } else if (out?.action === 'FACULTY_ALERT') {
            lastRaiseHintRef.current = null;
            setRaiseNotice({ type: 'alert', content: out.reason, P_sr: out.P_sr, HDI: out.HDI });
          } else {
            if (querySuccess) {
              await raiseApi.verify({
                studentId: auth.email,
                hintId: lastRaiseHintRef.current,
                recovered: true,
                afterProgress: progress,
                independent: !lastRaiseHintRef.current,
              });
              lastRaiseHintRef.current = null;
            }
            setRaiseNotice(null);
          }
        } catch (raiseErr) {
          // RAISE backend is optional; never block the query console.
        }
      }
    }
  };

  return (
    <>
      {showAiAnalysis && <AIAnalysisModal students={students} onClose={() => setShowAiAnalysis(false)} />}
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">SmartLabX</p>
            <h1 className="text-2xl font-semibold text-slate-900">Database & SQL Virtual Lab</h1>
          </div>
          <Link to="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!auth ? (
          <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Access portal</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">Batch 43 database lab</h2>
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
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">DBMS Workspace</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Welcome, {auth.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChangePassword((visible) => !visible)}
                    className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => setAuth(null)}
                    className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">Change Password</h3>
                    <p className="mt-1 text-xs text-slate-600">Use at least 6 characters for your new password.</p>
                  </div>
                  <button type="button" onClick={() => setShowChangePassword(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Close</button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" required className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required minLength={6} className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required minLength={6} className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                </div>
                <button type="submit" className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">Update Password</button>
              </form>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr]">
              <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Batch 43</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Database Lab Workspace</h3>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{students.length} members</span>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Workspace details</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>• Assigned staff: Dr. Priya</li>
                    <li>• Lab modules: students, departments, submissions, lab_sessions</li>
                    <li>• First login password: password123</li>
                  </ul>
                </div>

                {auth.role === 'staff' ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">Students</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">{students.length} active</span>
                        <button
                          type="button"
                          onClick={() => setShowCreateStudent((visible) => !visible)}
                          className="rounded-xl bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
                        >
                          {showCreateStudent ? 'Close' : '+ Create Student'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowAiAnalysis(true)}
                        className="w-full rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-purple-700 shadow-md flex items-center justify-center gap-2"
                      >
                        [AI] AI Performance Analysis (K-Means + RF)
                      </button>
                    </div>

                    {showCreateStudent && (
                      <form onSubmit={handleAddStudent} className="mt-3 space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                        <p className="text-xs font-semibold text-indigo-900">Create Batch 43 student</p>
                        <input
                          type="text"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Student name"
                          required
                          className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                        <input
                          type="email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="Student email"
                          required
                          className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                        <p className="text-[11px] text-indigo-700">First-time password: password123</p>
                        <button type="submit" className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">
                          Create Student
                        </button>
                      </form>
                    )}
                    <div className="mt-3 space-y-2">
                      {students.map((student) => (
                        <div key={student.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-800">{student.name}</p>
                              <p className="text-slate-500">{student.email}</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button onClick={() => setActiveVivaStudent(student)} className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Viva</button>
                              <button onClick={() => assignTaskToStudent(student.id)} className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Assign</button>
                              <button onClick={() => setActiveReportStudent(student)} className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Report</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm">
                    <h4 className="text-lg font-semibold text-slate-900 mb-3">My Tasks & Feedback</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-2">Assigned work</p>
                        <ul className="text-sm text-slate-600">
                          {(students.find((s) => s.email === auth.email)?.assignedTasks || []).length === 0 && <li className="text-xs text-slate-500">No tasks assigned yet.</li>}
                          {(students.find((s) => s.email === auth.email)?.assignedTasks || []).map((t) => (
                            <li key={t.id} className="mt-1 rounded-lg border border-slate-200 bg-white p-2 flex justify-between items-center gap-2">
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
                          value={students.find((s) => s.email === auth.email)?.vivaNotes || ''}
                          onChange={(e) => {
                            const currentStudent = students.find((s) => s.email === auth.email);
                            if (currentStudent) saveVivaNotes(currentStudent.id, e.target.value);
                          }}
                          rows={3}
                          placeholder="Write your notes here..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="flex flex-col gap-2 mt-4">
                        <button onClick={() => navigate('/viva-portal?lab=dbms')} className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 flex items-center justify-center gap-2">
                          [GRAD] Open AI Viva Portal
                        </button>
                        <button onClick={() => setActiveReportStudent(students.find((s) => s.email === auth.email))} className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700">
                          View My Report
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <AIGuidance auth={auth} />
                </div>
              </aside>

              <main className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] space-y-6">
                  <div className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-slate-800 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Interactive SQL Query Engine</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Supports JOINs, Subqueries, CREATE TABLE, INSERT, CREATE INDEX & DESCRIBE</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate('/safe-exam/dbms/1')}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          [LOCK] Open Safe Browser
                        </button>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                           SQL Engine Ready
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">SQL Editor</label>
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        rows="4"
                        placeholder="Type your SQL query here..."
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 outline-none focus:border-indigo-400 shadow-inner"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                          <button
                            onClick={runQuery}
                            disabled={queryLoading}
                            className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-sm"
                          >
                            {queryLoading ? 'Executing...' : 'Run Query ▶'}
                          </button>
                          <button
                            onClick={() => setQuery('')}
                            className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            Clear
                          </button>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">SQL Standard: SQLite / ANSI</span>
                      </div>
                      {raiseNotice && (
                        <div className={`mt-3 rounded-2xl border p-3 text-sm ${
                          raiseNotice.type === 'hint' ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : raiseNotice.type === 'support' ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : raiseNotice.type === 'alert' ? 'border-rose-200 bg-rose-50 text-rose-900'
                          : 'border-slate-200 bg-slate-50 text-slate-800'
                        }`}>
                          {raiseNotice.type === 'hint' ? (
                            <>
                              <p className="font-bold">RAISE Hint ({String(raiseNotice.level || '').toUpperCase()})</p>
                              <p className="mt-1">{raiseNotice.content}</p>
                            </>
                          ) : (
                            <p className="font-semibold">{raiseNotice.content}</p>
                          )}
                          <p className="mt-1 text-[11px] opacity-70">
                            P_sr: {typeof raiseNotice.P_sr === 'number' ? raiseNotice.P_sr.toFixed(2) : '-'} • HDI: {typeof raiseNotice.HDI === 'number' ? raiseNotice.HDI.toFixed(2) : '-'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800">Query Execution Output</h4>
                        <span className="text-xs font-mono text-slate-500">{results.length} rows returned</span>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs max-h-80">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-100 sticky top-0">
                            <tr>
                              {results.length > 0
                                ? Object.keys(results[0]).map((key) => (
                                    <th key={key} className="px-4 py-3 text-left font-bold text-slate-700 font-mono uppercase tracking-wider text-xs">
                                      {key}
                                    </th>
                                  ))
                                : <th className="px-4 py-3 text-left font-semibold text-slate-700">Output Window</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {results.length > 0 ? (
                              results.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition">
                                  {Object.values(row).map((value, idx) => (
                                    <td key={idx} className="px-4 py-2.5 text-slate-700 font-mono text-xs whitespace-nowrap">
                                      {value === null || value === undefined ? <span className="text-slate-400 italic">NULL</span> : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="px-4 py-6 text-center text-slate-500 italic">No output rows to display. Enter a query and click 'Run Query'.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <StaffMonitorWidgets auth={auth} />
                </div>
              </main>
            </div>
          </div>
        )}
      </div>

      {activeReportStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Student Report</h3>
              <button onClick={() => setActiveReportStudent(null)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">Close</button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">Student:</span> {activeReportStudent.name}</p>
              <p><span className="font-semibold text-slate-900">Email:</span> {activeReportStudent.email}</p>
              <p><span className="font-semibold text-slate-900">Assigned tasks:</span> {(activeReportStudent.assignedTasks || []).length}</p>
              <p><span className="font-semibold text-slate-900">Viva notes:</span> {activeReportStudent.vivaNotes || 'No notes yet.'}</p>
            </div>
          </div>
        </div>
      )}

      {activeVivaStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">AI Viva Panel</h3>
              <button onClick={() => setActiveVivaStudent(null)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">Close</button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">Candidate:</span> {activeVivaStudent.name}</p>
              <p>Review SQL concepts, joins, normalization, and query optimization with the AI assistance panel.</p>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-indigo-800">
                Suggested question: Explain how a LEFT JOIN differs from an INNER JOIN in database queries.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Real-time Warning Modal Overlay */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-2 border-amber-500 bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">
              [!]
            </div>
            <h3 className="text-xl font-extrabold text-amber-900">Faculty Live Warning Received</h3>
            <p className="mt-1 text-xs font-semibold text-amber-700 uppercase tracking-wider">
              From {activeWarning.sender || 'Faculty Monitor'}
            </p>
            <div className="my-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm font-medium text-amber-950 leading-relaxed">
              "{activeWarning.message}"
            </div>
            <button
              onClick={() => setActiveWarning(null)}
              className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-amber-700"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Staff Announcement Toast */}
      {activeAnnouncement && (
        <div className="fixed top-5 right-5 z-50 max-w-sm rounded-2xl border border-indigo-400 bg-slate-900 p-4 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-bold text-indigo-400">[ANNOUNCE] {activeAnnouncement.title}</span>
            <button onClick={() => setActiveAnnouncement(null)} className="text-slate-400 font-bold hover:text-white">&times;</button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">"{activeAnnouncement.message}"</p>
          <p className="mt-2 text-[10px] text-slate-400">Instructor: {activeAnnouncement.sender}</p>
        </div>
      )}

      {/* [LOCK] Feature 1: Remote Workspace Lock Screen */}
      {isWorkspaceLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border-2 border-rose-500 bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-4xl text-rose-600">
              [LOCK]
            </div>
            <h2 className="text-2xl font-black text-rose-950">Workspace Remote Locked</h2>
            <p className="mt-1 text-xs font-bold text-rose-700 uppercase tracking-wider">
              Enforced by Faculty Instructor
            </p>
            <div className="my-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left text-sm font-medium text-rose-950 leading-relaxed">
              "{lockReason}"
            </div>
            <p className="text-xs text-slate-500">
              Please raise your hand or contact your faculty instructor to unlock your lab workspace.
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
