import React, { useState } from 'react';

export default function OSFacultyMonitor({ darkMode, onBack }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [comment, setComment] = useState('');

  const students = [
    { id: 1, name: 'Arjun', status: 'Online', currentExp: 'CPU Scheduling', algorithm: 'Round Robin', progress: 45, timeSpent: '12m 30s', aiUsage: 2 },
    { id: 2, name: 'Meera', status: 'Online', currentExp: 'Page Replacement', algorithm: 'LRU', progress: 80, timeSpent: '45m 10s', aiUsage: 5 },
    { id: 3, name: 'Ravi', status: 'Offline', currentExp: '-', algorithm: '-', progress: 0, timeSpent: '-', aiUsage: 0 }
  ];

  if (selectedStudent) {
     return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
           <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-white/10 bg-[#1a1f36]' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-4">
                 <button onClick={() => setSelectedStudent(null)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    ← Back to Monitor
                 </button>
                 <div>
                    <h2 className="font-bold">Live View: {selectedStudent.name}</h2>
                    <p className={`text-xs ${darkMode?'text-slate-400':'text-slate-500'}`}>Currently viewing their actual SmartLabX workspace</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" /> LIVE
                 </span>
              </div>
           </div>

           <div className="flex-1 flex overflow-hidden">
              {/* Fake Live Workspace View */}
              <div className={`flex-1 p-8 relative ${darkMode ? 'bg-[#0d0f1a]' : 'bg-slate-100'}`}>
                 <div className="absolute top-4 left-4 right-4 bottom-4 rounded-2xl border-4 border-violet-500/30 overflow-hidden opacity-75 grayscale-[30%] pointer-events-none">
                    <div className={`w-full h-12 flex items-center px-4 border-b ${darkMode?'border-white/10 bg-[#141829]':'border-slate-200 bg-white'}`}>
                       <span className="text-xs font-bold">{selectedStudent.currentExp} - {selectedStudent.algorithm}</span>
                    </div>
                    <div className="flex p-4 gap-4 h-full">
                       <div className={`w-48 h-full rounded-xl ${darkMode?'bg-white/5':'bg-slate-200'}`} />
                       <div className={`flex-1 h-full rounded-xl ${darkMode?'bg-white/5':'bg-slate-200'} flex items-center justify-center`}>
                          <span className={`text-2xl font-bold opacity-30 ${darkMode?'text-white':'text-slate-900'}`}>Simulation Canvas Syncing...</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Faculty Actions */}
              <div className={`w-80 flex-shrink-0 border-l p-6 flex flex-col ${darkMode ? 'bg-[#1a1f36] border-white/10' : 'bg-white border-slate-200'}`}>
                 <h3 className="font-bold mb-4">Student Status</h3>
                 <div className="space-y-4 flex-1">
                    <div className={`p-4 rounded-xl ${darkMode?'bg-white/5':'bg-slate-50 border'}`}>
                       <p className={`text-[10px] uppercase font-bold mb-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>Experiment</p>
                       <p className="font-bold text-sm">{selectedStudent.currentExp}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${darkMode?'bg-white/5':'bg-slate-50 border'}`}>
                       <p className={`text-[10px] uppercase font-bold mb-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>Algorithm Selected</p>
                       <p className="font-bold text-sm">{selectedStudent.algorithm}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${darkMode?'bg-white/5':'bg-slate-50 border'}`}>
                       <p className={`text-[10px] uppercase font-bold mb-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>AI Hints Used</p>
                       <p className="font-bold text-sm">{selectedStudent.aiUsage}</p>
                    </div>
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <h3 className="font-bold text-sm mb-2">Live Guidance</h3>
                    <textarea 
                       value={comment}
                       onChange={e=>setComment(e.target.value)}
                       placeholder="Type a message to show on student's screen..."
                       className={`w-full rounded-xl p-3 text-sm resize-none h-24 outline-none ${darkMode?'bg-white/5 border border-white/10 text-white':'bg-white border border-slate-200 text-slate-900'}`}
                    />
                    <button className="w-full mt-2 py-2.5 rounded-xl font-bold text-sm bg-violet-600 text-white shadow-lg">Send Message</button>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className={`h-full overflow-y-auto p-8 ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
       <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
             <button onClick={onBack} className={`p-2 rounded-xl transition ${darkMode?'hover:bg-white/10 bg-white/5':'hover:bg-slate-200 bg-slate-100'}`}>←</button>
             <div>
               <h2 className="text-2xl font-bold">Faculty Live Monitor</h2>
               <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Observe students performing OS experiments in real-time.</p>
             </div>
          </div>
          
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1a1f36] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
             <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase font-bold ${darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                   <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Current Experiment</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                   {students.map(s => (
                      <tr key={s.id} className={`transition ${darkMode?'hover:bg-white/5':'hover:bg-slate-50'}`}>
                         <td className="px-6 py-4 font-bold">{s.name}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                               {s.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            {s.currentExp}<br/>
                            <span className={`text-[10px] ${darkMode?'text-slate-500':'text-slate-400'}`}>{s.algorithm}</span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="w-full max-w-[100px] h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
                               <div className="h-full rounded-full bg-violet-500" style={{width: `${s.progress}%`}} />
                            </div>
                            <span className={`text-[10px] mt-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>{s.timeSpent}</span>
                         </td>
                         <td className="px-6 py-4">
                            <button 
                               onClick={() => setSelectedStudent(s)}
                               disabled={s.status === 'Offline'}
                               className={`px-4 py-1.5 rounded-lg font-bold text-xs transition disabled:opacity-50 ${darkMode ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-violet-100 hover:bg-violet-200 text-violet-700'}`}
                            >
                               Live View
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}
