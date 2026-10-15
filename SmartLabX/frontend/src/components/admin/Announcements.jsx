import React, { useState } from 'react';

export default function Announcements() {
  const [showModal, setShowModal] = useState(false);
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'DBMS Lab Session Scheduled', message: 'DBMS Lab for CSE 3rd Sem is scheduled for July 28, 2026.', target: 'CSE - Sem 3', type: 'Announcement', date: '2026-07-24' },
    { id: 2, title: 'System Maintenance Notice', message: 'Platform will be under maintenance on Aug 1, 2026 from 2AM-4AM.', target: 'All Users', type: 'Notification', date: '2026-07-23' },
    { id: 3, title: 'New Lab Module Released', message: 'Operating Systems Lab module is now live. Faculty can start creating workspaces.', target: 'Faculty', type: 'Announcement', date: '2026-07-20' },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements & Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">Send announcements and notifications to students and faculty.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
          New Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.type === 'Announcement' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{a.type}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{a.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {a.target}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {a.date}
                  </span>
                </div>
              </div>
              <div className="space-x-2 ml-4">
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                <button className="text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">New Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Announcement title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Write your message..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Announcement</option><option>Notification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>All Users</option><option>Faculty Only</option><option>Students Only</option><option>CSE</option><option>IT</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
                <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">Cancel</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition">Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
