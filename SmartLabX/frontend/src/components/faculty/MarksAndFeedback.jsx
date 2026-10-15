import React, { useState } from 'react';

export default function MarksAndFeedback() {
  const [selectedSubject, setSelectedSubject] = useState('DBMS');
  const [selectedExperiment, setSelectedExperiment] = useState('Exp 1: SQL DDL');

  const students = [
    { id: 1, name: 'John Doe', rollNo: 'CSE001', codeMarks: 22, maxCode: 25, vivaMarks: 8, maxViva: 10, attendance: true, published: true },
    { id: 2, name: 'Jane Smith', rollNo: 'CSE002', codeMarks: 24, maxCode: 25, vivaMarks: 9, maxViva: 10, attendance: true, published: false },
    { id: 3, name: 'Raj Kumar', rollNo: 'CSE003', codeMarks: 20, maxCode: 25, vivaMarks: null, maxViva: 10, attendance: true, published: false },
    { id: 4, name: 'Priya Sharma', rollNo: 'CSE004', codeMarks: null, maxCode: 25, vivaMarks: null, maxViva: 10, attendance: false, published: false },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Evaluation & Marks</h2>
          <p className="text-sm text-gray-500 mt-1">Review performance, adjust marks, and publish results to students.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium">Publish All Pending</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>DBMS</option><option>Computer Networks</option><option>Operating Systems</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Experiment</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>Exp 1: SQL DDL</option><option>Exp 2: SQL DML</option><option>Exp 3: Joins</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>CSE 2023-27 Sec A</option><option>CSE 2023-27 Sec B</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Student Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Roll No</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Attendance</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Code Execution (/25)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Viva Marks (/10)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Total (/35)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(s => {
              const total = (s.codeMarks || 0) + (s.vivaMarks || 0);
              const maxTotal = s.maxCode + s.maxViva;
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.rollNo}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    {s.attendance ? <span className="text-green-500 font-bold">P</span> : <span className="text-red-500 font-bold">A</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {s.attendance ? <input type="number" defaultValue={s.codeMarks} className="w-16 px-2 py-1 border rounded text-center" /> : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {s.attendance ? <input type="number" defaultValue={s.vivaMarks} className="w-16 px-2 py-1 border rounded text-center" /> : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-bold text-indigo-700">
                    {s.attendance ? `${total}/${maxTotal}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {s.published ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">Published</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-bold">Draft</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">Add Feedback</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
