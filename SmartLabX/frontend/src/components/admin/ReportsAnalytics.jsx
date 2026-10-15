import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const allStudents = [
  { sno: 1, name: 'Arjun', email: 'arjun@student.com', branch: 'CSE', attendance: 9, assignmentsPending: 1, ptClass: 4, dsa: 52, remarks: 'Good progress in completing assignments and submitting on time.' },
  { sno: 2, name: 'Meera', email: 'meera@student.com', branch: 'CSE', attendance: 8, assignmentsPending: 2, ptClass: 3, dsa: 48, remarks: 'Moderate performance. Encouraged to attend sessions regularly.' },
  { sno: 3, name: 'Ravi', email: 'ravi@student.com', branch: 'ECE', attendance: 6, assignmentsPending: 4, ptClass: 2, dsa: 30, remarks: 'Low attendance. Needs significant improvement in assignments.' },
  { sno: 4, name: 'Kavya', email: 'kavya@student.com', branch: 'CSE', attendance: 10, assignmentsPending: 0, ptClass: 5, dsa: 58, remarks: 'Outstanding performance with full attendance and timely submissions.' },
  { sno: 5, name: 'Sanjay', email: 'sanjay@student.com', branch: 'IT', attendance: 7, assignmentsPending: 3, ptClass: 3, dsa: 35, remarks: 'Inconsistent attendance. Overall progress is moderate.' },
  { sno: 6, name: 'Priya', email: 'priya@student.com', branch: 'CSE', attendance: 9, assignmentsPending: 1, ptClass: 4, dsa: 50, remarks: 'Good conceptual clarity and lab performance.' },
  { sno: 7, name: 'Vikram', email: 'vikram@student.com', branch: 'ECE', attendance: 10, assignmentsPending: 0, ptClass: 5, dsa: 55, remarks: 'Excellent performance across all experiments.' },
  { sno: 8, name: 'Sneha', email: 'sneha@student.com', branch: 'IT', attendance: 5, assignmentsPending: 5, ptClass: 2, dsa: 22, remarks: 'Poor attendance and multiple pending assignments. Needs counselling.' },
  { sno: 9, name: 'Rahul', email: 'rahul@student.com', branch: 'CSE', attendance: 8, assignmentsPending: 2, ptClass: 4, dsa: 47, remarks: 'Performing well. Focus on completing pending tasks.' },
  { sno: 10, name: 'Ananya', email: 'ananya@student.com', branch: 'CSE', attendance: 10, assignmentsPending: 0, ptClass: 5, dsa: 60, remarks: 'Top performer with perfect scores and full attendance.' },
  { sno: 11, name: 'Karthik', email: 'karthik@student.com', branch: 'ECE', attendance: 6, assignmentsPending: 3, ptClass: 3, dsa: 33, remarks: 'Average performance. Should attend lab sessions more regularly.' },
  { sno: 12, name: 'Divya', email: 'divya@student.com', branch: 'IT', attendance: 7, assignmentsPending: 2, ptClass: 3, dsa: 40, remarks: 'Improving gradually. Assignment completion rate is moderate.' },
  { sno: 13, name: 'Surya', email: 'surya@student.com', branch: 'CSE', attendance: 9, assignmentsPending: 1, ptClass: 4, dsa: 53, remarks: 'Strong lab skills with consistent submissions.' },
  { sno: 14, name: 'Shruti', email: 'shruti@student.com', branch: 'ECE', attendance: 8, assignmentsPending: 2, ptClass: 3, dsa: 44, remarks: 'Moderate marks. Good viva performance.' },
  { sno: 15, name: 'Gautham', email: 'gautham@student.com', branch: 'CSE', attendance: 7, assignmentsPending: 3, ptClass: 3, dsa: 38, remarks: 'Needs to focus on clearing pending experiments.' },
  { sno: 16, name: 'Nandini', email: 'nandini@student.com', branch: 'IT', attendance: 5, assignmentsPending: 4, ptClass: 2, dsa: 28, remarks: 'Low engagement. Attendance and submissions need improvement.' },
  { sno: 17, name: 'Ashwin', email: 'ashwin@student.com', branch: 'CSE', attendance: 9, assignmentsPending: 1, ptClass: 4, dsa: 51, remarks: 'Consistent performer with good marks.' },
  { sno: 18, name: 'Pooja', email: 'pooja@student.com', branch: 'CSE', attendance: 10, assignmentsPending: 0, ptClass: 5, dsa: 57, remarks: 'Excellent conceptual understanding and lab performance.' },
  { sno: 19, name: 'Deepak', email: 'deepak@student.com', branch: 'ECE', attendance: 6, assignmentsPending: 4, ptClass: 2, dsa: 32, remarks: 'Needs significant improvement. Attendance is low.' },
  { sno: 20, name: 'Swathi', email: 'swathi@student.com', branch: 'IT', attendance: 8, assignmentsPending: 1, ptClass: 4, dsa: 46, remarks: 'Good overall performance with minor gaps.' },
];

export default function ReportsAnalytics() {
  const [activeReport, setActiveReport] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');

  const reportTabs = [
    { key: 'students', label: 'Student Reports' },
    { key: 'faculty', label: 'Faculty Reports' },
    { key: 'departments', label: 'Department Reports' },
    { key: 'laboratories', label: 'Lab Reports' },
  ];

  const filtered = allStudents.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBranch = branchFilter === 'All' || s.branch === branchFilter;
    return matchSearch && matchBranch;
  });

  const getDsaColor = (val) => {
    if (val >= 50) return { bg: '#dcfce7', color: '#16a34a' };
    if (val >= 35) return { bg: '#fef9c3', color: '#ca8a04' };
    return { bg: '#fee2e2', color: '#dc2626' };
  };

  const getAttColor = (val) => {
    if (val >= 8) return { bg: '#dcfce7', color: '#16a34a' };
    if (val >= 6) return { bg: '#fef9c3', color: '#ca8a04' };
    return { bg: '#fee2e2', color: '#dc2626' };
  };

  // 1. Download Overall Report as Excel (.xlsx)
  const downloadOverallExcel = () => {
    const data = filtered.map(s => ({
      'S.No': s.sno,
      'Student Name': s.name,
      'Email Address': s.email,
      'Department / Branch': s.branch,
      'Attendance (out of 10)': s.attendance,
      'Assignments Pending': s.assignmentsPending,
      'PT Class Marks (out of 5)': s.ptClass,
      'DSA Marks (out of 60)': s.dsa,
      'Total Percentage (%)': `${Math.round(((s.attendance / 10) * 0.2 + (s.ptClass / 5) * 0.2 + (s.dsa / 60) * 0.6) * 100)}%`,
      'Performance Status': s.dsa >= 50 ? 'Outstanding' : s.dsa >= 35 ? 'Satisfactory' : 'Needs Improvement',
      'Faculty Remarks': s.remarks
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 25 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Performance');

    // Summary Sheet
    const summaryData = [
      { 'Metric': 'Total Students Enrolled', 'Value': filtered.length },
      { 'Metric': 'Average Attendance (out of 10)', 'Value': (filtered.reduce((s, e) => s + e.attendance, 0) / (filtered.length || 1)).toFixed(2) },
      { 'Metric': 'Average PT Class (out of 5)', 'Value': (filtered.reduce((s, e) => s + e.ptClass, 0) / (filtered.length || 1)).toFixed(2) },
      { 'Metric': 'Average DSA Score (out of 60)', 'Value': (filtered.reduce((s, e) => s + e.dsa, 0) / (filtered.length || 1)).toFixed(2) },
      { 'Metric': 'Total Pending Assignments', 'Value': filtered.reduce((s, e) => s + e.assignmentsPending, 0) },
      { 'Metric': 'High Performers (DSA >= 50)', 'Value': filtered.filter(e => e.dsa >= 50).length },
      { 'Metric': 'At Risk Students (DSA < 35)', 'Value': filtered.filter(e => e.dsa < 35).length },
      { 'Metric': 'Export Timestamp', 'Value': new Date().toLocaleString('en-IN') },
      { 'Metric': 'Generated By', 'Value': 'SmartLabX Faculty Portal' }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 32 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Analytics Summary');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `SmartLabX_Overall_Student_Report_${dateStr}.xlsx`);
  };

  // 2. Download Individual Student Report as Excel (.xlsx)
  const downloadStudentExcel = (student) => {
    const studentProfile = [
      { 'Information Field': 'Student Roll / S.No', 'Details': student.sno },
      { 'Information Field': 'Student Name', 'Details': student.name },
      { 'Information Field': 'Email ID', 'Details': student.email },
      { 'Information Field': 'Department', 'Details': student.branch },
      { 'Information Field': 'Attendance Score', 'Details': `${student.attendance} / 10 (${student.attendance * 10}%)` },
      { 'Information Field': 'Assignments Pending', 'Details': `${student.assignmentsPending} pending task(s)` },
      { 'Information Field': 'PT Class Performance', 'Details': `${student.ptClass} / 5` },
      { 'Information Field': 'DSA Practical Marks', 'Details': `${student.dsa} / 60 (${((student.dsa/60)*100).toFixed(1)}%)` },
      { 'Information Field': 'Overall Grade / Status', 'Details': student.dsa >= 50 ? 'Distinction' : student.dsa >= 35 ? 'First Class' : 'Remedial Required' },
      { 'Information Field': 'Instructor Remarks', 'Details': student.remarks },
      { 'Information Field': 'Generated On', 'Details': new Date().toLocaleString('en-IN') }
    ];

    const expDetails = [
      { 'Exp Code': 'EXP-01', 'Experiment Title': 'SQL Schema Design & DDL Queries', 'Status': 'Completed', 'Max Marks': 10, 'Obtained': 10, 'Viva (5)': 5, 'Remarks': 'Verified' },
      { 'Exp Code': 'EXP-02', 'Experiment Title': 'Complex Joins, Views & Subqueries', 'Status': student.assignmentsPending > 2 ? 'Pending' : 'Completed', 'Max Marks': 10, 'Obtained': student.dsa >= 45 ? 9 : 7, 'Viva (5)': 4, 'Remarks': 'Good queries' },
      { 'Exp Code': 'EXP-03', 'Experiment Title': 'PL/SQL Triggers, Procedures & Functions', 'Status': student.assignmentsPending > 0 ? 'Pending' : 'Completed', 'Max Marks': 10, 'Obtained': student.dsa >= 50 ? 10 : 8, 'Viva (5)': 4, 'Remarks': 'Clean logic' },
      { 'Exp Code': 'EXP-04', 'Experiment Title': 'Binary Search Tree & Graph Traversal', 'Status': 'Completed', 'Max Marks': 10, 'Obtained': Math.min(10, Math.round(student.dsa / 6)), 'Viva (5)': student.ptClass, 'Remarks': student.remarks },
      { 'Exp Code': 'EXP-05', 'Experiment Title': 'Dynamic Programming Knapsack & Greedy', 'Status': student.dsa >= 40 ? 'Completed' : 'In Progress', 'Max Marks': 10, 'Obtained': Math.min(10, Math.round(student.dsa / 7)), 'Viva (5)': Math.min(5, student.ptClass), 'Remarks': 'Submitted' }
    ];

    const profileSheet = XLSX.utils.json_to_sheet(studentProfile);
    profileSheet['!cols'] = [{ wch: 30 }, { wch: 45 }];

    const expSheet = XLSX.utils.json_to_sheet(expDetails);
    expSheet['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, profileSheet, 'Student Profile');
    XLSX.utils.book_append_sheet(workbook, expSheet, 'Experiments & Viva');

    XLSX.writeFile(workbook, `${student.name.replace(/\s+/g, '_')}_Individual_Report.xlsx`);
  };

  // 3. Download Individual Student Report as Text (.txt)
  const downloadStudentText = (student) => {
    const now = new Date();
    const lines = [
      '═══════════════════════════════════════════════════════════════════════════════',
      '                     SMARTLABX — INDIVIDUAL STUDENT REPORT                     ',
      '═══════════════════════════════════════════════════════════════════════════════',
      '',
      `  Student S.No    : ${student.sno}`,
      `  Student Name    : ${student.name}`,
      `  Email Address   : ${student.email}`,
      `  Branch / Dept   : ${student.branch}`,
      `  Generated On    : ${now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-IN')}`,
      '',
      '───────────────────────────────────────────────────────────────────────────────',
      '  ACADEMIC & LAB PERFORMANCE',
      '───────────────────────────────────────────────────────────────────────────────',
      '',
      `  Attendance Score      : ${student.attendance} / 10 (${student.attendance * 10}%)`,
      `  Pending Assignments   : ${student.assignmentsPending}`,
      `  PT Class Score        : ${student.ptClass} / 5`,
      `  DSA Practical Marks   : ${student.dsa} / 60 (${((student.dsa / 60) * 100).toFixed(1)}%)`,
      `  Performance Status    : ${student.dsa >= 50 ? 'Outstanding' : student.dsa >= 35 ? 'Satisfactory' : 'Needs Immediate Improvement'}`,
      `  Faculty Remarks       : ${student.remarks}`,
      '',
      '───────────────────────────────────────────────────────────────────────────────',
      '  Auto-generated by SmartLabX Faculty Portal · © 2026 SmartLabX',
      '═══════════════════════════════════════════════════════════════════════════════',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, '_')}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 4. Download Overall Report as Text (.txt)
  const downloadOverallText = () => {
    const now = new Date();
    const lines = [
      '═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════',
      '                                    SMARTLABX — OVERALL STUDENT PERFORMANCE REPORT                                          ',
      '═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════',
      '',
      `  Generated On    : ${now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-IN')}`,
      `  Generated By    : Faculty / Staff`,
      `  Total Students  : ${filtered.length}`,
      '',
      '═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════',
      '',
      `  ${'S.No'.padEnd(6)} | ${'Student Name'.padEnd(16)} | ${'Email'.padEnd(28)} | ${'Branch'.padEnd(8)} | ${'Att'.padEnd(5)} | ${'Pending'.padEnd(8)} | ${'PT(5)'.padEnd(6)} | ${'DSA(60)'.padEnd(8)} | Remarks`,
      `  ${'─'.repeat(6)}┼${'─'.repeat(18)}┼${'─'.repeat(30)}┼${'─'.repeat(10)}┼${'─'.repeat(7)}┼${'─'.repeat(10)}┼${'─'.repeat(8)}┼${'─'.repeat(10)}┼${'─'.repeat(50)}`,
    ];

    filtered.forEach((s) => {
      lines.push(
        `  ${String(s.sno).padEnd(6)} | ${s.name.padEnd(16)} | ${s.email.padEnd(28)} | ${s.branch.padEnd(8)} | ${String(s.attendance).padEnd(5)} | ${String(s.assignmentsPending).padEnd(8)} | ${String(s.ptClass).padEnd(6)} | ${String(s.dsa).padEnd(8)} | ${s.remarks}`
      );
    });

    lines.push(
      `  ${'─'.repeat(6)}┼${'─'.repeat(18)}┼${'─'.repeat(30)}┼${'─'.repeat(10)}┼${'─'.repeat(7)}┼${'─'.repeat(10)}┼${'─'.repeat(8)}┼${'─'.repeat(10)}┼${'─'.repeat(50)}`,
      '',
      '  SUMMARY:',
      `  Total Students            : ${filtered.length}`,
      `  Avg Attendance            : ${(filtered.reduce((s, e) => s + e.attendance, 0) / (filtered.length || 1)).toFixed(1)} / 10`,
      `  Avg PT Class Marks        : ${(filtered.reduce((s, e) => s + e.ptClass, 0) / (filtered.length || 1)).toFixed(1)} / 5`,
      `  Avg DSA Marks             : ${(filtered.reduce((s, e) => s + e.dsa, 0) / (filtered.length || 1)).toFixed(1)} / 60`,
      `  Total Pending Assignments : ${filtered.reduce((s, e) => s + e.assignmentsPending, 0)}`,
      `  Students with Full Att.   : ${filtered.filter(e => e.attendance >= 9).length}`,
      `  Students at Risk (DSA<35) : ${filtered.filter(e => e.dsa < 35).length}`,
      '',
      '═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════',
      '  Auto-generated by SmartLabX Platform · © 2026 SmartLabX — All Rights Reserved                                            ',
      '═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════',
    );

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartLabX_Overall_Student_Report_${now.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports &amp; Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">View all students' performance, export to Excel (.xlsx), and download individual reports.</p>
        </div>
        <div className="space-x-3 flex items-center">
          {/* Excel Export Button */}
          <button
            onClick={downloadOverallExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition font-semibold text-sm flex items-center gap-2 cursor-pointer"
            title="Download full analytics as Excel spreadsheet"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 14.8l-1.4 2.2-1.4-2.2H11l2 3.1-2 3.1h2l1.4-2.2 1.4 2.2h2l-2-3.1 2-3.1h-2zM13 9V3.5L18.5 9H13z"/>
            </svg>
            Download Excel (.xlsx)
          </button>

          {/* Text Export Button */}
          <button
            onClick={downloadOverallText}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition font-semibold text-sm flex items-center gap-2 cursor-pointer"
            title="Download overall text summary"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Text (.txt)
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Total Students</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{allStudents.length}</p>
          <p className="text-xs text-green-600 mt-1">All enrolled students</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Avg Attendance</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{(allStudents.reduce((s, e) => s + e.attendance, 0) / allStudents.length).toFixed(1)}/10</p>
          <p className="text-xs text-blue-600 mt-1">Across all students</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Avg DSA Marks</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{(allStudents.reduce((s, e) => s + e.dsa, 0) / allStudents.length).toFixed(1)}/60</p>
          <p className="text-xs text-green-600 mt-1">Overall performance</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">At Risk Students</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{allStudents.filter(e => e.dsa < 35).length}</p>
          <p className="text-xs text-red-500 mt-1">DSA &lt; 35 marks</p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {reportTabs.map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveReport(tab.key)}
              className={`flex-1 py-4 font-medium text-sm transition cursor-pointer ${activeReport === tab.key ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeReport === 'students' && (
            <>
              {/* Search & Filter */}
              <div className="flex items-center gap-4 mb-5">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="All">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="IT">IT</option>
                </select>
                <span className="text-sm text-gray-500 font-medium">{filtered.length} students</span>
              </div>

              {/* Full Student Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left border-collapse" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">S.No</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Branch</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">Attendance<br/><span className="text-[10px] opacity-70">(out of 10)</span></th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">Assignments<br/><span className="text-[10px] opacity-70">Pending</span></th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">PT Class<br/><span className="text-[10px] opacity-70">(out of 5)</span></th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center">DSA<br/><span className="text-[10px] opacity-70">(out of 60)</span></th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ minWidth: '220px' }}>Remarks</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center" style={{ minWidth: '170px' }}>Download Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((s, idx) => {
                      const dsaC = getDsaColor(s.dsa);
                      const attC = getAttColor(s.attendance);
                      return (
                        <tr key={s.sno} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}
                        >
                          <td className="px-4 py-3 text-sm font-bold text-indigo-600">{s.sno}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{s.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${s.branch === 'CSE' ? 'bg-indigo-100 text-indigo-700' : s.branch === 'ECE' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-100 text-cyan-700'}`}>
                              {s.branch}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-3 py-1 rounded-md text-sm font-bold" style={{ background: attC.bg, color: attC.color }}>{s.attendance}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-md text-sm font-bold ${s.assignmentsPending === 0 ? 'bg-green-100 text-green-700' : s.assignmentsPending <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {s.assignmentsPending}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-md text-sm font-bold ${s.ptClass >= 4 ? 'bg-green-100 text-green-700' : s.ptClass >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {s.ptClass}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-3 py-1 rounded-md text-sm font-bold" style={{ background: dsaC.bg, color: dsaC.color }}>{s.dsa}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 leading-relaxed">{s.remarks}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Individual Excel Download */}
                              <button
                                onClick={() => downloadStudentExcel(s)}
                                title={`Download Excel report for ${s.name}`}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 14.8l-1.4 2.2-1.4-2.2H11l2 3.1-2 3.1h2l1.4-2.2 1.4 2.2h2l-2-3.1 2-3.1h-2zM13 9V3.5L18.5 9H13z"/></svg>
                                <span>.xlsx</span>
                              </button>
                              {/* Individual Text Download */}
                              <button
                                onClick={() => downloadStudentText(s)}
                                title={`Download Text report for ${s.name}`}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                              >
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                <span>.txt</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {activeReport === 'faculty' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Faculty</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Department</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Subjects</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Sessions Conducted</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Avg Student Score</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">Dr. Alan Turing</td><td className="px-6 py-4 text-sm text-gray-600">CSE</td><td className="px-6 py-4 text-sm">DBMS, DS</td><td className="px-6 py-4 text-sm">24</td><td className="px-6 py-4 text-sm text-green-600 font-bold">82%</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">Dr. Grace Hopper</td><td className="px-6 py-4 text-sm text-gray-600">IT</td><td className="px-6 py-4 text-sm">CN</td><td className="px-6 py-4 text-sm">18</td><td className="px-6 py-4 text-sm text-green-600 font-bold">79%</td></tr>
              </tbody>
            </table>
          )}
          {activeReport === 'departments' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Department</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Students</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Faculty</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Lab Sessions</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Avg Performance</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">CSE</td><td className="px-6 py-4 text-sm">620</td><td className="px-6 py-4 text-sm">45</td><td className="px-6 py-4 text-sm">120</td><td className="px-6 py-4 text-sm text-green-600 font-bold">81%</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">IT</td><td className="px-6 py-4 text-sm">380</td><td className="px-6 py-4 text-sm">32</td><td className="px-6 py-4 text-sm">85</td><td className="px-6 py-4 text-sm text-yellow-600 font-bold">76%</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">ECE</td><td className="px-6 py-4 text-sm">240</td><td className="px-6 py-4 text-sm">20</td><td className="px-6 py-4 text-sm">62</td><td className="px-6 py-4 text-sm text-yellow-600 font-bold">74%</td></tr>
              </tbody>
            </table>
          )}
          {activeReport === 'laboratories' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Laboratory</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Sessions</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Experiments</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Students Participated</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Avg Score</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">DBMS Lab</td><td className="px-6 py-4 text-sm">42</td><td className="px-6 py-4 text-sm">15</td><td className="px-6 py-4 text-sm">340</td><td className="px-6 py-4 text-sm text-green-600 font-bold">84%</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">CN Lab</td><td className="px-6 py-4 text-sm">38</td><td className="px-6 py-4 text-sm">12</td><td className="px-6 py-4 text-sm">280</td><td className="px-6 py-4 text-sm text-yellow-600 font-bold">75%</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium">OS Lab</td><td className="px-6 py-4 text-sm">30</td><td className="px-6 py-4 text-sm">10</td><td className="px-6 py-4 text-sm">260</td><td className="px-6 py-4 text-sm text-green-600 font-bold">80%</td></tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
