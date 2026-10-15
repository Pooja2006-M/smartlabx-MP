import React, { useState } from 'react';

export default function AcademicManagement() {
  const [activeSection, setActiveSection] = useState('year');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const academicYears = [
    { id: 1, name: '2025-2026', status: 'Active' },
    { id: 2, name: '2024-2025', status: 'Completed' },
  ];
  const semesters = [
    { id: 1, name: 'Semester 1 (Odd)', year: '2025-2026', status: 'Active' },
    { id: 2, name: 'Semester 2 (Even)', year: '2025-2026', status: 'Upcoming' },
  ];
  const batches = [
    { id: 1, name: 'Batch 2023-2027', dept: 'CSE', students: 120 },
    { id: 2, name: 'Batch 2024-2028', dept: 'IT', students: 60 },
  ];
  const sections = [
    { id: 1, name: 'Section A', batch: 'Batch 2023-2027', dept: 'CSE', students: 60 },
    { id: 2, name: 'Section B', batch: 'Batch 2023-2027', dept: 'CSE', students: 60 },
  ];

  const openAdd = (type) => { setModalType(type); setShowAddModal(true); };

  const tabs = [
    { key: 'year', label: 'Academic Year' },
    { key: 'semester', label: 'Semesters' },
    { key: 'batch', label: 'Batches' },
    { key: 'section', label: 'Sections' },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Academic Management</h2>
          <p className="text-sm text-gray-500 mt-1">Configure academic years, semesters, batches, and sections.</p>
        </div>
        <button 
          onClick={() => openAdd(activeSection)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add {tabs.find(t => t.key === activeSection)?.label}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex-1 py-4 font-medium text-sm transition ${activeSection === tab.key ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {activeSection === 'year' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Academic Year</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {academicYears.map(y => (
                  <tr key={y.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{y.name}</td>
                    <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-bold ${y.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{y.status}</span></td>
                    <td className="px-6 py-4 text-sm text-right space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                      <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSection === 'semester' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Semester</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Academic Year</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {semesters.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.year}</td>
                    <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{s.status}</span></td>
                    <td className="px-6 py-4 text-sm text-right space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSection === 'batch' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Batch Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Students</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.dept}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.students}</td>
                    <td className="px-6 py-4 text-sm text-right space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Manage Students</button>
                      <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSection === 'section' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Section</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Batch</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Students</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {sections.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.batch}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.dept}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.students}</td>
                    <td className="px-6 py-4 text-sm text-right space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 capitalize">Add {tabs.find(t => t.key === modalType)?.label}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter name..." />
              </div>
              {(modalType === 'batch' || modalType === 'section') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>CSE</option><option>IT</option><option>AIDS</option>
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
