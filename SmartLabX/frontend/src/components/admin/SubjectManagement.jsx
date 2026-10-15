import React, { useState } from 'react';

export default function SubjectManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Database Management Systems', code: 'CS301', dept: 'CSE', faculty: 'Dr. Alan Turing', semester: '3' },
    { id: 2, name: 'Computer Networks', code: 'CS302', dept: 'CSE', faculty: 'Dr. Grace Hopper', semester: '4' },
    { id: 3, name: 'Operating Systems', code: 'CS303', dept: 'CSE', faculty: 'Dr. Linus Torvalds', semester: '3' },
    { id: 4, name: 'Data Structures', code: 'CS201', dept: 'IT', faculty: 'Dr. John McCarthy', semester: '2' },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Subject Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage subjects and assign faculty members.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Subject Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Code</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Faculty</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Semester</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{sub.name}</td>
                <td className="px-6 py-4 text-sm"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{sub.code}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{sub.dept}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{sub.faculty}</td>
                <td className="px-6 py-4 text-sm text-gray-600">Sem {sub.semester}</td>
                <td className="px-6 py-4 text-sm text-right space-x-3">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Add New Subject</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. DBMS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. CS301" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>Computer Science Engineering</option>
                  <option>Information Technology</option>
                  <option>AI & Data Science</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Select Faculty</option>
                    <option>Dr. Alan Turing</option>
                    <option>Dr. Grace Hopper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>1</option><option>2</option><option>3</option><option>4</option>
                    <option>5</option><option>6</option><option>7</option><option>8</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition">Save Subject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
