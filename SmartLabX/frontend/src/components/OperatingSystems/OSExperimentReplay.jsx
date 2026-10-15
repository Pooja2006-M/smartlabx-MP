import React, { useState, useEffect } from 'react';

export default function OSExperimentReplay({ darkMode, onBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const actions = [
    { time: '00:00', text: 'Started CPU Scheduling Experiment' },
    { time: '00:45', text: 'Selected SJF Algorithm' },
    { time: '01:12', text: 'Added Process P5 (Arrival: 2, Burst: 4)' },
    { time: '02:05', text: 'Started Simulation' },
    { time: '02:40', text: 'Paused Simulation' },
    { time: '03:15', text: 'Resumed Simulation' },
    { time: '05:00', text: 'Simulation Completed (Avg Wait: 4.2)' }
  ];

  useEffect(() => {
    let timer;
    if (isPlaying && progress < 100) {
       timer = setInterval(() => setProgress(p => Math.min(p + 1, 100)), 300);
    } else if (progress >= 100) {
       setIsPlaying(false);
    }
    return () => clearInterval(timer);
  }, [isPlaying, progress]);

  return (
    <div className={`h-full flex flex-col p-8 ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
       <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
             <button onClick={onBack} className={`p-2 rounded-xl transition ${darkMode?'hover:bg-white/10 bg-white/5':'hover:bg-slate-200 bg-slate-100'}`}>←</button>
             <div>
               <h2 className="text-2xl font-bold">Experiment Replay</h2>
               <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Review student interactions timeline.</p>
             </div>
          </div>
          
          <div className="flex-1 grid md:grid-cols-[2fr_1fr] gap-6">
             {/* Fake canvas area */}
             <div className={`rounded-3xl border flex flex-col p-6 ${darkMode ? 'bg-[#1a1f36] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`flex-1 rounded-2xl flex items-center justify-center mb-6 opacity-50 grayscale ${darkMode?'bg-[#0d0f1a]':'bg-slate-100'}`}>
                   <p className={`font-bold ${darkMode?'text-white':'text-slate-900'}`}>Replay Video Sync...</p>
                </div>
                
                {/* Playback controls */}
                <div className="flex items-center gap-4">
                   <button onClick={()=>setIsPlaying(!isPlaying)} className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl text-white ${isPlaying?'bg-amber-500':'bg-violet-600'}`}>
                      {isPlaying ? '⏸' : '▶'}
                   </button>
                   <div className="flex-1">
                      <input 
                         type="range" 
                         min="0" max="100" 
                         value={progress}
                         onChange={e=>setProgress(parseInt(e.target.value))}
                         className="w-full accent-violet-600"
                      />
                      <div className="flex justify-between text-xs mt-1 opacity-70">
                         <span>00:00</span>
                         <span>05:00</span>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Timeline */}
             <div className={`rounded-3xl border p-6 overflow-y-auto ${darkMode ? 'bg-[#1a1f36] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="font-bold mb-6">Action Timeline</h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                   {actions.map((act, i) => (
                      <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                         <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ${darkMode?'bg-[#1a1f36] border-slate-700 text-slate-300':'bg-white border-slate-200 text-slate-500'} ${i*15 <= progress ? (darkMode?'border-violet-500 text-violet-400':'border-violet-500 text-violet-600') : ''}`}>
                            <span className="text-[10px] font-bold">{act.time}</span>
                         </div>
                         <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow ${darkMode?'bg-white/5 border border-white/5 text-slate-300':'bg-slate-50 border border-slate-100 text-slate-600'} ${i*15 <= progress ? 'opacity-100' : 'opacity-40'}`}>
                            <p className="text-sm font-bold">{act.text}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
