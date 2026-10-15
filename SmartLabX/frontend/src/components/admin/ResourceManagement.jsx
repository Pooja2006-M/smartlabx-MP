import React, { useState } from 'react';

export default function ResourceManagement() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [resources, setResources] = useState([
    { id: 1, name: 'DBMS Lab Manual 2026', type: 'PDF', subject: 'DBMS', size: '2.4 MB', date: '2026-06-10' },
    { id: 2, name: 'SQL Basics Tutorial', type: 'Video', subject: 'DBMS', size: '48 MB', date: '2026-06-12' },
    { id: 3, name: 'CN Reference Notes', type: 'PDF', subject: 'Computer Networks', size: '1.8 MB', date: '2026-07-01' },
    { id: 4, name: 'OS Lab Procedure Manual', type: 'PDF', subject: 'Operating Systems', size: '3.1 MB', date: '2026-07-05' },
  ]);

  const typeColors = {
    'PDF': 'bg-red-50 text-red-700',
    'Video': 'bg-blue-50 text-blue-700',
    'Document': 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Resource Management</h2>
          <p className="text-sm text-gray-500 mt-1">Upload and manage PDFs, videos, lab manuals, and reference materials.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Upload Resource
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Resource Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Subject</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Size</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Uploaded</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resources.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                  {r.type === 'PDF' ? (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                  )}
                  {r.name}
                </td>
                <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-bold ${typeColors[r.type] || 'bg-gray-100 text-gray-600'}`}>{r.type}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{r.subject}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{r.size}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{r.date}</td>
                <td className="px-6 py-4 text-sm text-right space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">Download</button>
                  <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Upload Resource</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. DBMS Lab Manual" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>PDF</option><option>Video</option><option>Lab Manual</option><option>Reference Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>DBMS</option><option>Computer Networks</option><option>Operating Systems</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition cursor-pointer">
                  <svg className="mx-auto w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p className="text-sm text-gray-500">Drag & drop your file here, or <span className="text-indigo-600 font-medium">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">Supports PDF, MP4, DOC (Max 50MB)</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
