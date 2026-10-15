import React, { useState } from 'react';
import { ArrowLeft, Check, X, Server, Globe, Wifi, Monitor } from 'lucide-react';

const initialServers = {
  dhcp: { enabled: false, poolStart: '', poolEnd: '', subnet: '', gateway: '', dns: '' },
  dns: { enabled: false, records: [{ domain: '', ip: '' }] },
  http: { enabled: false, title: '', body: '' },
};

export default function Experiment4({ onBack, onComplete }) {
  const [servers, setServers] = useState(initialServers);
  const [clientIP, setClientIP] = useState('');
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserContent, setBrowserContent] = useState(null);
  const [dhcpResult, setDhcpResult] = useState(null);
  const [validated, setValidated] = useState({ dhcp: false, dns: false, http: false });
  const [log, setLog] = useState([]);

  const addLog = (msg, type = 'info') => setLog((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);

  const updateDHCP = (field, value) => setServers((s) => ({ ...s, dhcp: { ...s.dhcp, [field]: value } }));
  const updateHTTP = (field, value) => setServers((s) => ({ ...s, http: { ...s.http, [field]: value } }));

  const updateDNSRecord = (index, field, value) => {
    setServers((s) => ({
      ...s,
      dns: {
        ...s.dns,
        records: s.dns.records.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
      },
    }));
  };

  const addDNSRecord = () => {
    setServers((s) => ({ ...s, dns: { ...s.dns, records: [...s.dns.records, { domain: '', ip: '' }] } }));
  };

  // DHCP Auto-assign
  const requestDHCP = () => {
    if (!servers.dhcp.enabled) {
      setDhcpResult({ success: false, message: 'DHCP Server is not enabled!' });
      addLog('DHCP request failed: server disabled', 'error');
      return;
    }
    if (!servers.dhcp.poolStart || !servers.dhcp.subnet) {
      setDhcpResult({ success: false, message: 'Configure DHCP pool range first!' });
      addLog('DHCP request failed: pool not configured', 'error');
      return;
    }
    const assignedIP = servers.dhcp.poolStart;
    setClientIP(assignedIP);
    setDhcpResult({ success: true, message: `DHCP ACK: IP ${assignedIP} assigned\nSubnet: ${servers.dhcp.subnet}\nGateway: ${servers.dhcp.gateway}\nDNS: ${servers.dhcp.dns}` });
    setValidated((v) => ({ ...v, dhcp: true }));
    addLog(`DHCP assigned IP: ${assignedIP}`, 'success');
  };

  // DNS Lookup + Browser
  const navigateBrowser = () => {
    if (!browserUrl) return;
    if (!servers.dns.enabled) {
      setBrowserContent({ error: true, message: 'DNS Server is not enabled. Cannot resolve domain.' });
      addLog(`DNS lookup for "${browserUrl}": FAILED (DNS disabled)`, 'error');
      return;
    }

    const record = servers.dns.records.find((r) => r.domain.toLowerCase() === browserUrl.toLowerCase());
    if (!record || !record.ip) {
      setBrowserContent({ error: true, message: `DNS Error: Cannot resolve "${browserUrl}". No matching DNS record found.` });
      addLog(`DNS lookup for "${browserUrl}": NOT FOUND`, 'error');
      return;
    }

    addLog(`DNS resolved: ${browserUrl} → ${record.ip}`, 'success');
    setValidated((v) => ({ ...v, dns: true }));

    if (!servers.http.enabled) {
      setBrowserContent({ error: true, message: `Connected to ${record.ip} but HTTP server is not running.` });
      addLog(`HTTP request to ${record.ip}: FAILED (server down)`, 'error');
      return;
    }

    setBrowserContent({
      error: false,
      title: servers.http.title || 'Untitled Page',
      body: servers.http.body || 'No content configured.',
      ip: record.ip,
    });
    setValidated((v) => ({ ...v, http: true }));
    addLog(`HTTP 200 OK from ${record.ip}: "${servers.http.title}"`, 'success');
  };

  const allValidated = validated.dhcp && validated.dns && validated.http;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Experiment 4: Network Services</h2>
            <p className="text-sm text-slate-500">Configure DHCP, DNS, and HTTP servers, then test them</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['dhcp', 'dns', 'http'].map((s) => (
            <span key={s} className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${validated[s] ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              {s} {validated[s] ? '[OK]' : '○'}
            </span>
          ))}
        </div>
      </div>

      {allValidated && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <Check size={16} /> All network services configured and tested successfully!
          <button onClick={() => onComplete && onComplete(4)} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700">
            Mark Complete [OK]
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4" style={{ minHeight: 480 }}>
        {/* DHCP Config */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">DHCP Server</h3>
            <button onClick={() => setServers((s) => ({ ...s, dhcp: { ...s.dhcp, enabled: !s.dhcp.enabled } }))} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${servers.dhcp.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {servers.dhcp.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Pool Start', field: 'poolStart', ph: '192.168.1.100' },
              { label: 'Pool End', field: 'poolEnd', ph: '192.168.1.200' },
              { label: 'Subnet Mask', field: 'subnet', ph: '255.255.255.0' },
              { label: 'Gateway', field: 'gateway', ph: '192.168.1.1' },
              { label: 'DNS Server', field: 'dns', ph: '192.168.1.50' },
            ].map((f) => (
              <div key={f.field}>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">{f.label}</label>
                <input value={servers.dhcp[f.field]} onChange={(e) => updateDHCP(f.field, e.target.value)} placeholder={f.ph} className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-mono outline-none focus:border-indigo-400" />
              </div>
            ))}
            <button onClick={requestDHCP} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 mt-2">
              Request DHCP (Client)
            </button>
            {dhcpResult && (
              <pre className={`rounded border p-2 text-[10px] font-mono whitespace-pre-wrap ${dhcpResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                {dhcpResult.message}
              </pre>
            )}
          </div>
        </div>

        {/* DNS Config */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">DNS Server</h3>
            <button onClick={() => setServers((s) => ({ ...s, dns: { ...s.dns, enabled: !s.dns.enabled } }))} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${servers.dns.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {servers.dns.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="space-y-2">
            {servers.dns.records.map((rec, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Record {i + 1}</label>
                <input value={rec.domain} onChange={(e) => updateDNSRecord(i, 'domain', e.target.value)} placeholder="e.g. www.smartlabx.com" className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-mono outline-none focus:border-indigo-400" />
                <input value={rec.ip} onChange={(e) => updateDNSRecord(i, 'ip', e.target.value)} placeholder="e.g. 192.168.1.50" className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-mono outline-none focus:border-indigo-400" />
              </div>
            ))}
            <button onClick={addDNSRecord} className="w-full rounded border border-dashed border-slate-300 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50">+ Add Record</button>
          </div>
        </div>

        {/* HTTP + Browser */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">HTTP Server</h3>
            <button onClick={() => setServers((s) => ({ ...s, http: { ...s.http, enabled: !s.http.enabled } }))} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${servers.http.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {servers.http.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="space-y-2 mb-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Page Title</label>
              <input value={servers.http.title} onChange={(e) => updateHTTP('title', e.target.value)} placeholder="My Web Page" className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Page Body</label>
              <textarea value={servers.http.body} onChange={(e) => updateHTTP('body', e.target.value)} rows={2} placeholder="Hello from SmartLabX!" className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
            </div>
          </div>

          {/* Mini Browser */}
          <div className="flex-1 rounded-xl border-2 border-indigo-200 bg-indigo-50 overflow-hidden flex flex-col">
            <div className="bg-indigo-100 px-3 py-1.5 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 flex items-center gap-1">
                <input value={browserUrl} onChange={(e) => setBrowserUrl(e.target.value)} placeholder="www.smartlabx.com" className="flex-1 rounded bg-white px-2 py-1 text-xs font-mono border border-slate-200 outline-none" />
                <button onClick={navigateBrowser} className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white">Go</button>
              </div>
            </div>
            <div className="flex-1 bg-white p-3 overflow-auto">
              {browserContent ? (
                browserContent.error ? (
                  <div className="text-xs text-red-600 font-mono">{browserContent.message}</div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{browserContent.title}</h4>
                    <p className="mt-1 text-xs text-slate-600">{browserContent.body}</p>
                    <p className="mt-2 text-[10px] text-slate-400 font-mono">Served from {browserContent.ip}</p>
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Enter a URL and click Go
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm" style={{ maxHeight: 100, overflow: 'auto' }}>
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          {log.slice(-6).reverse().map((entry, i) => (
            <span key={i} className={entry.type === 'error' ? 'text-red-600' : entry.type === 'success' ? 'text-emerald-600' : 'text-slate-500'}>
              <span className="text-slate-300">{entry.time}</span> {entry.msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
