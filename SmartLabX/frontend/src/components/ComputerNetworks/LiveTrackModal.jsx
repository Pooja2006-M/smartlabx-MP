import React, { useState, useEffect } from 'react';
import { X, Activity, Monitor, Network, Eye } from 'lucide-react';

export default function LiveTrackModal({ student, onClose }) {
  const [activeExperiment, setActiveExperiment] = useState(1);
  const [simulatedAction, setSimulatedAction] = useState('Idle...');
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    // Simulated live tracking events
    const actions = [
      { exp: 1, text: "Dragging Router-1 to workspace" },
      { exp: 1, text: "Connecting PC-A to Switch-1" },
      { exp: 2, text: "Configuring IP address 192.168.1.10 on PC-1" },
      { exp: 2, text: "Running Ping from PC-1 to Router-1" },
      { exp: 3, text: "Setting Fa0/0 interface to UP" },
      { exp: 3, text: "Adding Static Route for 10.0.0.0/24" },
      { exp: 4, text: "Turning on DHCP Server" },
      { exp: 5, text: "Reading troubleshooting scenario" },
    ];

    const addLog = (text) => {
      setLogs(prev => {
        const newLogs = [...prev, { time: new Date().toLocaleTimeString(), text }];
        return newLogs.slice(-6); // keep last 6
      });
    };

    addLog(`Started live connection to ${student.name}'s workspace`);

    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setActiveExperiment(randomAction.exp);
      setSimulatedAction(randomAction.text);
      addLog(randomAction.text);
    }, 4500);

    return () => clearInterval(interval);
  }, [student]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-lg relative">
              <Eye className="text-red-400" size={24} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Live Session Tracking
              </h2>
              <p className="text-xs text-slate-400">Monitoring: {student.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-[500px]">
          
          {/* Left Panel: Simulated View */}
          <div className="flex-1 bg-slate-100 flex flex-col p-6 border-r border-slate-200 relative">
            <div className="absolute top-4 right-4 bg-slate-800 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
              Current: Experiment {activeExperiment}
            </div>
            
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Monitor size={16} /> Screen Simulation
            </h3>

            {/* Student Session Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold text-amber-700">2 Times</p>
                <p className="text-[10px] font-semibold text-amber-900"> AI Hints Asked</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold text-red-700">2 Exits</p>
                <p className="text-[10px] font-semibold text-red-900"> Tab/Screen Exits</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold text-emerald-700">38 Mins</p>
                <p className="text-[10px] font-semibold text-emerald-900">[TIME]️ Time in Session</p>
              </div>
            </div>

            <div className="flex-1 border-2 border-dashed border-slate-300 rounded-2xl bg-white flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
               
               <Activity className="text-indigo-400 mb-4 animate-bounce relative z-10" size={48} />
               <p className="text-slate-500 font-medium mb-1 relative z-10">Student Activity Detected</p>
               <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 shadow-sm relative z-10">
                 <p className="text-lg font-bold text-indigo-700">{simulatedAction}</p>
               </div>
            </div>
          </div>

          {/* Right Panel: Activity Log */}
          <div className="w-full md:w-80 bg-white p-6 flex flex-col">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Network size={16} /> Activity Stream
            </h3>
            
            <div className="flex-1 space-y-4">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 relative before:absolute before:left-1.5 before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-slate-100 last:before:hidden">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0 mt-1.5 relative z-10 ring-4 ring-white" />
                  <div>
                    <p className="text-xs text-slate-400 font-mono mb-0.5">{log.time}</p>
                    <p className="text-sm text-slate-700">{log.text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={() => {
                  const msg = window.prompt(`Enter warning for ${student.name}:`, 'Please focus on your lab experiment and adhere to guidelines.');
                  if (msg) {
                    const warningData = {
                      student: student.name,
                      message: msg,
                      timestamp: Date.now(),
                      sender: 'Faculty'
                    };
                    localStorage.setItem('smartlabx-staff-warning', JSON.stringify(warningData));
                    alert(`[OK] Warning dispatched to ${student.name}!`);
                  }
                }} 
                className="w-full bg-amber-500 text-white hover:bg-amber-600 font-semibold py-2 rounded-xl transition"
              >
                [!] Send Warning to Student
              </button>
              <button onClick={onClose} className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-2 rounded-xl transition">
                End Live Tracking
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
