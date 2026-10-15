import React, { useState } from 'react';

export default function LaboratoryManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [labs, setLabs] = useState([
    { id: 1, name: 'DBMS Laboratory', type: 'Database', status: 'Active' },
    { id: 2, name: 'Computer Networks Laboratory', type: 'Simulation', status: 'Active' },
    { id: 3, name: 'Operating Systems Laboratory', type: 'Simulation', status: 'Active' },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laboratory Management</h2>
          <p className="text-sm text-gray-500 mt-1">Configure virtual laboratory workspaces and environments.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create Laboratory
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Laboratory Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Workspace Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {labs.map(lab => (
              <tr key={lab.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{lab.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{lab.type}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${lab.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {lab.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">Configure</button>
                  <button className="text-yellow-600 hover:text-yellow-800 font-medium">Disable</button>
                  <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create Laboratory</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Data Science Lab" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Engine Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>Code Editor (Python/Node)</option>
                  <option>Database (SQL)</option>
                  <option>Simulation (WebGL/Canvas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Briefly describe this lab..."></textarea>
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
                Create Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
