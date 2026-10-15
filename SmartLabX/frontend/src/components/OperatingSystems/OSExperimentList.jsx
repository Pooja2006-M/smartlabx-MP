import React from 'react';

const experiments = [
  {
    id: 1,
    name: 'CPU Scheduling Algorithms',
    description: 'Simulate FCFS, SJF, Priority, and Round Robin scheduling algorithms with animated Gantt charts and live queue visualization.',
    difficulty: 'Medium',
    estimatedTime: '90 min',
    algorithms: ['FCFS', 'SJF', 'Priority', 'Round Robin'],
    color: 'from-blue-500 to-cyan-600',
    shadowColor: 'shadow-blue-500/20',
    icon: '',
  },
  {
    id: 2,
    name: 'Memory Management',
    description: 'Visualize RAM allocation with First Fit, Best Fit, and Worst Fit algorithms. Observe fragmentation in real-time.',
    difficulty: 'Medium',
    estimatedTime: '75 min',
    algorithms: ['First Fit', 'Best Fit', 'Worst Fit'],
    color: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
    icon: '[AI]',
  },
  {
    id: 3,
    name: 'Page Replacement Algorithms',
    description: 'Animate page loading and replacement with FIFO, LRU, and Optimal algorithms. Track page faults and hits live.',
    difficulty: 'Hard',
    estimatedTime: '80 min',
    algorithms: ['FIFO', 'LRU', 'Optimal'],
    color: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/20',
    icon: '[NOTE]',
  },
  {
    id: 4,
    name: 'Deadlock Detection & Banker\'s Algorithm',
    description: 'Create processes and resources, build allocation graphs, detect deadlocks, and find safe sequences using Banker\'s Algorithm.',
    difficulty: 'Hard',
    estimatedTime: '100 min',
    algorithms: ['Deadlock Detection', "Banker's Algorithm"],
    color: 'from-red-500 to-pink-600',
    shadowColor: 'shadow-red-500/20',
    icon: '[LOCK]',
  },
  {
    id: 5,
    name: 'Disk Scheduling Algorithms',
    description: 'Simulate disk head movement with FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK algorithms. Visualize seek paths.',
    difficulty: 'Medium',
    estimatedTime: '85 min',
    algorithms: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'],
    color: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
    icon: '',
  },
];

const difficultyColors = {
  Easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  Hard: { bg: 'bg-red-500/10', text: 'text-red-500' },
};

export default function OSExperimentList({ darkMode, onStartExperiment, onViewTheory, experimentProgress }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Experiments
        </h2>
        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Select an experiment to begin your interactive OS simulation
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {experiments.map((exp) => {
          const prog = experimentProgress?.[exp.id] || 0;
          const status = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
          const dc = difficultyColors[exp.difficulty];

          return (
            <div
              key={exp.id}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                darkMode
                  ? 'bg-[#1a1f36] border border-white/5 hover:border-white/15'
                  : 'bg-white border border-slate-200/80 shadow-sm hover:shadow-lg'
              } ${exp.shadowColor}`}
            >
              {/* Gradient Header */}
              <div className={`h-2 bg-gradient-to-r ${exp.color}`} />

              <div className="p-5">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{exp.icon}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${dc.bg} ${dc.text}`}>
                      {exp.difficulty}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : status === 'In Progress'
                        ? 'bg-amber-500/10 text-amber-500'
                        : darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className={`mt-3 text-lg font-bold leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {exp.name}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed line-clamp-2 ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {exp.description}
                </p>

                {/* Algorithms */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {exp.algorithms.map((alg) => (
                    <span
                      key={alg}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {alg}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className={`flex items-center gap-4 mt-4 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {exp.estimatedTime}
                  </span>
                  <span>Exp {exp.id} of 5</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Progress</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{prog}%</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${exp.color} transition-all duration-700`}
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => onStartExperiment(exp.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      prog > 0 && prog < 100
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30'
                        : `bg-gradient-to-r ${exp.color} text-white shadow-lg ${exp.shadowColor} hover:shadow-xl`
                    }`}
                  >
                    {prog >= 100 ? 'Review' : prog > 0 ? 'Continue' : 'Start'}
                  </button>
                  <button
                    onClick={() => onViewTheory(exp.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      darkMode
                        ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Theory
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
