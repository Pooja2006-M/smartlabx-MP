import React from 'react';
import { Monitor, Server, Router, Wifi, Cable, Cpu, AlertTriangle, Globe, Search, Wrench } from 'lucide-react';

const experiments = [
  {
    id: 1,
    title: 'Network Topology Design & Packet Simulation',
    description: 'Build a network topology by placing devices and connecting them with cables, then simulate packet transmission.',
    icon: <Cable size={28} />,
    accentColor: 'bg-slate-700',
    stripColor: 'bg-slate-600',
    tasks: ['Drag & drop devices', 'Connect with cables', 'Run simulation', 'Observe packet flow'],
    difficulty: 'Beginner',
  },
  {
    id: 2,
    title: 'IP Address Configuration & Connectivity Testing',
    description: 'Configure IP addresses, subnet masks, and gateways for network devices and verify communication.',
    icon: <Globe size={28} />,
    accentColor: 'bg-indigo-700',
    stripColor: 'bg-indigo-600',
    tasks: ['Assign IP addresses', 'Configure subnet & gateway', 'Test with Ping', 'Verify connectivity'],
    difficulty: 'Intermediate',
  },
  {
    id: 3,
    title: 'Routing Configuration & Packet Forwarding',
    description: 'Configure routers to enable communication between different networks with static routing.',
    icon: <Router size={28} />,
    accentColor: 'bg-slate-700',
    stripColor: 'bg-slate-600',
    tasks: ['Configure router interfaces', 'Add static routes', 'View routing tables', 'Simulate forwarding'],
    difficulty: 'Intermediate',
  },
  {
    id: 4,
    title: 'Network Services — DHCP, DNS & HTTP',
    description: 'Configure essential network services (DHCP, DNS, HTTP) and test their functionality.',
    icon: <Cpu size={28} />,
    accentColor: 'bg-indigo-700',
    stripColor: 'bg-indigo-600',
    tasks: ['Configure DHCP', 'Setup DNS records', 'Host a web page', 'Verify auto-IP allocation'],
    difficulty: 'Advanced',
  },
  {
    id: 5,
    title: 'Network Troubleshooting & Diagnostics',
    description: 'Identify, analyze, and resolve common network faults using diagnostic tools.',
    icon: <Wrench size={28} />,
    accentColor: 'bg-slate-700',
    stripColor: 'bg-slate-600',
    tasks: ['Detect faults', 'Diagnose with Ping/Traceroute', 'Fix configuration', 'Verify repair'],
    difficulty: 'Advanced',
  },
];

const difficultyColor = {
  Beginner: 'bg-slate-100 text-slate-600 border-slate-200',
  Intermediate: 'bg-slate-100 text-slate-700 border-slate-200',
  Advanced: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function ExperimentDashboard({ onSelectExperiment, completedExperiments = [], authEmail = '' }) {
  // Open experiment in a dedicated Safe Exam Browser tab
  const handleStart = (expId) => {
    // Also notify parent (to update state if needed)
    if (typeof onSelectExperiment === 'function') onSelectExperiment(expId);
    // Open in current tab
    window.location.href = `/safe-exam/cn/${expId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">CN Lab Experiments</h2>
          <p className="mt-1 text-sm text-slate-500">Complete all 5 experiments to finish your Computer Networks practical</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-indigo-600">{completedExperiments.length}</span> / 5 Completed
        </div>
      </div>

      {/* Safe Exam info banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
        <span style={{ fontSize: 20 }}>[LOCK]</span>
        <span>
          Each experiment opens in a <strong>Safe Exam Browser tab</strong> with security restrictions active.
          Make sure you are logged in before starting.
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {experiments.map((exp) => {
          const isCompleted = completedExperiments.includes(exp.id);
          return (
            <div
              key={exp.id}
              onClick={() => handleStart(exp.id)}
              className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >


              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                      {exp.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Experiment {exp.id}</p>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">{exp.title}</h3>
                    </div>
                  </div>

                </div>

                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{exp.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {exp.tasks.map((task, i) => (
                    <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                      {task}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {isCompleted ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                      Completed
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Not started</span>
                  )}
                  <button className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 group-hover:shadow-md">
                    {isCompleted ? 'Review' : 'Start'}
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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
