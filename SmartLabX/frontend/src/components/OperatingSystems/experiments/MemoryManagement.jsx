import React, { useState, useEffect, useRef, useCallback } from 'react';

const BLOCK_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function allocateFirstFit(blocks, procSize) {
  for (let i = 0; i < blocks.length; i++) {
    if (!blocks[i].allocated && blocks[i].size >= procSize) return i;
  }
  return -1;
}

function allocateBestFit(blocks, procSize) {
  let bestIdx = -1, bestDiff = Infinity;
  for (let i = 0; i < blocks.length; i++) {
    if (!blocks[i].allocated && blocks[i].size >= procSize) {
      const diff = blocks[i].size - procSize;
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
  }
  return bestIdx;
}

function allocateWorstFit(blocks, procSize) {
  let worstIdx = -1, worstDiff = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (!blocks[i].allocated && blocks[i].size >= procSize) {
      const diff = blocks[i].size - procSize;
      if (diff > worstDiff) { worstDiff = diff; worstIdx = i; }
    }
  }
  return worstIdx;
}

export default function MemoryManagement({ darkMode, onBack }) {
  const [memoryBlocks, setMemoryBlocks] = useState([
    { id: 1, size: 100, allocated: false, process: null, processSize: 0 },
    { id: 2, size: 500, allocated: false, process: null, processSize: 0 },
    { id: 3, size: 200, allocated: false, process: null, processSize: 0 },
    { id: 4, size: 300, allocated: false, process: null, processSize: 0 },
    { id: 5, size: 600, allocated: false, process: null, processSize: 0 },
  ]);

  const [processes, setProcesses] = useState([
    { id: 'P1', size: 212, color: BLOCK_COLORS[0], allocated: false },
    { id: 'P2', size: 417, color: BLOCK_COLORS[1], allocated: false },
    { id: 'P3', size: 112, color: BLOCK_COLORS[2], allocated: false },
    { id: 'P4', size: 426, color: BLOCK_COLORS[3], allocated: false },
  ]);

  const [algorithm, setAlgorithm] = useState('first-fit');
  const [allocationLog, setAllocationLog] = useState([]);
  const [animatingBlock, setAnimatingBlock] = useState(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoStep, setAutoStep] = useState(0);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const totalMemory = memoryBlocks.reduce((s, b) => s + b.size, 0);
  const usedMemory = memoryBlocks.filter(b => b.allocated).reduce((s, b) => s + b.processSize, 0);
  const internalFrag = memoryBlocks.filter(b => b.allocated).reduce((s, b) => s + (b.size - b.processSize), 0);
  const externalFrag = memoryBlocks.filter(b => !b.allocated).reduce((s, b) => s + b.size, 0);
  const memUsage = ((usedMemory / totalMemory) * 100).toFixed(1);

  const allocateProcess = useCallback((procId) => {
    const proc = processes.find(p => p.id === procId);
    if (!proc || proc.allocated) return;

    let blockIdx;
    switch (algorithm) {
      case 'best-fit': blockIdx = allocateBestFit(memoryBlocks, proc.size); break;
      case 'worst-fit': blockIdx = allocateWorstFit(memoryBlocks, proc.size); break;
      default: blockIdx = allocateFirstFit(memoryBlocks, proc.size);
    }

    if (blockIdx === -1) {
      setAllocationLog(prev => [...prev, { process: proc.id, block: null, status: 'failed', msg: `${proc.id} (${proc.size}KB): No suitable block found` }]);
      return;
    }

    setAnimatingBlock(blockIdx);
    setTimeout(() => setAnimatingBlock(null), 600);

    setMemoryBlocks(prev => prev.map((b, i) => i === blockIdx ? { ...b, allocated: true, process: proc.id, processSize: proc.size } : b));
    setProcesses(prev => prev.map(p => p.id === procId ? { ...p, allocated: true } : p));
    setAllocationLog(prev => [...prev, {
      process: proc.id, block: memoryBlocks[blockIdx].id,
      status: 'success',
      msg: `${proc.id} (${proc.size}KB) → Block ${memoryBlocks[blockIdx].id} (${memoryBlocks[blockIdx].size}KB) | Frag: ${memoryBlocks[blockIdx].size - proc.size}KB`
    }]);
  }, [algorithm, memoryBlocks, processes]);

  const deallocateProcess = (procId) => {
    setMemoryBlocks(prev => prev.map(b => b.process === procId ? { ...b, allocated: false, process: null, processSize: 0 } : b));
    setProcesses(prev => prev.map(p => p.id === procId ? { ...p, allocated: false } : p));
    setAllocationLog(prev => [...prev, { process: procId, status: 'deallocated', msg: `${procId} deallocated from memory` }]);
  };

  const runAutoAllocation = () => {
    resetAll();
    setIsAutoRunning(true);
    setAutoStep(0);
  };

  useEffect(() => {
    if (!isAutoRunning) return;
    const unallocated = processes.filter(p => !p.allocated);
    if (unallocated.length === 0 || autoStep >= processes.length) {
      setIsAutoRunning(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      allocateProcess(processes[autoStep].id);
      setAutoStep(prev => prev + 1);
    }, 900);
    return () => clearTimeout(timerRef.current);
  }, [isAutoRunning, autoStep, processes, allocateProcess]);

  const resetAll = () => {
    setMemoryBlocks(prev => prev.map(b => ({ ...b, allocated: false, process: null, processSize: 0 })));
    setProcesses(prev => prev.map(p => ({ ...p, allocated: false })));
    setAllocationLog([]);
    setIsAutoRunning(false);
    setAutoStep(0);
  };

  const addBlock = () => {
    const newId = Math.max(...memoryBlocks.map(b => b.id), 0) + 1;
    setMemoryBlocks(prev => [...prev, { id: newId, size: Math.floor(Math.random() * 400) + 100, allocated: false, process: null, processSize: 0 }]);
  };

  const addProcess = () => {
    const idx = processes.length;
    setProcesses(prev => [...prev, {
      id: `P${idx + 1}`,
      size: Math.floor(Math.random() * 300) + 50,
      color: BLOCK_COLORS[idx % BLOCK_COLORS.length],
      allocated: false,
    }]);
  };

  const generateRandom = () => {
    const blockCount = Math.floor(Math.random() * 4) + 4;
    const procCount = Math.floor(Math.random() * 4) + 3;
    setMemoryBlocks(Array.from({ length: blockCount }, (_, i) => ({
      id: i + 1, size: Math.floor(Math.random() * 500) + 50, allocated: false, process: null, processSize: 0
    })));
    setProcesses(Array.from({ length: procCount }, (_, i) => ({
      id: `P${i + 1}`, size: Math.floor(Math.random() * 300) + 30, color: BLOCK_COLORS[i % BLOCK_COLORS.length], allocated: false
    })));
    setAllocationLog([]);
  };

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

    // Title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RAM VISUALIZATION', 30, 30);

    // Draw memory blocks as vertical bars
    const barX = 60;
    const barW = 120;
    const maxBarH = H - 80;
    const totalSize = memoryBlocks.reduce((s, b) => s + b.size, 0);
    let currentY = 50;

    memoryBlocks.forEach((block, idx) => {
      const blockH = (block.size / totalSize) * maxBarH;
      const isAnimating = animatingBlock === idx;

      if (block.allocated) {
        const proc = processes.find(p => p.id === block.process);
        const color = proc ? proc.color : '#6366f1';

        // Process portion
        const procH = (block.processSize / block.size) * blockH;
        ctx.fillStyle = isAnimating ? color : color + 'cc';
        ctx.beginPath();
        ctx.roundRect(barX, currentY, barW, procH, idx === 0 ? [8, 8, 0, 0] : idx === memoryBlocks.length - 1 ? [0, 0, 8, 8] : 0);
        ctx.fill();

        if (isAnimating) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Process label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${block.process}`, barX + barW / 2, currentY + procH / 2 + 4);

        // Internal fragmentation
        if (blockH - procH > 3) {
          ctx.fillStyle = darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(barX, currentY + procH, barW, blockH - procH);
          // Hatching
          ctx.strokeStyle = darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)';
          ctx.lineWidth = 1;
          for (let sy = currentY + procH; sy < currentY + blockH; sy += 6) {
            ctx.beginPath();
            ctx.moveTo(barX, sy);
            ctx.lineTo(barX + barW, sy);
            ctx.stroke();
          }
        }
      } else {
        // Free block
        ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
        ctx.beginPath();
        ctx.roundRect(barX, currentY, barW, blockH, idx === 0 ? [8, 8, 0, 0] : idx === memoryBlocks.length - 1 ? [0, 0, 8, 8] : 0);
        ctx.fill();

        ctx.fillStyle = mutedText;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        if (blockH > 20) ctx.fillText('Free', barX + barW / 2, currentY + blockH / 2 + 4);
      }

      // Block border
      ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, currentY, barW, blockH);

      // Block label on right
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`B${block.id}: ${block.size}KB`, barX + barW + 15, currentY + blockH / 2 + 4);

      currentY += blockH;
    });

    // ─── Memory Usage Gauge ──────────────────────────────
    const gaugeX = W - 200;
    const gaugeY = 50;
    const gaugeR = 60;

    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEMORY USAGE', gaugeX, gaugeY);

    const centerX = gaugeX;
    const centerY = gaugeY + 80;
    const usage = usedMemory / totalMemory;

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, gaugeR, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Usage arc
    const startAngle = Math.PI * 0.75;
    const endAngle = startAngle + (Math.PI * 1.5 * usage);
    ctx.beginPath();
    ctx.arc(centerX, centerY, gaugeR, startAngle, endAngle);
    const gradient = ctx.createLinearGradient(centerX - gaugeR, centerY, centerX + gaugeR, centerY);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#06b6d4');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillText(`${memUsage}%`, centerX, centerY + 8);
    ctx.fillStyle = mutedText;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText('Used', centerX, centerY + 25);

    // Stats below gauge
    const statsY = centerY + 60;
    const statsData = [
      { label: 'Total Memory', value: `${totalMemory}KB` },
      { label: 'Used Memory', value: `${usedMemory}KB` },
      { label: 'Internal Frag', value: `${internalFrag}KB` },
      { label: 'External Frag', value: `${externalFrag}KB` },
      { label: 'Free Blocks', value: memoryBlocks.filter(b => !b.allocated).length },
      { label: 'Allocated', value: memoryBlocks.filter(b => b.allocated).length },
    ];

    statsData.forEach((s, i) => {
      const y = statsY + i * 28;
      ctx.fillStyle = mutedText;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s.label, gaugeX - 70, y);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(s.value), gaugeX + 70, y);
    });

    // ─── Allocation Log ──────────────────────────────────
    const logX = 300;
    const logY = 50;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ALLOCATION LOG', logX, logY);

    const visibleLogs = allocationLog.slice(-10);
    visibleLogs.forEach((log, i) => {
      const y = logY + 20 + i * 22;
      ctx.fillStyle = log.status === 'success' ? '#10b981' : log.status === 'failed' ? '#ef4444' : '#f59e0b';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText(log.status === 'success' ? '[OK]' : log.status === 'failed' ? '' : '↩', logX, y);
      ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText(log.msg, logX + 18, y);
    });

    if (allocationLog.length === 0) {
      ctx.fillStyle = mutedText;
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('Allocate processes to see the log', logX, logY + 25);
    }
  }, [memoryBlocks, processes, allocationLog, animatingBlock, darkMode, totalMemory, usedMemory, internalFrag, externalFrag, memUsage]);

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
          <h2 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Memory Management</h2>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            darkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
          }`}>Experiment 2</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetAll} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>Reset</button>
          <button onClick={runAutoAllocation} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
            Run Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className={`w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4 ${
          darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'
        }`}>
          {/* Algorithm */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Algorithm</label>
            <select value={algorithm} onChange={(e) => { setAlgorithm(e.target.value); resetAll(); }}
              className={`w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none ${
                darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'
              }`}>
              <option value="first-fit">First Fit</option>
              <option value="best-fit">Best Fit</option>
              <option value="worst-fit">Worst Fit</option>
            </select>
          </div>

          {/* Memory Blocks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Memory Blocks</label>
              <div className="flex gap-1">
                <button onClick={generateRandom} className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>Random</button>
                <button onClick={addBlock} className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 transition">+ Add</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {memoryBlocks.map(b => (
                <div key={b.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                  darkMode ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-slate-200'
                }`}>
                  <span className={`text-xs font-bold w-8 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>B{b.id}</span>
                  <input type="number" value={b.size} min={10}
                    onChange={(e) => setMemoryBlocks(prev => prev.map(bl => bl.id === b.id ? { ...bl, size: parseInt(e.target.value) || 10 } : bl))}
                    className={`flex-1 rounded-lg px-2 py-1 text-xs outline-none ${
                      darkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`} />
                  <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>KB</span>
                  {b.allocated && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Processes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Processes</label>
              <button onClick={addProcess} className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 transition">+ Add</button>
            </div>
            <div className="space-y-2">
              {processes.map(p => (
                <div key={p.id} className={`rounded-xl p-3 ${
                  darkMode ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.id}</span>
                      <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{p.size}KB</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.allocated ? 'bg-emerald-500/15 text-emerald-500' : darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
                    }`}>{p.allocated ? 'Allocated' : 'Pending'}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => allocateProcess(p.id)} disabled={p.allocated}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition disabled:opacity-30 ${
                        darkMode ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}>Allocate</button>
                    <button onClick={() => deallocateProcess(p.id)} disabled={!p.allocated}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition disabled:opacity-30 ${
                        darkMode ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}>Deallocate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className={`flex-1 p-4 ${darkMode ? 'bg-[#0d0f1a]' : 'bg-slate-50'}`}>
          <canvas ref={canvasRef} width={700} height={480} className="w-full h-full rounded-xl" style={{ maxHeight: '480px' }} />
        </div>

        {/* Right Panel Stats */}
        <div className={`w-60 flex-shrink-0 overflow-y-auto border-l p-4 space-y-3 ${
          darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Statistics</h3>
          {[
            { label: 'Algorithm', value: algorithm === 'first-fit' ? 'First Fit' : algorithm === 'best-fit' ? 'Best Fit' : 'Worst Fit' },
            { label: 'Memory Usage', value: `${memUsage}%` },
            { label: 'Total Memory', value: `${totalMemory} KB` },
            { label: 'Used Memory', value: `${usedMemory} KB` },
            { label: 'Free Memory', value: `${totalMemory - usedMemory} KB` },
            { label: 'Internal Frag', value: `${internalFrag} KB` },
            { label: 'External Frag', value: `${externalFrag} KB` },
            { label: 'Blocks', value: memoryBlocks.length },
            { label: 'Allocated Blocks', value: memoryBlocks.filter(b => b.allocated).length },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3 ${darkMode ? 'bg-white/[0.03]' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
              <p className={`text-sm font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
