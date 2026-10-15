import React from 'react';

export default function OSDashboard({ darkMode, onNavigate, progress, studentName }) {
  const stats = [
    { label: 'Completed', value: progress.completed, total: 5, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    { label: 'In Progress', value: progress.inProgress, total: 5, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', text: 'text-amber-500' },
    { label: 'Pending', value: 5 - progress.completed - progress.inProgress, total: 5, color: 'from-slate-400 to-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400' },
    { label: 'Viva Ready', value: progress.vivaReady, total: 5, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', text: 'text-violet-500' },
  ];

  const recentActivity = [
    { action: 'Started CPU Scheduling experiment', time: '2 hours ago', icon: '' },
    { action: 'Completed Round Robin simulation', time: '3 hours ago', icon: '[OK]' },
    { action: 'Saved Memory Management progress', time: '1 day ago', icon: '' },
    { action: 'Submitted Page Replacement report', time: '2 days ago', icon: '[NOTE]' },
    { action: 'AI Assistant used for Deadlock concept', time: '3 days ago', icon: '' },
  ];

  const overallPercent = Math.round((progress.completed / 5) * 100);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-2xl p-6 ${
        darkMode
          ? 'bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent border border-white/10'
          : 'bg-gradient-to-br from-violet-50 via-indigo-50 to-white border border-violet-100/50'
      }`}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 blur-3xl" />
        <div className="relative z-10">
          <p className={`text-sm font-semibold uppercase tracking-widest ${
            darkMode ? 'text-violet-400' : 'text-violet-600'
          }`}>
            Welcome back
          </p>
          <h2 className={`mt-1 text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {studentName || 'Student'} 
          </h2>
          <p className={`mt-2 text-sm max-w-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Continue your Operating Systems experiments. You have completed {progress.completed} out of 5 experiments.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onNavigate('experiments')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 hover:-translate-y-0.5"
            >
              View Experiments
            </button>
            {progress.lastExperiment && (
              <button
                onClick={() => onNavigate('workspace', progress.lastExperiment)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  darkMode
                    ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Continue Last Experiment →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${
              darkMode
                ? 'bg-[#1a1f36] border border-white/5 hover:border-white/10'
                : 'bg-white border border-slate-200/80 shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${stat.text}`}>{stat.value}</span>
            </div>
            <p className={`mt-3 text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {stat.value}<span className={`text-sm font-normal ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>/ {stat.total}</span>
            </p>
            <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Progress & Analytics */}
        <div className={`rounded-2xl p-6 ${
          darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border border-slate-200/80 shadow-sm'
        }`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Learning Analytics
          </h3>

          {/* Overall Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Overall Progress</span>
              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{overallPercent}%</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-1000 ease-out"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>

          {/* Experiment Progress Bars */}
          <div className="mt-6 space-y-4">
            {[
              { name: 'CPU Scheduling', progress: progress.experiments?.[1] || 0, color: 'from-blue-500 to-cyan-500' },
              { name: 'Memory Management', progress: progress.experiments?.[2] || 0, color: 'from-emerald-500 to-teal-500' },
              { name: 'Page Replacement', progress: progress.experiments?.[3] || 0, color: 'from-amber-500 to-orange-500' },
              { name: 'Deadlock Detection', progress: progress.experiments?.[4] || 0, color: 'from-red-500 to-pink-500' },
              { name: 'Disk Scheduling', progress: progress.experiments?.[5] || 0, color: 'from-violet-500 to-purple-500' },
            ].map((exp) => (
              <div key={exp.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{exp.name}</span>
                  <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{exp.progress}%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${exp.color} transition-all duration-700`}
                    style={{ width: `${exp.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className={`rounded-xl p-3 ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Faculty</p>
              <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Dr. Alan Turing</p>
            </div>
            <div className={`rounded-xl p-3 ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Next Viva</p>
              <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Aug 10, 2026</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`rounded-2xl p-6 ${
          darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border border-slate-200/80 shadow-sm'
        }`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Recent Activity
          </h3>
          <div className="mt-4 space-y-1">
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
                  darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{activity.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{activity.action}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {['Experiments', 'Submissions', 'Reports'].map((action) => (
                <button
                  key={action}
                  onClick={() => onNavigate(action.toLowerCase())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    darkMode
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
