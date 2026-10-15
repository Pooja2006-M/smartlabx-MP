import React, { useState } from 'react';
import { ArrowLeft, Check, X, Router as RouterIcon, Monitor, Server, ArrowRight } from 'lucide-react';

const networks = [
  { id: 'net1', name: 'Network A', subnet: '192.168.1.0/24', color: 'blue' },
  { id: 'net2', name: 'Network B', subnet: '10.0.0.0/24', color: 'purple' },
];

const initialRouters = [
  {
    id: 'r1', name: 'Router-1',
    interfaces: [
      { name: 'Fa0/0', ip: '', subnet: '', network: 'net1', status: 'down' },
      { name: 'Fa0/1', ip: '', subnet: '', network: 'net2', status: 'down' },
    ],
    routes: [],
  },
];

const initialDevices = [
  { id: 'pc1', name: 'PC-A', network: 'net1', ip: '192.168.1.10', gateway: '192.168.1.1' },
  { id: 'pc2', name: 'PC-B', network: 'net2', ip: '10.0.0.10', gateway: '10.0.0.1' },
  { id: 'srv1', name: 'Web-Server', network: 'net2', ip: '10.0.0.100', gateway: '10.0.0.1' },
];

const correctInterfaces = {
  'Fa0/0': { ip: '192.168.1.1', subnet: '255.255.255.0' },
  'Fa0/1': { ip: '10.0.0.1', subnet: '255.255.255.0' },
};

export default function Experiment3({ onBack, onComplete }) {
  const [routers, setRouters] = useState(initialRouters);
  const [selectedRouter, setSelectedRouter] = useState('r1');
  const [newRoute, setNewRoute] = useState({ dest: '', mask: '', nextHop: '' });
  const [simResult, setSimResult] = useState(null);
  const [packetPath, setPacketPath] = useState([]);
  const [validated, setValidated] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = (msg, type = 'info') => {
    setLog((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const router = routers.find((r) => r.id === selectedRouter);

  const updateInterface = (ifName, field, value) => {
    setRouters((prev) =>
      prev.map((r) =>
        r.id === selectedRouter
          ? {
              ...r,
              interfaces: r.interfaces.map((iface) =>
                iface.name === ifName ? { ...iface, [field]: value } : iface
              ),
            }
          : r
      )
    );
  };

  const toggleInterface = (ifName) => {
    setRouters((prev) =>
      prev.map((r) =>
        r.id === selectedRouter
          ? {
              ...r,
              interfaces: r.interfaces.map((iface) =>
                iface.name === ifName ? { ...iface, status: iface.status === 'up' ? 'down' : 'up' } : iface
              ),
            }
          : r
      )
    );
    addLog(`Interface ${ifName} toggled`, 'info');
  };

  const addRoute = () => {
    if (!newRoute.dest || !newRoute.mask || !newRoute.nextHop) {
      addLog('All route fields are required', 'error');
      return;
    }
    setRouters((prev) =>
      prev.map((r) =>
        r.id === selectedRouter
          ? { ...r, routes: [...r.routes, { ...newRoute, id: Date.now() }] }
          : r
      )
    );
    addLog(`Static route added: ${newRoute.dest}/${newRoute.mask} via ${newRoute.nextHop}`, 'success');
    setNewRoute({ dest: '', mask: '', nextHop: '' });
  };

  const simulatePacket = () => {
    const r = routers[0];
    const fa00 = r.interfaces.find((i) => i.name === 'Fa0/0');
    const fa01 = r.interfaces.find((i) => i.name === 'Fa0/1');

    if (!fa00.ip || !fa01.ip) {
      setSimResult({ success: false, message: 'Configure both router interfaces first!' });
      addLog('Simulation failed: interfaces not configured', 'error');
      return;
    }

    if (fa00.status === 'down' || fa01.status === 'down') {
      setSimResult({ success: false, message: 'Both interfaces must be UP for routing to work.' });
      addLog('Simulation failed: interface is down', 'error');
      return;
    }

    // Animate packet path
    const path = ['PC-A (192.168.1.10)', `Router Fa0/0 (${fa00.ip})`, `Router Fa0/1 (${fa01.ip})`, 'Web-Server (10.0.0.100)'];
    setPacketPath([]);
    
    path.forEach((hop, i) => {
      setTimeout(() => {
        setPacketPath((prev) => [...prev, hop]);
        addLog(`Packet at hop ${i + 1}: ${hop}`, 'success');
        if (i === path.length - 1) {
          setSimResult({ success: true, message: `Packet forwarded successfully! ${path.length} hops, TTL=124, Delay=2ms` });
          setValidated(true);
        }
      }, (i + 1) * 800);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Experiment 3: Routing & Packet Forwarding</h2>
            <p className="text-sm text-slate-500">Configure router interfaces → Add routes → Simulate packet forwarding</p>
          </div>
        </div>
        <button onClick={simulatePacket} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          ▶ Simulate Packet
        </button>
      </div>

      {validated && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <Check size={16} /> Packet forwarded successfully across networks!
          <button onClick={() => onComplete && onComplete(3)} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700">
            Mark Complete [OK]
          </button>
        </div>
      )}

      {simResult && !simResult.success && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <X size={16} /> {simResult.message}
        </div>
      )}

      <div className="flex gap-4" style={{ minHeight: 460 }}>
        {/* Network Topology */}
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Multi-Network Topology</h3>
          
          <div className="flex items-start justify-between gap-6">
            {/* Network A */}
            <div className="flex-1 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
              <h4 className="text-xs font-bold text-blue-600 uppercase mb-3">Network A (192.168.1.0/24)</h4>
              <div className="flex flex-col items-center gap-3">
                <div className={`flex flex-col items-center rounded-lg border-2 p-3 ${packetPath.includes('PC-A (192.168.1.10)') ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-blue-200 bg-white'}`}>
                  <Monitor size={28} className="text-blue-600" />
                  <span className="text-xs font-bold mt-1">PC-A</span>
                  <span className="text-[10px] font-mono text-slate-500">192.168.1.10</span>
                </div>
              </div>
            </div>

            {/* Router */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="text-[10px] font-mono text-slate-400">Fa0/0</div>
              <div className={`h-0.5 w-12 ${packetPath.length >= 2 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <div className={`flex flex-col items-center rounded-xl border-2 p-4 ${packetPath.length >= 2 ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-indigo-300 bg-indigo-50'}`}>
                <RouterIcon size={32} className="text-indigo-600" />
                <span className="text-sm font-bold mt-1">Router-1</span>
              </div>
              <div className={`h-0.5 w-12 ${packetPath.length >= 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <div className="text-[10px] font-mono text-slate-400">Fa0/1</div>
            </div>

            {/* Network B */}
            <div className="flex-1 rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
              <h4 className="text-xs font-bold text-purple-600 uppercase mb-3">Network B (10.0.0.0/24)</h4>
              <div className="flex flex-col items-center gap-3">
                <div className={`flex flex-col items-center rounded-lg border-2 p-3 ${packetPath.includes('Web-Server (10.0.0.100)') ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-purple-200 bg-white'}`}>
                  <Server size={28} className="text-purple-600" />
                  <span className="text-xs font-bold mt-1">Web-Server</span>
                  <span className="text-[10px] font-mono text-slate-500">10.0.0.100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Packet Path Visualization */}
          {packetPath.length > 0 && (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
              <h4 className="text-xs font-bold text-indigo-600 mb-2">Packet Path</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {packetPath.map((hop, i) => (
                  <React.Fragment key={i}>
                    <span className="rounded-lg bg-white border border-indigo-200 px-2 py-1 text-xs font-mono text-indigo-800">{hop}</span>
                    {i < packetPath.length - 1 && <ArrowRight size={14} className="text-indigo-400" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Router Config Panel */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Router Configuration</h3>
            {router && router.interfaces.map((iface) => (
              <div key={iface.name} className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">{iface.name}</span>
                  <button
                    onClick={() => toggleInterface(iface.name)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${iface.status === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {iface.status.toUpperCase()}
                  </button>
                </div>
                <input
                  value={iface.ip}
                  onChange={(e) => updateInterface(iface.name, 'ip', e.target.value)}
                  placeholder={iface.network === 'net1' ? '192.168.1.1' : '10.0.0.1'}
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono mb-1 outline-none focus:border-indigo-400"
                />
                <input
                  value={iface.subnet}
                  onChange={(e) => updateInterface(iface.name, 'subnet', e.target.value)}
                  placeholder="255.255.255.0"
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-400"
                />
              </div>
            ))}
          </div>

          {/* Routing Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Static Routes</h3>
            <div className="space-y-1 mb-3">
              <input value={newRoute.dest} onChange={(e) => setNewRoute({...newRoute, dest: e.target.value})} placeholder="Dest network (e.g. 10.0.0.0)" className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-mono outline-none focus:border-indigo-400" />
              <input value={newRoute.mask} onChange={(e) => setNewRoute({...newRoute, mask: e.target.value})} placeholder="Mask (e.g. 255.255.255.0)" className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-mono outline-none focus:border-indigo-400" />
              <input value={newRoute.nextHop} onChange={(e) => setNewRoute({...newRoute, nextHop: e.target.value})} placeholder="Next hop (e.g. 10.0.0.1)" className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-mono outline-none focus:border-indigo-400" />
              <button onClick={addRoute} className="w-full rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Add Route</button>
            </div>
            {router && router.routes.length > 0 && (
              <div className="space-y-1">
                {router.routes.map((r) => (
                  <div key={r.id} className="rounded bg-slate-50 px-2 py-1 text-[10px] font-mono text-slate-600">
                    {r.dest}/{r.mask} via {r.nextHop}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" style={{ maxHeight: 120, overflow: 'auto' }}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Log</h3>
            <div className="space-y-1">
              {log.slice(-8).reverse().map((entry, i) => (
                <div key={i} className="text-[10px]">
                  <span className="text-slate-300">{entry.time}</span>{' '}
                  <span className={entry.type === 'error' ? 'text-red-600' : entry.type === 'success' ? 'text-emerald-600' : 'text-slate-600'}>{entry.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
