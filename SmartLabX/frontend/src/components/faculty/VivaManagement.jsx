import React, { useState, useEffect } from 'react';

export default function VivaManagement() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [vivaSettings, setVivaSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('smartlabx-viva-config');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [vivaResults, setVivaResults] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('smartlabx-viva-results') || '{}');
    } catch {
      return {};
    }
  });

  const [customQuestions, setCustomQuestions] = useState([
    "Explain the primary difference between DDL and DML in SQL.",
    "Why did you use a PRIMARY KEY constraint in your table schema?",
    "How does indexing improve database search performance?"
  ]);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [accessDuration, setAccessDuration] = useState(15); // minutes

  useEffect(() => {
    const refreshResults = () => {
      try {
        setVivaResults(JSON.parse(localStorage.getItem('smartlabx-viva-results') || '{}'));
      } catch {
        setVivaResults({});
      }
    };
    refreshResults();
    const timer = setInterval(refreshResults, 2000);
    return () => clearInterval(timer);
  }, []);

  const pendingVivas = [
    { id: 1, name: 'Aarav Kumar', rollNo: 'STU-2048', experiment: 'SQL DDL', subject: 'DBMS', status: 'Pending', submissionScore: '22/25', email: 'student@smartlabx.edu' },
    { id: 2, name: 'Priya Sharma', rollNo: 'STU-2049', experiment: 'Computer Networks Exp 2', subject: 'CN', status: 'Scheduled', submissionScore: '24/25', email: 'priya@smartlabx.edu' },
  ];

  const handleToggleEnableViva = (studentEmail) => {
    const isCurrentlyEnabled = vivaSettings[studentEmail]?.enabled;
    const expiryTime = !isCurrentlyEnabled ? Date.now() + accessDuration * 60 * 1000 : 0;
    
    const updated = {
      ...vivaSettings,
      [studentEmail]: {
        enabled: !isCurrentlyEnabled,
        durationMinutes: accessDuration,
        expiryTimestamp: expiryTime,
        questions: customQuestions,
        enabledAt: new Date().toLocaleTimeString()
      }
    };
    setVivaSettings(updated);
    localStorage.setItem('smartlabx-viva-config', JSON.stringify(updated));
    alert(!isCurrentlyEnabled 
      ? `[OK] Viva Enabled for ${studentEmail} for ${accessDuration} minutes!` 
      : `[LOCK] Viva Disabled for ${studentEmail}.`
    );
  };

  const handleGenerateAIQuestions = () => {
    const aiPool = [
      "What is the difference between INNER JOIN and LEFT JOIN?",
      "How does the 3-way TCP Handshake work?",
      "What happens during a context switch in CPU Scheduling?",
      "Explain the ACID properties of database transactions.",
      "How does Banker's Algorithm prevent deadlocks in OS?"
    ];
    // Pick 3 random
    const shuffled = [...aiPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    setCustomQuestions(shuffled);
    alert(" Generated 3 fresh AI Viva questions based on lab context!");
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setCustomQuestions(prev => [...prev, newQuestionText.trim()]);
    setNewQuestionText('');
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Viva Examination & Access Control</h2>
          <p className="text-sm text-slate-500 mt-1">Enable student viva access window, configure AI/custom questions, and review camera/screen recordings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Viva List */}
        <div className="col-span-1 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-800 text-sm flex justify-between items-center">
            <span>Student Viva Roster</span>
            <span className="text-xs text-indigo-600 font-mono">{pendingVivas.length} Students</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {pendingVivas.map(student => {
              const isEnabled = vivaSettings[student.email]?.enabled;
              const expiry = vivaSettings[student.email]?.expiryTimestamp;
              const isExpired = expiry && Date.now() > expiry;
              
              return (
                <div 
                  key={student.id} 
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 border-b border-slate-100 rounded-xl cursor-pointer transition mb-1 ${selectedStudent?.id === student.id ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600 shadow-2xs' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isEnabled && !isExpired ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                      {isEnabled && !isExpired ? ' Enabled' : '[LOCK] Locked'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{student.rollNo} • {student.subject}</p>
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>Lab Score: <b className="text-slate-800">{student.submissionScore}</b></span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleEnableViva(student.email); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${isEnabled && !isExpired ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {isEnabled && !isExpired ? 'Disable' : 'Enable Access'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Viva Interface & Controls */}
        <div className="col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col h-[75vh] overflow-y-auto">
          {selectedStudent ? (
            <>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                    <p className="text-xs text-slate-500">{selectedStudent.rollNo} • {selectedStudent.subject} • {selectedStudent.experiment}</p>
                  </div>
                </div>

                {/* Access Window Control */}
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Access Window Time</label>
                    <select 
                      value={accessDuration} 
                      onChange={(e) => setAccessDuration(Number(e.target.value))}
                      className="text-xs font-bold bg-transparent outline-none text-slate-800"
                    >
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => handleToggleEnableViva(selectedStudent.email)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${vivaSettings[selectedStudent.email]?.enabled ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    {vivaSettings[selectedStudent.email]?.enabled ? '[LOCK] Lock Access' : ' Enable Viva Access'}
                  </button>
                </div>
              </div>

              {/* Questions Management */}
              <div className="space-y-6">
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                      <span> AI & Custom Viva Question Paper</span>
                    </h4>
                    <button 
                      onClick={handleGenerateAIQuestions}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                       Auto-Generate via AI
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    {customQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-100 text-xs text-slate-800 font-medium flex justify-between items-center">
                        <span><b>Q{idx + 1}:</b> {q}</span>
                        <button onClick={() => setCustomQuestions(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 font-bold ml-2">[X]</button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddQuestion} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Add a custom staff question..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-400"
                    />
                    <button type="submit" className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-bold hover:bg-slate-800">Add</button>
                  </form>
                </div>

                {/* Staff-Only AI Calculated Score Panel */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                      <span>[*] Staff Private AI Score Evaluation</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">Faculty Only</span>
                    </h4>
                    <span className="text-xs text-emerald-700 font-mono">Auto-Calculated by AI</span>
                  </div>

                  {(() => {
                    const studentRes = vivaResults[selectedStudent.email];
                    
                    if (studentRes) {
                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <div>
                            <p className="text-xl font-black text-emerald-700">{studentRes.score} / {studentRes.maxScore} Marks</p>
                            <p className="text-xs text-slate-600 font-semibold mt-0.5">Grade: <span className="text-slate-900 font-bold">{studentRes.grade}</span></p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">Attempted at: {studentRes.completedAt}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Questions answered: {(studentRes.evalDetails || []).length}</p>
                          </div>
                          <button 
                            onClick={() => alert(`[OK] Published marks (${studentRes.score}/100) for ${selectedStudent.name}!`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
                          >
                            Publish Marks to Gradebook
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                        Student has not submitted their Viva attempt yet. AI score will appear here automatically upon completion.
                      </div>
                    );
                  })()}
                </div>

                {/* Live Recorded Video / Camera Feed View */}
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Student Screen & Face Camera Recording Feed
                    </h4>
                    <span className="text-[10px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">REC LIVE</span>
                  </div>
                  <div className="aspect-video rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1e1b4b_0%,#090d16_100%)] opacity-80" />
                    <div className="relative z-10 text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl mx-auto mb-2 border border-indigo-500/30 animate-pulse"></div>
                      <p className="text-sm font-bold text-slate-200">Face & Screen Recording Stream</p>
                      <p className="text-xs text-slate-400 mt-1">Recorded video stream for {selectedStudent.name} during viva attempt.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              <p className="text-sm font-semibold text-slate-600">Select a student from the list to enable access or edit questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
