import React from 'react';
import CPUScheduling from './experiments/CPUScheduling';
import MemoryManagement from './experiments/MemoryManagement';
import PageReplacement from './experiments/PageReplacement';
import DeadlockDetection from './experiments/DeadlockDetection';
import DiskScheduling from './experiments/DiskScheduling';

export default function OSWorkspace({ experimentId, darkMode, onBack, onComplete }) {
  // Select the correct experiment based on ID
  const renderExperiment = () => {
    switch (experimentId) {
      case 1:
        return <CPUScheduling darkMode={darkMode} onBack={onBack} onComplete={onComplete} />;
      case 2:
        return <MemoryManagement darkMode={darkMode} onBack={onBack} onComplete={onComplete} />;
      case 3:
        return <PageReplacement darkMode={darkMode} onBack={onBack} onComplete={onComplete} />;
      case 4:
        return <DeadlockDetection darkMode={darkMode} onBack={onBack} onComplete={onComplete} />;
      case 5:
        return <DiskScheduling darkMode={darkMode} onBack={onBack} onComplete={onComplete} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Experiment not found.</p>
          </div>
        );
    }
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-white text-slate-800'}`}>
       <div className="flex-1 min-h-0 overflow-hidden">
          {renderExperiment()}
       </div>
    </div>
  );
}
