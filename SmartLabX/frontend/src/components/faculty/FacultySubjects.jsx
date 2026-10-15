import React, { useState } from 'react';

export default function FacultySubjects() {
  const [selectedSubject, setSelectedSubject] = useState(null);

  const subjects = [
    { id: 1, name: 'Database Management Systems', code: 'CS301', dept: 'CSE', semester: '3', students: 60, experiments: 15, schedule: 'Monday 9:00 AM - 12:00 PM' },
    { id: 2, name: 'Computer Networks', code: 'CS302', dept: 'CSE', semester: '4', students: 55, experiments: 12, schedule: 'Wednesday 2:00 PM - 5:00 PM' },
    { id: 3, name: 'Operating Systems', code: 'CS303', dept: 'CSE', semester: '3', students: 58, experiments: 10, schedule: 'Friday 9:00 AM - 12:00 PM' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Subjects</h2>
        <p className="text-sm text-gray-500 mt-1">View and manage your assigned subjects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map(sub => (
          <div 
            key={sub.id}
            onClick={() => setSelectedSubject(sub)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{sub.code}</span>
              <span className="text-xs text-gray-400">Sem {sub.semester}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">{sub.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{sub.dept} Department</p>
            <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Students</p>
                <p className="font-bold text-gray-800">{sub.students}</p>
              </div>
              <div>
                <p className="text-gray-400">Experiments</p>
                <p className="font-bold text-gray-800">{sub.experiments}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {sub.schedule}
            </div>
          </div>
        ))}
      </div>

      {/* Subject Detail Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedSubject.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Code: {selectedSubject.code} | Semester {selectedSubject.semester}</p>
              </div>
              <button onClick={() => setSelectedSubject(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-blue-700">{selectedSubject.students}</p><p className="text-xs text-blue-500">Students</p></div>
              <div className="bg-purple-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-purple-700">{selectedSubject.experiments}</p><p className="text-xs text-purple-500">Experiments</p></div>
              <div className="bg-green-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-green-700">8</p><p className="text-xs text-green-500">Completed</p></div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Lab Schedule</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedSubject.schedule}</p>
              <h4 className="font-semibold text-gray-700 mt-4">Previous Experiments</h4>
              <div className="space-y-2">
                {['Exp 1: ER Diagrams', 'Exp 2: SQL DDL Commands', 'Exp 3: SQL DML Commands'].map((exp, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-sm">
                    <span className="text-gray-700">{exp}</span>
                    <span className="text-green-600 text-xs font-bold">Completed</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedSubject(null)} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
