import React, { useState } from 'react';

export default function WorkspaceManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [workspaces, setWorkspaces] = useState([
    { id: 1, name: 'DBMS Exp 1 - Sec A', subject: 'DBMS', experiment: 'ER Diagram', batch: '2023-27 A', students: 30, date: '2026-07-28', time: '9:00 AM', status: 'Active', type: 'SQL Editor' },
    { id: 2, name: 'CN Exp 1 - Sec B', subject: 'CN', experiment: 'Network Topology', batch: '2023-27 B', students: 28, date: '2026-07-30', time: '2:00 PM', status: 'Scheduled', type: 'Network Builder' },
    { id: 3, name: 'OS Exp 1 - Sec A', subject: 'OS', experiment: 'CPU Scheduling', batch: '2023-27 A', students: 30, date: '2026-08-01', time: '9:00 AM', status: 'Closed', type: 'CPU Scheduler' },
  ]);

  const statusColors = { Active: 'bg-green-50 text-green-700', Scheduled: 'bg-blue-50 text-blue-700', Closed: 'bg-gray-100 text-gray-600' };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Workspace Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create, configure, and allocate workspaces for experiments.</p>
        </div>
        <div className="space-x-3">
          <button onClick={() => setShowAllocateModal(true)} className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition font-medium text-sm">Allocate Workspace</button>
          <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium">+ Create Workspace</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Workspace</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Subject</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Batch</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date & Time</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Students</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workspaces.map(ws => (
              <tr key={ws.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{ws.name}</td>
                <td className="px-6 py-4 text-sm"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{ws.subject}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{ws.type}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{ws.batch}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{ws.date} {ws.time}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{ws.students}</td>
                <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[ws.status]}`}>{ws.status}</span></td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
                  {ws.status === 'Active' && <button className="text-green-600 hover:text-green-800 font-medium">Monitor</button>}
                  <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  {ws.status !== 'Closed' && <button className="text-orange-600 hover:text-orange-800 font-medium">Close</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create Workspace</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option>DBMS</option><option>Computer Networks</option><option>Operating Systems</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Experiment</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option>Exp 1: ER Diagram</option><option>Exp 2: DDL</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Workspace Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>SQL Editor</option><option>Schema Viewer</option><option>Network Builder</option><option>Packet Simulator</option><option>CPU Scheduler</option><option>Memory Manager</option><option>Deadlock Simulator</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option>2023-27 Sec A</option><option>2023-27 Sec B</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label><input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label><input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Workspace Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Allocate Workspace</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Select Workspace</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option>DBMS Exp 1 - Sec A</option><option>CN Exp 1 - Sec B</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Allocate To</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option>Entire Batch</option><option>Individual Student</option><option>Multiple Students</option></select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Select Batch / Student</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option>2023-27 Sec A (60 students)</option><option>2023-27 Sec B (58 students)</option></select></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="notify" className="rounded" defaultChecked /><label htmlFor="notify" className="text-sm text-gray-700">Send notification to students</label></div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowAllocateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
              <button onClick={() => setShowAllocateModal(false)} className="px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700 font-medium transition">Allocate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
