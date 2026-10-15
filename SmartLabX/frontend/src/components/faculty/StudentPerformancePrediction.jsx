import React, { useState, useMemo } from 'react';

/* ─────── Sample Student Performance Data ─────── */
const STUDENT_DATA = [
  { id: 'STU-2048', name: 'Aarav Kumar', batch: 'Batch 43', dbms: 24, cn: 21, os: 27, viva: 18, attendance: 91, labCompleted: 7, totalLabs: 9, submissions: 12, totalAssignments: 14, avgResponseTime: 28 },
  { id: 'STU-2049', name: 'Meera Nair', batch: 'Batch 43', dbms: 28, cn: 26, os: 29, viva: 19, attendance: 96, labCompleted: 9, totalLabs: 9, submissions: 14, totalAssignments: 14, avgResponseTime: 18 },
  { id: 'STU-2050', name: 'Ravi Shankar', batch: 'Batch 43', dbms: 18, cn: 15, os: 20, viva: 12, attendance: 72, labCompleted: 5, totalLabs: 9, submissions: 8, totalAssignments: 14, avgResponseTime: 45 },
  { id: 'STU-2051', name: 'Kavya Menon', batch: 'Batch 43', dbms: 22, cn: 24, os: 25, viva: 17, attendance: 88, labCompleted: 8, totalLabs: 9, submissions: 13, totalAssignments: 14, avgResponseTime: 22 },
  { id: 'STU-2052', name: 'Arjun Das', batch: 'Batch 43', dbms: 15, cn: 12, os: 14, viva: 10, attendance: 64, labCompleted: 4, totalLabs: 9, submissions: 6, totalAssignments: 14, avgResponseTime: 55 },
  { id: 'STU-2053', name: 'Priya Sharma', batch: 'Batch 43', dbms: 26, cn: 23, os: 28, viva: 18, attendance: 93, labCompleted: 8, totalLabs: 9, submissions: 13, totalAssignments: 14, avgResponseTime: 20 },
  { id: 'STU-2054', name: 'Deepak Raj', batch: 'Batch 44', dbms: 20, cn: 19, os: 22, viva: 14, attendance: 79, labCompleted: 6, totalLabs: 9, submissions: 10, totalAssignments: 14, avgResponseTime: 35 },
  { id: 'STU-2055', name: 'Ananya Iyer', batch: 'Batch 44', dbms: 27, cn: 25, os: 26, viva: 19, attendance: 95, labCompleted: 9, totalLabs: 9, submissions: 14, totalAssignments: 14, avgResponseTime: 16 },
  { id: 'STU-2056', name: 'Karthik Vel', batch: 'Batch 44', dbms: 14, cn: 16, os: 18, viva: 11, attendance: 68, labCompleted: 5, totalLabs: 9, submissions: 7, totalAssignments: 14, avgResponseTime: 50 },
  { id: 'STU-2057', name: 'Lakshmi Bala', batch: 'Batch 44', dbms: 25, cn: 22, os: 24, viva: 16, attendance: 85, labCompleted: 7, totalLabs: 9, submissions: 11, totalAssignments: 14, avgResponseTime: 25 },
];

/* ─────── AI Prediction Engine (Weighted Scoring Model) ─────── */
function predictStudent(s) {
  // Normalize scores to 0-100 scale
  const dbmsPct = (s.dbms / 30) * 100;
  const cnPct = (s.cn / 30) * 100;
  const osPct = (s.os / 30) * 100;
  const vivaPct = (s.viva / 20) * 100;
  const labPct = (s.labCompleted / s.totalLabs) * 100;
  const subPct = (s.submissions / s.totalAssignments) * 100;

  // Weighted overall performance score
  const overallScore = (
    dbmsPct * 0.20 +
    cnPct * 0.15 +
    osPct * 0.15 +
    vivaPct * 0.15 +
    s.attendance * 0.15 +
    labPct * 0.10 +
    subPct * 0.10
  );

  // Semester prediction (scale to GPA-like 10 point)
  const predictedGPA = Math.min(10, Math.max(0, (overallScore / 10).toFixed(1)));

  // Semester percentage prediction
  const predictedPct = Math.min(100, Math.max(0, Math.round(overallScore)));

  // Grade prediction
  let predictedGrade;
  if (predictedPct >= 90) predictedGrade = 'O';
  else if (predictedPct >= 80) predictedGrade = 'A+';
  else if (predictedPct >= 70) predictedGrade = 'A';
  else if (predictedPct >= 60) predictedGrade = 'B+';
  else if (predictedPct >= 50) predictedGrade = 'B';
  else predictedGrade = 'C';

  // Risk level
  let risk = 'LOW';
  let riskColor = '#10b981';
  if (predictedPct < 50) { risk = 'HIGH'; riskColor = '#ef4444'; }
  else if (predictedPct < 70) { risk = 'MEDIUM'; riskColor = '#f59e0b'; }

  // Trend analysis
  const avgLabScore = ((dbmsPct + cnPct + osPct) / 3);
  let trend = 'Stable';
  let trendIcon = '→';
  if (avgLabScore > vivaPct + 10) { trend = 'Lab Strong, Viva Weak'; trendIcon = '[!]'; }
  else if (vivaPct > avgLabScore + 10) { trend = 'Viva Strong, Lab Weak'; trendIcon = '[MARKS]'; }
  else if (predictedPct >= 80) { trend = 'Improving'; trendIcon = ''; }
  else if (predictedPct < 55) { trend = 'Declining'; trendIcon = ''; }

  // Improvement areas
  const improvements = [];
  if (s.attendance < 80) improvements.push('Improve attendance (currently ' + s.attendance + '%)');
  if (dbmsPct < 60) improvements.push('Focus on DBMS practicals');
  if (cnPct < 60) improvements.push('Strengthen Computer Networks concepts');
  if (osPct < 60) improvements.push('Work on OS lab experiments');
  if (vivaPct < 70) improvements.push('Prepare better for viva questions');
  if (subPct < 80) improvements.push('Complete pending assignments (' + s.submissions + '/' + s.totalAssignments + ')');
  if (s.avgResponseTime > 40) improvements.push('Reduce average task completion time');

  // Strengths
  const strengths = [];
  if (dbmsPct >= 80) strengths.push('DBMS');
  if (cnPct >= 80) strengths.push('Networks');
  if (osPct >= 80) strengths.push('OS');
  if (vivaPct >= 85) strengths.push('Viva');
  if (s.attendance >= 90) strengths.push('Attendance');

  return {
    ...s,
    overallScore: Math.round(overallScore),
    predictedGPA: Number(predictedGPA),
    predictedPct,
    predictedGrade,
    risk,
    riskColor,
    trend,
    trendIcon,
    improvements,
    strengths,
    dbmsPct: Math.round(dbmsPct),
    cnPct: Math.round(cnPct),
    osPct: Math.round(osPct),
    vivaPct: Math.round(vivaPct),
    labPct: Math.round(labPct),
    subPct: Math.round(subPct),
  };
}

/* ─────── Progress Bar Component ─────── */
function ProgressBar({ value, max = 100, color = '#6366f1', height = 8, label }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: 11, color: color, fontWeight: 700 }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ height, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          borderRadius: 99,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

/* ─────── Radial Score Component ─────── */
function RadialScore({ value, size = 80, color = '#6366f1', label }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e2e8f0" strokeWidth={5}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: size * 0.25, fontWeight: 800, fill: color }}>
          {value}%
        </text>
      </svg>
      {label && <p style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{label}</p>}
    </div>
  );
}

/* ─────── Main Component ─────── */
export default function StudentPerformancePrediction() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterBatch, setFilterBatch] = useState('All');
  const [sortBy, setSortBy] = useState('predictedPct');
  const [sortDir, setSortDir] = useState('desc');

  const predictions = useMemo(() => STUDENT_DATA.map(predictStudent), []);

  const batches = ['All', ...new Set(STUDENT_DATA.map(s => s.batch))];

  const filtered = useMemo(() => {
    let list = filterBatch === 'All' ? predictions : predictions.filter(s => s.batch === filterBatch);
    list.sort((a, b) => sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]);
    return list;
  }, [predictions, filterBatch, sortBy, sortDir]);

  // Class-level stats
  const classAvg = Math.round(predictions.reduce((s, p) => s + p.predictedPct, 0) / predictions.length);
  const highRisk = predictions.filter(p => p.risk === 'HIGH').length;
  const medRisk = predictions.filter(p => p.risk === 'MEDIUM').length;
  const topPerformers = predictions.filter(p => p.predictedPct >= 80).length;

  const student = selectedStudent ? predictions.find(p => p.id === selectedStudent) : null;

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #312e81 50%, #4f46e5 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        boxShadow: '0 10px 40px rgba(79, 70, 229, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#6ee7b7',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            AI-Powered Prediction Engine
          </span>
          <span style={{
            background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#a5b4fc',
          }}>
            Semester Score Forecasting
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
           Student Performance Prediction
        </h2>
        <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14, maxWidth: 700 }}>
          AI analyzes lab scores, viva marks, attendance, submission rate, and task completion time to predict each student's semester outcome and identify at-risk students early.
        </p>
      </div>

      {/* Class-Level KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Class Average Prediction', value: `${classAvg}%`, sub: 'Across all students', color: '#6366f1', icon: '[CHART]' },
          { label: 'Top Performers (≥80%)', value: topPerformers, sub: 'Predicted A+ or O Grade', color: '#10b981', icon: '⭐' },
          { label: 'Medium Risk Students', value: medRisk, sub: 'Need monitoring', color: '#f59e0b', icon: '[!]' },
          { label: 'High Risk Students', value: highRisk, sub: 'Urgent intervention needed', color: '#ef4444', icon: '[!!]' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: 'white', borderRadius: 16, padding: '20px 24px',
            border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
                <p style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 6 }}>{kpi.sub}</p>
              </div>
              <span style={{ fontSize: 28 }}>{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Sort Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
        background: 'white', borderRadius: 14, padding: '14px 20px',
        border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Batch:</span>
          {batches.map(b => (
            <button key={b} onClick={() => setFilterBatch(b)} style={{
              padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: filterBatch === b ? '#6366f1' : '#f1f5f9',
              color: filterBatch === b ? 'white' : '#64748b',
              fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
            }}>{b}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 12, fontWeight: 600, color: '#374151', background: '#f8fafc', cursor: 'pointer',
          }}>
            <option value="predictedPct">Predicted Score</option>
            <option value="overallScore">Overall Performance</option>
            <option value="attendance">Attendance</option>
            <option value="dbmsPct">DBMS Score</option>
          </select>
          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{
            padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: '#f8fafc', fontSize: 12, cursor: 'pointer', fontWeight: 700, color: '#64748b',
          }}>{sortDir === 'desc' ? '↓ High→Low' : '↑ Low→High'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: student ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* Student List Table */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
               Student Predictions ({filtered.length})
            </h3>
          </div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Predicted</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Grade</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Risk</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Trend</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}
                    onClick={() => setSelectedStudent(p.id)}
                    style={{
                      cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                      background: selectedStudent === p.id ? '#eef2ff' : 'white',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (selectedStudent !== p.id) e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={e => { if (selectedStudent !== p.id) e.currentTarget.style.background = 'white'; }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${p.riskColor}40, ${p.riskColor}20)`,
                          border: `2px solid ${p.riskColor}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800, color: p.riskColor, flexShrink: 0,
                        }}>
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{p.name}</p>
                          <p style={{ color: '#94a3b8', fontSize: 11 }}>{p.id} · {p.batch}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: p.riskColor }}>{p.predictedPct}%</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 8,
                        background: p.predictedGrade === 'O' ? '#ecfdf5' : p.predictedGrade === 'A+' ? '#eef2ff' : p.predictedGrade === 'A' ? '#f0fdf4' : '#fffbeb',
                        color: p.predictedGrade === 'O' ? '#059669' : p.predictedGrade === 'A+' ? '#4338ca' : p.predictedGrade === 'A' ? '#16a34a' : '#d97706',
                        fontSize: 12, fontWeight: 800,
                      }}>{p.predictedGrade}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 8,
                        background: `${p.riskColor}15`, color: p.riskColor,
                        fontSize: 11, fontWeight: 700,
                      }}>{p.risk}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 12 }}>{p.trendIcon} {p.trend}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(p.id); }} style={{
                        padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#6366f1', cursor: 'pointer',
                      }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Student Profile */}
        {student && (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden',
          }}>
            {/* Profile Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              padding: '20px 24px', color: 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800,
                  }}>
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{student.name}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{student.id} · {student.batch}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8',
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}>[X] Close</button>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Predicted Outcome Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Predicted Score</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: student.riskColor, lineHeight: 1 }}>{student.predictedPct}%</p>
                </div>
                <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Predicted GPA</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{student.predictedGPA}</p>
                </div>
                <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Predicted Grade</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6', lineHeight: 1 }}>{student.predictedGrade}</p>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                   Subject-wise Performance
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ProgressBar value={student.dbmsPct} label="DBMS Practical" color="#6366f1" />
                  <ProgressBar value={student.cnPct} label="Computer Networks" color="#8b5cf6" />
                  <ProgressBar value={student.osPct} label="Operating Systems" color="#06b6d4" />
                  <ProgressBar value={student.vivaPct} label="Viva Score" color="#10b981" />
                  <ProgressBar value={student.attendance} label="Attendance" color={student.attendance >= 80 ? '#10b981' : '#f59e0b'} />
                  <ProgressBar value={student.subPct} label="Assignment Completion" color="#8b5cf6" />
                </div>
              </div>

              {/* Radial Scores Row */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20, padding: '16px 0', background: '#f8fafc', borderRadius: 12 }}>
                <RadialScore value={student.overallScore} color="#6366f1" label="Overall" size={72} />
                <RadialScore value={student.labPct} color="#10b981" label="Lab Done" size={72} />
                <RadialScore value={student.subPct} color="#8b5cf6" label="Submissions" size={72} />
                <RadialScore value={student.attendance} color={student.attendance >= 80 ? '#06b6d4' : '#f59e0b'} label="Attendance" size={72} />
              </div>

              {/* Strengths */}
              {student.strengths.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginBottom: 8 }}> Strengths</h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {student.strengths.map(s => (
                      <span key={s} style={{
                        padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements Needed */}
              {student.improvements.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}> Areas to Improve</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {student.improvements.map((imp, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', borderRadius: 8,
                        background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12, color: '#92400e',
                      }}>
                        <span style={{ fontSize: 14 }}></span>
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
