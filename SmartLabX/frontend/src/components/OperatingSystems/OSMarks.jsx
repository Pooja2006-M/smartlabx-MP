import React from 'react';

export default function OSMarks({ darkMode, onBack }) {
  const marks = [
    { id: 1, name: 'CPU Scheduling Algorithms', score: '9/10', status: 'Graded', feedback: 'Good understanding of Gantt charts. Next time, try visualizing RR with different quantums.' },
    { id: 2, name: 'Memory Management', score: '8/10', status: 'Graded', feedback: 'Clear concepts on external fragmentation.' },
    { id: 3, name: 'Page Replacement Algorithms', score: '-', status: 'Pending Review', feedback: '' },
    { id: 4, name: "Deadlock Detection & Banker's", score: '-', status: 'Not Submitted', feedback: '' },
    { id: 5, name: 'Disk Scheduling Algorithms', score: '-', status: 'Not Submitted', feedback: '' }
  ];

  return (
    <div className={`h-full overflow-y-auto p-8 ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
       <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Marks & Faculty Feedback</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>View your grades and feedback from the instructor.</p>
          </div>
          
          <div className="space-y-4">
             {marks.map(exp => (
                <div key={exp.id} className={`p-6 rounded-2xl flex flex-col md:flex-row gap-6 ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${darkMode?'bg-white/10':'bg-slate-100'}`}>Exp {exp.id}</span>
                         <h3 className="font-bold">{exp.name}</h3>
                      </div>
                      {exp.feedback ? (
                         <div className={`mt-4 p-4 rounded-xl text-sm ${darkMode?'bg-white/5 border border-white/5':'bg-slate-50 border'}`}>
                            <p className={`text-xs font-bold uppercase mb-1 ${darkMode?'text-violet-400':'text-violet-600'}`}>Instructor Feedback</p>
                            <p className="italic">{exp.feedback}</p>
                         </div>
                      ) : (
                         <p className={`mt-4 text-sm italic ${darkMode?'text-slate-500':'text-slate-400'}`}>No feedback available yet.</p>
                      )}
                   </div>
                   <div className="w-40 flex flex-col items-end justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-slate-200 dark:border-white/10">
                      <p className={`text-xs uppercase font-bold mb-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                         exp.status === 'Graded' ? 'bg-emerald-500/10 text-emerald-500' : 
                         exp.status === 'Pending Review' ? 'bg-amber-500/10 text-amber-500' : 
                         darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
                      }`}>{exp.status}</span>
                      
                      <p className={`text-xs uppercase font-bold mb-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>Score</p>
                      <p className={`text-2xl font-bold ${darkMode?'text-white':'text-slate-900'}`}>{exp.score}</p>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
