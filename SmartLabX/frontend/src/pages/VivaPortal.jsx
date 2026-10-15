import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProctorHUD from '../components/proctor/ProctorHUD';

const SUBJECT_QUESTIONS = {
  dbms: {
    title: 'Database Management Systems (DBMS)',
    icon: '[DBMS]',
    gradient: 'from-blue-600 to-indigo-700',
    questions: [
      { id: 1, text: "Explain the difference between Primary Key, Candidate Key, and Foreign Key.", keywords: ["primary", "foreign", "unique", "referential", "table"], weight: 20 },
      { id: 2, text: "What are ACID properties in database transactions? Explain each briefly.", keywords: ["atomicity", "consistency", "isolation", "durability", "transaction"], weight: 20 },
      { id: 3, text: "Describe 3NF (Third Normal Form) and Boyce-Codd Normal Form (BCNF).", keywords: ["normal", "transitive", "dependency", "superkey", "bcnf"], weight: 20 },
      { id: 4, text: "What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?", keywords: ["join", "inner", "left", "outer", "null", "rows"], weight: 20 },
      { id: 5, text: "How does indexing improve database query performance and what are its trade-offs?", keywords: ["index", "b-tree", "search", "insert", "overhead", "lookup"], weight: 20 }
    ]
  },
  cn: {
    title: 'Computer Networks (CN)',
    icon: '[WEB]',
    gradient: 'from-purple-600 to-pink-700',
    questions: [
      { id: 1, text: "Differentiate between TCP and UDP protocols in the Transport Layer.", keywords: ["connection", "reliable", "unreliable", "handshake", "packet", "speed"], weight: 20 },
      { id: 2, text: "How does the 3-Way Handshake mechanism work in TCP?", keywords: ["syn", "ack", "seq", "connection", "client", "server"], weight: 20 },
      { id: 3, text: "Explain IPv4 vs IPv6 addressing and why IPv6 is necessary.", keywords: ["bit", "32-bit", "128-bit", "address", "space", "exhaustion"], weight: 20 },
      { id: 4, text: "What is CSMA/CD and how does it detect collisions in Ethernet networks?", keywords: ["carrier", "sense", "collision", "jam", "backoff", "ethernet"], weight: 20 },
      { id: 5, text: "Describe the function of DNS (Domain Name System) and ARP (Address Resolution Protocol).", keywords: ["dns", "ip", "domain", "mac", "arp", "resolution"], weight: 20 }
    ]
  },
  os: {
    title: 'Operating Systems (OS)',
    icon: '[GEAR]',
    gradient: 'from-emerald-600 to-teal-700',
    questions: [
      { id: 1, text: "Explain the difference between preemptive and non-preemptive CPU scheduling.", keywords: ["preemptive", "context", "cpu", "interrupt", "priority"], weight: 20 },
      { id: 2, text: "Why is the Convoy Effect a problem in FCFS scheduling algorithm?", keywords: ["fcfs", "long", "process", "wait", "starvation", "burst"], weight: 20 },
      { id: 3, text: "How does Banker's Algorithm ensure a safe state to avoid deadlocks?", keywords: ["safe", "resource", "need", "available", "deadlock", "avoidance"], weight: 20 },
      { id: 4, text: "What is internal vs external fragmentation in memory management?", keywords: ["fixed", "partition", "leftover", "wasted", "paging", "compaction"], weight: 20 },
      { id: 5, text: "Describe Belady's Anomaly in page replacement algorithms.", keywords: ["page fault", "frames", "fifo", "increase"], weight: 20 }
    ]
  }
};
const DEFAULT_VIVA_USER = { name: 'Student User', email: 'student@smartlabx.edu' };

export default function VivaPortal() {
  const navigate = useNavigate();
  const user = (() => {
    try { return { ...DEFAULT_VIVA_USER, ...JSON.parse(localStorage.getItem('user') || '{}') }; }
    catch { return DEFAULT_VIVA_USER; }
  })();
  const [searchParams] = useSearchParams();
  const requestedSubject = searchParams.get('lab');
  const initialSubject = Object.prototype.hasOwnProperty.call(SUBJECT_QUESTIONS, requestedSubject)
    ? requestedSubject
    : 'dbms';
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [scores, setScores] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [timer, setTimer] = useState(300); // 5 min timer
  const [timerActive, setTimerActive] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [vivaAccess, setVivaAccess] = useState(null);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartlabx-viva-history');
      if (saved) setPastSessions(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }, []);

  // Faculty-controlled access: viva stays locked until staff enables it for this student
  useEffect(() => {
    const readAccess = () => {
      try {
        const cfg = JSON.parse(localStorage.getItem('smartlabx-viva-config') || '{}');
        const entry = cfg[user.email] || null;
        const active = entry && entry.enabled && (!entry.expiryTimestamp || Date.now() < entry.expiryTimestamp);
        setVivaAccess(active ? entry : null);
      } catch {
        setVivaAccess(null);
      }
    };
    readAccess();
    const poll = setInterval(readAccess, 3000);
    return () => clearInterval(poll);
  }, [user.email]);

  // Timer Countdown
  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && sessionActive) {
      finishVivaSession();
    }
    return () => clearInterval(interval);
  }, [timerActive, timer, sessionActive]);

  // Speech Recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer(transcript);
      };
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  // Webcam Start/Stop
  const toggleCamera = async (enable) => {
    if (enable) {
      try {
        setCameraError('');
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API unavailable');
        }
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Webcam not accessible:', err);
        setIsCameraActive(false);
        setCameraError('Camera permission is required. Allow camera access and restart the viva.');
      }
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Attach the user-approved stream after the live-session video element mounts.
  useEffect(() => {
    if (!sessionActive) return undefined;
    if (cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
    return undefined;
  }, [sessionActive, isCameraActive]);

  useEffect(() => () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const synth = new SpeechSynthesisUtterance(text);
    synth.rate = 1.0;
    synth.onstart = () => setIsSpeaking(true);
    synth.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(synth);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please type your response.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const startVivaSession = async () => {
    if (!vivaAccess) {
      alert('Your Viva access has not been enabled by faculty yet.');
      return;
    }
    const durationSec = Math.max(60, Math.round((vivaAccess.durationMinutes || 5) * 60));
    setSessionActive(true);
    setCurrentQIndex(0);
    setUserAnswer('');
    setScores([]);
    setIsCompleted(false);
    setTimer(durationSec);
    setTimerActive(true);
    await toggleCamera(true);
    const firstQ = SUBJECT_QUESTIONS[selectedSubject].questions[0].text;
    speakText(`Welcome to your AI Viva on ${SUBJECT_QUESTIONS[selectedSubject].title}. First question: ${firstQ}`);
  };

  const handleNextQuestion = () => {
    const currentQ = SUBJECT_QUESTIONS[selectedSubject].questions[currentQIndex];
    const textLower = userAnswer.toLowerCase();
    
    // Calculate score based on keywords matched
    let matchedCount = 0;
    currentQ.keywords.forEach((kw) => {
      if (textLower.includes(kw)) matchedCount++;
    });
    
    const maxKw = currentQ.keywords.length;
    const scoreVal = maxKw > 0 ? Math.min(20, Math.round((matchedCount / Math.min(3, maxKw)) * 20)) : 15;
    
    const updatedScores = [...scores, { qId: currentQ.id, question: currentQ.text, answer: userAnswer, score: scoreVal }];
    setScores(updatedScores);
    setUserAnswer('');

    if (currentQIndex + 1 < SUBJECT_QUESTIONS[selectedSubject].questions.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      const nextQ = SUBJECT_QUESTIONS[selectedSubject].questions[nextIdx].text;
      speakText(`Question ${nextIdx + 1}: ${nextQ}`);
    } else {
      finishVivaSession(updatedScores);
    }
  };

  const finishVivaSession = (finalScores = scores) => {
    setTimerActive(false);
    setSessionActive(false);
    setIsCompleted(true);
    toggleCamera(false);
    if (recognitionRef.current && isListening) recognitionRef.current.stop();

    const totalScore = finalScores.reduce((acc, curr) => acc + curr.score, 0);
    const grade = totalScore >= 90 ? 'A+' : totalScore >= 80 ? 'A' : totalScore >= 70 ? 'B' : totalScore >= 60 ? 'C' : 'D';
    const resultObj = {
      id: Date.now(),
      subject: SUBJECT_QUESTIONS[selectedSubject].title,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: totalScore,
      maxScore: 100,
      grade,
      studentName: user.name,
      studentEmail: user.email,
      evalDetails: finalScores
    };

    const newHistory = [resultObj, ...pastSessions];
    setPastSessions(newHistory);
    try {
      localStorage.setItem('smartlabx-viva-history', JSON.stringify(newHistory));
      const vivaResults = JSON.parse(localStorage.getItem('smartlabx-viva-results') || '{}');
      localStorage.setItem('smartlabx-viva-results', JSON.stringify({
        ...vivaResults,
        [user.email]: { ...resultObj, completedAt: resultObj.date },
      }));
    } catch (e) { console.error(e); }

    speakText(`Viva session completed. Your overall score is ${totalScore} out of 100.`);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeSub = SUBJECT_QUESTIONS[selectedSubject];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* ── Viva Portal Navigation Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                <span className="text-xl">[EDU]</span>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-gray-900">SmartLabX</span>
                <span className="ml-2 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 border border-indigo-200">
                  Viva Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-full text-xs text-gray-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Proctored Live Session Engine</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-sm"
            >
              ← Back to Portal
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Viva Portal Workspace ── */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!sessionActive && !isCompleted && !vivaAccess && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600 text-3xl font-black border border-amber-200">
              [LOCK]
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">Viva Access Locked</h2>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Your Viva examination is not enabled yet. Your faculty must grant access for
              <span className="font-semibold text-gray-700"> {user.email}</span> before you can begin.
              This page will unlock automatically once access is enabled.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Waiting for faculty approval...
            </div>
          </div>
        )}

        {!sessionActive && !isCompleted && vivaAccess && (
          <div className="space-y-10">
            {/* Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-8 sm:p-12 border border-indigo-400/20 shadow-2xl shadow-indigo-500/10">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold text-white border border-white/30">
                  AI-Powered Oral Evaluation
                </span>
                <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">Viva Examination Portal</span>
                </h1>
                <p className="mt-4 text-sm sm:text-base text-indigo-100 leading-relaxed">
                  Select your lab course below to begin an interactive AI oral examination. Real-time speech evaluation, instant proctoring, and comprehensive feedback scoring included.
                </p>
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 text-9xl pointer-events-none">
                ️
              </div>
            </div>

            {/* Subject Selector Cards */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span></span> Select Examination Subject
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {Object.keys(SUBJECT_QUESTIONS).map((key) => {
                  const sub = SUBJECT_QUESTIONS[key];
                  const isSel = selectedSubject === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedSubject(key)}
                      className={`group cursor-pointer rounded-2xl p-6 transition-all duration-300 border ${
                        isSel
                          ? 'border-indigo-400 bg-indigo-50 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-400/50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">{sub.icon}</span>
                        {isSel && (
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600 border border-indigo-200">
                            Selected
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition">
                        {sub.title}
                      </h3>
                      <p className="mt-2 text-xs text-gray-500">
                        5 AI-Generated Questions • Speech & Text Evaluation • 5 Minutes
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Panel */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ready for {activeSub.title} Viva?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Faculty access approved. Make sure your microphone and camera permissions are allowed.
                  You have {vivaAccess.durationMinutes || 5} minutes to answer 5 questions.
                </p>
              </div>
              <button
                onClick={startVivaSession}
                className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
              >
                 Start Live AI Viva
              </button>
            </div>

            {/* Past History */}
            {pastSessions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span></span> Past Viva Examination Records
                </h2>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pastSessions.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-semibold text-gray-900">{s.subject}</td>
                          <td className="px-6 py-4 text-gray-500">{s.date}</td>
                          <td className="px-6 py-4 text-gray-600">{s.studentName}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">{s.score} / 100</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Active Viva Session ── */}
        {sessionActive && (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              {/* Question Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Question {currentQIndex + 1} of {activeSub.questions.length}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    [TIME]️ {formatTimer(timer)}
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed mb-6">
                  {activeSub.questions[currentQIndex].text}
                </h2>

                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => speakText(activeSub.questions[currentQIndex].text)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-indigo-600 transition border border-gray-200"
                  >
                     {isSpeaking ? 'Speaking...' : 'Repeat Question'}
                  </button>
                  <span className="text-xs text-gray-400">
                    Keywords evaluated: {activeSub.questions[currentQIndex].keywords.join(', ')}
                  </span>
                </div>

                {/* Response Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500">Your Answer (Voice or Typing):</label>
                    <button
                      onClick={toggleListen}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                       {isListening ? 'Stop Listening' : 'Start Mic'}
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Speak into your microphone or type your complete answer here..."
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => finishVivaSession()}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                  >
                    End Viva Early
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm shadow-lg shadow-indigo-600/30 transition"
                  >
                    {currentQIndex + 1 === activeSub.questions.length ? 'Submit Final Answer' : 'Next Question →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Side Proctoring Panel */}
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center justify-between">
                  <span> Live Camera Monitor</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                </h3>
                <div className="relative aspect-video rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xs">
                      <span className="text-2xl mb-1"></span>
                      {cameraError || 'Starting camera...'}
                      {cameraError && (
                        <button
                          type="button"
                          onClick={() => toggleCamera(true)}
                          className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                        >
                          Allow Camera / Retry
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  [LOCK] Viva Security Rules
                </h3>
                <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
                  <li>AI assistance is disabled during the viva session.</li>
                  <li>Responses are evaluated using NLP keyword detection.</li>
                  <li>Live camera feed is recorded for faculty review.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Viva Results Scorecard ── */}
        {isCompleted && (
          <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 sm:p-12 shadow-2xl text-center space-y-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-4xl border border-emerald-200">
              [*]
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Viva Examination Completed!</h2>
              <p className="text-sm text-gray-500 mt-2">
                Your answers have been evaluated and recorded into your academic history.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 flex items-center justify-around">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Total Score</p>
                <p className="text-4xl font-extrabold text-emerald-600 mt-1">
                  {scores.reduce((a, b) => a + b.score, 0)} <span className="text-lg text-gray-400">/ 100</span>
                </p>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
                <p className="text-lg font-bold text-indigo-600 mt-1">PASSED [OK]</p>
              </div>
            </div>

            <div className="text-left space-y-4">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Evaluation Breakdown</h3>
              <div className="space-y-3">
                {scores.map((sc, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs">
                    <div className="flex items-center justify-between font-bold text-gray-900 mb-1">
                      <span>Q{idx + 1}: {sc.question}</span>
                      <span className="text-emerald-600 font-mono">{sc.score} / 20</span>
                    </div>
                    <p className="text-gray-500 italic">Answer: "{sc.answer || 'No response provided'}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => { setIsCompleted(false); setSessionActive(false); }}
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                Back to Viva Portal
              </button>
            </div>
          </div>
        )}
      </main>

      {/* InvigiLMNce AI Proctoring HUD for Viva Oral Exams */}
      <ProctorHUD studentId="Aarav_Kumar" />
    </div>
  );
}

