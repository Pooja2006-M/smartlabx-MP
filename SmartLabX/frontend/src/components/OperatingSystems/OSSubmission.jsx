import React, { useState } from 'react';

export default function OSSubmission({ experimentId, darkMode, onBack }) {
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([
    { id: 1, date: '2026-08-01 10:30 AM', status: 'Graded', file: 'exp1_report.pdf', score: '9/10' }
  ]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
       setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    setIsSubmitting(true);
    setTimeout(() => {
       const newSub = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          status: 'Pending',
          file: file.name,
          score: '-'
       };
       setSubmissions([newSub, ...submissions]);
       setFile(null);
       setComments('');
       setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className={`h-full overflow-y-auto p-8 ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
       <div className="max-w-4xl mx-auto space-y-8">
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white border hover:bg-slate-50'}`}>
             ← Back
          </button>
          
          <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
             <div className={`p-8 rounded-3xl ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
                 <h2 className="text-2xl font-bold mb-6">Submit Experiment Report</h2>
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                       <label className={`block text-sm font-bold mb-2 ${darkMode?'text-slate-400':'text-slate-700'}`}>Upload Lab Report (PDF)</label>
                       <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${darkMode?'border-white/10 hover:border-violet-500/50 bg-white/5':'border-slate-200 hover:border-violet-500/50 bg-slate-50'}`}>
                          <input type="file" id="fileUpload" className="hidden" accept=".pdf" onChange={handleFileChange} />
                          <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                             <span className="text-3xl mb-3">[NOTE]</span>
                             <span className={`text-sm font-semibold mb-1 ${darkMode?'text-white':'text-slate-900'}`}>
                                {file ? file.name : 'Click to upload or drag and drop'}
                             </span>
                             <span className={`text-xs ${darkMode?'text-slate-500':'text-slate-400'}`}>PDF up to 10MB</span>
                          </label>
                       </div>
                    </div>
                    
                    <div>
                       <label className={`block text-sm font-bold mb-2 ${darkMode?'text-slate-400':'text-slate-700'}`}>Additional Comments</label>
                       <textarea 
                          rows="4" 
                          value={comments}
                          onChange={e=>setComments(e.target.value)}
                          placeholder="Add any notes for your faculty..."
                          className={`w-full rounded-xl p-4 text-sm outline-none resize-none transition ${darkMode?'bg-white/5 border border-white/10 focus:border-violet-500':'bg-white border border-slate-200 focus:border-violet-500'}`}
                       />
                    </div>
                    
                    <button 
                       type="submit" 
                       disabled={!file || isSubmitting}
                       className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all hover:shadow-violet-500/40"
                    >
                       {isSubmitting ? 'Submitting...' : 'Submit Experiment'}
                    </button>
                 </form>
             </div>
             
             <div className={`p-8 rounded-3xl ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
                 <h3 className="text-lg font-bold mb-6">Submission History</h3>
                 <div className="space-y-4">
                    {submissions.map(sub => (
                       <div key={sub.id} className={`p-4 rounded-2xl ${darkMode?'bg-white/5':'bg-slate-50 border'}`}>
                          <div className="flex justify-between items-start mb-2">
                             <p className={`text-sm font-bold ${darkMode?'text-white':'text-slate-900'}`}>{sub.file}</p>
                             <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.status === 'Graded' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                             }`}>{sub.status}</span>
                          </div>
                          <p className={`text-xs mb-2 ${darkMode?'text-slate-500':'text-slate-400'}`}>{sub.date}</p>
                          <div className="flex justify-between items-center border-t pt-2 mt-2 border-slate-200 dark:border-white/5">
                             <span className={`text-xs ${darkMode?'text-slate-400':'text-slate-500'}`}>Score</span>
                             <span className={`text-sm font-bold ${darkMode?'text-white':'text-slate-900'}`}>{sub.score}</span>
                          </div>
                       </div>
                    ))}
                 </div>
             </div>
          </div>
       </div>
    </div>
  );
}
