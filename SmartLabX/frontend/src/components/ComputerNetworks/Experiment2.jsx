import React, { useState } from 'react';
import { ArrowLeft, Check, X, Wifi, Globe, Server } from 'lucide-react';

const initialDevices = [
  { id: 'pc1', name: 'PC-1', type: 'PC', ip: '', subnet: '', gateway: '', dns: '' },
  { id: 'pc2', name: 'PC-2', type: 'PC', ip: '', subnet: '', gateway: '', dns: '' },
  { id: 'router1', name: 'Router-1', type: 'Router', ip: '192.168.1.1', subnet: '255.255.255.0', gateway: '-', dns: '-' },
  { id: 'server1', name: 'Server-1', type: 'Server', ip: '192.168.1.100', subnet: '255.255.255.0', gateway: '192.168.1.1', dns: '8.8.8.8' },
];

const correctConfig = {
  pc1: { ip: '192.168.1.10', subnet: '255.255.255.0', gateway: '192.168.1.1', dns: '8.8.8.8' },
  pc2: { ip: '192.168.1.20', subnet: '255.255.255.0', gateway: '192.168.1.1', dns: '8.8.8.8' },
};

export default function Experiment2({ onBack, onComplete }) {
  const [devices, setDevices] = useState(initialDevices);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [pingSource, setPingSource] = useState('');
  const [pingDest, setPingDest] = useState('');
  const [pingResult, setPingResult] = useState(null);
  const [validated, setValidated] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = (msg, type = 'info') => {
    setLog((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const updateDevice = (id, field, value) => {
    setDevices((devs) =>
      devs.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const validateConfig = () => {
    let allCorrect = true;
    for (const [id, expected] of Object.entries(correctConfig)) {
      const dev = devices.find((d) => d.id === id);
      if (!dev) continue;
      for (const [field, val] of Object.entries(expected)) {
        if (dev[field].trim() !== val) {
          allCorrect = false;
          addLog(`${dev.name}: Wrong ${field}. Expected ${val}, got "${dev[field]}"`, 'error');
        }
      }
    }
    if (allCorrect) {
      setValidated(true);
      addLog('All IP configurations are correct!', 'success');
    } else {
      addLog('Some configurations are incorrect. Check the log above.', 'error');
    }
  };

  const [animatingPacket, setAnimatingPacket] = useState(null);

  const runPing = () => {
    if (!pingSource || !pingDest) {
      setPingResult({ success: false, message: 'Select both source and destination devices.' });
      return;
    }
    const src = devices.find((d) => d.id === pingSource);
    const dst = devices.find((d) => d.id === pingDest);
    if (!src || !dst) return;

    if (!src.ip || !dst.ip) {
      setPingResult({ success: false, message: `Ping failed: ${!src.ip ? src.name : dst.name} has no IP address configured.` });
      addLog(`Ping ${src.name} → ${dst.name}: FAILED (no IP)`, 'error');
      return;
    }

    setPingResult(null);
    setAnimatingPacket({ from: src.id, to: dst.id, step: 0 });
    addLog(`Initiating ping from ${src.name} to ${dst.name}...`, 'info');

    // Check if they're in the same subnet
    const srcNet = src.ip.split('.').slice(0, 3).join('.');
    const dstNet = dst.ip.split('.').slice(0, 3).join('.');
    const isSuccess = (srcNet === dstNet || src.gateway === dst.ip || dst.gateway === src.ip);

    // Animation steps
    setTimeout(() => setAnimatingPacket({ from: src.id, to: dst.id, step: 1 }), 800); // at switch/router
    
    setTimeout(() => {
      if (isSuccess) {
        setAnimatingPacket({ from: src.id, to: dst.id, step: 2 }); // at destination
        setTimeout(() => {
           setAnimatingPacket(null);
           setPingResult({
            success: true,
            message: `Pinging ${dst.ip} from ${src.ip}...\nReply from ${dst.ip}: bytes=32 time<1ms TTL=128\nReply from ${dst.ip}: bytes=32 time<1ms TTL=128\nReply from ${dst.ip}: bytes=32 time<1ms TTL=128\n\nPing statistics: Sent=3, Received=3, Lost=0 (0% loss)`
          });
          addLog(`Ping ${src.name} (${src.ip}) → ${dst.name} (${dst.ip}): SUCCESS`, 'success');
        }, 1000);
      } else {
        setAnimatingPacket({ from: src.id, to: dst.id, step: 'failed' });
        setTimeout(() => {
          setAnimatingPacket(null);
          setPingResult({
            success: false,
            message: `Pinging ${dst.ip} from ${src.ip}...\nRequest timed out.\nRequest timed out.\n\nPing statistics: Sent=3, Received=0, Lost=3 (100% loss)\n\nHint: Devices are on different subnets. Check gateway configuration.`
          });
          addLog(`Ping ${src.name} → ${dst.name}: FAILED (different subnet)`, 'error');
        }, 1000);
      }
    }, 1600);
  };

  const selected = selectedDevice ? devices.find((d) => d.id === selectedDevice) : null;
  const isEditable = selected && (selected.id === 'pc1' || selected.id === 'pc2');

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Experiment 2: IP Address Configuration</h2>
            <p className="text-sm text-slate-500">Configure IP, Subnet, Gateway, DNS for each PC and test connectivity</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={validateConfig} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
            Validate Config
          </button>
        </div>
      </div>

      {validated && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <Check size={16} /> All configurations validated successfully!
          <button onClick={() => onComplete && onComplete(2)} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700">
            Mark Complete [OK]
          </button>
        </div>
      )}

      <div className="flex gap-4" style={{ minHeight: 480 }}>
        {/* Network Topology Diagram */}
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Network Topology</h3>
          <div className="relative flex flex-col items-center gap-6">
            {/* Visual topology */}
            <div className="flex items-center gap-16">
              {devices.filter(d => d.type === 'PC').map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev.id)}
                  className={`flex flex-col items-center cursor-pointer rounded-xl border-2 p-4 transition duration-300 ${
                    animatingPacket && animatingPacket.from === dev.id && animatingPacket.step === 0 ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-110' :
                    animatingPacket && animatingPacket.to === dev.id && animatingPacket.step === 2 ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-110' :
                    animatingPacket && animatingPacket.to === dev.id && animatingPacket.step === 'failed' ? 'border-red-500 bg-red-50 shadow-lg scale-110' :
                    selectedDevice === dev.id ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    <Globe size={24} />
                  </div>
                  <span className="mt-2 text-sm font-bold text-slate-800">{dev.name}</span>
                  <span className="text-xs font-mono text-slate-500">{dev.ip || 'No IP'}</span>
                  <span className={`mt-1 h-2 w-2 rounded-full ${dev.ip ? 'bg-emerald-500' : 'bg-red-400'}`} />
                </div>
              ))}
            </div>

            {/* Connection lines */}
            <div className={`h-8 w-0.5 transition-colors duration-300 ${animatingPacket && animatingPacket.step >= 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-indigo-300'}`} />
            <div className="flex items-center gap-16">
              {devices.filter(d => d.type === 'Router').map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev.id)}
                  className={`flex flex-col items-center cursor-pointer rounded-xl border-2 p-4 transition duration-300 ${
                    animatingPacket && animatingPacket.step === 1 ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-110' :
                    selectedDevice === dev.id ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-indigo-100 bg-indigo-50 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white">
                    <Wifi size={24} />
                  </div>
                  <span className="mt-2 text-sm font-bold text-slate-800">{dev.name}</span>
                  <span className="text-xs font-mono text-slate-500">{dev.ip}</span>
                </div>
              ))}
            </div>
            <div className={`h-8 w-0.5 transition-colors duration-300 ${animatingPacket && (animatingPacket.step === 2 || animatingPacket.step === 'failed') ? (animatingPacket.step === 2 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-400') : 'bg-indigo-300'}`} />
            <div className="h-8 w-0.5 bg-indigo-300" />

            <div className="flex items-center gap-16">
              {devices.filter(d => d.type === 'Server').map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev.id)}
                  className={`flex flex-col items-center cursor-pointer rounded-xl border-2 p-4 transition duration-300 ${
                    animatingPacket && animatingPacket.to === dev.id && animatingPacket.step === 2 ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-110' :
                    animatingPacket && animatingPacket.to === dev.id && animatingPacket.step === 'failed' ? 'border-red-500 bg-red-50 shadow-lg scale-110' :
                    selectedDevice === dev.id ? 'border-indigo-500 bg-purple-50 shadow-lg' : 'border-purple-100 bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                    <Server size={24} />
                  </div>
                  <span className="mt-2 text-sm font-bold text-slate-800">{dev.name}</span>
                  <span className="text-xs font-mono text-slate-500">{dev.ip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ping Section */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Connectivity Test (Ping)</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Source</label>
                <select value={pingSource} onChange={(e) => setPingSource(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Select source</option>
                  {devices.map((d) => <option key={d.id} value={d.id}>{d.name} {d.ip ? `(${d.ip})` : ''}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Destination</label>
                <select value={pingDest} onChange={(e) => setPingDest(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Select destination</option>
                  {devices.map((d) => <option key={d.id} value={d.id}>{d.name} {d.ip ? `(${d.ip})` : ''}</option>)}
                </select>
              </div>
              <button onClick={runPing} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Ping
              </button>
            </div>
            {pingResult && (
              <pre className={`mt-3 rounded-lg border p-3 text-xs font-mono whitespace-pre-wrap ${pingResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                {pingResult.message}
              </pre>
            )}
          </div>
        </div>

        {/* Config Panel */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Device Configuration</h3>
            {selected ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <span className="text-sm font-bold text-slate-800">{selected.name}</span>
                  <span className="ml-2 text-xs text-slate-500">({selected.type})</span>
                </div>
                {['ip', 'subnet', 'gateway', 'dns'].map((field) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                      {field === 'ip' ? 'IP Address' : field === 'subnet' ? 'Subnet Mask' : field === 'gateway' ? 'Default Gateway' : 'DNS Server'}
                    </label>
                    <input
                      value={selected[field]}
                      onChange={(e) => isEditable && updateDevice(selected.id, field, e.target.value)}
                      readOnly={!isEditable}
                      placeholder={field === 'ip' ? '192.168.1.x' : field === 'subnet' ? '255.255.255.0' : field === 'gateway' ? '192.168.1.1' : '8.8.8.8'}
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-mono ${isEditable ? 'border-indigo-200 bg-white focus:border-indigo-400 outline-none' : 'border-slate-200 bg-slate-100 text-slate-500'}`}
                    />
                  </div>
                ))}
                {!isEditable && <p className="text-xs text-amber-600 font-medium">This device is pre-configured (read-only)</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click a device in the topology to configure its network settings.</p>
            )}
          </div>

          {/* Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" style={{ maxHeight: 180, overflow: 'auto' }}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Log</h3>
            {log.length === 0 ? (
              <p className="text-xs text-slate-400">Configure PC-1 and PC-2, then validate.</p>
            ) : (
              <div className="space-y-1">
                {log.slice(-10).reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-slate-300 shrink-0">{entry.time}</span>
                    <span className={entry.type === 'error' ? 'text-red-600' : entry.type === 'success' ? 'text-emerald-600' : 'text-slate-600'}>
                      {entry.msg}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
