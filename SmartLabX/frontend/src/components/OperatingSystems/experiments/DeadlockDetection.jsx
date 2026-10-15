import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function DeadlockDetection({ darkMode, onBack }) {
  // Bankers algorithm inputs
  const [numProcesses, setNumProcesses] = useState(5);
  const [numResources, setNumResources] = useState(3);
  
  // Matrices
  const [allocation, setAllocation] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ]);
  
  const [max, setMax] = useState([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ]);
  
  const [available, setAvailable] = useState([3, 3, 2]);

  // Simulation state
  const [simResult, setSimResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  // Compute Need Matrix
  const need = max.map((row, i) => row.map((val, j) => val - allocation[i][j]));

  // Auto-resize matrices when dimensions change
  useEffect(() => {
    setAllocation(prev => {
      const newMat = Array(numProcesses).fill(0).map(() => Array(numResources).fill(0));
      for (let i = 0; i < Math.min(prev.length, numProcesses); i++) {
        for (let j = 0; j < Math.min(prev[i].length, numResources); j++) {
          newMat[i][j] = prev[i][j];
        }
      }
      return newMat;
    });
    setMax(prev => {
      const newMat = Array(numProcesses).fill(0).map(() => Array(numResources).fill(0));
      for (let i = 0; i < Math.min(prev.length, numProcesses); i++) {
        for (let j = 0; j < Math.min(prev[i].length, numResources); j++) {
          newMat[i][j] = prev[i][j];
        }
      }
      return newMat;
    });
    setAvailable(prev => {
      const newArr = Array(numResources).fill(0);
      for (let j = 0; j < Math.min(prev.length, numResources); j++) {
        newArr[j] = prev[j];
      }
      return newArr;
    });
  }, [numProcesses, numResources]);

  const updateAllocation = (i, j, val) => {
    const newMat = [...allocation];
    newMat[i][j] = parseInt(val) || 0;
    setAllocation(newMat);
  };

  const updateMax = (i, j, val) => {
    const newMat = [...max];
    newMat[i][j] = parseInt(val) || 0;
    setMax(newMat);
  };

  const updateAvailable = (j, val) => {
    const newArr = [...available];
    newArr[j] = parseInt(val) || 0;
    setAvailable(newArr);
  };

  const runBankers = useCallback(() => {
    const work = [...available];
    const finish = Array(numProcesses).fill(false);
    const safeSeq = [];
    const steps = []; // { work, finish, safeSeq, tryProcess, canExecute, message }

    let count = 0;
    while (count < numProcesses) {
      let found = false;
      for (let p = 0; p < numProcesses; p++) {
        if (!finish[p]) {
          steps.push({
            work: [...work],
            finish: [...finish],
            safeSeq: [...safeSeq],
            tryProcess: p,
            canExecute: false,
            message: `Checking P${p}: Need [${need[p].join(', ')}] <= Work [${work.join(', ')}] ?`
          });

          let canAllocate = true;
          for (let j = 0; j < numResources; j++) {
            if (need[p][j] > work[j]) {
              canAllocate = false;
              break;
            }
          }

          if (canAllocate) {
            steps[steps.length - 1].canExecute = true;
            steps[steps.length - 1].message += ' Yes.';
            
            // Execute
            for (let j = 0; j < numResources; j++) {
              work[j] += allocation[p][j];
            }
            safeSeq.push(p);
            finish[p] = true;
            found = true;
            count++;

            steps.push({
              work: [...work],
              finish: [...finish],
              safeSeq: [...safeSeq],
              tryProcess: null,
              canExecute: null,
              message: `P${p} executed. Released allocation. New Work [${work.join(', ')}]`
            });
            break; // restart loop
          } else {
             steps[steps.length - 1].message += ' No. Cannot execute.';
          }
        }
      }
      if (!found) {
        break; // Deadlock or unsafe state
      }
    }

    const isSafe = count === numProcesses;
    steps.push({
      work: [...work],
      finish: [...finish],
      safeSeq: [...safeSeq],
      tryProcess: null,
      canExecute: null,
      message: isSafe ? `System is in a SAFE state. Sequence: <${safeSeq.map(p=>`P${p}`).join(', ')}>` : `System is in an UNSAFE state. Deadlock may occur.`
    });

    setSimResult({ isSafe, safeSeq, steps, finalWork: work, finalFinish: finish });
    setCurrentStep(0);
    setIsRunning(true);
    setIsPaused(false);
  }, [numProcesses, numResources, allocation, available, need]);

  const resetSimulation = () => {
    setSimResult(null);
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stepForward = () => {
    if (!simResult) { runBankers(); return; }
    setIsPaused(true);
    setCurrentStep(prev => Math.min(prev + 1, simResult.steps.length - 1));
  };

  useEffect(() => {
    if (!isRunning || isPaused || !simResult) return;
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= simResult.steps.length - 1) { setIsRunning(false); clearInterval(timerRef.current); return prev; }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused, simResult]);

  // ─── Canvas Drawing ─────────────────────────────────────────────────
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
      ctx.fillText('Enter resource matrices and click "Run Simulation"', W / 2, H / 2 - 10);
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText('The Banker\'s Algorithm execution will be visualized step-by-step', W / 2, H / 2 + 15);
      return;
    }

    const step = simResult.steps[currentStep];
    
    // Draw Graph Visualization
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STATE VISUALIZATION', 20, 30);

    const centerX = W / 2;
    const centerY = H / 2 - 40;
    const radius = 120;

    // Draw Processes (Circles)
    const nodePositions = [];
    for(let i=0; i<numProcesses; i++) {
        const angle = (i / numProcesses) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        nodePositions.push({x, y});

        const isFinished = step.finish[i];
        const isTrying = step.tryProcess === i;

        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        if(isFinished) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.strokeStyle = '#10b981';
        } else if(isTrying) {
            ctx.fillStyle = step.canExecute ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)';
            ctx.strokeStyle = step.canExecute ? '#10b981' : '#f59e0b';
            ctx.lineWidth = 3;
        } else {
            ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 14px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`P${i}`, x, y + 5);
    }

    // Work Vector display
    const workX = 20;
    const workY = H - 80;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CURRENT WORK VECTOR (AVAILABLE)', workX, workY);
    
    ctx.fillStyle = darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(workX, workY + 15, 200, 40, 8);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[ ${step.work.join(' , ')} ]`, workX + 100, workY + 42);

    // Message Log
    const msgX = W / 2 - 100;
    const msgY = H - 120;
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.beginPath();
    ctx.roundRect(msgX, msgY, W - msgX - 20, 100, 8);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ALGORITHM STEP:', msgX + 15, msgY + 25);
    
    ctx.fillStyle = step.canExecute === true ? '#10b981' : step.canExecute === false ? '#f59e0b' : '#6366f1';
    if(currentStep === simResult.steps.length - 1) {
       ctx.fillStyle = simResult.isSafe ? '#10b981' : '#ef4444';
    }
    ctx.font = '13px Inter, system-ui, sans-serif';
    
    // Wrap text hack
    const words = step.message.split(' ');
    let line = '';
    let ly = msgY + 50;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > (W - msgX - 50) && n > 0) {
        ctx.fillText(line, msgX + 15, ly);
        line = words[n] + ' ';
        ly += 20;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, msgX + 15, ly);


  }, [simResult, currentStep, darkMode, numProcesses]);

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? 'bg-[#141829] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h2 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Deadlock Detection & Banker's Algorithm</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetSimulation} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>Reset</button>
          <button onClick={runBankers} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 transition-all">
            Run Banker's
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className={`w-80 flex-shrink-0 overflow-y-auto border-r p-4 space-y-6 ${darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'}`}>
          <div className="flex gap-4">
             <div className="flex-1">
                <label className={`block text-[10px] font-bold uppercase mb-1 ${darkMode?'text-slate-500':'text-slate-400'}`}>Processes</label>
                <input type="number" min="2" max="6" value={numProcesses} onChange={e=>setNumProcesses(parseInt(e.target.value)||2)}
                   className={`w-full p-2 text-sm rounded ${darkMode?'bg-white/5 text-white':'bg-white text-slate-900 border'}`} />
             </div>
             <div className="flex-1">
                <label className={`block text-[10px] font-bold uppercase mb-1 ${darkMode?'text-slate-500':'text-slate-400'}`}>Resources</label>
                <input type="number" min="2" max="5" value={numResources} onChange={e=>setNumResources(parseInt(e.target.value)||2)}
                   className={`w-full p-2 text-sm rounded ${darkMode?'bg-white/5 text-white':'bg-white text-slate-900 border'}`} />
             </div>
          </div>

          <div>
             <label className={`block text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Allocation Matrix</label>
             <div className="space-y-1">
               {allocation.slice(0, numProcesses).map((row, i) => (
                 <div key={`a-${i}`} className="flex gap-1 items-center">
                   <span className={`w-6 text-[10px] font-bold ${darkMode?'text-slate-500':'text-slate-400'}`}>P{i}</span>
                   {row.slice(0, numResources).map((val, j) => (
                     <input key={`a-${i}-${j}`} type="number" value={val} onChange={e=>updateAllocation(i,j,e.target.value)}
                        className={`w-full p-1.5 text-xs text-center rounded ${darkMode?'bg-white/5 text-white':'bg-white text-slate-900 border'}`} />
                   ))}
                 </div>
               ))}
             </div>
          </div>

          <div>
             <label className={`block text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Max Matrix</label>
             <div className="space-y-1">
               {max.slice(0, numProcesses).map((row, i) => (
                 <div key={`m-${i}`} className="flex gap-1 items-center">
                   <span className={`w-6 text-[10px] font-bold ${darkMode?'text-slate-500':'text-slate-400'}`}>P{i}</span>
                   {row.slice(0, numResources).map((val, j) => (
                     <input key={`m-${i}-${j}`} type="number" value={val} onChange={e=>updateMax(i,j,e.target.value)}
                        className={`w-full p-1.5 text-xs text-center rounded ${darkMode?'bg-white/5 text-white':'bg-white text-slate-900 border'}`} />
                   ))}
                 </div>
               ))}
             </div>
          </div>
          
          <div>
             <label className={`block text-xs font-bold uppercase mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Available Resources</label>
             <div className="flex gap-1 pl-7">
               {available.slice(0, numResources).map((val, j) => (
                 <input key={`av-${j}`} type="number" value={val} onChange={e=>updateAvailable(j,e.target.value)}
                    className={`w-full p-1.5 text-xs text-center rounded ${darkMode?'bg-white/5 text-white':'bg-white text-slate-900 border'}`} />
               ))}
             </div>
          </div>

        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 p-4 ${darkMode ? 'bg-[#0d0f1a]' : 'bg-slate-50'}`}>
            <canvas ref={canvasRef} width={800} height={500} className="w-full h-full rounded-xl" style={{ maxHeight: '500px' }} />
          </div>
          <div className={`flex items-center justify-between px-4 py-3 border-t ${darkMode ? 'bg-[#141829] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex gap-2">
               <button onClick={() => { if (!simResult) runBankers(); else { setIsRunning(true); setIsPaused(false); } }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white">▶ {simResult ? 'Resume' : 'Run'}</button>
               <button onClick={()=>setIsPaused(true)} disabled={!isRunning} className={`px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-30 ${darkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100'}`}>⏸ Pause</button>
               <button onClick={stepForward} className={`px-4 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100'}`}>⏭ Step</button>
            </div>
            <div className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {simResult ? `Step ${currentStep} / ${simResult.steps.length - 1}` : 'Ready'}
            </div>
          </div>
        </div>
        
        {/* Right Panel */}
        <div className={`w-64 flex-shrink-0 overflow-y-auto border-l p-4 space-y-4 ${darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Need Matrix (Calculated)</h3>
          <div className="space-y-1 mb-6">
               {need.slice(0, numProcesses).map((row, i) => (
                 <div key={`n-${i}`} className="flex gap-1 items-center">
                   <span className={`w-6 text-[10px] font-bold ${darkMode?'text-slate-500':'text-slate-400'}`}>P{i}</span>
                   {row.slice(0, numResources).map((val, j) => (
                     <div key={`n-${i}-${j}`} className={`w-full p-1.5 text-xs text-center rounded ${darkMode?'bg-white/5 text-white':'bg-white text-slate-900 border'}`}>
                        {val}
                     </div>
                   ))}
                 </div>
               ))}
          </div>

          <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode?'text-slate-400':'text-slate-500'}`}>Result</h3>
          {simResult && (
             <div className={`p-4 rounded-xl border ${simResult.isSafe ? (darkMode?'bg-emerald-500/10 border-emerald-500/30 text-emerald-400':'bg-emerald-50 border-emerald-200 text-emerald-700') : (darkMode?'bg-red-500/10 border-red-500/30 text-red-400':'bg-red-50 border-red-200 text-red-700')}`}>
                 <p className="font-bold mb-2">{simResult.isSafe ? 'SAFE STATE' : 'UNSAFE STATE'}</p>
                 {simResult.isSafe && (
                    <p className="text-xs">Safe Sequence:<br/> {`< ${simResult.safeSeq.map(p=>`P${p}`).join(', ')} >`}</p>
                 )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
