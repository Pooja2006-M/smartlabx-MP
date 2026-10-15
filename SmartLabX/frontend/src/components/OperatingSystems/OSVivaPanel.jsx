import React, { useState, useEffect, useRef } from 'react';

const VIVA_QUESTIONS = [
  { text: "Explain the difference between preemptive and non-preemptive scheduling.", keywords: ["preemptive", "context", "cpu", "interrupt", "priority"], weight: 20 },
  { text: "Why is the Convoy Effect a problem in FCFS?", keywords: ["fcfs", "long", "process", "wait", "starvation", "burst"], weight: 20 },
  { text: "How does Banker's Algorithm ensure a safe state?", keywords: ["safe", "resource", "need", "available", "deadlock", "avoidance"], weight: 20 },
  { text: "What is internal fragmentation and which memory allocation algorithm suffers from it?", keywords: ["fixed", "partition", "leftover", "wasted", "page", "paging"], weight: 20 },
  { text: "Describe Belady's Anomaly in page replacement.", keywords: ["page fault", "frames", "fifo", "increase"], weight: 20 }
];

export default function OSVivaPanel({ experimentId, darkMode, onBack, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAccessAllowed, setIsAccessAllowed] = useState(true);
  const [lockMessage, setLockMessage] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

  // Check Staff Access Window
  useEffect(() => {
    try {
      const configRaw = localStorage.getItem('smartlabx-viva-config');
      if (configRaw) {
        const config = JSON.parse(configRaw);
        const studentConfig = config['student@smartlabx.edu'] || Object.values(config)[0];
        if (!studentConfig || !studentConfig.enabled) {
          setIsAccessAllowed(false);
          setLockMessage('[LOCK] Viva Session Locked: Faculty has not enabled your Viva access yet.');
          return;
        }
        if (studentConfig.expiryTimestamp && Date.now() > studentConfig.expiryTimestamp) {
          setIsAccessAllowed(false);
          setLockMessage('⏰ Viva Access Expired: Allocated time window has passed. Contact your faculty.');
          return;
        }
      }
    } catch (e) { console.error(e); }
  }, []);

  // Speech Recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        let t = '';
        for (let i = event.resultIndex; i < event.results.length; i++) t += event.results[i][0].transcript;
        setInput(t);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Camera
  useEffect(() => {
    let stream;
    if (!isCompleted) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(() => {});
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [isCompleted]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) { alert("Speech recognition not supported. Please type."); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { try { recognitionRef.current.start(); setIsListening(true); } catch (e) { setIsListening(false); } }
  };

  const addAIMessage = (text, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'ai', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, delay);
  };

  useEffect(() => {
    const welcome = 'Welcome! I\'m your AI Viva Examiner for Operating Systems. Answer via voice ️ or keyboard ⌨️. Let\'s begin.';
    addAIMessage(welcome, 1200);
    speakText(welcome);
    setTimeout(() => askQuestion(0), 3500);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const askQuestion = (index) => {
    if (index >= VIVA_QUESTIONS.length) {
      setIsCompleted(true);
      speakText('Viva session complete. Your responses have been submitted to your faculty.');
      return;
    }
    const q = VIVA_QUESTIONS[index];
    const qText = `Question ${index + 1} of ${VIVA_QUESTIONS.length}: ${q.text}`;
    addAIMessage(qText, 1000);
    setTimeout(() => speakText(qText), 1100);
  };

  const handleSend = () => {
    if (!input.trim() || isCompleted) return;
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); }

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');

    const currentQ = VIVA_QUESTIONS[currentQIndex];
    const userWords = userMessage.toLowerCase();
    const matched = currentQ.keywords.filter(kw => userWords.includes(kw)).length;
    let qScore = 0;
    if (matched >= 2 || (matched >= 1 && userMessage.length > 25)) qScore = currentQ.weight;
    else if (matched === 1) qScore = Math.round(currentQ.weight * 0.6);
    else if (userMessage.length > 10) qScore = Math.round(currentQ.weight * 0.3);

    setScores(prev => [...prev, qScore]);
    addAIMessage('[OK] Response recorded. Proceeding...', 900);
    setTimeout(() => { const nextQ = currentQIndex + 1; setCurrentQIndex(nextQ); askQuestion(nextQ); }, 2800);
  };

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const grade = totalScore >= 85 ? 'S (Outstanding)' : totalScore >= 70 ? 'A (Excellent)' : totalScore >= 50 ? 'B (Good)' : 'C (Needs Improvement)';
  const progressPercent = isCompleted ? 100 : Math.round((currentQIndex / VIVA_QUESTIONS.length) * 100);

  // Save for Staff
  useEffect(() => {
    if (isCompleted) {
      try {
        const results = JSON.parse(localStorage.getItem('smartlabx-viva-results') || '{}');
        results['student@smartlabx.edu'] = { studentName: 'Student', score: totalScore, maxScore: 100, grade, completedAt: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString() };
        localStorage.setItem('smartlabx-viva-results', JSON.stringify(results));
      } catch (e) {}
    }
  }, [isCompleted, totalScore, grade]);

  if (!isAccessAllowed) {
    return (
      <div className="h-full flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="max-w-md w-full p-8 rounded-3xl text-center" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)' }}>[LOCK]</div>
          <h2 className="text-xl font-bold text-white mb-2">Viva Session Locked</h2>
          <p className="text-sm text-slate-300 mb-6">{lockMessage}</p>
          <button onClick={onBack} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="flex-1 flex max-w-6xl w-full mx-auto p-6 gap-5 overflow-hidden">
        
        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col rounded-3xl overflow-hidden relative" style={{ background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
          
          {/* Glows */}
          <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-25 animate-pulse" style={{ background: 'radial-gradient(circle, #667eea, transparent)' }} />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}></div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2" style={{ borderColor: 'rgba(15,12,41,0.85)' }} />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                  SmartLabX Viva AI
                  {isSpeaking && <span className="text-indigo-400 text-xs animate-pulse"> Speaking</span>}
                </h2>
                <p className="text-[11px] text-slate-500">Operating Systems Lab</p>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9">
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="url(#osgrad)" strokeWidth="3" strokeDasharray={`${progressPercent} ${100 - progressPercent}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                  <defs><linearGradient id="osgrad"><stop offset="0%" stopColor="#667eea" /><stop offset="100%" stopColor="#764ba2" /></linearGradient></defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{currentQIndex}/{VIVA_QUESTIONS.length}</span>
              </div>
              <button onClick={onBack} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white text-sm transition" style={{ background: 'rgba(255,255,255,0.05)' }}>[X]</button>
            </div>
          </div>

          {/* Messages */}
          <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-3.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`} style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs" style={{ background: msg.sender === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.08)' }}>
                  {msg.sender === 'user' ? '' : ''}
                </div>
                <div className="max-w-[82%]">
                  <div className="rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed" style={{
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.06)',
                    color: msg.sender === 'user' ? '#fff' : '#e2e8f0',
                    borderTopRightRadius: msg.sender === 'user' ? '4px' : undefined,
                    borderTopLeftRadius: msg.sender !== 'user' ? '4px' : undefined,
                    border: msg.sender !== 'user' ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] mt-0.5 ${msg.sender === 'user' ? 'text-right' : ''}`} style={{ color: 'rgba(148,163,184,0.5)' }}>{msg.time}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
                <div className="rounded-2xl px-4 py-2.5 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderTopLeftRadius: '4px' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="mt-3 p-5 rounded-2xl text-center flex flex-col items-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-3xl mb-2">[OK]</span>
                <h3 className="text-base font-bold text-white">Viva Submitted</h3>
                <p className="text-xs mt-1.5 max-w-xs" style={{ color: 'rgba(148,163,184,0.7)' }}>Responses recorded. Marks will be published by your instructor.</p>
                <button onClick={onBack} className="mt-4 px-5 py-2 rounded-xl font-bold text-white text-xs" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>Return to Dashboard</button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Waveform */}
          {isListening && (
            <div className="relative z-10 px-5 py-2 flex items-center justify-center gap-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="rounded-full" style={{ width: '2.5px', background: 'linear-gradient(to top, #667eea, #764ba2)', animation: 'waveform 0.8s ease-in-out infinite', animationDelay: `${i * 0.07}s`, height: `${6 + Math.random() * 14}px` }} />
              ))}
              <span className="ml-2 text-[11px] font-semibold text-indigo-400 animate-pulse">Listening...</span>
            </div>
          )}

          {/* Input */}
          <div className="relative z-10 px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <button onClick={toggleListening} disabled={isCompleted} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition text-sm" style={{
                background: isListening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.06)',
                border: isListening ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isListening ? '0 0 16px rgba(239,68,68,0.3)' : 'none'
              }}>
                {isListening ? '⏹️' : '️'}
              </button>
              <input
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "️ Speaking..." : isCompleted ? "Done." : "Type your answer..."}
                disabled={isCompleted}
                className="flex-1 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button onClick={handleSend} disabled={isCompleted || !input.trim()} className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm disabled:opacity-30" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel: Camera + Info */}
        <div className="w-64 flex flex-col gap-4 shrink-0">
          <div className="rounded-3xl overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-500 text-white">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
            </div>
          </div>

          <div className="flex-1 rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 className="font-bold mb-3 text-[11px] uppercase tracking-widest text-slate-400">Viva Guidelines</h4>
            <ul className="space-y-2.5 text-[12px] text-slate-400">
              <li className="flex gap-2"><span>️</span> Voice & Type modes active</li>
              <li className="flex gap-2"><span></span> AI evaluates automatically</li>
              <li className="flex gap-2"><span></span> Keep face visible in frame</li>
              <li className="flex gap-2"><span>[CHART]</span> Marks visible to staff only</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
