import React, { useState } from 'react';

export default function OSNavbar({ darkMode, onToggleDarkMode, studentName, onLogout }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, text: 'CPU Scheduling experiment due tomorrow', time: '2h ago', type: 'warning' },
    { id: 2, text: 'Faculty Dr. Turing left feedback on Exp 2', time: '5h ago', type: 'info' },
    { id: 3, text: 'Viva scheduled for August 10', time: '1d ago', type: 'important' },
  ];

  return (
    <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-6 transition-colors duration-300 ${
      darkMode
        ? 'bg-[#0f1221]/90 backdrop-blur-xl border-b border-white/5'
        : 'bg-white/80 backdrop-blur-xl border-b border-slate-200/80'
    }`}>
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          <h1 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Operating Systems Laboratory
          </h1>
        </div>
        <span className={`hidden md:inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
          darkMode ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-700'
        }`}>
          Virtual Lab
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => { setSearchOpen(!searchOpen); setNotifOpen(false); setProfileOpen(false); }}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          {searchOpen && (
            <div className={`absolute right-0 top-12 w-80 rounded-2xl shadow-2xl p-4 ${
              darkMode ? 'bg-[#1a1f36] border border-white/10' : 'bg-white border border-slate-200'
            }`}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search experiments, theory..."
                autoFocus
                className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${
                  darkMode
                    ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <div className={`mt-3 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Try: "CPU Scheduling", "FIFO", "Banker's Algorithm"
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false); setProfileOpen(false); }}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${
              darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f1221]" />
          </button>
          {notifOpen && (
            <div className={`absolute right-0 top-12 w-80 rounded-2xl shadow-2xl overflow-hidden ${
              darkMode ? 'bg-[#1a1f36] border border-white/10' : 'bg-white border border-slate-200'
            }`}>
              <div className={`px-4 py-3 border-b font-semibold text-sm ${
                darkMode ? 'border-white/5 text-white' : 'border-slate-100 text-slate-900'
              }`}>
                Notifications
              </div>
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b last:border-0 transition-colors ${
                  darkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-50 hover:bg-slate-50'
                }`}>
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{n.text}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            darkMode ? 'hover:bg-white/5 text-amber-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setSearchOpen(false); setNotifOpen(false); }}
            className="flex items-center gap-2.5 ml-1"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-violet-500/20">
              {(studentName || 'S').charAt(0).toUpperCase()}
            </div>
            {!profileOpen && (
              <span className={`hidden md:block text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                {studentName || 'Student'}
              </span>
            )}
          </button>
          {profileOpen && (
            <div className={`absolute right-0 top-12 w-56 rounded-2xl shadow-2xl overflow-hidden ${
              darkMode ? 'bg-[#1a1f36] border border-white/10' : 'bg-white border border-slate-200'
            }`}>
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {studentName || 'Student'}
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  student@smartlabx.edu
                </p>
              </div>
              <button
                onClick={onLogout}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                  darkMode ? 'text-red-400 hover:bg-white/5' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
