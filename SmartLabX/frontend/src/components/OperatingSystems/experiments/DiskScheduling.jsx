import React, { useState, useEffect, useRef, useCallback } from 'react';

// Disk Scheduling Algorithms
function runFCFS(queue, head) {
  let sequence = [head, ...queue];
  let distance = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    distance += Math.abs(sequence[i] - sequence[i + 1]);
  }
  return { sequence, distance };
}

function runSSTF(queue, head) {
  let sequence = [head];
  let remaining = [...queue];
  let currentHead = head;
  let distance = 0;

  while (remaining.length > 0) {
    let closestIdx = -1;
    let minDiff = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      let diff = Math.abs(currentHead - remaining[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    let nextTrack = remaining[closestIdx];
    distance += minDiff;
    sequence.push(nextTrack);
    currentHead = nextTrack;
    remaining.splice(closestIdx, 1);
  }
  return { sequence, distance };
}

function runSCAN(queue, head, size, direction) {
  let sequence = [head];
  let distance = 0;
  let left = queue.filter(req => req < head).sort((a, b) => b - a); // descending
  let right = queue.filter(req => req >= head).sort((a, b) => a - b); // ascending

  if (direction === 'high') {
    for (let r of right) {
      distance += Math.abs(head - r);
      head = r;
      sequence.push(head);
    }
    if (left.length > 0) {
      distance += Math.abs(head - (size - 1));
      head = size - 1;
      sequence.push(head);
      for (let l of left) {
        distance += Math.abs(head - l);
        head = l;
        sequence.push(head);
      }
    }
  } else {
    for (let l of left) {
      distance += Math.abs(head - l);
      head = l;
      sequence.push(head);
    }
    if (right.length > 0) {
      distance += Math.abs(head - 0);
      head = 0;
      sequence.push(head);
      for (let r of right) {
        distance += Math.abs(head - r);
        head = r;
        sequence.push(head);
      }
    }
  }
  return { sequence, distance };
}

function runCSCAN(queue, head, size, direction) {
  let sequence = [head];
  let distance = 0;
  let left = queue.filter(req => req < head).sort((a, b) => a - b);
  let right = queue.filter(req => req >= head).sort((a, b) => a - b);

  if (direction === 'high') {
    for (let r of right) {
      distance += Math.abs(head - r);
      head = r;
      sequence.push(head);
    }
    if (left.length > 0) {
      distance += Math.abs(head - (size - 1));
      sequence.push(size - 1);
      distance += Math.abs((size - 1) - 0); // Jump back
      sequence.push(0);
      head = 0;
      for (let l of left) {
        distance += Math.abs(head - l);
        head = l;
        sequence.push(head);
      }
    }
  } else {
    left = queue.filter(req => req < head).sort((a, b) => b - a);
    right = queue.filter(req => req >= head).sort((a, b) => b - a);
    
    for (let l of left) {
      distance += Math.abs(head - l);
      head = l;
      sequence.push(head);
    }
    if (right.length > 0) {
      distance += Math.abs(head - 0);
      sequence.push(0);
      distance += Math.abs(0 - (size - 1));
      sequence.push(size - 1);
      head = size - 1;
      for (let r of right) {
        distance += Math.abs(head - r);
        head = r;
        sequence.push(head);
      }
    }
  }
  return { sequence, distance };
}

function runLOOK(queue, head, size, direction) {
  let sequence = [head];
  let distance = 0;
  let left = queue.filter(req => req < head).sort((a, b) => b - a);
  let right = queue.filter(req => req >= head).sort((a, b) => a - b);

  if (direction === 'high') {
    for (let r of right) {
      distance += Math.abs(head - r);
      head = r;
      sequence.push(head);
    }
    for (let l of left) {
      distance += Math.abs(head - l);
      head = l;
      sequence.push(head);
    }
  } else {
    for (let l of left) {
      distance += Math.abs(head - l);
      head = l;
      sequence.push(head);
    }
    for (let r of right) {
      distance += Math.abs(head - r);
      head = r;
      sequence.push(head);
    }
  }
  return { sequence, distance };
}

function runCLOOK(queue, head, size, direction) {
  let sequence = [head];
  let distance = 0;
  let left = queue.filter(req => req < head).sort((a, b) => a - b);
  let right = queue.filter(req => req >= head).sort((a, b) => a - b);

  if (direction === 'high') {
    for (let r of right) {
      distance += Math.abs(head - r);
      head = r;
      sequence.push(head);
    }
    if (left.length > 0) {
      distance += Math.abs(head - left[0]);
      head = left[0];
      sequence.push(head);
      for (let i = 1; i < left.length; i++) {
        distance += Math.abs(head - left[i]);
        head = left[i];
        sequence.push(head);
      }
    }
  } else {
    left = queue.filter(req => req < head).sort((a, b) => b - a);
    right = queue.filter(req => req >= head).sort((a, b) => b - a);
    for (let l of left) {
      distance += Math.abs(head - l);
      head = l;
      sequence.push(head);
    }
    if (right.length > 0) {
      distance += Math.abs(head - right[0]);
      head = right[0];
      sequence.push(head);
      for (let i = 1; i < right.length; i++) {
        distance += Math.abs(head - right[i]);
        head = right[i];
        sequence.push(head);
      }
    }
  }
  return { sequence, distance };
}


export default function DiskScheduling({ darkMode, onBack }) {
  const [queueInput, setQueueInput] = useState('82, 170, 43, 140, 24, 16, 190');
  const [initialHead, setInitialHead] = useState(50);
  const [diskSize, setDiskSize] = useState(200);
  const [direction, setDirection] = useState('high'); // 'high' or 'low'
  const [algorithm, setAlgorithm] = useState('FCFS');
  
  const [simResult, setSimResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const parseQueue = () => {
    return queueInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n < diskSize);
  };

  const generateRandom = () => {
     const count = Math.floor(Math.random() * 5) + 5;
     const q = Array.from({length: count}, () => Math.floor(Math.random() * diskSize));
     setQueueInput(q.join(', '));
     setInitialHead(Math.floor(Math.random() * diskSize));
     resetSimulation();
  };

  const runSimulation = useCallback(() => {
    const queue = parseQueue();
    let result;
    switch(algorithm) {
       case 'SSTF': result = runSSTF(queue, initialHead); break;
       case 'SCAN': result = runSCAN(queue, initialHead, diskSize, direction); break;
       case 'C-SCAN': result = runCSCAN(queue, initialHead, diskSize, direction); break;
       case 'LOOK': result = runLOOK(queue, initialHead, diskSize, direction); break;
       case 'C-LOOK': result = runCLOOK(queue, initialHead, diskSize, direction); break;
       default: result = runFCFS(queue, initialHead);
    }
    setSimResult(result);
    setCurrentStep(0);
    setIsRunning(true);
    setIsPaused(false);
  }, [queueInput, initialHead, diskSize, algorithm, direction]);

  const resetSimulation = () => {
    setSimResult(null);
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stepForward = () => {
    if (!simResult) { runSimulation(); return; }
    setIsPaused(true);
    setCurrentStep(prev => Math.min(prev + 1, simResult.sequence.length - 1));
  };

  useEffect(() => {
    if (!isRunning || isPaused || !simResult) return;
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= simResult.sequence.length - 1) { setIsRunning(false); clearInterval(timerRef.current); return prev; }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused, simResult]);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bg = darkMode ? '#0f1221' : '#f8fafc';
    const textColor = darkMode ? '#e2e8f0' : '#1e293b';
    const mutedText = darkMode ? '#64748b' : '#94a3b8';
    
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (!simResult) {
      ctx.fillStyle = mutedText;
      ctx.font = '16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Configure queue and click "Run Simulation"', W / 2, H / 2 - 10);
      return;
    }

    const { sequence } = simResult;
    const visSeq = sequence.slice(0, currentStep + 1);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DISK HEAD MOVEMENT GRAPH', 20, 30);

    const padX = 40;
    const graphW = W - 2 * padX;
    const topY = 60;
    const bottomY = H - 60;
    
    // Draw grid
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
       const x = padX + (i / 10) * graphW;
       ctx.moveTo(x, topY);
       ctx.lineTo(x, bottomY);
    }
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = mutedText;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
       const x = padX + (i / 10) * graphW;
       const val = Math.round((i / 10) * (diskSize - 1));
       ctx.fillText(String(val), x, topY - 10);
    }

    // Draw path
    if (visSeq.length > 0) {
       ctx.strokeStyle = '#6366f1';
       ctx.lineWidth = 2;
       ctx.beginPath();
       for (let i = 0; i < visSeq.length; i++) {
          const x = padX + (visSeq[i] / (diskSize - 1)) * graphW;
          const y = topY + (i / Math.max(1, sequence.length - 1)) * (bottomY - topY);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
       }
       ctx.stroke();

       // Draw points
       for (let i = 0; i < visSeq.length; i++) {
          const x = padX + (visSeq[i] / (diskSize - 1)) * graphW;
          const y = topY + (i / Math.max(1, sequence.length - 1)) * (bottomY - topY);
          ctx.fillStyle = i === 0 ? '#10b981' : i === visSeq.length - 1 ? '#ef4444' : '#6366f1';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = textColor;
          ctx.font = '10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(` ${visSeq[i]}`, x + 6, y + 3);
       }
    }

  }, [simResult, currentStep, darkMode, diskSize]);

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? 'bg-[#141829] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h2 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Disk Scheduling Algorithms</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetSimulation} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>Reset</button>
          <button onClick={runSimulation} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg transition-all">
            Run Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left */}
        <div className={`w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4 ${darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'}`}>
           <div>
            <label className={`block text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Algorithm</label>
            <select value={algorithm} onChange={(e) => { setAlgorithm(e.target.value); resetSimulation(); }}
              className={`w-full rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border text-slate-900'}`}>
              {['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
             <div className="flex justify-between items-center mb-2">
                 <label className={`text-xs font-bold uppercase ${darkMode?'text-slate-400':'text-slate-500'}`}>Request Queue</label>
                 <button onClick={generateRandom} className={`px-2 py-1 rounded text-[10px] ${darkMode?'bg-white/5 text-slate-400':'bg-slate-200'}`}>Random</button>
             </div>
             <input type="text" value={queueInput} onChange={e=>setQueueInput(e.target.value)}
                className={`w-full rounded px-3 py-2 text-sm outline-none ${darkMode?'bg-white/5 text-white':'border bg-white text-slate-900'}`} />
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>Initial Head</label>
                <input type="number" min="0" max={diskSize-1} value={initialHead} onChange={e=>setInitialHead(parseInt(e.target.value)||0)}
                   className={`w-full rounded px-2 py-1 text-sm outline-none ${darkMode?'bg-white/5 text-white':'border bg-white text-slate-900'}`} />
             </div>
             <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${darkMode?'text-slate-400':'text-slate-500'}`}>Disk Size</label>
                <input type="number" min="10" value={diskSize} onChange={e=>setDiskSize(parseInt(e.target.value)||200)}
                   className={`w-full rounded px-2 py-1 text-sm outline-none ${darkMode?'bg-white/5 text-white':'border bg-white text-slate-900'}`} />
             </div>
          </div>

          {['SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'].includes(algorithm) && (
              <div>
                 <label className={`block text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Direction</label>
                 <select value={direction} onChange={e=>setDirection(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border text-slate-900'}`}>
                    <option value="high">Towards Larger (High)</option>
                    <option value="low">Towards Smaller (Low)</option>
                 </select>
              </div>
          )}

        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 p-4 ${darkMode ? 'bg-[#0d0f1a]' : 'bg-slate-50'}`}>
            <canvas ref={canvasRef} width={800} height={500} className="w-full h-full rounded-xl" style={{ maxHeight: '500px' }} />
          </div>
          <div className={`flex items-center justify-between px-4 py-3 border-t ${darkMode ? 'bg-[#141829] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex gap-2">
               <button onClick={() => { if (!simResult) runSimulation(); else { setIsRunning(true); setIsPaused(false); } }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white">▶ {simResult ? 'Resume' : 'Run'}</button>
               <button onClick={()=>setIsPaused(true)} disabled={!isRunning} className={`px-4 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>⏸ Pause</button>
               <button onClick={stepForward} className={`px-4 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>⏭ Step</button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className={`w-64 flex-shrink-0 overflow-y-auto border-l p-4 space-y-4 ${darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'}`}>
           <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Statistics</h3>
           {simResult && (
               <>
                 <div className={`rounded-xl p-3 ${darkMode?'bg-white/5':'bg-white border shadow-sm'}`}>
                    <p className={`text-[10px] uppercase font-bold ${darkMode?'text-slate-400':'text-slate-500'}`}>Total Seek Distance</p>
                    <p className={`text-xl font-bold mt-1 ${darkMode?'text-white':'text-slate-900'}`}>{simResult.distance} tracks</p>
                 </div>
                 <div className={`rounded-xl p-3 ${darkMode?'bg-white/5':'bg-white border shadow-sm'}`}>
                    <p className={`text-[10px] uppercase font-bold ${darkMode?'text-slate-400':'text-slate-500'}`}>Sequence Length</p>
                    <p className={`text-xl font-bold mt-1 ${darkMode?'text-white':'text-slate-900'}`}>{simResult.sequence.length}</p>
                 </div>
               </>
           )}
        </div>
      </div>
    </div>
  );
}
