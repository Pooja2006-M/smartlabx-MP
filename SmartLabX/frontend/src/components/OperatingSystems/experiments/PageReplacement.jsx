import React, { useState, useEffect, useRef, useCallback } from 'react';

function runFIFO(pages, frameCount) {
  const frames = Array(frameCount).fill(null);
  const steps = [];
  let faults = 0, hits = 0, queue = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const inFrames = frames.includes(page);
    if (inFrames) {
      hits++;
      steps.push({ page, frames: [...frames], fault: false, replaced: null, queue: [...queue] });
    } else {
      faults++;
      let replaced = null;
      if (frames.includes(null)) {
        const emptyIdx = frames.indexOf(null);
        frames[emptyIdx] = page;
        queue.push(page);
      } else {
        replaced = queue.shift();
        const idx = frames.indexOf(replaced);
        frames[idx] = page;
        queue.push(page);
      }
      steps.push({ page, frames: [...frames], fault: true, replaced, queue: [...queue] });
    }
  }
  return { steps, faults, hits };
}

function runLRU(pages, frameCount) {
  const frames = Array(frameCount).fill(null);
  const steps = [];
  let faults = 0, hits = 0;
  const lastUsed = {};

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const inFrames = frames.includes(page);
    if (inFrames) {
      hits++;
      lastUsed[page] = i;
      steps.push({ page, frames: [...frames], fault: false, replaced: null });
    } else {
      faults++;
      let replaced = null;
      if (frames.includes(null)) {
        const emptyIdx = frames.indexOf(null);
        frames[emptyIdx] = page;
      } else {
        let lruPage = null, lruTime = Infinity;
        for (const f of frames) {
          if ((lastUsed[f] ?? -1) < lruTime) { lruTime = lastUsed[f] ?? -1; lruPage = f; }
        }
        replaced = lruPage;
        const idx = frames.indexOf(lruPage);
        frames[idx] = page;
      }
      lastUsed[page] = i;
      steps.push({ page, frames: [...frames], fault: true, replaced });
    }
  }
  return { steps, faults, hits };
}

function runOptimal(pages, frameCount) {
  const frames = Array(frameCount).fill(null);
  const steps = [];
  let faults = 0, hits = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const inFrames = frames.includes(page);
    if (inFrames) {
      hits++;
      steps.push({ page, frames: [...frames], fault: false, replaced: null });
    } else {
      faults++;
      let replaced = null;
      if (frames.includes(null)) {
        const emptyIdx = frames.indexOf(null);
        frames[emptyIdx] = page;
      } else {
        let farthest = -1, victimIdx = 0;
        for (let f = 0; f < frames.length; f++) {
          const nextUse = pages.indexOf(frames[f], i + 1);
          if (nextUse === -1) { victimIdx = f; break; }
          if (nextUse > farthest) { farthest = nextUse; victimIdx = f; }
        }
        replaced = frames[victimIdx];
        frames[victimIdx] = page;
      }
      steps.push({ page, frames: [...frames], fault: true, replaced });
    }
  }
  return { steps, faults, hits };
}

export default function PageReplacement({ darkMode, onBack }) {
  const [pageString, setPageString] = useState('7,0,1,2,0,3,0,4,2,3,0,3,2');
  const [frameCount, setFrameCount] = useState(3);
  const [algorithm, setAlgorithm] = useState('FIFO');
  const [simResult, setSimResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const pages = pageString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

  const runSimulation = useCallback(() => {
    let result;
    switch (algorithm) {
      case 'LRU': result = runLRU(pages, frameCount); break;
      case 'Optimal': result = runOptimal(pages, frameCount); break;
      default: result = runFIFO(pages, frameCount);
    }
    setSimResult(result);
    setCurrentStep(0);
    setIsRunning(true);
    setIsPaused(false);
  }, [algorithm, pages, frameCount]);

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
    setCurrentStep(prev => Math.min(prev + 1, simResult.steps.length));
  };

  useEffect(() => {
    if (!isRunning || isPaused || !simResult) return;
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= simResult.steps.length) { setIsRunning(false); clearInterval(timerRef.current); return prev; }
        return prev + 1;
      });
    }, 700 / speed);
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused, simResult, speed]);

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
      ctx.fillText('Enter page reference string and click "Run Simulation"', W / 2, H / 2 - 10);
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText('Watch pages load into frames with animated page faults and hits', W / 2, H / 2 + 15);
      return;
    }

    const visibleSteps = simResult.steps.slice(0, currentStep);
    const totalSteps = simResult.steps.length;

    // ─── Page Reference String ──────────────────────────
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PAGE REFERENCE STRING', 20, 28);

    const cellW = Math.min(50, (W - 40) / pages.length);
    const cellH = 36;
    const refY = 38;

    pages.forEach((page, i) => {
      const x = 20 + i * cellW;
      const isActive = i === currentStep - 1;
      const isPast = i < currentStep;

      if (isActive) {
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.roundRect(x, refY, cellW - 2, cellH, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
      } else if (isPast) {
        const step = simResult.steps[i];
        ctx.fillStyle = step.fault ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)';
        ctx.beginPath();
        ctx.roundRect(x, refY, cellW - 2, cellH, 6);
        ctx.fill();
        ctx.fillStyle = step.fault ? '#ef4444' : '#10b981';
      } else {
        ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
        ctx.beginPath();
        ctx.roundRect(x, refY, cellW - 2, cellH, 6);
        ctx.fill();
        ctx.fillStyle = mutedText;
      }
      ctx.font = `${isActive ? 'bold ' : ''}14px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(page), x + cellW / 2 - 1, refY + cellH / 2 + 5);
    });

    // ─── Frames Grid ────────────────────────────────────
    const gridY = refY + cellH + 35;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('FRAME STATE PER STEP', 20, gridY);

    const fCellW = cellW;
    const fCellH = 40;
    const fStartY = gridY + 15;

    // Frame labels
    for (let f = 0; f < frameCount; f++) {
      ctx.fillStyle = mutedText;
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`F${f}`, 15, fStartY + f * fCellH + fCellH / 2 + 4);
    }

    // Draw grid
    visibleSteps.forEach((step, i) => {
      const x = 20 + i * fCellW;

      step.frames.forEach((page, f) => {
        const y = fStartY + f * fCellH;
        const isNew = step.fault && step.frames[f] === step.page;
        const isReplaced = step.replaced !== null && i > 0 && simResult.steps[i - 1].frames[f] === step.replaced;

        if (isNew) {
          ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
          ctx.strokeStyle = '#6366f1';
        } else if (page !== null) {
          ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
          ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        } else {
          ctx.fillStyle = 'transparent';
          ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, fCellW - 2, fCellH - 2, 4);
        ctx.fill();
        ctx.lineWidth = isNew ? 2 : 1;
        ctx.stroke();

        if (page !== null) {
          ctx.fillStyle = isNew ? '#6366f1' : textColor;
          ctx.font = `${isNew ? 'bold ' : ''}13px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(String(page), x + fCellW / 2 - 1, y + fCellH / 2 + 2);
        }
      });

      // Fault/Hit indicator below
      const indicatorY = fStartY + frameCount * fCellH + 5;
      ctx.fillStyle = step.fault ? '#ef4444' : '#10b981';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(step.fault ? 'F' : 'H', x + fCellW / 2 - 1, indicatorY);
    });

    // ─── Stats Section ──────────────────────────────────
    const statsY = fStartY + frameCount * fCellH + 40;
    const faultsSoFar = visibleSteps.filter(s => s.fault).length;
    const hitsSoFar = visibleSteps.filter(s => !s.fault).length;
    const ratio = visibleSteps.length > 0 ? ((faultsSoFar / visibleSteps.length) * 100).toFixed(1) : '0.0';

    // Fault/Hit counters
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STATISTICS', 20, statsY);

    // Fault counter
    const counterY = statsY + 20;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.beginPath();
    ctx.roundRect(20, counterY, 130, 50, 10);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(faultsSoFar), 85, counterY + 32);
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('Page Faults', 85, counterY + 46);

    // Hit counter
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.beginPath();
    ctx.roundRect(160, counterY, 130, 50, 10);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(hitsSoFar), 225, counterY + 32);
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('Page Hits', 225, counterY + 46);

    // Ratio
    ctx.fillStyle = darkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)';
    ctx.beginPath();
    ctx.roundRect(300, counterY, 130, 50, 10);
    ctx.fill();
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${ratio}%`, 365, counterY + 32);
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('Fault Ratio', 365, counterY + 46);

    // Progress bar
    const progY = counterY + 65;
    ctx.fillStyle = mutedText;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Step ${currentStep} of ${totalSteps}`, 20, progY);

    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.beginPath();
    ctx.roundRect(20, progY + 8, W - 40, 6, 3);
    ctx.fill();
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(20, progY + 8, ((W - 40) * currentStep) / totalSteps, 6, 3);
    ctx.fill();

  }, [simResult, currentStep, pages, frameCount, darkMode]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        darkMode ? 'bg-[#141829] border-white/5' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h2 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Page Replacement Algorithms</h2>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            darkMode ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700'
          }`}>Experiment 3</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetSimulation} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>Reset</button>
          <button onClick={runSimulation} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 transition-all">
            Run Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className={`w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4 ${
          darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Algorithm</label>
            <select value={algorithm} onChange={(e) => { setAlgorithm(e.target.value); resetSimulation(); }}
              className={`w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none ${
                darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'
              }`}>
              <option value="FIFO">FIFO (First In First Out)</option>
              <option value="LRU">LRU (Least Recently Used)</option>
              <option value="Optimal">Optimal</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Page Reference String</label>
            <textarea value={pageString} onChange={(e) => setPageString(e.target.value)} rows={3}
              className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${
                darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'
              }`} placeholder="e.g. 7,0,1,2,0,3,0,4" />
            <div className="flex gap-1.5 mt-2">
              <button onClick={() => {
                const rnd = Array.from({ length: Math.floor(Math.random() * 8) + 8 }, () => Math.floor(Math.random() * 8));
                setPageString(rnd.join(','));
                resetSimulation();
              }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>Random</button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Number of Frames: {frameCount}
            </label>
            <input type="range" min={2} max={6} value={frameCount} onChange={(e) => { setFrameCount(parseInt(e.target.value)); resetSimulation(); }}
              className="w-full accent-amber-500" />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Speed: {speed}x</label>
            <input type="range" min={0.25} max={4} step={0.25} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-amber-500" />
          </div>

          {/* Legend */}
          <div className={`rounded-xl p-3 space-y-2 ${darkMode ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-slate-200'}`}>
            <p className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>LEGEND</p>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" /><span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Page Fault</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" /><span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Page Hit</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500" /><span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>New Page</span></div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className={`flex-1 flex flex-col`}>
          <div className={`flex-1 p-4 ${darkMode ? 'bg-[#0d0f1a]' : 'bg-slate-50'}`}>
            <canvas ref={canvasRef} width={900} height={450} className="w-full h-full rounded-xl" style={{ maxHeight: '450px' }} />
          </div>

          {/* Bottom Controls */}
          <div className={`flex items-center justify-between px-4 py-3 border-t ${
            darkMode ? 'bg-[#141829] border-white/5' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <button onClick={() => { if (!simResult) runSimulation(); else { setIsRunning(true); setIsPaused(false); } }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all">
                ▶ {simResult ? 'Resume' : 'Run'}
              </button>
              <button onClick={() => setIsPaused(true)} disabled={!isRunning}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-30 ${
                  darkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>⏸ Pause</button>
              <button onClick={stepForward}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  darkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>⏭ Step</button>
              <button onClick={resetSimulation}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  darkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>↺ Restart</button>
            </div>
            <div className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {simResult ? `Step ${currentStep} / ${simResult.steps.length}` : 'Ready'}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={`w-60 flex-shrink-0 overflow-y-auto border-l p-4 space-y-3 ${
          darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Statistics</h3>
          {(() => {
            const vis = simResult ? simResult.steps.slice(0, currentStep) : [];
            const f = vis.filter(s => s.fault).length;
            const h = vis.filter(s => !s.fault).length;
            const r = vis.length > 0 ? ((f / vis.length) * 100).toFixed(1) : '0.0';
            return [
              { label: 'Algorithm', value: algorithm },
              { label: 'Frames', value: frameCount },
              { label: 'Total Pages', value: pages.length },
              { label: 'Page Faults', value: f, color: 'text-red-500' },
              { label: 'Page Hits', value: h, color: 'text-emerald-500' },
              { label: 'Fault Ratio', value: `${r}%` },
              { label: 'Hit Ratio', value: `${(100 - parseFloat(r)).toFixed(1)}%` },
              { label: 'Status', value: isRunning ? (isPaused ? 'Paused' : 'Running') : simResult ? 'Complete' : 'Ready' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 ${darkMode ? 'bg-white/[0.03]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                <p className={`text-sm font-bold mt-1 ${s.color || (darkMode ? 'text-white' : 'text-slate-900')}`}>{s.value}</p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
