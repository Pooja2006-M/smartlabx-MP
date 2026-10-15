import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'experiments', label: 'Experiments', icon: 'flask' },
  { id: 'theory', label: 'Theory Library', icon: 'book' },
  { id: 'workspace', label: 'OS Workspace', icon: 'terminal' },
  { id: 'assignments', label: 'Assignments', icon: 'clipboard' },
  { id: 'submissions', label: 'Submissions', icon: 'upload' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: 'bot' },
  { id: 'marks', label: 'Marks', icon: 'award' },
  { id: 'feedback', label: 'Faculty Feedback', icon: 'message' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];

const IconSvg = ({ name, size = 20 }) => {
  const icons = {
    grid: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    flask: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v6.5L4 20h16L14 9.5V3" /><path d="M7 16h10" />
      </svg>
    ),
    book: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    terminal: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    clipboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    upload: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    bot: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    ),
    award: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
    message: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    chart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    gear: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    chevronLeft: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    ),
    chevronRight: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
  };
  return icons[name] || null;
};

export default function OSSidebar({ activeView, onNavigate, collapsed, onToggleCollapse, darkMode }) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } ${
        darkMode
          ? 'bg-[#0f1221] border-r border-white/5'
          : 'bg-white/80 backdrop-blur-xl border-r border-slate-200/80'
      }`}
    >
      {/* Logo Area */}
      <div className={`flex items-center h-16 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/25 flex-shrink-0">
          OS
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className={`text-sm font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              SmartLabX
            </p>
            <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              OS Laboratory
            </p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative ${
                collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
              } ${
                isActive
                  ? darkMode
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-400 shadow-sm'
                    : 'bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 shadow-sm'
                  : darkMode
                  ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${
                  darkMode ? 'bg-violet-500' : 'bg-violet-600'
                }`} />
              )}
              <span className="flex-shrink-0">
                <IconSvg name={item.icon} size={19} />
              </span>
              {!collapsed && (
                <span className="text-[13px] font-semibold truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className={`px-3 py-4 border-t ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 ${
            darkMode
              ? 'text-slate-500 hover:bg-white/5 hover:text-white'
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <IconSvg name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
          {!collapsed && <span className="text-[13px] font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
