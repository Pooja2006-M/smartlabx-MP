import React, { useState } from 'react';

export default function DepartmentManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Computer Science Engineering', code: 'CSE', hod: 'Dr. Alan Turing', date: '2026-01-10' },
    { id: 2, name: 'Information Technology', code: 'IT', hod: 'Dr. Grace Hopper', date: '2026-01-15' },
    { id: 3, name: 'Artificial Intelligence & Data Science', code: 'AIDS', hod: 'Dr. John McCarthy', date: '2026-02-01' },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Department Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage institution departments and heads.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Department Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Code</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">HOD</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Created Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departments.map(dept => (
              <tr key={dept.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{dept.code}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{dept.hod}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{dept.date}</td>
                <td className="px-6 py-4 text-sm text-right space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Department Modal (Mockup) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Add New Department</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Computer Science Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. CSE" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department (Optional)</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>Select Faculty</option>
                  <option>Dr. Alan Turing</option>
                  <option>Dr. Grace Hopper</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition"
              >
                Save Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
