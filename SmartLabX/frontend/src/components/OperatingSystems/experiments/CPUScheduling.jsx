import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Algorithm Implementations ───────────────────────────────────────────────

function runFCFS(processes) {
  const procs = processes.map(p => ({ ...p })).sort((a, b) => a.arrival - b.arrival);
  const timeline = [];
  let time = 0;
  const completed = [];

  for (const p of procs) {
    if (time < p.arrival) {
      timeline.push({ pid: 'idle', start: time, end: p.arrival });
      time = p.arrival;
    }
    const start = time;
    const end = time + p.burst;
    timeline.push({ pid: p.id, start, end, color: p.color });
    completed.push({
      ...p,
      startTime: start,
      completionTime: end,
      turnaround: end - p.arrival,
      waiting: start - p.arrival,
      response: start - p.arrival,
    });
    time = end;
  }
  return { timeline, completed };
}

function runSJF(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const timeline = [];
  const completed = [];
  let time = 0;
  const n = procs.length;
  const done = new Set();
  const firstResponse = {};

  while (done.size < n) {
    const available = procs.filter(p => p.arrival <= time && !done.has(p.id));
    if (available.length === 0) {
      const next = procs.filter(p => !done.has(p.id)).sort((a, b) => a.arrival - b.arrival)[0];
      if (next) {
        timeline.push({ pid: 'idle', start: time, end: next.arrival });
        time = next.arrival;
      } else break;
      continue;
    }
    const shortest = available.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival)[0];
    if (!(shortest.id in firstResponse)) firstResponse[shortest.id] = time;
    const start = time;
    const end = time + shortest.remaining;
    timeline.push({ pid: shortest.id, start, end, color: shortest.color });
    done.add(shortest.id);
    completed.push({
      ...shortest,
      startTime: firstResponse[shortest.id],
      completionTime: end,
      turnaround: end - shortest.arrival,
      waiting: end - shortest.arrival - shortest.burst,
      response: firstResponse[shortest.id] - shortest.arrival,
    });
    time = end;
  }
  return { timeline, completed };
}

function runPriority(processes) {
  const procs = processes.map(p => ({ ...p }));
  const timeline = [];
  const completed = [];
  let time = 0;
  const n = procs.length;
  const done = new Set();

  while (done.size < n) {
    const available = procs.filter(p => p.arrival <= time && !done.has(p.id));
    if (available.length === 0) {
      const next = procs.filter(p => !done.has(p.id)).sort((a, b) => a.arrival - b.arrival)[0];
      if (next) {
        timeline.push({ pid: 'idle', start: time, end: next.arrival });
        time = next.arrival;
      } else break;
      continue;
    }
    const highest = available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival)[0];
    const start = time;
    const end = time + highest.burst;
    timeline.push({ pid: highest.id, start, end, color: highest.color });
    done.add(highest.id);
    completed.push({
      ...highest,
      startTime: start,
      completionTime: end,
      turnaround: end - highest.arrival,
      waiting: start - highest.arrival,
      response: start - highest.arrival,
    });
    time = end;
  }
  return { timeline, completed };
}

function runRoundRobin(processes, quantum) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  const timeline = [];
  const completed = [];
  let time = 0;
  const queue = [];
  const n = procs.length;
  const arrived = new Set();
  const firstResponse = {};
  let idx = 0;

  // Sort by arrival
  procs.sort((a, b) => a.arrival - b.arrival);

  // Add initially arrived
  while (idx < n && procs[idx].arrival <= time) {
    queue.push(procs[idx]);
    arrived.add(procs[idx].id);
    idx++;
  }

  while (queue.length > 0 || idx < n) {
    if (queue.length === 0) {
      const next = procs[idx];
      timeline.push({ pid: 'idle', start: time, end: next.arrival });
      time = next.arrival;
      while (idx < n && procs[idx].arrival <= time) {
        if (!arrived.has(procs[idx].id)) {
          queue.push(procs[idx]);
          arrived.add(procs[idx].id);
        }
        idx++;
      }
      continue;
    }

    const current = queue.shift();
    if (!(current.id in firstResponse)) firstResponse[current.id] = time;
    const execTime = Math.min(current.remaining, quantum);
    const start = time;
    const end = time + execTime;
    timeline.push({ pid: current.id, start, end, color: current.color });
    current.remaining -= execTime;
    time = end;

    // Add newly arrived processes
    while (idx < n && procs[idx].arrival <= time) {
      if (!arrived.has(procs[idx].id)) {
        queue.push(procs[idx]);
        arrived.add(procs[idx].id);
      }
      idx++;
    }

    if (current.remaining > 0) {
      queue.push(current);
    } else {
      completed.push({
        ...current,
        startTime: firstResponse[current.id],
        completionTime: end,
        turnaround: end - current.arrival,
        waiting: end - current.arrival - current.burst,
        response: firstResponse[current.id] - current.arrival,
      });
    }
  }
  return { timeline, completed };
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const PROCESS_COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6',
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CPUScheduling({ darkMode, onBack }) {
  // Process state
  const [processes, setProcesses] = useState([
    { id: 'P1', arrival: 0, burst: 5, priority: 2, color: PROCESS_COLORS[0] },
    { id: 'P2', arrival: 1, burst: 3, priority: 1, color: PROCESS_COLORS[1] },
    { id: 'P3', arrival: 2, burst: 8, priority: 3, color: PROCESS_COLORS[2] },
    { id: 'P4', arrival: 3, burst: 2, priority: 4, color: PROCESS_COLORS[3] },
  ]);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [quantum, setQuantum] = useState(2);

  // Simulation state
  const [simResult, setSimResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [stepMode, setStepMode] = useState(false);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);

  // ─── Process Input ──────────────────────────────────────────────────

  const addProcess = () => {
    const idx = processes.length;
    setProcesses(prev => [...prev, {
      id: `P${idx + 1}`,
      arrival: Math.floor(Math.random() * 8),
      burst: Math.floor(Math.random() * 8) + 1,
      priority: Math.floor(Math.random() * 5) + 1,
      color: PROCESS_COLORS[idx % PROCESS_COLORS.length],
    }]);
  };

  const removeProcess = (id) => {
    if (processes.length <= 2) return;
    setProcesses(prev => prev.filter(p => p.id !== id));
  };

  const updateProcess = (id, field, value) => {
    setProcesses(prev => prev.map(p => p.id === id ? { ...p, [field]: parseInt(value) || 0 } : p));
  };

  const generateRandom = () => {
    const count = Math.floor(Math.random() * 4) + 3;
    const newProcs = Array.from({ length: count }, (_, i) => ({
      id: `P${i + 1}`,
      arrival: Math.floor(Math.random() * 10),
      burst: Math.floor(Math.random() * 10) + 1,
      priority: Math.floor(Math.random() * 5) + 1,
      color: PROCESS_COLORS[i % PROCESS_COLORS.length],
    }));
    setProcesses(newProcs);
    resetSimulation();
  };

  // ─── Simulation ─────────────────────────────────────────────────────

  const runSimulation = useCallback(() => {
    let result;
    switch (algorithm) {
      case 'SJF': result = runSJF(processes); break;
      case 'Priority': result = runPriority(processes); break;
      case 'RR': result = runRoundRobin(processes, quantum); break;
      default: result = runFCFS(processes);
    }
    setSimResult(result);
    setCurrentStep(0);
    setIsRunning(true);
    setIsPaused(false);
    setStepMode(false);
  }, [algorithm, processes, quantum]);

  const resetSimulation = () => {
    setSimResult(null);
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setStepMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stepForward = () => {
    if (!simResult) {
      runSimulation();
      setStepMode(true);
      return;
    }
    setStepMode(true);
    setIsPaused(true);
    setCurrentStep(prev => Math.min(prev + 1, simResult.timeline.length));
  };

  // Auto-advance simulation steps
  useEffect(() => {
    if (!isRunning || isPaused || !simResult || stepMode) return;
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= simResult.timeline.length) {
          setIsRunning(false);
          clearInterval(timerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 800 / speed);
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused, simResult, speed, stepMode]);

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
    const lineColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (!simResult) {
      // Draw placeholder
      ctx.fillStyle = mutedText;
      ctx.font = '16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Configure processes and press "Run Simulation" to begin', W / 2, H / 2 - 10);
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText('The animation will show ready queue, CPU execution, and Gantt chart', W / 2, H / 2 + 15);
      return;
    }

    const { timeline, completed } = simResult;
    const totalTime = timeline.length > 0 ? timeline[timeline.length - 1].end : 1;
    const visibleTimeline = timeline.slice(0, currentStep);

    // ─── Section 1: Ready Queue & CPU ───────────────────────────
    const queueY = 30;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('READY QUEUE', 20, queueY);

    // Current executing
    const currentBlock = visibleTimeline.length > 0 ? visibleTimeline[visibleTimeline.length - 1] : null;
    const currentTime = currentBlock ? currentBlock.end : 0;

    // Find processes in ready queue at current time
    const executedIds = new Set();
    visibleTimeline.forEach(t => { if (t.pid !== 'idle') executedIds.add(t.pid); });
    const readyQueue = processes.filter(p =>
      p.arrival <= currentTime && !executedIds.has(p.id)
    );

    // Draw ready queue blocks
    const blockW = 56;
    const blockH = 36;
    let qx = 20;
    readyQueue.forEach((p, i) => {
      const x = qx + i * (blockW + 8);
      // Animated entrance
      ctx.fillStyle = p.color + '20';
      ctx.beginPath();
      ctx.roundRect(x, queueY + 10, blockW, blockH, 8);
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.id, x + blockW / 2, queueY + 33);
    });

    if (readyQueue.length === 0) {
      ctx.fillStyle = mutedText;
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Empty', 20, queueY + 33);
    }

    // CPU Box
    const cpuX = W - 200;
    const cpuY = queueY;
    ctx.fillStyle = darkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)';
    ctx.beginPath();
    ctx.roundRect(cpuX, cpuY, 170, 60, 12);
    ctx.fill();
    ctx.strokeStyle = darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = mutedText;
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CPU CORE', cpuX + 85, cpuY + 16);

    if (currentBlock && currentBlock.pid !== 'idle') {
      const proc = processes.find(p => p.id === currentBlock.pid);
      ctx.fillStyle = proc ? proc.color : '#6366f1';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText(currentBlock.pid, cpuX + 85, cpuY + 44);
    } else {
      ctx.fillStyle = mutedText;
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillText(currentBlock ? 'IDLE' : '—', cpuX + 85, cpuY + 44);
    }

    // Arrow from queue to CPU
    ctx.strokeStyle = darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.min(qx + readyQueue.length * (blockW + 8) + 20, cpuX - 20), queueY + 28);
    ctx.lineTo(cpuX - 5, queueY + 28);
    ctx.stroke();
    ctx.setLineDash([]);

    // ─── Section 2: Gantt Chart ─────────────────────────────────
    const ganttY = 120;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GANTT CHART', 20, ganttY);

    const ganttTop = ganttY + 15;
    const ganttH = 50;
    const ganttLeft = 20;
    const ganttWidth = W - 40;
    const unitWidth = ganttWidth / Math.max(totalTime, 1);

    // Background
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    ctx.beginPath();
    ctx.roundRect(ganttLeft, ganttTop, ganttWidth, ganttH, 8);
    ctx.fill();

    // Draw timeline blocks
    visibleTimeline.forEach((block) => {
      const x = ganttLeft + block.start * unitWidth;
      const w = (block.end - block.start) * unitWidth;

      if (block.pid === 'idle') {
        ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
        ctx.fillRect(x, ganttTop, w, ganttH);
        // Diagonal stripes for idle
        ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        for (let sx = x; sx < x + w; sx += 8) {
          ctx.beginPath();
          ctx.moveTo(sx, ganttTop);
          ctx.lineTo(sx + ganttH, ganttTop + ganttH);
          ctx.stroke();
        }
      } else {
        const proc = processes.find(p => p.id === block.pid);
        const color = proc ? proc.color : '#6366f1';
        ctx.fillStyle = color + 'cc';
        ctx.beginPath();
        ctx.roundRect(x + 1, ganttTop + 2, w - 2, ganttH - 4, 6);
        ctx.fill();

        // Process label
        if (w > 25) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(block.pid, x + w / 2, ganttTop + ganttH / 2 + 5);
        }
      }
    });

    // Time markers
    ctx.fillStyle = mutedText;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    const step = totalTime > 20 ? Math.ceil(totalTime / 15) : 1;
    for (let t = 0; t <= totalTime; t += step) {
      const x = ganttLeft + t * unitWidth;
      ctx.fillText(t.toString(), x, ganttTop + ganttH + 14);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, ganttTop);
      ctx.lineTo(x, ganttTop + ganttH);
      ctx.stroke();
    }

    // Current time indicator
    if (currentBlock) {
      const cx = ganttLeft + currentTime * unitWidth;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, ganttTop - 5);
      ctx.lineTo(cx, ganttTop + ganttH + 5);
      ctx.stroke();
      // Triangle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(cx - 5, ganttTop - 5);
      ctx.lineTo(cx + 5, ganttTop - 5);
      ctx.lineTo(cx, ganttTop + 2);
      ctx.fill();
    }

    // ─── Section 3: Completed Processes Table ───────────────────
    const tableY = ganttTop + ganttH + 40;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COMPLETED PROCESSES', 20, tableY);

    const completedSoFar = completed.filter(c =>
      visibleTimeline.some(t => t.pid === c.id && t.end <= currentTime)
    );

    if (completedSoFar.length > 0) {
      const cols = ['Process', 'Arrival', 'Burst', 'Start', 'End', 'Wait', 'TAT', 'Response'];
      const colW = (W - 40) / cols.length;
      const rowH = 28;

      // Header
      ctx.fillStyle = darkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)';
      ctx.fillRect(20, tableY + 8, W - 40, rowH);
      ctx.fillStyle = mutedText;
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      cols.forEach((col, i) => {
        ctx.textAlign = 'center';
        ctx.fillText(col, 20 + i * colW + colW / 2, tableY + 27);
      });

      // Rows
      completedSoFar.forEach((proc, rowIdx) => {
        const y = tableY + 8 + (rowIdx + 1) * rowH;
        if (rowIdx % 2 === 0) {
          ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
          ctx.fillRect(20, y, W - 40, rowH);
        }
        ctx.fillStyle = textColor;
        ctx.font = '12px Inter, system-ui, sans-serif';
        const vals = [proc.id, proc.arrival, proc.burst, proc.startTime, proc.completionTime, proc.waiting, proc.turnaround, proc.response];
        vals.forEach((val, i) => {
          ctx.textAlign = 'center';
          if (i === 0) {
            ctx.fillStyle = proc.color || textColor;
            ctx.font = 'bold 12px Inter, system-ui, sans-serif';
          } else {
            ctx.fillStyle = textColor;
            ctx.font = '12px Inter, system-ui, sans-serif';
          }
          ctx.fillText(String(val), 20 + i * colW + colW / 2, y + 19);
        });
      });
    } else {
      ctx.fillStyle = mutedText;
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('No processes completed yet...', 20, tableY + 28);
    }

  }, [simResult, currentStep, processes, darkMode]);

  // ─── Stats Computation ──────────────────────────────────────────────

  const stats = simResult ? (() => {
    const c = simResult.completed;
    if (c.length === 0) return null;
    const avgWait = (c.reduce((s, p) => s + p.waiting, 0) / c.length).toFixed(2);
    const avgTat = (c.reduce((s, p) => s + p.turnaround, 0) / c.length).toFixed(2);
    const avgResp = (c.reduce((s, p) => s + p.response, 0) / c.length).toFixed(2);
    const totalTime = simResult.timeline.length > 0 ? simResult.timeline[simResult.timeline.length - 1].end : 1;
    const busyTime = simResult.timeline.filter(t => t.pid !== 'idle').reduce((s, t) => s + (t.end - t.start), 0);
    const cpuUtil = ((busyTime / totalTime) * 100).toFixed(1);
    return { avgWait, avgTat, avgResp, cpuUtil, totalTime };
  })() : null;

  // ─── Render ─────────────────────────────────────────────────────────

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
          <h2 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            CPU Scheduling Algorithms
          </h2>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            darkMode ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-700'
          }`}>Experiment 1</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetSimulation} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>Reset</button>
          <button onClick={runSimulation} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
            Run Simulation
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className={`w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4 ${
          darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'
        }`}>
          {/* Algorithm Selection */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => { setAlgorithm(e.target.value); resetSimulation(); }}
              className={`w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition ${
                darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'
              }`}
            >
              <option value="FCFS">First Come First Served</option>
              <option value="SJF">Shortest Job First</option>
              <option value="Priority">Priority Scheduling</option>
              <option value="RR">Round Robin</option>
            </select>
          </div>

          {algorithm === 'RR' && (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Time Quantum
              </label>
              <input
                type="number"
                value={quantum}
                onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className={`w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition ${
                  darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'
                }`}
              />
            </div>
          )}

          {/* Speed Control */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Speed: {speed}x
            </label>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Process Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Processes
              </label>
              <div className="flex gap-1">
                <button onClick={generateRandom} className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                  darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>Random</button>
                <button onClick={addProcess} className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 transition">
                  + Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {processes.map((p) => (
                <div key={p.id} className={`rounded-xl p-3 space-y-2 ${
                  darkMode ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.id}</span>
                    </div>
                    <button onClick={() => removeProcess(p.id)} className={`text-xs ${darkMode ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>[X]</button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className={`text-[10px] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Arrival</label>
                      <input type="number" value={p.arrival} min={0} onChange={(e) => updateProcess(p.id, 'arrival', e.target.value)}
                        className={`w-full rounded-lg px-2 py-1.5 text-xs outline-none ${
                          darkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                        }`} />
                    </div>
                    <div>
                      <label className={`text-[10px] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Burst</label>
                      <input type="number" value={p.burst} min={1} onChange={(e) => updateProcess(p.id, 'burst', e.target.value)}
                        className={`w-full rounded-lg px-2 py-1.5 text-xs outline-none ${
                          darkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                        }`} />
                    </div>
                    <div>
                      <label className={`text-[10px] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Priority</label>
                      <input type="number" value={p.priority} min={1} onChange={(e) => updateProcess(p.id, 'priority', e.target.value)}
                        className={`w-full rounded-lg px-2 py-1.5 text-xs outline-none ${
                          darkMode ? 'bg-white/5 border border-white/5 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                        }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 p-4 ${darkMode ? 'bg-[#0d0f1a]' : 'bg-slate-50'}`}>
            <canvas
              ref={canvasRef}
              width={900}
              height={500}
              className="w-full h-full rounded-xl"
              style={{ maxHeight: '500px' }}
            />
          </div>

          {/* Bottom Controls */}
          <div className={`flex items-center justify-between px-4 py-3 border-t ${
            darkMode ? 'bg-[#141829] border-white/5' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (!simResult) runSimulation(); else { setIsRunning(true); setIsPaused(false); setStepMode(false); } }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
              >
                ▶ {simResult ? 'Resume' : 'Run'}
              </button>
              <button
                onClick={() => setIsPaused(true)}
                disabled={!isRunning}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30'
                }`}
              >⏸ Pause</button>
              <button
                onClick={stepForward}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >⏭ Step</button>
              <button
                onClick={resetSimulation}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >↺ Restart</button>
            </div>
            <div className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {simResult ? `Step ${currentStep} / ${simResult.timeline.length}` : 'Ready'}
            </div>
          </div>
        </div>

        {/* Right Panel - Stats */}
        <div className={`w-64 flex-shrink-0 overflow-y-auto border-l p-4 space-y-4 ${
          darkMode ? 'bg-[#0f1221] border-white/5' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Statistics
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Algorithm', value: algorithm === 'RR' ? `Round Robin (Q=${quantum})` : algorithm === 'SJF' ? 'Shortest Job First' : algorithm === 'Priority' ? 'Priority' : 'FCFS' },
              { label: 'Processes', value: processes.length },
              { label: 'Status', value: isRunning ? (isPaused ? 'Paused' : 'Running') : simResult ? 'Complete' : 'Ready', color: isRunning ? (isPaused ? 'text-amber-500' : 'text-emerald-500') : simResult ? 'text-blue-500' : '' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-3 ${darkMode ? 'bg-white/[0.03]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                <p className={`text-sm font-bold mt-1 ${stat.color || (darkMode ? 'text-white' : 'text-slate-900')}`}>{stat.value}</p>
              </div>
            ))}

            {stats && (
              <>
                <div className={`h-px ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`} />
                {[
                  { label: 'Avg Wait Time', value: stats.avgWait, unit: 'units' },
                  { label: 'Avg Turnaround', value: stats.avgTat, unit: 'units' },
                  { label: 'Avg Response', value: stats.avgResp, unit: 'units' },
                  { label: 'CPU Utilization', value: stats.cpuUtil, unit: '%' },
                  { label: 'Total Time', value: stats.totalTime, unit: 'units' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl p-3 ${darkMode ? 'bg-white/[0.03]' : 'bg-white border border-slate-200 shadow-sm'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                    <p className={`text-lg font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {stat.value}<span className={`text-xs font-normal ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
