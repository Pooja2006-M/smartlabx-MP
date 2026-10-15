import React, { useState, useEffect } from 'react';
import { getAllCognitiveFrictionRecords, calculateCognitiveFrictionScore } from '../utils/liveTracker';

// DBMS Lab Experiments List
const DBMS_EXPERIMENTS = [
  { id: 'exp1', name: 'Basic SELECT Queries', queryKeywords: ['SELECT'], description: 'Simple SELECT statements' },
  { id: 'exp2', name: 'WHERE & Filtering', queryKeywords: ['WHERE', 'LIKE', 'BETWEEN', 'IN ('], description: 'Conditional filtering' },
  { id: 'exp3', name: 'JOIN Operations', queryKeywords: ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'], description: 'Table joining' },
  { id: 'exp4', name: 'Aggregate Functions', queryKeywords: ['COUNT(', 'SUM(', 'AVG(', 'MAX(', 'MIN(', 'GROUP BY'], description: 'Aggregation & grouping' },
  { id: 'exp5', name: 'Subqueries', queryKeywords: ['SELECT', '(SELECT'], description: 'Nested queries' },
  { id: 'exp6', name: 'INSERT Operations', queryKeywords: ['INSERT INTO'], description: 'Data insertion' },
  { id: 'exp7', name: 'UPDATE Operations', queryKeywords: ['UPDATE'], description: 'Data modification' },
  { id: 'exp8', name: 'DELETE Operations', queryKeywords: ['DELETE FROM'], description: 'Data deletion' },
  { id: 'exp9', name: 'CREATE TABLE', queryKeywords: ['CREATE TABLE'], description: 'Table creation (DDL)' },
  { id: 'exp10', name: 'CREATE INDEX', queryKeywords: ['CREATE INDEX'], description: 'Index management' },
];

function checkExperimentDone(queries, experiment) {
  return queries.some((q) => {
    const upper = (q.query || '').toUpperCase();
    return experiment.queryKeywords.some((kw) => upper.includes(kw));
  });
}

export default function StaffMonitorWidgets({ auth }) {
  if (!auth || auth.role !== 'staff') return null;

  const [logs, setLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('smartlabx-ai-logs');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [securityLogs, setSecurityLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('smartlabx-security-logs');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [queryLogs, setQueryLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('smartlabx-query-logs');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [frictionRecords, setFrictionRecords] = useState(() => getAllCognitiveFrictionRecords());
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        try {
          const savedAi = window.localStorage.getItem('smartlabx-ai-logs');
          if (savedAi) setLogs(JSON.parse(savedAi));

          const savedSec = window.localStorage.getItem('smartlabx-security-logs');
          if (savedSec) setSecurityLogs(JSON.parse(savedSec));

          const savedQueries = window.localStorage.getItem('smartlabx-query-logs');
          if (savedQueries) setQueryLogs(JSON.parse(savedQueries));

          setFrictionRecords(getAllCognitiveFrictionRecords());
        } catch (e) {}
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Build per-student summary from query logs
  const studentSummary = {};
  queryLogs.forEach((log) => {
    if (!studentSummary[log.email]) {
      studentSummary[log.email] = {
        name: log.studentName || log.email,
        email: log.email,
        totalQueries: 0,
        successQueries: 0,
        failedQueries: 0,
        queries: [],
        queryTypes: {},
        lastActive: log.time || '',
      };
    }
    const s = studentSummary[log.email];
    s.totalQueries += 1;
    if (log.success) s.successQueries += 1;
    else s.failedQueries += 1;
    s.queries.push(log);
    s.queryTypes[log.queryType] = (s.queryTypes[log.queryType] || 0) + 1;
    if (!s.lastActive) s.lastActive = log.time;
  });

  const studentList = Object.values(studentSummary).sort((a, b) => b.totalQueries - a.totalQueries);

  // Get experiment progress for a specific student
  const getStudentExperiments = (email) => {
    const studentQueries = queryLogs.filter((q) => q.email === email);
    return DBMS_EXPERIMENTS.map((exp) => ({
      ...exp,
      completed: checkExperimentDone(studentQueries, exp),
    }));
  };

  // Overall class stats
  const totalStudentsActive = studentList.length;
  const totalQueriesExecuted = queryLogs.length;
  const overallCompleted = studentList.reduce((sum, s) => {
    const exps = getStudentExperiments(s.email);
    return sum + exps.filter((e) => e.completed).length;
  }, 0);
  const overallTotal = totalStudentsActive * DBMS_EXPERIMENTS.length;

  return (
    <div className="w-full mt-10 border-t border-slate-200 pt-8 pb-4">
      <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto">

        {/* ── COGNITIVE FRICTION DETECTION & ANALYTICS WIDGET (NEW) ── */}
        <div className="rounded-[1.75rem] border border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h4 className="text-base font-bold text-amber-950">Cognitive Friction Detection Engine</h4>
                <span className="rounded-full bg-amber-200 px-3 py-0.5 text-xs font-extrabold text-amber-900 border border-amber-300">
                  Real-time Friction Scoring & Alerting
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800">
                Automated threshold monitoring for repeated errors, idle time, edit-to-run cycles, stuck loops, and faculty struggle alerts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">Class Avg Friction</p>
                {(() => {
                  const recordsArr = Object.values(frictionRecords);
                  const avg = recordsArr.length > 0
                    ? Math.round(recordsArr.reduce((acc, r) => acc + (r.frictionScore || 0), 0) / recordsArr.length)
                    : 15;
                  return <p className={`text-xl font-black ${avg >= 55 ? 'text-rose-600' : avg >= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{avg}/100</p>;
                })()}
              </div>
            </div>
          </div>

          {/* Cognitive Friction Metrics Grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(() => {
              const recordsArr = Object.values(frictionRecords);
              const highFrictionCount = recordsArr.filter(r => (r.frictionScore || 0) >= 55).length;
              const totalRepeatedErrors = recordsArr.reduce((acc, r) => acc + (r.repeatedErrorsCount || 0), 0);
              const totalCycles = recordsArr.reduce((acc, r) => acc + (r.editRunCycles || 0), 0);

              return (
                <>
                  <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-xs">
                    <p className="text-2xl font-black text-rose-600">{highFrictionCount}</p>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">High Struggle Alerts</p>
                    <p className="text-[10px] text-slate-400">Score ≥ 55 (Needs Faculty Help)</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs">
                    <p className="text-2xl font-black text-amber-600">{totalRepeatedErrors}</p>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">Repeated Error Loops</p>
                    <p className="text-[10px] text-slate-400">Identical error repetitions</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-xs">
                    <p className="text-2xl font-black text-indigo-600">{totalCycles}</p>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">Edit → Run Cycles</p>
                    <p className="text-[10px] text-slate-400">Total code edit/run loops</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
                    <p className="text-2xl font-black text-emerald-600">Active</p>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">Threshold Guard</p>
                    <p className="text-[10px] text-slate-400">Auto Alert Trigger Active</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Student Cognitive Friction Table */}
          <div className="mt-5 overflow-x-auto rounded-2xl border border-amber-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-amber-100 text-sm">
              <thead className="bg-amber-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-900 uppercase">Student</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-900 uppercase">Friction Score</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-900 uppercase">Level</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-rose-800 uppercase">Repeated Errors</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-indigo-800 uppercase">Edit-Run Cycles</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Debugging State</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-900 uppercase">Faculty Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {Object.keys(frictionRecords).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-xs text-amber-800 italic">
                      No cognitive friction events logged yet. Data updates live as students code and execute queries.
                    </td>
                  </tr>
                ) : (
                  Object.values(frictionRecords).map((record) => {
                    const analysis = calculateCognitiveFrictionScore(record);
                    return (
                      <tr key={record.email} className={`hover:bg-amber-50/30 transition ${analysis.isAlert ? 'bg-rose-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 text-xs">{record.name}</p>
                          <p className="text-[10px] text-slate-400">{record.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span className="font-black text-sm text-slate-800">{analysis.frictionScore}</span>
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${analysis.frictionScore}%`,
                                  background: analysis.frictionScore >= 75 ? '#dc2626' : analysis.frictionScore >= 55 ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${analysis.badgeColor}`}>
                            {analysis.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-rose-700 text-xs">
                          {record.repeatedErrorsCount || 0}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-700 text-xs">
                          {record.editRunCycles || 0}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                          {analysis.debuggingBehavior}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {analysis.isAlert ? (
                            <span className="rounded-full bg-rose-600 text-white px-3 py-1 text-[10px] font-black animate-pulse">
                              HIGH FRICTION
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-semibold">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Student Query Activity & Experiment Progress ── */}
        <div className="rounded-[1.75rem] border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-indigo-900">[TRACK] Student Query Activity & Experiment Progress</h4>
              <p className="mt-1 text-xs text-indigo-700">Real-time tracking of SQL query executions and DBMS experiment completion per student.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                {totalStudentsActive} Students Active
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {totalQueriesExecuted} Queries
              </span>
            </div>
          </div>

          {/* Class Overview Stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-indigo-100 bg-white p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">{totalStudentsActive}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Students</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{totalQueriesExecuted}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Queries</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-white p-3 text-center">
              <p className="text-2xl font-bold text-violet-700">{overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0}%</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Class Completion</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-white p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{DBMS_EXPERIMENTS.length}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Experiments</p>
            </div>
          </div>

          {/* Student-wise Table */}
          {studentList.length === 0 ? (
            <p className="mt-4 text-sm text-indigo-600 italic">No student query activity logged yet. Data will appear once students run queries.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-indigo-100 shadow-xs">
              <table className="min-w-full divide-y divide-indigo-100 text-sm">
                <thead className="bg-indigo-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-indigo-800 uppercase tracking-wider">Total Queries</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-emerald-800 uppercase tracking-wider">Success</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-rose-800 uppercase tracking-wider">Failed</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-violet-800 uppercase tracking-wider">Experiments Done</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-amber-800 uppercase tracking-wider">Incomplete</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Last Active</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 bg-white">
                  {studentList.map((student) => {
                    const exps = getStudentExperiments(student.email);
                    const completed = exps.filter((e) => e.completed).length;
                    const incomplete = exps.length - completed;
                    const progressPct = Math.round((completed / exps.length) * 100);
                    return (
                      <tr key={student.email} className="hover:bg-indigo-50/40 transition">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{student.name}</p>
                          <p className="text-[11px] text-slate-500">{student.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-700">{student.totalQueries}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{student.successQueries}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">{student.failedQueries}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{completed}/{exps.length}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{incomplete}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progressPct}%`,
                                  background: progressPct === 100 ? '#059669' : progressPct >= 50 ? '#6366f1' : '#f59e0b',
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 min-w-[32px] text-right">{progressPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{student.lastActive}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedStudent(selectedStudent === student.email ? null : student.email)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            {selectedStudent === student.email ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Expanded Student Detail View */}
          {selectedStudent && studentSummary[selectedStudent] && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-bold text-slate-900">
                  {studentSummary[selectedStudent].name} — Detailed Progress
                </h5>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>

              {/* Experiment Checklist */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Experiment Completion Status</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getStudentExperiments(selectedStudent).map((exp) => (
                    <div
                      key={exp.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                        exp.completed
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        exp.completed ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white'
                      }`}>
                        {exp.completed ? '✓' : '—'}
                      </span>
                      <div>
                        <p className="font-semibold">{exp.name}</p>
                        <p className="text-[10px] opacity-75">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Query Type Breakdown */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Query Type Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(studentSummary[selectedStudent].queryTypes).map(([type, count]) => (
                    <span key={type} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Queries */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Recent Queries (Last 10)</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {studentSummary[selectedStudent].queries.slice(0, 10).map((q) => (
                    <div key={q.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          q.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {q.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">{q.queryType}</span>
                        <span className="text-slate-400 text-[10px]">{q.time}</span>
                      </div>
                      <p className="font-mono text-slate-600 truncate">{q.query}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Staff Security Tracker: Monitor Student Exam Entry / Exits */}
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50/50 p-5 shadow-sm h-full">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-rose-900">[SEC] Student Exam Entrance & Exit Tracker</h4>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                  {securityLogs.length} Events
                </span>
              </div>
              <p className="mt-1 text-xs text-rose-700">Staff monitoring: Tracks when students enter/leave exams or switch tabs.</p>
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                {securityLogs.length === 0 ? (
                  <p className="text-sm text-rose-600 italic">No security events logged yet.</p>
                ) : (
                  securityLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-rose-200 bg-white p-3 text-xs shadow-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">{log.email}</span>
                        <span className="text-rose-600 font-mono">{log.time}</span>
                      </div>
                      <p className={`font-semibold ${log.type.includes('EXIT') || log.type.includes('LOGOUT') ? 'text-red-600' : 'text-emerald-700'}`}>
                        {log.type.includes('EXIT') || log.type.includes('LOGOUT') ? '[X] Exited Exam: ' : '[OK] Entered Exam: '}
                        {log.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
          </div>

          {/* Student AI Activity */}
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm h-full">
              <h4 className="text-sm font-semibold text-slate-900">Student AI Questions Log</h4>
              <p className="mt-1 text-xs text-slate-500">Live feed of DBMS questions asked by students.</p>
              <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-500">No questions asked yet.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-700">{log.email}</span>
                        <span className="text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-slate-600 italic">"{log.question}"</p>
                    </div>
                  ))
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
