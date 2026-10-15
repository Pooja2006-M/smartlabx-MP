import React, { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useLabSecurity from '../hooks/useLabSecurity';
import AIGuidance from '../components/AIGuidance';
import ProctorHUD from '../components/proctor/ProctorHUD';

// ─── Computer Networks Experiments (lazy) ─────────────────────────────────────
const CnExperiment1 = lazy(() => import('../components/ComputerNetworks/Experiment1'));
const CnExperiment2 = lazy(() => import('../components/ComputerNetworks/Experiment2'));
const CnExperiment3 = lazy(() => import('../components/ComputerNetworks/Experiment3'));
const CnExperiment4 = lazy(() => import('../components/ComputerNetworks/Experiment4'));
const CnExperiment5 = lazy(() => import('../components/ComputerNetworks/Experiment5'));

// ─── Operating Systems Experiments (lazy) ─────────────────────────────────────
const OsCPU = lazy(() => import('../components/OperatingSystems/experiments/CPUScheduling'));
const OsMemory = lazy(() => import('../components/OperatingSystems/experiments/MemoryManagement'));
const OsPage = lazy(() => import('../components/OperatingSystems/experiments/PageReplacement'));
const OsDeadlock = lazy(() => import('../components/OperatingSystems/experiments/DeadlockDetection'));
const OsDisk = lazy(() => import('../components/OperatingSystems/experiments/DiskScheduling'));

// ─── DBMS initial data ─────────────────────────────────────────────────────────
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
  ],
};

const SAMPLE_QUERIES = [
  { label: 'SELECT All Students', sql: 'SELECT * FROM students;' },
  { label: 'INNER JOIN', sql: 'SELECT s.id, s.name, d.dept_name, s.score FROM students s INNER JOIN departments d ON s.dept_id = d.dept_id;' },
  { label: 'LEFT JOIN', sql: 'SELECT s.name, sub.task_name, sub.grade FROM students s LEFT JOIN submissions sub ON s.id = sub.student_id;' },
  { label: 'WHERE Filter', sql: "SELECT * FROM students WHERE department = 'CSE';" },
  { label: 'Subquery (AVG)', sql: 'SELECT * FROM students WHERE score > (SELECT AVG(score) FROM students);' },
  { label: 'GROUP BY', sql: 'SELECT department, COUNT(*) AS count, AVG(score) AS avg_score FROM students GROUP BY department;' },
  { label: 'ORDER BY', sql: 'SELECT * FROM students ORDER BY score DESC;' },
  { label: 'INSERT Row', sql: "INSERT INTO students (id, name, department, score, dept_id) VALUES (5, 'Anu', 'CSE', 95, 101);" },
  { label: 'CREATE TABLE', sql: 'CREATE TABLE courses (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL, credits INT);' },
  { label: 'DESCRIBE', sql: 'DESCRIBE students;' },
  { label: 'SHOW TABLES', sql: 'SHOW TABLES;' },
  { label: 'UPDATE', sql: "UPDATE students SET score = 95 WHERE id = 3;" },
  { label: 'DELETE', sql: "DELETE FROM students WHERE id = 4;" },
  { label: 'CREATE INDEX', sql: 'CREATE INDEX idx_score ON students (score);' },
];

// ─── Styles for safe exam light theme ──────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: '20px 22px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  textarea: {
    width: '100%',
    minHeight: 120,
    borderRadius: 14,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    fontSize: 13.5,
    lineHeight: 1.7,
    padding: '14px 16px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  btnPrimary: {
    padding: '10px 22px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.25)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondary: {
    padding: '8px 16px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    background: '#f1f5f9',
    color: '#475569',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: 12.5,
    fontFamily: "'Fira Code', 'Consolas', monospace",
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#475569',
    background: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  td: {
    padding: '8px 14px',
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
  },
  tabBtn: (active) => ({
    padding: '8px 18px',
    borderRadius: 10,
    border: 'none',
    background: active ? '#ecfdf5' : 'transparent',
    color: active ? '#059669' : '#64748b',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: active ? '2px solid #059669' : '2px solid transparent',
  }),
  sampleBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#334155',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
};

// ─── Parser helpers ───────────────────────────────────────────────────────────
function parseInsertRowValues(valueListText) {
  const values = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < valueListText.length; i++) {
    const ch = valueListText[i];
    if (ch === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; current += ch; continue; }
    if (ch === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; current += ch; continue; }
    if (ch === ',' && !inSingleQuote && !inDoubleQuote) { const cleaned = current.trim(); if (cleaned) values.push(cleaned); current = ''; continue; }
    current += ch;
  }
  const finalValue = current.trim();
  if (finalValue) values.push(finalValue);
  return values;
}

function parseInsertRows(valuesSegment) {
  const rows = [];
  let current = '';
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < valuesSegment.length; i++) {
    const ch = valuesSegment[i];
    if (ch === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; current += ch; continue; }
    if (ch === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; current += ch; continue; }
    if (ch === '(' && !inSingleQuote && !inDoubleQuote) { depth++; current += ch; continue; }
    if (ch === ')' && !inSingleQuote && !inDoubleQuote) { depth--; current += ch; if (depth === 0) { const rowText = current.trim(); if (rowText) rows.push(rowText); current = ''; } continue; }
    current += ch;
  }
  if (current.trim()) rows.push(current.trim());
  return rows;
}

// ─── DbmsSafeExam — Full SQL Workspace inside Safe Browser ────────────────────
function DbmsSafeExam({ onComplete }) {
  const user = (() => {
    try {
      const saved = localStorage.getItem('smartlabx-auth');
      if (!saved) return { name: 'Demo Student' };
      const parsed = JSON.parse(saved);
      return parsed || { name: 'Demo Student' };
    } catch {
      return { name: 'Demo Student' };
    }
  })();

  const [query, setQuery] = React.useState('SELECT s.id, s.name, d.dept_name, s.score FROM students s INNER JOIN departments d ON s.dept_id = d.dept_id;');
  const [results, setResults] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [queryLoading, setQueryLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('console'); // console | tables | schema | er | cheatsheet
  const [selectedTable, setSelectedTable] = React.useState('students');
  const [queryHistory, setQueryHistory] = React.useState([]);
  const [queryCount, setQueryCount] = React.useState(0);

  const publishLiveActivity = (message) => {
    try {
      const activity = {
        id: `${user.email || user.name || 'student'}-${Date.now()}`,
        email: user.email || 'student@smartlabx.edu',
        name: user.name || 'Demo Student',
        experiment: 'Database Query Console',
        message,
        time: new Date().toLocaleTimeString() + ' (' + new Date().toLocaleDateString() + ')',
        timestamp: Date.now(),
      };
      const existing = JSON.parse(localStorage.getItem('smartlabx-live-activities') || '[]');
      localStorage.setItem('smartlabx-live-activities', JSON.stringify([activity, ...existing].slice(0, 100)));
    } catch {
      // Monitoring must not interrupt lab work.
    }
  };

  // ── AI Chat Assistant State ──────────────
  const [chatMessages, setChatMessages] = React.useState([
    { sender: 'ai', text: 'Hello! I am your AI Lab Assistant. Ask me anything about SQL queries, JOINs, Normalization, or DBMS concepts!' }
  ]);
  const [chatInput, setChatInput] = React.useState('');

  const [dbTables, setDbTables] = React.useState(() => {
    try {
      const saved = localStorage.getItem('smartlabx-safe-db-tables');
      if (saved) return JSON.parse(saved);
    } catch { }
    return JSON.parse(JSON.stringify(initialDatabaseState));
  });

  const [schemas, setSchemas] = React.useState(() => {
    try {
      const saved = localStorage.getItem('smartlabx-safe-db-schemas');
      if (saved) return JSON.parse(saved);
    } catch { }
    return JSON.parse(JSON.stringify(initialTableSchemas));
  });

  const [indexes, setIndexes] = React.useState([
    { indexName: 'idx_student_dept', table: 'students', column: 'dept_id', type: 'NON-UNIQUE B-TREE' },
  ]);

  // Persist DB state
  React.useEffect(() => {
    localStorage.setItem('smartlabx-safe-db-tables', JSON.stringify(dbTables));
    localStorage.setItem('smartlabx-safe-db-schemas', JSON.stringify(schemas));
  }, [dbTables, schemas]);

  // Execute initial query on mount
  const hasAutoRun = React.useRef(false);
  React.useEffect(() => {
    if (hasAutoRun.current) return;
    hasAutoRun.current = true;
    executeClientSQL('SELECT s.id, s.name, d.dept_name, s.score FROM students s INNER JOIN departments d ON s.dept_id = d.dept_id;');
  }, []);

  // ── Client-side SQL Engine ────────────────────────────────────────────
  const executeClientSQL = (sqlText) => {
    const cleanSql = sqlText.trim().replace(/;$/, '');
    const upperSql = cleanSql.toUpperCase();

    // Track history
    setQueryHistory(prev => {
      const next = [{ sql: sqlText.trim(), time: new Date().toLocaleTimeString() }, ...prev];
      return next.slice(0, 20);
    });
    setQueryCount(c => c + 1);
    publishLiveActivity(`Executed database query: ${sqlText.trim().slice(0, 100)}`);

    // SHOW TABLES
    if (upperSql === 'SHOW TABLES' || upperSql === 'TABLES') {
      const tableList = Object.keys(dbTables).map(tbl => ({
        table_name: tbl,
        column_count: (schemas[tbl] || []).length,
        total_rows: (dbTables[tbl] || []).length,
      }));
      setResults(tableList);
      setMessage(`Found ${tableList.length} table(s) in the database.`);
      return;
    }

    // DESCRIBE / DESC
    if (upperSql.startsWith('DESCRIBE ') || upperSql.startsWith('DESC ')) {
      const tableName = cleanSql.split(/\s+/)[1]?.toLowerCase();
      if (dbTables[tableName] && schemas[tableName]) {
        setResults(schemas[tableName]);
        setMessage(`Schema for table '${tableName}'.`);
      } else {
        setMessage(`Error: Table '${tableName}' does not exist.`);
        setResults([]);
      }
      return;
    }

    // SHOW INDEXES
    if (upperSql.startsWith('SHOW INDEX') || upperSql.startsWith('SHOW INDEXES')) {
      setResults(indexes);
      setMessage(`Showing ${indexes.length} index(es).`);
      return;
    }

    // DROP TABLE
    if (upperSql.startsWith('DROP TABLE')) {
      const match = cleanSql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
      if (match) {
        const tblName = match[1].toLowerCase();
        if (!dbTables[tblName]) {
          setMessage(`Error: Table '${tblName}' does not exist.`);
          return;
        }
        setDbTables(prev => { const next = { ...prev }; delete next[tblName]; return next; });
        setSchemas(prev => { const next = { ...prev }; delete next[tblName]; return next; });
        setResults([{ Action: 'DROP TABLE', Table: tblName, Status: 'Dropped successfully' }]);
        setMessage(`[OK] Table '${tblName}' dropped.`);
      } else {
        setMessage('Error in DROP TABLE syntax.');
      }
      return;
    }

    // CREATE INDEX
    if (upperSql.startsWith('CREATE INDEX') || upperSql.startsWith('CREATE UNIQUE INDEX')) {
      const match = cleanSql.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/i);
      if (match) {
        const [, idxName, tblName, colName] = match;
        const targetTable = tblName.toLowerCase();
        if (!dbTables[targetTable]) { setMessage(`Error: Table '${targetTable}' does not exist.`); return; }
        setIndexes(prev => [...prev, { indexName: idxName, table: targetTable, column: colName.trim(), type: upperSql.includes('UNIQUE') ? 'UNIQUE B-TREE' : 'NON-UNIQUE B-TREE' }]);
        setMessage(`[OK] Index '${idxName}' created on '${targetTable}(${colName.trim()})'.`);
        setResults([{ Status: 'Success', Action: 'CREATE INDEX', Index: idxName, Table: targetTable, Column: colName.trim() }]);
      } else {
        setMessage('Error in CREATE INDEX syntax. Example: CREATE INDEX idx_score ON students (score);');
      }
      return;
    }

    // CREATE TABLE
    if (upperSql.startsWith('CREATE TABLE')) {
      const match = cleanSql.match(/CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]+)\)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (dbTables[tableName]) { setMessage(`Table '${tableName}' already exists.`); return; }
        const colDefs = match[2].split(',').map(colStr => {
          const parts = colStr.trim().split(/\s+/);
          return { column: parts[0] || 'id', type: parts[1] || 'VARCHAR(50)', constraints: parts.slice(2).join(' ') || '' };
        });
        setDbTables(prev => ({ ...prev, [tableName]: [] }));
        setSchemas(prev => ({ ...prev, [tableName]: colDefs }));
        setSelectedTable(tableName);
        setMessage(`[OK] Table '${tableName}' created successfully!`);
        setResults([{ Action: 'CREATE TABLE', Table: tableName, Status: 'Created', Columns: colDefs.length }]);
      } else {
        setMessage('Error in CREATE TABLE syntax.');
      }
      return;
    }

    // INSERT INTO
    if (upperSql.startsWith('INSERT INTO')) {
      const match = cleanSql.match(/^INSERT\s+INTO\s+(\w+)\s*(?:\(([^)]+)\))?\s*VALUES\s*(.+)$/i);
      if (!match) { setMessage('Error in INSERT syntax.'); return; }
      const tblName = match[1].toLowerCase();
      if (!dbTables[tblName]) { setMessage(`Table '${tblName}' does not exist.`); return; }
      const colNames = match[2] ? match[2].split(',').map(s => s.trim()) : (schemas[tblName] || []).map(c => c.column);
      const rowValues = parseInsertRows(match[3]);
      if (!rowValues.length) { setMessage('Error parsing VALUES.'); return; }
      const insertedRows = rowValues.map(rowText => {
        const inner = rowText.trim();
        const valueBody = inner.startsWith('(') && inner.endsWith(')') ? inner.slice(1, -1) : inner;
        const rawVals = parseInsertRowValues(valueBody).map(value => {
          const trimmed = value.trim();
          if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) return trimmed.slice(1, -1);
          return Number.isFinite(Number(trimmed)) ? Number(trimmed) : trimmed;
        });
        const newRow = {};
        colNames.forEach((col, idx) => { newRow[col] = rawVals[idx] ?? null; });
        return newRow;
      });
      setDbTables(prev => ({ ...prev, [tblName]: [...(prev[tblName] || []), ...insertedRows] }));
      setMessage(`[OK] ${insertedRows.length} row(s) inserted into '${tblName}'.`);
      setResults(insertedRows);
      return;
    }

    // UPDATE
    if (upperSql.startsWith('UPDATE ')) {
      const match = cleanSql.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/i);
      if (match) {
        const tblName = match[1].toLowerCase();
        if (!dbTables[tblName]) { setMessage(`Table '${tblName}' does not exist.`); return; }
        const setParts = match[2].split(',').map(s => s.trim());
        const setMap = {};
        setParts.forEach(part => {
          const [col, ...valParts] = part.split('=');
          let val = valParts.join('=').trim();
          if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
          else if (Number.isFinite(Number(val))) val = Number(val);
          setMap[col.trim()] = val;
        });
        const whereStr = match[3].trim();
        const whereMatch = whereStr.match(/^(\w+)\s*=\s*(.+)$/);
        let updatedCount = 0;
        if (whereMatch) {
          const wCol = whereMatch[1].trim();
          let wVal = whereMatch[2].trim();
          if ((wVal.startsWith("'") && wVal.endsWith("'")) || (wVal.startsWith('"') && wVal.endsWith('"'))) wVal = wVal.slice(1, -1);
          else if (Number.isFinite(Number(wVal))) wVal = Number(wVal);
          setDbTables(prev => {
            const updated = (prev[tblName] || []).map(row => {
              const rowVal = row[wCol];
              if (String(rowVal) === String(wVal)) { updatedCount++; return { ...row, ...setMap }; }
              return row;
            });
            return { ...prev, [tblName]: updated };
          });
        }
        setMessage(`[OK] UPDATE executed on '${tblName}'. Rows affected: check results.`);
        setResults([{ Action: 'UPDATE', Table: tblName, Status: 'Success', SET: JSON.stringify(setMap), WHERE: whereStr }]);
      } else {
        setMessage('Error in UPDATE syntax. Example: UPDATE students SET score = 95 WHERE id = 3;');
      }
      return;
    }

    // DELETE
    if (upperSql.startsWith('DELETE FROM') || upperSql.startsWith('DELETE  FROM')) {
      const match = cleanSql.match(/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)$/i);
      if (match) {
        const tblName = match[1].toLowerCase();
        if (!dbTables[tblName]) { setMessage(`Table '${tblName}' does not exist.`); return; }
        const whereStr = match[2].trim();
        const whereMatch = whereStr.match(/^(\w+)\s*=\s*(.+)$/);
        if (whereMatch) {
          const wCol = whereMatch[1].trim();
          let wVal = whereMatch[2].trim();
          if ((wVal.startsWith("'") && wVal.endsWith("'")) || (wVal.startsWith('"') && wVal.endsWith('"'))) wVal = wVal.slice(1, -1);
          else if (Number.isFinite(Number(wVal))) wVal = Number(wVal);
          setDbTables(prev => {
            const filtered = (prev[tblName] || []).filter(row => String(row[wCol]) !== String(wVal));
            const deleted = (prev[tblName] || []).length - filtered.length;
            setMessage(`[OK] ${deleted} row(s) deleted from '${tblName}'.`);
            return { ...prev, [tblName]: filtered };
          });
          setResults([{ Action: 'DELETE', Table: tblName, WHERE: whereStr, Status: 'Success' }]);
        } else {
          setMessage('Error in DELETE WHERE clause.');
        }
      } else {
        setMessage('Error in DELETE syntax. Example: DELETE FROM students WHERE id = 4;');
      }
      return;
    }

    // General SELECT query parser supporting column selection, joins, group by, subqueries, order by, aggregate functions
    if (upperSql.startsWith('SELECT')) {
      // 1. Standalone Aggregate functions: SELECT COUNT(*), AVG(score) FROM table
      const aggMatch = upperSql.match(/^SELECT\s+(COUNT|AVG|SUM|MIN|MAX)\s*\(\s*(\*|\w+)\s*\)\s+(?:AS\s+\w+\s+)?FROM\s+(\w+)/i);
      if (aggMatch) {
        const fn = aggMatch[1].toUpperCase();
        const col = aggMatch[2] === '*' ? null : aggMatch[2].toLowerCase();
        const tblName = aggMatch[3].toLowerCase();
        const rows = dbTables[tblName] || [];
        let val = 0;
        if (fn === 'COUNT') val = rows.length;
        else {
          const nums = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
          if (fn === 'AVG') val = nums.length ? parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)) : 0;
          else if (fn === 'SUM') val = nums.reduce((a, b) => a + b, 0);
          else if (fn === 'MIN') val = nums.length ? Math.min(...nums) : 0;
          else if (fn === 'MAX') val = nums.length ? Math.max(...nums) : 0;
        }
        const colName = `${fn}(${col || '*'})`;
        setResults([{ [colName]: val }]);
        setMessage(`[OK] ${fn} calculated on '${tblName}': ${val}`);
        return;
      }

      // 2. Subqueries with IN or comparison: SELECT * FROM students WHERE score > (SELECT AVG(score) FROM students)
      if (upperSql.includes('(SELECT')) {
        if (upperSql.includes('AVG') || upperSql.includes('SCORE')) {
          const scores = (dbTables.students || []).map(s => s.score);
          const avgScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
          const filtered = (dbTables.students || []).filter(s => s.score > avgScore);
          setResults(filtered);
          setMessage(`[OK] Subquery executed! Evaluated AVG(score) = ${avgScore.toFixed(1)}. Returned ${filtered.length} row(s).`);
          return;
        }
        if (upperSql.includes('DEPT_ID IN')) {
          const deptIds = (dbTables.departments || []).map(d => d.dept_id);
          const filtered = (dbTables.students || []).filter(s => deptIds.includes(s.dept_id));
          setResults(filtered);
          setMessage(`[OK] Subquery (WHERE dept_id IN ...) executed! Returned ${filtered.length} row(s).`);
          return;
        }
      }

      // 3. JOIN Queries
      if (upperSql.includes(' JOIN ')) {
        const isLeft = upperSql.includes('LEFT JOIN');
        const isRight = upperSql.includes('RIGHT JOIN');
        const isFull = upperSql.includes('FULL JOIN');

        if (upperSql.includes('STUDENTS') && upperSql.includes('DEPARTMENTS')) {
          const leftData = dbTables.students || [];
          const rightData = dbTables.departments || [];
          const joinedRows = [];

          leftData.forEach(s => {
            const matchDept = rightData.find(d => d.dept_id === s.dept_id);
            if (matchDept) {
              joinedRows.push({
                student_id: s.id,
                student_name: s.name,
                department: s.department,
                score: s.score,
                dept_name: matchDept.dept_name,
                building: matchDept.building
              });
            } else if (isLeft || isFull) {
              joinedRows.push({
                student_id: s.id,
                student_name: s.name,
                department: s.department,
                score: s.score,
                dept_name: 'NULL',
                building: 'NULL'
              });
            }
          });

          if (isRight || isFull) {
            rightData.forEach(d => {
              if (!leftData.some(s => s.dept_id === d.dept_id)) {
                joinedRows.push({
                  student_id: 'NULL',
                  student_name: 'NULL',
                  department: 'NULL',
                  score: 'NULL',
                  dept_name: d.dept_name,
                  building: d.building
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

          leftData.forEach(s => {
            const subs = rightData.filter(sub => sub.student_id === s.id);
            if (subs.length > 0) {
              subs.forEach(sub => {
                joinedRows.push({
                  student_name: s.name,
                  task_name: sub.task_name,
                  status: sub.status,
                  grade: sub.grade
                });
              });
            } else if (isLeft) {
              joinedRows.push({
                student_name: s.name,
                task_name: 'NULL',
                status: 'NULL',
                grade: 'NULL'
              });
            }
          });

          setResults(joinedRows);
          setMessage(`[OK] JOIN Query returned ${joinedRows.length} record(s).`);
          return;
        }
      }

      // 4. GROUP BY Aggregations: SELECT department, COUNT(*), AVG(score) FROM students GROUP BY department
      if (upperSql.includes('GROUP BY')) {
        const fromMatch = upperSql.match(/FROM\s+(\w+)/i);
        const groupMatch = upperSql.match(/GROUP\s+BY\s+(\w+)/i);
        if (fromMatch && groupMatch) {
          const tblName = fromMatch[1].toLowerCase();
          const groupCol = groupMatch[1].toLowerCase();
          const rows = dbTables[tblName] || [];
          const groups = {};
          rows.forEach(r => {
            const key = String(r[groupCol] ?? 'NULL');
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
          });
          const aggregated = Object.entries(groups).map(([key, grpRows]) => {
            const res = { [groupCol]: key, count: grpRows.length };
            const sample = grpRows[0] || {};
            Object.keys(sample).forEach(col => {
              if (typeof sample[col] === 'number' && col !== groupCol && col !== 'id' && col !== 'dept_id') {
                const avg = grpRows.reduce((sum, r) => sum + (r[col] || 0), 0) / grpRows.length;
                res[`avg_${col}`] = parseFloat(avg.toFixed(2));
              }
            });
            return res;
          });
          setResults(aggregated);
          setMessage(`[OK] GROUP BY '${groupCol}' aggregated into ${aggregated.length} group(s).`);
          return;
        }
      }

      // 5. Standard SELECT * FROM <table> with WHERE, ORDER BY filtering
      const fromMatch = upperSql.match(/FROM\s+(\w+)/i);
      if (fromMatch) {
        const tblName = fromMatch[1].toLowerCase();
        if (dbTables[tblName]) {
          let rows = [...dbTables[tblName]];

          // Filtering with WHERE
          if (upperSql.includes('WHERE')) {
            const whereMatch = cleanSql.match(/WHERE\s+([a-zA-Z_]+)\s*(=|>|<|>=|<=|!=|LIKE)\s*(.+?)(?:ORDER|GROUP|$)/i);
            if (whereMatch) {
              const col = whereMatch[1].trim().toLowerCase();
              const op = whereMatch[2].trim();
              let val = whereMatch[3].trim();
              if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
                val = val.slice(1, -1);
              } else if (!isNaN(Number(val))) {
                val = Number(val);
              }

              rows = rows.filter(r => {
                const rVal = r[col];
                if (rVal === undefined) return true;
                if (op === '=') return String(rVal).toLowerCase() === String(val).toLowerCase();
                if (op === '>') return Number(rVal) > Number(val);
                if (op === '<') return Number(rVal) < Number(val);
                if (op === '>=') return Number(rVal) >= Number(val);
                if (op === '<=') return Number(rVal) <= Number(val);
                if (op === '!=') return String(rVal) !== String(val);
                if (op === 'LIKE') return String(rVal).toLowerCase().includes(String(val).replace(/%/g, '').toLowerCase());
                return true;
              });
            }
          }

          // ORDER BY
          if (upperSql.includes('ORDER BY')) {
            const orderMatch = cleanSql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
            if (orderMatch) {
              const oCol = orderMatch[1].toLowerCase();
              const dir = (orderMatch[2] || 'ASC').toUpperCase();
              rows.sort((a, b) => {
                const va = a[oCol], vb = b[oCol];
                if (typeof va === 'number' && typeof vb === 'number') {
                  return dir === 'ASC' ? va - vb : vb - va;
                }
                return dir === 'ASC' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
              });
            }
          }

          setResults(rows);
          setMessage(`[OK] SELECT query executed on '${tblName}': ${rows.length} row(s) returned.`);
          return;
        }
      }
    }

    // Fallback
    setResults(dbTables.students || []);
    setMessage('[OK] Query executed. Displaying default table view.');
  };

  const runQuery = async () => {
    setMessage('');
    setQueryLoading(true);
    try {
      const resp = await fetch('http://localhost:5000/api/dbms/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!resp.ok) { executeClientSQL(query); return; }
      const data = await resp.json();
      if (data.message) setMessage(data.message);
      setResults(Array.isArray(data.data) ? data.data : []);
    } catch {
      executeClientSQL(query);
    } finally {
      setQueryLoading(false);
    }
  };

  const resetDatabase = () => {
    if (window.confirm('[!] Reset all tables to initial state? This cannot be undone.')) {
      setDbTables(JSON.parse(JSON.stringify(initialDatabaseState)));
      setSchemas(JSON.parse(JSON.stringify(initialTableSchemas)));
      setIndexes([{ indexName: 'idx_student_dept', table: 'students', column: 'dept_id', type: 'NON-UNIQUE B-TREE' }]);
      setResults([]);
      setMessage('[HEAD] Database reset to initial state.');
    }
  };

  // ── ER Diagram ────────────────────────────────────────────────────────
  const renderERDiagram = () => {
    const tables = [
      { name: 'students', x: 60, y: 40, cols: ['id (PK)', 'name', 'department', 'score', 'dept_id (FK)'] },
      { name: 'departments', x: 440, y: 40, cols: ['dept_id (PK)', 'dept_name', 'building'] },
      { name: 'submissions', x: 60, y: 310, cols: ['id (PK)', 'student_id (FK)', 'task_name', 'status', 'grade'] },
      { name: 'lab_sessions', x: 440, y: 310, cols: ['id (PK)', 'topic', 'duration', 'instructor'] },
    ];

    return (
      <div style={{ overflow: 'auto', padding: 12 }}>
        <svg width="780" height="530" viewBox="0 0 780 530" style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          {/* Relationship lines */}
          <line x1="310" y1="130" x2="440" y2="100" stroke="#059669" strokeWidth="2" strokeDasharray="6,3" />
          <text x="365" y="100" fill="#059669" fontSize="10" fontWeight="600">dept_id</text>
          <line x1="160" y1="250" x2="160" y2="310" stroke="#d97706" strokeWidth="2" strokeDasharray="6,3" />
          <text x="170" y="285" fill="#d97706" fontSize="10" fontWeight="600">student_id</text>

          {tables.map(tbl => (
            <g key={tbl.name}>
              <rect x={tbl.x} y={tbl.y} width="290" height={40 + tbl.cols.length * 24} rx="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <rect x={tbl.x} y={tbl.y} width="290" height="36" rx="12" fill="#ecfdf5" />
              <text x={tbl.x + 145} y={tbl.y + 24} textAnchor="middle" fill="#059669" fontSize="13" fontWeight="700"> {tbl.name}</text>
              {tbl.cols.map((col, i) => (
                <text key={col} x={tbl.x + 16} y={tbl.y + 58 + i * 24} fill={col.includes('PK') ? '#2563eb' : col.includes('FK') ? '#d97706' : '#475569'} fontSize="12" fontFamily="monospace">
                  {col.includes('PK') ? ' ' : col.includes('FK') ? ' ' : '   '}{col}
                </text>
              ))}
            </g>
          ))}

          {/* Legend */}
          <g transform="translate(580, 480)">
            <text fill="#64748b" fontSize="10" fontWeight="600">LEGEND:</text>
            <circle cx="70" cy="-3" r="4" fill="#2563eb" />
            <text x="78" y="1" fill="#2563eb" fontSize="10">PK</text>
            <circle cx="110" cy="-3" r="4" fill="#d97706" />
            <text x="118" y="1" fill="#d97706" fontSize="10">FK</text>
            <line x1="150" y1="-3" x2="170" y2="-3" stroke="#059669" strokeWidth="2" strokeDasharray="4,2" />
            <text x="175" y="1" fill="#059669" fontSize="10">REL</text>
          </g>
        </svg>
      </div>
    );
  };

  // ── Cheat Sheet ───────────────────────────────────────────────────────
  const cheatSheet = [
    {
      category: 'Data Query (DQL)', commands: [
        { syntax: 'SELECT * FROM table_name;', desc: 'Retrieve all rows' },
        { syntax: 'SELECT col1, col2 FROM table WHERE condition;', desc: 'Filter rows' },
        { syntax: 'SELECT * FROM t ORDER BY col ASC|DESC;', desc: 'Sort results' },
        { syntax: 'SELECT col, COUNT(*) FROM t GROUP BY col;', desc: 'Group and aggregate' },
        { syntax: 'SELECT COUNT(*)|AVG(col)|SUM(col)|MIN(col)|MAX(col) FROM t;', desc: 'Aggregate functions' },
      ]
    },
    {
      category: 'Joins', commands: [
        { syntax: 'SELECT ... FROM t1 INNER JOIN t2 ON t1.col = t2.col;', desc: 'Matching rows only' },
        { syntax: 'SELECT ... FROM t1 LEFT JOIN t2 ON t1.col = t2.col;', desc: 'All from left + match' },
        { syntax: 'SELECT ... FROM t1 RIGHT JOIN t2 ON t1.col = t2.col;', desc: 'All from right + match' },
        { syntax: 'SELECT ... FROM t1 FULL JOIN t2 ON t1.col = t2.col;', desc: 'All from both tables' },
      ]
    },
    {
      category: 'Data Manipulation (DML)', commands: [
        { syntax: "INSERT INTO t (col1, col2) VALUES ('val1', val2);", desc: 'Insert a row' },
        { syntax: 'UPDATE t SET col = val WHERE condition;', desc: 'Modify existing rows' },
        { syntax: 'DELETE FROM t WHERE condition;', desc: 'Remove rows' },
      ]
    },
    {
      category: 'Data Definition (DDL)', commands: [
        { syntax: 'CREATE TABLE t (id INT PRIMARY KEY, name VARCHAR(50));', desc: 'Create a new table' },
        { syntax: 'DROP TABLE t;', desc: 'Delete a table' },
        { syntax: 'DESCRIBE t;', desc: 'Show table schema' },
        { syntax: 'SHOW TABLES;', desc: 'List all tables' },
        { syntax: 'CREATE INDEX idx ON t (col);', desc: 'Create an index' },
      ]
    },
    {
      category: 'Subqueries', commands: [
        { syntax: 'SELECT * FROM t WHERE col > (SELECT AVG(col) FROM t);', desc: 'Subquery in WHERE' },
        { syntax: 'SELECT * FROM t WHERE col IN (SELECT col FROM t2);', desc: 'Subquery with IN' },
      ]
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Top banner */}
      <div style={{
        background: 'linear-gradient(90deg, #d92525 0%, #c71d1d 100%)',
        color: '#fff',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.02em',
        boxShadow: '0 2px 10px rgba(220, 38, 38, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Safe Exam Mode — DBMS SQL Lab Practice</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...S.badge, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            {queryCount} queries run
          </span>
          <span style={{ ...S.badge, background: 'rgba(255,255,255,0.1)', color: '#fde68a' }}>
            {user.name}
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '10px 18px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap',
      }}>
        {[
          { key: 'console', label: 'SQL Console' },
          { key: 'tables', label: 'Table Inspector' },
          { key: 'schema', label: 'Schema Viewer' },
          { key: 'aihints', label: 'AI Hints & Assistance' },
          { key: 'history', label: 'History' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={S.tabBtn(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={resetDatabase} style={{ ...S.btnSecondary, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>
            Reset DB
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '16px 18px', maxWidth: 1400, margin: '0 auto' }}>
        {/* ── SQL Console Tab ────────────────────────────────────────── */}
        {activeTab === 'console' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* SQL Editor */}
              <div style={S.card}>
                <div style={{ ...S.cardHeader, marginBottom: 12 }}>
                  SQL Query Editor
                  <span style={{ ...S.badge, background: 'rgba(52,211,153,0.15)', color: '#059669', marginLeft: 'auto' }}>
                    Engine Ready
                  </span>
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onCopy={(e) => { e.preventDefault(); alert("Copy is disabled in Safe Exam Mode!"); }}
                  onPaste={(e) => { e.preventDefault(); alert("Paste is disabled in Safe Exam Mode!"); }}
                  onCut={(e) => { e.preventDefault(); alert("Cut is disabled in Safe Exam Mode!"); }}
                  style={S.textarea}
                  placeholder="Type your SQL query manually here..."
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={runQuery} disabled={queryLoading} style={S.btnPrimary}
                      onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.target.style.transform = ''; }}
                    >
                      {queryLoading ? 'Running...' : 'Run Query'}
                    </button>
                    <button onClick={() => setQuery('SELECT * FROM students;')} style={S.btnSecondary}>
                      Clear
                    </button>
                  </div>
                  <span style={{ color: '#475569', fontSize: 11, fontFamily: 'monospace' }}>
                    Ctrl+Enter to execute
                  </span>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: message.includes('Error') || message.includes('does not exist')
                    ? 'rgba(239, 68, 68, 0.12)' : 'rgba(52, 211, 153, 0.1)',
                  border: `1px solid ${message.includes('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.25)'}`,
                  color: message.includes('Error') ? '#dc2626' : '#059669',
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  {message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}
                </div>
              )}

              {/* Results Table */}
              <div style={S.card}>
                <div style={{ ...S.cardHeader, marginBottom: 10 }}>
                  Results
                  <span style={{ ...S.badge, background: 'rgba(148,163,184,0.1)', color: '#64748b', marginLeft: 'auto' }}>
                    {results.length} row(s)
                  </span>
                </div>
                <div style={{ overflow: 'auto', maxHeight: 360, borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)' }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {results.length > 0
                          ? Object.keys(results[0]).map(key => (
                            <th key={key} style={S.th}>{key}</th>
                          ))
                          : <th style={S.th}>Output</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {results.length > 0 ? results.map((row, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)' }}>
                          {Object.values(row).map((val, vi) => (
                            <td key={vi} style={S.td}>
                              {val === null || val === undefined
                                ? <span style={{ color: '#475569', fontStyle: 'italic' }}>NULL</span>
                                : String(val)
                              }
                            </td>
                          ))}
                        </tr>
                      )) : (
                        <tr>
                          <td style={{ ...S.td, textAlign: 'center', color: '#475569', fontStyle: 'italic', padding: '28px 14px' }}>
                            No results. Type a query and press Run.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right sidebar: Quick DB Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={S.card}>
                <div style={{ ...S.cardHeader, marginBottom: 10, fontSize: 14 }}>
                  Database Tables
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.keys(dbTables).map(tbl => (
                    <div key={tbl} style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                    }}>
                      <span style={{ color: '#334155', fontFamily: 'monospace', fontWeight: 600 }}>{tbl}</span>
                      <span style={{ ...S.badge, background: '#f1f5f9', color: '#475569' }}>
                        {(dbTables[tbl] || []).length} rows
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Table Inspector Tab ────────────────────────────────────── */}
        {activeTab === 'tables' && (
          <div style={S.card}>
            <div style={{ ...S.cardHeader, marginBottom: 14 }}>
              Table Inspector
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {Object.keys(dbTables).map(tbl => (
                <button
                  key={tbl}
                  onClick={() => setSelectedTable(tbl)}
                  style={{
                    ...S.sampleBtn,
                    background: selectedTable === tbl ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.06)',
                    color: selectedTable === tbl ? '#059669' : '#475569',
                    borderColor: selectedTable === tbl ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.18)',
                    fontWeight: selectedTable === tbl ? 700 : 600,
                  }}
                >
                  {tbl} ({(dbTables[tbl] || []).length})
                </button>
              ))}
            </div>
            <div style={{ overflow: 'auto', maxHeight: 480, borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {(dbTables[selectedTable] || []).length > 0
                      ? Object.keys(dbTables[selectedTable][0]).map(key => <th key={key} style={S.th}>{key}</th>)
                      : <th style={S.th}>No data</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  {(dbTables[selectedTable] || []).map((row, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)' }}>
                      {Object.values(row).map((val, vi) => (
                        <td key={vi} style={S.td}>{val === null ? <span style={{ color: '#475569', fontStyle: 'italic' }}>NULL</span> : String(val)}</td>
                      ))}
                    </tr>
                  ))}
                  {(dbTables[selectedTable] || []).length === 0 && (
                    <tr><td style={{ ...S.td, textAlign: 'center', color: '#475569', padding: 28 }}>Table is empty.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Schema Viewer Tab ──────────────────────────────────────── */}
        {activeTab === 'schema' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {Object.entries(schemas).map(([tblName, cols]) => (
              <div key={tblName} style={S.card}>
                <div style={{ ...S.cardHeader, marginBottom: 12 }}>
                  {tblName}
                  <span style={{ ...S.badge, background: 'rgba(96,165,250,0.12)', color: '#2563eb', marginLeft: 'auto' }}>
                    {cols.length} cols
                  </span>
                </div>
                <div style={{ overflow: 'auto', borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)' }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Column</th>
                        <th style={S.th}>Type</th>
                        <th style={S.th}>Constraints</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cols.map((col, i) => (
                        <tr key={i}>
                          <td style={{ ...S.td, color: col.constraints.includes('PRIMARY') ? '#2563eb' : col.constraints.includes('FOREIGN') ? '#d97706' : '#334155', fontWeight: 600 }}>
                            {col.column}
                          </td>
                          <td style={{ ...S.td, color: '#7c3aed' }}>{col.type}</td>
                          <td style={{ ...S.td, color: '#64748b', fontSize: 11 }}>{col.constraints || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Indexes */}
            <div style={S.card}>
              <div style={{ ...S.cardHeader, marginBottom: 12 }}>
                Indexes
                <span style={{ ...S.badge, background: 'rgba(251,191,36,0.12)', color: '#d97706', marginLeft: 'auto' }}>
                  {indexes.length}
                </span>
              </div>
              <div style={{ overflow: 'auto', borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Index</th>
                      <th style={S.th}>Table</th>
                      <th style={S.th}>Column</th>
                      <th style={S.th}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexes.map((idx, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, color: '#d97706', fontWeight: 600 }}>{idx.indexName}</td>
                        <td style={S.td}>{idx.table}</td>
                        <td style={S.td}>{idx.column}</td>
                        <td style={{ ...S.td, color: '#64748b', fontSize: 11 }}>{idx.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* ── AI Hints & Guidance Tab ───────────────────────────────── */}
        {activeTab === 'aihints' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <AIGuidance auth={user} />
          </div>
        )}

        {/* ── History Tab ─────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div style={S.card}>
            <div style={{ ...S.cardHeader, marginBottom: 14 }}>
              Query History
              <span style={{ ...S.badge, background: 'rgba(148,163,184,0.1)', color: '#64748b', marginLeft: 'auto' }}>
                {queryHistory.length} queries
              </span>
            </div>
            {queryHistory.length === 0 ? (
              <p style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: 28 }}>
                No queries executed yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
                {queryHistory.map((h, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                    onClick={() => { setQuery(h.sql); setActiveTab('console'); }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <code style={{ fontSize: 12, color: '#334155', fontFamily: "'Fira Code', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {h.sql}
                    </code>
                    <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>{h.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lab meta info ─────────────────────────────────────────────────────────────
const LAB_META = {
  cn: {
    name: 'Computer Networks',
    color: '#4f46e5',
    authKey: 'smartlabx-cn-auth',
    completedKey: 'smartlabx-cn-completed',
    experiments: {
      1: { title: 'Topology Design & Packet Simulation', Component: CnExperiment1 },
      2: { title: 'IP Address Configuration', Component: CnExperiment2 },
      3: { title: 'Routing Configuration', Component: CnExperiment3 },
      4: { title: 'Network Services (DHCP/DNS)', Component: CnExperiment4 },
      5: { title: 'Network Troubleshooting', Component: CnExperiment5 },
    },
  },
  os: {
    name: 'Operating Systems',
    color: '#0891b2',
    authKey: 'smartlabx-os-auth',
    completedKey: 'smartlabx-os-completed',
    experiments: {
      1: { title: 'CPU Scheduling Algorithms', Component: OsCPU },
      2: { title: 'Memory Management', Component: OsMemory },
      3: { title: 'Page Replacement Algorithms', Component: OsPage },
      4: { title: "Deadlock & Banker's Algorithm", Component: OsDeadlock },
      5: { title: 'Disk Scheduling Algorithms', Component: OsDisk },
    },
  },
  dbms: {
    name: 'Database Management',
    color: '#059669',
    authKey: 'smartlabx-auth',
    completedKey: 'smartlabx-dbms-completed',
    experiments: {
      1: { title: 'SQL Lab Practice', Component: DbmsSafeExam },
    },
  },
};

// ─── Spinner ───────────────────────────────────────────────────────────────────
function ExamSpinner({ color }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        border: `4px solid rgba(255,255,255,0.15)`,
        borderTop: `4px solid ${color}`,
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ marginTop: 20, color: '#94a3b8', fontSize: 15 }}>Loading experiment…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Fullscreen countdown ──────────────────────────────────────────────────────
function FullscreenPrompt({ onAccept }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
        padding: '48px 40px', maxWidth: 440, textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>[LOCK]</div>
        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Safe Exam Browser
        </h2>
        <p style={{ color: '#94a3b8', marginTop: 12, lineHeight: 1.7, fontSize: 14 }}>
          This experiment will run in <strong style={{ color: '#f1f5f9' }}>fullscreen mode</strong>.
          Copy, paste, tab switching, right-click, and developer tools are <strong style={{ color: '#f87171' }}>disabled</strong>.
        </p>
        <ul style={{
          textAlign: 'left', color: '#94a3b8', fontSize: 13,
          margin: '20px 0', padding: '0 0 0 18px', lineHeight: 2,
        }}>
          <li>[!] Copy / Paste / Cut blocked</li>
          <li>[!] Right-click disabled</li>
          <li>[!] DevTools (F12) blocked</li>
          <li>[!] Tab switch = instant logout</li>
          <li>[!] Exiting fullscreen = instant logout</li>
        </ul>
        <button
          id="safe-exam-enter-btn"
          onClick={onAccept}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(79,70,229,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 25px rgba(79,70,229,0.5)'; }}
          onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 4px 15px rgba(79,70,229,0.4)'; }}
        >
          Enter Safe Exam Mode →
        </button>
      </div>
    </div>
  );
}

// ─── Main SafeExamPage ─────────────────────────────────────────────────────────
export default function SafeExamPage() {
  const { lab, experimentId } = useParams();
  const navigate = useNavigate();
  const autoLogoutHandled = useRef(false);

  const labKey = (lab || '').toLowerCase();
  const expId = parseInt(experimentId, 10);
  const labMeta = LAB_META[labKey];

  // ── Auth: read from localStorage (set by the parent lab tab) ──────────────
  const [auth, setAuth] = useState(() => {
    if (!labMeta) return null;
    try {
      const saved = localStorage.getItem(labMeta.authKey);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // ── Exam accepted (shows FullscreenPrompt first) ───────────────────────────
  const [examAccepted, setExamAccepted] = useState(false);
  const [completed, setCompleted] = useState(false);

  // ── BroadcastChannel: listen to logout/warning from main tab ──────────────
  useEffect(() => {
    const channel = new BroadcastChannel(`smartlabx-${labKey}`);
    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'LOGOUT') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('smartlabx-auth');
        localStorage.removeItem('smartlabx-cn-auth');
        localStorage.removeItem('smartlabx-os-auth');
        window.location.replace('/login');
      }
      if (type === 'STAFF_WARNING') {
        alert(`[!] FACULTY WARNING\n\n"${payload?.message}"\n\n— ${payload?.sender || 'Staff'}`);
      }
      if (type === 'AUTH_UPDATE') {
        setAuth(payload);
      }
    };
    return () => channel.close();
  }, [labKey]);

  // ── Security callbacks ─────────────────────────────────────────────────────
  const handleViolation = useCallback(({ type, count, max }) => {
    const msgs = {
      'copy': '[!] Copy is not allowed during the experiment!',
      'paste': '[!] Paste is not allowed during the experiment!',
      'cut': '[!] Cut is not allowed during the experiment!',
      'right-click': '[!] Right-click is disabled during the experiment!',
      'devtools-f12': '[!] Developer tools are blocked during the experiment!',
      'devtools-shortcut': '[!] Developer tools are blocked during the experiment!',
      'view-source': '[!] View Source is blocked during the experiment!',
      'tab-switch': '[!] Tab switching detected!',
      'print': '[!] Printing is disabled during the experiment!',
    };
    alert(`[!] Warning ${count}/${max}: ${msgs[type] || 'Action not allowed!'}\n\nYou will be logged out after ${max} violations.`);
  }, []);

  useEffect(() => {
    if (!auth || !examAccepted) return;

    const lockKey = `smartlabx-safe-exam-lock-${labKey}`;
    const existingLock = sessionStorage.getItem(lockKey);
    if (existingLock && existingLock !== window.name) {
      alert('[!] This safe exam session is already active in another tab. This tab will close.');
      window.close();
      return;
    }

    if (!window.name) {
      window.name = `${labKey}-${Date.now()}`;
    }
    sessionStorage.setItem(lockKey, window.name);

    const handleBeforeUnload = () => {
      sessionStorage.removeItem(lockKey);
    };

    const handleRouteGuard = () => {
      const currentPath = window.location.pathname;
      const allowedPattern = new RegExp(`^/safe-exam/${labKey}/\\d+$`);
      if (!allowedPattern.test(currentPath)) {
        alert('[!] This tab is restricted to the active experiment only.');
        window.close();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleRouteGuard);

    return () => {
      sessionStorage.removeItem(lockKey);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleRouteGuard);
    };
  }, [auth, examAccepted, labKey]);

  const handleAutoLogout = useCallback(() => {
    // Prevent duplicate logout alerts/navigation when multiple browser events fire together.
    if (autoLogoutHandled.current) return;
    autoLogoutHandled.current = true;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('smartlabx-auth');
    localStorage.removeItem('smartlabx-cn-auth');
    localStorage.removeItem('smartlabx-os-auth');
    localStorage.removeItem('smartlabx-dbms-auth');
    localStorage.removeItem('smartlabx-completed');
    localStorage.removeItem('smartlabx-cn-completed');
    localStorage.removeItem('smartlabx-os-completed');
    // Notify main tab
    try {
      const channel = new BroadcastChannel(`smartlabx-${labKey}`);
      channel.postMessage({ type: 'STUDENT_LOGOUT', payload: { reason: 'violations' } });
      channel.close();
    } catch { }

    alert('[!!] You have been logged out after 3 security warnings.');
    window.location.replace('/');
  }, [labKey]);

  const isInExperiment = examAccepted && auth?.role === 'student';

  const handleAcceptExam = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen request failed', error);
    }
    setExamAccepted(true);
  }, []);

  useLabSecurity({
    enabled: isInExperiment,
    studentEmail: auth?.email || '',
    onViolation: handleViolation,
    onAutoLogout: handleAutoLogout,
    maxViolations: 3,
  });
  const handleComplete = useCallback((id) => {
    setCompleted(true);
    try {

      const key = labMeta?.completedKey || 'smartlabx-completed';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (!existing.includes(id)) {
        localStorage.setItem(key, JSON.stringify([...existing, id]));
      }
      const channel = new BroadcastChannel(`smartlabx-${labKey}`);
      channel.postMessage({ type: 'EXPERIMENT_COMPLETE', payload: { experimentId: id } });
      channel.close();
    } catch { }
  }, [labKey, labMeta]);

  // ── Guard: invalid lab ─────────────────────────────────────────────────────
  if (!labMeta) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <p style={{ color: '#f87171', fontSize: 18 }}>[X] Unknown lab: "{lab}". Please close this tab.</p>
      </div>
    );
  }

  // ── Guard: not authenticated ───────────────────────────────────────────────
  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <div style={{ textAlign: 'center', color: '#f1f5f9' }}>
          <div style={{ fontSize: 48 }}></div>
          <h2 style={{ marginTop: 12 }}>Not Authenticated</h2>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>
            Please log in on the main lab page first, then click "Start Experiment".
          </p>
          <button
            onClick={() => window.close()}
            style={{ marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  // ── Guard: DBMS experiments not migrated yet ───────────────────────────────
  const expMeta = labMeta.experiments?.[expId];
  if (!expMeta) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <p style={{ color: '#f87171', fontSize: 18 }}>
          Experiment {expId} not found in {labMeta.name} lab.
        </p>
      </div>
    );
  }

  // ── Show fullscreen consent prompt first ──────────────────────────────────
  if (!examAccepted) {
    return <FullscreenPrompt onAccept={handleAcceptExam} />;
  }

  // ── Completed screen ───────────────────────────────────────────────────────
  if (completed) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)',
      }}>
        <div style={{
          background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
          borderRadius: 24, padding: '48px 40px', maxWidth: 440, textAlign: 'center',
        }}>
          <div style={{ fontSize: 56 }}>[OK]</div>
          <h2 style={{ color: '#34d399', fontSize: 22, fontWeight: 700, marginTop: 12 }}>
            Experiment Completed!
          </h2>
          <p style={{ color: '#94a3b8', marginTop: 10, lineHeight: 1.7 }}>
            <strong style={{ color: '#f1f5f9' }}>{expMeta.title}</strong> has been marked as complete.
            You can safely close this tab.
          </p>
          <button
            onClick={() => window.close()}
            style={{
              marginTop: 24, padding: '12px 32px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#059669,#10b981)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  const { Component } = expMeta;

  // ── Render the experiment ──────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Safe Exam Banner */}
      <div id="safe-exam-banner" style={{
        background: `linear-gradient(90deg, #1e293b 0%, #0f172a 100%)`,
        color: '#fff', padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, fontSize: 14, fontWeight: 600,
        letterSpacing: '0.02em', boxShadow: '0 2px 8px rgba(15,23,42,0.3)',
        position: 'sticky', top: 0, zIndex: 1000,
      }}>
        <span style={{ fontSize: 18 }}>[LOCK]</span>
        <span>Safe Exam Mode Active — {labMeta.name} &middot; {expMeta.title}</span>
        <span style={{
          background: 'rgba(255,255,255,0.2)', padding: '2px 12px',
          borderRadius: 999, fontSize: 12, fontWeight: 700,
        }}>
          10 violations = auto-logout
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)', padding: '2px 10px',
            borderRadius: 999, fontSize: 12, fontWeight: 600,
          }}>
            Logged in as: {auth.name}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              sessionStorage.removeItem('smartlabx-user');
              window.location.href = '/login';
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Experiment Content */}
      <div style={{ padding: '24px' }}>
        <Suspense fallback={<ExamSpinner color={labMeta.color} />}>
          <Component
            onBack={() => window.close()}
            onComplete={handleComplete}
          />
        </Suspense>
        {labKey === 'os' && !completed && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => handleComplete(expId)}
              style={{
                padding: '10px 18px', border: 'none', borderRadius: 10,
                background: '#059669', color: '#fff', fontWeight: 700,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Mark Experiment Complete
            </button>
          </div>
        )}
      </div>

      {/* InvigiLMNce AI Proctoring Camera HUD */}
      <ProctorHUD
        studentId={String(
          auth?.studentId || auth?.student_id || auth?.id || auth?.email || auth?.name || 'STU_DEMO'
        ).trim().replace(/[^a-zA-Z0-9_-]/g, '_')}
        studentName={auth?.name || auth?.fullName || 'Student'}
      />
    </div>
  );
}
