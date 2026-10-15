import React, { useState } from 'react';
import { ArrowLeft, Check, X, AlertTriangle, Search, Zap, Monitor, Server, Router as RouterIcon } from 'lucide-react';

const scenarios = [
  {
    id: 1,
    title: 'PC Cannot Reach Gateway',
    description: 'PC-1 is unable to ping its default gateway. Find and fix the configuration error.',
    devices: [
      { id: 'pc1', name: 'PC-1', type: 'PC', ip: '192.168.1.10', subnet: '255.255.255.0', gateway: '192.168.2.1' }, // Wrong gateway
      { id: 'r1', name: 'Router', type: 'Router', ip: '192.168.1.1', subnet: '255.255.255.0', gateway: '-' }
    ],
    fix: { deviceId: 'pc1', field: 'gateway', expectedValue: '192.168.1.1' },
    hint: 'Check if the PC\'s gateway matches the Router\'s IP address.'
  },
  {
    id: 2,
    title: 'Subnet Mismatch',
    description: 'PC-A and PC-B are connected to the same switch but cannot communicate.',
    devices: [
      { id: 'pca', name: 'PC-A', type: 'PC', ip: '10.0.0.5', subnet: '255.255.255.0', gateway: '10.0.0.1' },
      { id: 'pcb', name: 'PC-B', type: 'PC', ip: '10.0.0.10', subnet: '255.255.0.0', gateway: '10.0.0.1' } // Wrong subnet
    ],
    fix: { deviceId: 'pcb', field: 'subnet', expectedValue: '255.255.255.0' },
    hint: 'Devices on the same local network should have matching subnet masks.'
  },
  {
    id: 3,
    title: 'DNS Resolution Failure',
    description: 'The PC can ping the server IP directly, but cannot browse by domain name.',
    devices: [
      { id: 'pc', name: 'Client PC', type: 'PC', ip: '172.16.0.50', subnet: '255.255.255.0', dns: '8.8.4.4' }, // Wrong DNS
      { id: 'dns', name: 'DNS Server', type: 'Server', ip: '172.16.0.100', subnet: '255.255.255.0', dns: '-' }
    ],
    fix: { deviceId: 'pc', field: 'dns', expectedValue: '172.16.0.100' },
    hint: 'Ensure the client is pointing to the correct local DNS server IP.'
  }
];

export default function Experiment5({ onBack, onComplete }) {
  const [activeScenario, setActiveScenario] = useState(0);
  const [devices, setDevices] = useState(scenarios[0].devices);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [validated, setValidated] = useState(false);
  const [log, setLog] = useState([]);

  const scenario = scenarios[activeScenario];

  const addLog = (msg, type = 'info') => setLog((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);

  const updateDevice = (id, field, value) => {
    setDevices((devs) =>
      devs.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const loadScenario = (index) => {
    setActiveScenario(index);
    setDevices(scenarios[index].devices);
    setSelectedDevice(null);
    setShowHint(false);
    setPingResult(null);
    setValidated(false);
    setLog([]);
    addLog(`Loaded Scenario: ${scenarios[index].title}`, 'info');
  };

  const testConnectivity = () => {
    const { deviceId, field, expectedValue } = scenario.fix;
    const deviceToFix = devices.find(d => d.id === deviceId);

    if (deviceToFix[field] === expectedValue) {
      setPingResult({ success: true, message: 'Ping successful! Reply received. Issue resolved.' });
      setValidated(true);
      addLog('Issue resolved! Connectivity restored.', 'success');
    } else {
      setPingResult({ success: false, message: 'Request timed out. Destination unreachable.' });
      addLog('Ping failed. The issue is still present.', 'error');
    }
  };

  const selected = selectedDevice ? devices.find((d) => d.id === selectedDevice) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Experiment 5: Network Troubleshooting</h2>
            <p className="text-sm text-slate-500">Diagnose and resolve common network misconfigurations</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={testConnectivity} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm">
             <Zap size={16} /> Test Connectivity
           </button>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="flex gap-2">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => loadScenario(i)}
            className={`flex-1 rounded-xl border p-3 text-left transition-all ${activeScenario === i ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className={activeScenario === i ? 'text-indigo-600' : 'text-slate-400'} />
              <span className={`text-sm font-bold ${activeScenario === i ? 'text-indigo-900' : 'text-slate-600'}`}>Scenario {s.id}</span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{s.title}</p>
          </button>
        ))}
      </div>

      {validated && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <Check size={16} /> Problem identified and fixed! Excellent troubleshooting.
          <button onClick={() => onComplete && onComplete(5)} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700">
            Mark Complete [OK]
          </button>
        </div>
      )}

      <div className="flex gap-4" style={{ minHeight: 400 }}>
        {/* Topology & Diagnostic tools */}
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
             <h4 className="text-sm font-bold text-amber-800 mb-1">Current Issue: {scenario.title}</h4>
             <p className="text-sm text-amber-700">{scenario.description}</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 relative p-8">
            <div className="flex items-center gap-16 relative">
              {/* Simple Cable line */}
              <div className="absolute top-1/2 left-10 right-10 h-1 bg-indigo-300 -translate-y-1/2 z-0" />
              
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev.id)}
                  className={`z-10 flex flex-col items-center cursor-pointer rounded-xl border-2 p-4 transition bg-white ${selectedDevice === dev.id ? 'border-indigo-500 shadow-lg scale-110' : 'border-slate-300 hover:border-indigo-400'}`}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-sm bg-gradient-to-br ${dev.type === 'PC' ? 'from-blue-400 to-blue-600' : dev.type === 'Router' ? 'from-indigo-400 to-indigo-600' : 'from-purple-400 to-purple-600'}`}>
                    {dev.type === 'PC' ? <Monitor size={28} /> : dev.type === 'Router' ? <RouterIcon size={28} /> : <Server size={28} />}
                  </div>
                  <span className="mt-2 text-sm font-bold text-slate-800">{dev.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          {pingResult && (
             <div className={`mt-4 rounded-xl border p-4 font-mono text-sm whitespace-pre-wrap ${pingResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
               {'>'} ping test-target...
               {'\n\n'}{pingResult.message}
             </div>
          )}
        </div>

        {/* Right Panel: Config & Hints */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          {/* Config Editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Device Settings</h3>
            {selected ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-2 text-center border border-slate-100">
                  <span className="text-sm font-bold text-slate-800">{selected.name}</span>
                </div>
                {['ip', 'subnet', 'gateway', 'dns'].map((field) => (
                  selected[field] !== undefined && (
                    <div key={field}>
                      <label className="text-[10px] font-semibold text-slate-600 uppercase mb-1 block">
                        {field}
                      </label>
                      <input
                        value={selected[field]}
                        onChange={(e) => updateDevice(selected.id, field, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 outline-none transition"
                      />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-center text-sm text-slate-400">
                Select a device in the topology to inspect its configuration.
              </div>
            )}
          </div>

          {/* AI Hint Assistant */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
             <div className="flex items-center gap-2 mb-2">
               <Search size={16} className="text-indigo-600" />
               <h3 className="text-sm font-bold text-indigo-900">AI Assistant</h3>
             </div>
             {showHint ? (
               <p className="text-xs text-indigo-800 leading-relaxed bg-white/60 p-3 rounded-lg border border-indigo-100">{scenario.hint}</p>
             ) : (
               <button onClick={() => setShowHint(true)} className="w-full rounded-lg bg-indigo-600/10 text-indigo-700 py-2 text-xs font-bold hover:bg-indigo-600/20 transition">
                 Get a Hint
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
