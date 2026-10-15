import React, { useState, useRef, useEffect } from 'react';

export default function OSAIAssistant({ darkMode, isVivaMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your SmartLabX AI Assistant. I can help explain algorithms, guide your simulations, or provide hints. What would you like to know?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const predefinedResponses = {
    'fcfs': 'First Come First Served (FCFS) schedules processes in the exact order they arrive in the ready queue. It is non-preemptive. A common issue is the Convoy Effect, where short processes get stuck waiting for a long process.',
    'sjf': 'Shortest Job First (SJF) selects the process with the smallest execution time. It can be preemptive or non-preemptive. SJF gives the minimum average waiting time but can cause starvation for longer processes.',
    'round robin': 'Round Robin (RR) assigns a fixed time quantum to each process. Once the quantum expires, the process is preempted and sent to the back of the queue. It is great for time-sharing systems.',
    'deadlock': 'A deadlock occurs when a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process. Banker\'s Algorithm helps avoid this.',
    'page fault': 'A page fault occurs when a program attempts to access a block of memory that is not stored in the physical RAM. The OS must then fetch the page from the disk.',
    'hint': 'Try observing the Gantt chart as the time quantum changes in Round Robin. What happens to the context switch overhead when the quantum is very small?',
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
       const lowerInput = userMsg.text.toLowerCase();
       let reply = "I can guide you conceptually, but I cannot solve the experiment for you. Try asking about specific algorithms like 'FCFS', 'SJF', or 'Deadlock'.";
       
       for (const key in predefinedResponses) {
          if (lowerInput.includes(key)) {
             reply = predefinedResponses[key];
             break;
          }
       }

       setMessages(prev => [...prev, { id: Date.now(), text: reply, sender: 'ai' }]);
    }, 600);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
       messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (isVivaMode) {
     return null; // AI disabled during Viva
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
       {isOpen && (
         <div className={`mb-4 w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 ${darkMode ? 'bg-[#1a1f36] border border-white/10' : 'bg-white border border-slate-200'}`}>
            <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-white/10' : 'bg-gradient-to-r from-violet-50 to-indigo-50 border-slate-100'}`}>
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-lg"></div>
                  <div>
                     <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>AI Assistant</p>
                     <p className={`text-[10px] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>● Online</p>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className={`text-xl ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.sender === 'user' 
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-sm' 
                          : darkMode ? 'bg-white/10 text-slate-200 rounded-bl-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                     }`}>
                        {msg.text}
                     </div>
                  </div>
               ))}
               <div ref={messagesEndRef} />
            </div>
            
            <div className={`p-3 border-t flex gap-2 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
               <input 
                 type="text" 
                 value={input} 
                 onChange={e=>setInput(e.target.value)}
                 onKeyDown={e=>e.key === 'Enter' && handleSend()}
                 placeholder="Ask for hints..."
                 className={`flex-1 rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-50 border text-slate-900'}`}
               />
               <button onClick={handleSend} className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition">
                 ↑
               </button>
            </div>
         </div>
       )}
       
       <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition-transform hover:scale-110 ${isOpen ? 'bg-slate-800' : 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/30'}`}>
          {isOpen ? '[X]' : ''}
       </button>
    </div>
  );
}
