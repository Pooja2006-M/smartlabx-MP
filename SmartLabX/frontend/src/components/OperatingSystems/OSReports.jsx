import React from 'react';

export default function OSReports({ darkMode }) {
  return (
    <div className={`h-full overflow-y-auto p-8 ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
       <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Learning Analytics</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Track your performance, time spent, and concept mastery.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
             <div className={`p-6 rounded-2xl ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
                <p className={`text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Total Time Spent</p>
                <p className="text-3xl font-bold text-violet-500">4h 25m</p>
                <div className="mt-4 space-y-2">
                   <div className="flex justify-between text-xs"><span>CPU Scheduling</span><span>1h 15m</span></div>
                   <div className="flex justify-between text-xs"><span>Memory Mgmt</span><span>45m</span></div>
                   <div className="flex justify-between text-xs"><span>Page Replacement</span><span>2h 25m</span></div>
                </div>
             </div>
             
             <div className={`p-6 rounded-2xl ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
                <p className={`text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Simulation Accuracy</p>
                <p className="text-3xl font-bold text-emerald-500">92%</p>
                <p className={`text-xs mt-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Based on AI Viva responses and correct algorithm selection.</p>
             </div>
             
             <div className={`p-6 rounded-2xl ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
                <p className={`text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>AI Hint Usage</p>
                <p className="text-3xl font-bold text-amber-500">12</p>
                <p className={`text-xs mt-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Hints requested during simulations.</p>
             </div>
          </div>
          
          <div className={`p-6 rounded-2xl ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
             <h3 className="font-bold mb-4">Concept Mastery</h3>
             <div className="space-y-4">
                {[
                  { concept: 'Gantt Chart Analysis', progress: 95, color: 'bg-emerald-500' },
                  { concept: 'Fragmentation', progress: 85, color: 'bg-emerald-500' },
                  { concept: 'Deadlock Avoidance', progress: 40, color: 'bg-amber-500' },
                  { concept: 'Page Replacement Algorithms', progress: 75, color: 'bg-blue-500' },
                ].map(c => (
                   <div key={c.concept}>
                      <div className="flex justify-between text-sm mb-1">
                         <span>{c.concept}</span>
                         <span className="font-bold">{c.progress}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${darkMode?'bg-white/10':'bg-slate-100'}`}>
                         <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.progress}%` }} />
                      </div>
                   </div>
                ))}
             </div>
             
             <div className={`mt-6 p-4 rounded-xl flex gap-4 ${darkMode?'bg-red-500/10 border border-red-500/20 text-red-400':'bg-red-50 border border-red-100 text-red-700'}`}>
                <span className="text-xl">[!]</span>
                <div>
                   <p className="font-bold text-sm">Weak Concept Identified</p>
                   <p className="text-xs mt-1">Your performance in Deadlock Avoidance is below 50%. We recommend revisiting the Theory section for Banker's Algorithm.</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
