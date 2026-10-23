import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, CheckCircle, Mic, MicOff, Volume2 } from 'lucide-react';

const QUESTIONS = [
  {
    id: 1,
    text: "What happens if a PC tries to ping another PC on a different subnet, but no default gateway is configured?",
    keywords: ["drop", "fail", "timeout", "unreachable", "gateway", "discard", "router"],
    weight: 25,
    feedback: "Default gateway is required to route packets across subnet boundaries. Without it, packets are dropped."
  },
  {
    id: 2,
    text: "Which protocol is responsible for dynamically assigning IP addresses to devices on a network?",
    keywords: ["dhcp", "dynamic host configuration protocol"],
    weight: 25,
    feedback: "DHCP handles automatic IP assignments, reducing manual configuration errors."
  },
  {
    id: 3,
    text: "During the TCP 3-way handshake, what is the sequence of flags exchanged?",
    keywords: ["syn", "syn-ack", "ack", "syn ack"],
    weight: 25,
    feedback: "The 3-way handshake uses SYN, SYN-ACK, and ACK to establish a reliable connection."
  },
  {
    id: 4,
    text: "What is the primary difference between TCP and UDP protocols?",
    keywords: ["connection", "reliable", "unreliable", "handshake", "fast", "header", "flow"],
    weight: 25,
    feedback: "TCP is connection-oriented and reliable, while UDP is connectionless and lightweight for speed."
  }
];

export default function VivaPanel({ student, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAccessAllowed, setIsAccessAllowed] = useState(false);
  const [lockMessage, setLockMessage] = useState('Checking viva access...');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const vivaQuestionsRef = useRef(QUESTIONS);

  // Check Staff Access Window & Questions (locked by default until faculty enables it)
  useEffect(() => {
    const resolveEntry = (config, email) => {
      const target = String(email || '').trim().toLowerCase();
      const normalized = {};
      Object.keys(config || {}).forEach((key) => {
        normalized[String(key).trim().toLowerCase()] = config[key];
      });
      if (normalized[target]) return normalized[target];
      const isDemoAccount = /@student\.com$/i.test(target);
      return isDemoAccount ? normalized['student@smartlabx.edu'] || null : null;
    };

    const checkAccess = () => {
      try {
        const configRaw = localStorage.getItem('smartlabx-viva-config');
        const config = configRaw ? JSON.parse(configRaw) : {};
        const studentConfig = resolveEntry(config, student?.email);

        if (!studentConfig || !studentConfig.enabled) {
          setIsAccessAllowed(false);
          setLockMessage('[LOCK] Viva Session Locked: Faculty has not enabled your Viva access yet.');
          return;
        }

        if (studentConfig.expiryTimestamp && Date.now() > studentConfig.expiryTimestamp) {
          setIsAccessAllowed(false);
          setLockMessage('⏰ Viva Access Expired: Your allocated time window has passed. Request your faculty to re-enable.');
          return;
        }

        if (studentConfig.questions && studentConfig.questions.length > 0) {
          vivaQuestionsRef.current = studentConfig.questions.map((text, idx) => ({
            id: idx + 1,
            text: text,
            keywords: text.toLowerCase().split(' ').filter(w => w.length > 4),
            weight: Math.round(100 / studentConfig.questions.length),
            feedback: "Answer evaluated based on concept coverage."
          }));
        }

        setIsAccessAllowed(true);
      } catch (e) {
        console.error(e);
        setIsAccessAllowed(false);
        setLockMessage('[LOCK] Unable to verify viva access. Please contact your faculty.');
      }
    };

    checkAccess();
    const poll = setInterval(checkAccess, 3000);
    return () => clearInterval(poll);
  }, [student]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your response.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const addAIMessage = (text, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'ai', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, delay);
  };

  useEffect(() => {
    if (!isAccessAllowed) return;
    const welcome = `Welcome, ${student.name}! I'm your AI Viva Examiner. Answer via voice ️ or keyboard ⌨️. Let's begin your examination.`;
    addAIMessage(welcome, 1200);
    speakText(welcome);
    const timer = setTimeout(() => askQuestion(0), 3500);
    return () => clearTimeout(timer);
  }, [isAccessAllowed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const askQuestion = (index) => {
    const qs = vivaQuestionsRef.current;
    if (index >= qs.length) {
      setIsCompleted(true);
      speakText('Viva session complete. Your responses have been submitted to your faculty.');
      return;
    }
    const q = qs[index];
    const qText = `Question ${index + 1} of ${qs.length}: ${q.text}`;
    addAIMessage(qText, 1000);
    setTimeout(() => speakText(qText), 1100);
  };

  const handleSend = () => {
    if (!input.trim() || isCompleted) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');

    const qs = vivaQuestionsRef.current;
    const currentQ = qs[currentQIndex];
    const userWords = userMessage.toLowerCase();
    const matchedCount = currentQ.keywords.filter(kw => userWords.includes(kw)).length;
    
    let qScore = 0;
    if (matchedCount >= 2 || (matchedCount >= 1 && userMessage.length > 20)) {
      qScore = currentQ.weight;
    } else if (matchedCount === 1) {
      qScore = Math.round(currentQ.weight * 0.6);
    } else {
      qScore = Math.round(currentQ.weight * 0.2);
    }

    setScores(prev => [...prev, qScore]);

    addAIMessage('[OK] Response recorded. Proceeding to next question...', 900);

    setTimeout(() => {
      const nextQ = currentQIndex + 1;
      setCurrentQIndex(nextQ);
      askQuestion(nextQ);
    }, 2800);
  };

  const finalTotalScore = scores.reduce((a, b) => a + b, 0);
  const grade = finalTotalScore >= 85 ? 'S (Outstanding)' : finalTotalScore >= 70 ? 'A (Excellent)' : finalTotalScore >= 50 ? 'B (Good)' : 'C (Needs Practice)';
  const qs = vivaQuestionsRef.current;
  const progressPercent = isCompleted ? 100 : Math.round((currentQIndex / qs.length) * 100);

  // Save Viva result for Staff viewing
  useEffect(() => {
    if (isCompleted) {
      try {
        const existingRaw = localStorage.getItem('smartlabx-viva-results');
        const results = existingRaw ? JSON.parse(existingRaw) : {};
        results[student.email || 'student@smartlabx.edu'] = {
          studentName: student.name,
          score: finalTotalScore,
          maxScore: 100,
          grade: grade,
          completedAt: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
        };
        localStorage.setItem('smartlabx-viva-results', JSON.stringify(results));
      } catch (e) {}
    }
  }, [isCompleted, finalTotalScore, grade, student]);

  if (!isAccessAllowed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <div className="w-full max-w-md p-8 rounded-3xl text-center" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)' }}>[LOCK]</div>
          <h3 className="text-xl font-bold text-white mb-2">Viva Access Locked</h3>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">{lockMessage}</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white transition" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            Close & Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="w-full max-w-2xl h-[680px] rounded-3xl flex flex-col overflow-hidden relative" style={{ background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        
        {/* Animated glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 animate-pulse" style={{ background: 'radial-gradient(circle, #667eea, transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #764ba2, transparent)', animationDelay: '1s' }} />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {/* Animated AI Avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <Bot size={22} className="text-white" />
              </div>
              {isSpeaking && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 animate-pulse" style={{ borderColor: 'rgba(15,12,41,0.85)' }} />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2" style={{ borderColor: 'rgba(15,12,41,0.85)', display: isSpeaking ? 'none' : 'block' }} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                SmartLabX Viva AI
                {isSpeaking && <Volume2 size={14} className="text-indigo-400 animate-pulse" />}
              </h2>
              <p className="text-xs text-slate-400">{student.name} • Computer Networks Lab</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Progress Ring */}
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="url(#grad)" strokeWidth="3" strokeDasharray={`${progressPercent} ${100 - progressPercent}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                <defs>
                  <linearGradient id="grad"><stop offset="0%" stopColor="#667eea" /><stop offset="100%" stopColor="#764ba2" /></linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{currentQIndex}/{qs.length}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`} style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.sender === 'user' ? '' : ''}`} style={{ background: msg.sender === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.08)' }}>
                {msg.sender === 'user' ? <User size={15} className="text-white" /> : <Bot size={15} className="text-indigo-400" />}
              </div>
              <div className="max-w-[80%]">
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed" style={{
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.06)',
                  color: msg.sender === 'user' ? '#fff' : '#e2e8f0',
                  borderTopRightRadius: msg.sender === 'user' ? '4px' : undefined,
                  borderTopLeftRadius: msg.sender !== 'user' ? '4px' : undefined,
                  border: msg.sender !== 'user' ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  {msg.text}
                </div>
                <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`} style={{ color: 'rgba(148,163,184,0.6)' }}>{msg.time}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Bot size={15} className="text-indigo-400" />
              </div>
              <div className="rounded-2xl px-5 py-3 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderTopLeftRadius: '4px' }}>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Completion Card */}
          {isCompleted && (
            <div className="mt-4 p-6 rounded-2xl text-center flex flex-col items-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={44} style={{ color: '#10b981' }} />
              <h3 className="text-lg font-bold text-white mt-3">Viva Submission Complete</h3>
              <p className="text-sm mt-2 max-w-sm" style={{ color: 'rgba(148,163,184,0.8)' }}>
                Your responses have been recorded and sent to your faculty for evaluation. Marks will be published by your instructor.
              </p>
              <button onClick={onClose} className="mt-5 px-6 py-2.5 rounded-xl font-bold text-white text-sm transition hover:brightness-110" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                Return to Workspace
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Waveform Indicator */}
        {isListening && (
          <div className="relative z-10 px-6 py-2 flex items-center justify-center gap-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rounded-full" style={{
                width: '3px',
                background: 'linear-gradient(to top, #667eea, #764ba2)',
                animation: `waveform 0.8s ease-in-out infinite`,
                animationDelay: `${i * 0.07}s`,
                height: `${8 + Math.random() * 16}px`
              }} />
            ))}
            <span className="ml-3 text-xs font-semibold text-indigo-400 animate-pulse">Listening...</span>
          </div>
        )}

        {/* Input Area */}
        <div className="relative z-10 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isCompleted}
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition"
              style={{
                background: isListening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.06)',
                border: isListening ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.3)' : 'none'
              }}
            >
              {isListening ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-slate-400" />}
            </button>

            {/* Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "️ Speaking..." : isCompleted ? "Session ended." : "Type your answer..."}
                disabled={isCompleted}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={isCompleted || !input.trim()}
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white transition disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              <Send size={18} />
            </button>
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
    </div>
  );
}
