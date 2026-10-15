import React, { useState } from 'react';

export default function ExperimentManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [experiments, setExperiments] = useState([
    { id: 1, title: 'ER Diagram Design', number: 1, subject: 'DBMS', aim: 'Design ER diagram for Library Management System', deadline: '2026-07-28', marks: 25, vivaMarks: 10, status: 'Active' },
    { id: 2, title: 'SQL DDL Commands', number: 2, subject: 'DBMS', aim: 'Create tables using DDL commands', deadline: '2026-08-04', marks: 25, vivaMarks: 10, status: 'Active' },
    { id: 3, title: 'SQL DML Operations', number: 3, subject: 'DBMS', aim: 'Perform INSERT, UPDATE, DELETE operations', deadline: '2026-08-11', marks: 25, vivaMarks: 10, status: 'Draft' },
    { id: 4, title: 'Network Topology Setup', number: 1, subject: 'CN', aim: 'Configure star and mesh topologies', deadline: '2026-08-01', marks: 30, vivaMarks: 15, status: 'Active' },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Experiment Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage laboratory experiments for your subjects.</p>
        </div>
        <div className="space-x-3">
          <button className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium text-sm">Duplicate Previous</button>
          <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex-inline items-center gap-2">
            + Create Experiment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">#</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Title</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Subject</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Deadline</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Marks</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Viva</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {experiments.map(exp => (
              <tr key={exp.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-bold text-gray-400">{exp.number}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{exp.title}</td>
                <td className="px-6 py-4 text-sm"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{exp.subject}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{exp.deadline}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{exp.marks}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{exp.vivaMarks}</td>
                <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-bold ${exp.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{exp.status}</span></td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Experiment</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>DBMS</option><option>Computer Networks</option><option>Operating Systems</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experiment Number</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 4" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experiment Title</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Joins and Subqueries" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aim / Objective</label>
                <textarea rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="What students should achieve..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theory</label>
                <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Theoretical background..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
                <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Step-by-step instructions..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                <textarea rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="What the correct output should look like..."></textarea>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="25" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Viva Marks</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="10" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-600 rounded-lg text-white hover:bg-gray-700 font-medium transition">Save as Draft</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition">Create & Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
