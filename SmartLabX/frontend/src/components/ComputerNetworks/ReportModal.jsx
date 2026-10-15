import React from 'react';
import { X, Printer, CheckCircle, XCircle } from 'lucide-react';

export default function ReportModal({ student, onClose, batchName, completedExperiments = [] }) {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const experimentsList = [
    { id: 1, title: "Experiment 1: Topologies & Cables" },
    { id: 2, title: "Experiment 2: IP Address Config" },
    { id: 3, title: "Experiment 3: Routing & Packet Forwarding" },
    { id: 4, title: "Experiment 4: Network Services" },
    { id: 5, title: "Experiment 5: Network Troubleshooting" }
  ];

  const score = Math.round((completedExperiments.length / 5) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Student Progress Report</h2>
            <p className="text-sm text-slate-500">{batchName} • Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <Printer size={16} /> Print Report
            </button>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content (Printable Area) */}
        <div className="flex-1 overflow-auto p-8" id="report-printable-area">
          <div className="mb-8 flex items-start justify-between border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{student.name}</h1>
              <p className="mt-1 text-slate-600 font-mono">{student.email}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-indigo-600">{score}%</div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Completion Score</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Laboratory Experiments</h3>
            <div className="space-y-3">
              {experimentsList.map((exp) => {
                const isCompleted = completedExperiments.includes(exp.id);
                return (
                  <div key={exp.id} className={`flex items-center justify-between p-4 rounded-xl border ${isCompleted ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      {isCompleted ? <CheckCircle className="text-emerald-500" size={24} /> : <XCircle className="text-slate-400" size={24} />}
                      <span className={`font-semibold ${isCompleted ? 'text-emerald-900' : 'text-slate-600'}`}>{exp.title}</span>
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${isCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {isCompleted ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Assigned Tasks</h3>
            <div className="space-y-3">
              {(student.assignedTasks || []).length === 0 ? (
                <p className="text-slate-500 text-sm">No specific tasks assigned yet.</p>
              ) : (
                (student.assignedTasks || []).map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{t.title}</p>
                      <p className="text-sm text-slate-500">Due: {t.due || 'No date set'}</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full">{t.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <style>
            {`
              @media print {
                body * { visibility: hidden; }
                #report-printable-area, #report-printable-area * { visibility: visible; }
                #report-printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
}
