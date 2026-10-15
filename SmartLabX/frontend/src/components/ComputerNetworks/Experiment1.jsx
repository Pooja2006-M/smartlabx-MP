import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Monitor, Server, Router as RouterIcon, HardDrive, Wifi, Play, RotateCcw, Check, X, Zap, ArrowLeft } from 'lucide-react';
import CustomDeviceNode from './CustomDeviceNode';

let nodeId = 0;
const getId = () => `device_${nodeId++}`;

const deviceLibrary = [
  { type: 'PC', label: 'PC', icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { type: 'Router', label: 'Router', icon: RouterIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  { type: 'Switch', label: 'Switch', icon: HardDrive, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { type: 'Hub', label: 'Hub', icon: Wifi, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { type: 'Server', label: 'Server', icon: Server, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
];

const nodeTypes = { customDevice: CustomDeviceNode };

export default function Experiment1({ onBack, onComplete }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [animatingEdges, setAnimatingEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (msg, type = 'info') => {
    setLog((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => {
      const edge = {
        ...params,
        type: 'default',
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        animated: false,
      };
      setEdges((eds) => addEdge(edge, eds));
      addLog(`Cable connected: ${params.source} → ${params.target}`, 'success');
    },
    []
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const deviceType = event.dataTransfer.getData('application/reactflow') || event.dataTransfer.getData('text/plain');
      if (!deviceType) return;

      const position = reactFlowInstance
        ? reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
        : (() => {
            const bounds = reactFlowWrapper.current?.getBoundingClientRect();
            return {
              x: event.clientX - (bounds?.left || 0),
              y: event.clientY - (bounds?.top || 0),
            };
          })();

      const id = getId();
      const newNode = {
        id,
        type: 'customDevice',
        position,
        data: { label: `${deviceType}-${id.split('_')[1]}`, deviceType, status: 'up' },
      };

      setNodes((nds) => nds.concat(newNode));
      addLog(`Added ${deviceType} at (${Math.round(position.x)}, ${Math.round(position.y)})`, 'info');
    },
    [reactFlowInstance]
  );

  const onDragStart = (event, deviceType) => {
    event.dataTransfer.setData('application/reactflow', deviceType);
    event.dataTransfer.setData('text/plain', deviceType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCanvasDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  };

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  // ─── Topology Validation ───
  const validateTopology = () => {
    if (nodes.length < 2) return { valid: false, error: 'Place at least 2 devices on the canvas.' };
    if (edges.length < 1) return { valid: false, error: 'Connect at least 2 devices with a cable.' };

    // Check for isolated nodes
    const connectedIds = new Set();
    edges.forEach((e) => {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    });
    const isolated = nodes.filter((n) => !connectedIds.has(n.id));
    if (isolated.length > 0) {
      return { valid: false, error: `Device "${isolated[0].data.label}" is not connected to any cable.` };
    }

    return { valid: true };
  };

  // ─── Packet Animation ───
  const runSimulation = async () => {
    setSimResult(null);
    setAnimatingEdges([]);
    const validation = validateTopology();

    if (!validation.valid) {
      setSimResult({ success: false, message: validation.error });
      addLog(`Validation failed: ${validation.error}`, 'error');
      return;
    }

    setSimulating(true);
    addLog('Starting packet simulation...', 'info');

    // Animate each edge sequentially
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      setAnimatingEdges([edge.id]);

      // Animate the edge
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edge.id
            ? { ...e, animated: true, style: { ...e.style, stroke: '#22c55e', strokeWidth: 3.5 } }
            : e
        )
      );

      addLog(`Packet traveling: ${edge.source} → ${edge.target}`, 'success');
      await new Promise((r) => setTimeout(r, 1200));

      // Return edge to normal after animation
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edge.id
            ? { ...e, animated: false, style: { ...e.style, stroke: '#6366f1', strokeWidth: 2.5 } }
            : e
        )
      );
    }

    setAnimatingEdges([]);
    setSimulating(false);
    setSimResult({ success: true, message: `Simulation complete! ${edges.length} packets transmitted across ${nodes.length} devices.` });
    addLog(`Simulation complete! ${edges.length} connections validated.`, 'success');
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSimResult(null);
    setSelectedNode(null);
    setLog([]);
    nodeId = 0;
    addLog('Canvas cleared', 'info');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Experiment 1: Network Topology Design</h2>
            <p className="text-sm text-slate-500">Drag devices → Connect cables → Run simulation → Observe packets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition"
          >
            <RotateCcw size={15} /> Clear
          </button>
          <button
            onClick={runSimulation}
            disabled={simulating}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition ${simulating ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {simulating ? (
              <><Zap size={15} className="animate-pulse" /> Simulating...</>
            ) : (
              <><Play size={15} /> Run Simulation</>
            )}
          </button>
        </div>
      </div>

      {/* Result Banner */}
      {simResult && (
        <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${simResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {simResult.success ? <Check size={16} /> : <X size={16} />}
          {simResult.message}
          {simResult.success && (
            <button onClick={() => onComplete && onComplete(1)} className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700">
              Mark Complete [OK]
            </button>
          )}
        </div>
      )}

      {/* Main workspace */}
      <div className="flex gap-4" style={{ height: 540 }}>
        {/* Device Library */}
        <div className="w-44 shrink-0 space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Device Library</h3>
          {deviceLibrary.map((d) => (
            <div
              key={d.type}
              className={`flex cursor-grab items-center gap-2.5 rounded-xl border p-2.5 text-sm font-semibold transition hover:shadow-sm active:cursor-grabbing ${d.bg}`}
              onDragStart={(e) => onDragStart(e, d.type)}
              draggable
            >
              <d.icon size={18} className={d.color} />
              <span className="text-slate-700">{d.label}</span>
            </div>
          ))}
          <hr className="my-3 border-slate-100" />
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-500 mb-1">How to use:</p>
            <p>1. Drag a device to the canvas</p>
            <p>2. Connect handles with cables</p>
            <p>3. Click "Run Simulation"</p>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-inner"
          ref={reactFlowWrapper}
          onDragOver={handleCanvasDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode="loose"
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              style: { stroke: '#6366f1', strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            }}
          >
            <Background color="#e2e8f0" gap={20} size={1} />
            <Controls position="bottom-left" />
            <MiniMap
              nodeStrokeColor="#6366f1"
              nodeColor="#e0e7ff"
              maskColor="rgba(255,255,255,0.7)"
              className="!rounded-xl !border !border-slate-200"
            />
          </ReactFlow>
        </div>

        {/* Right panel: Properties + Log */}
        <div className="w-56 shrink-0 flex flex-col gap-3">
          {/* Properties */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Properties</h3>
            {selectedNode ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-800">{selectedNode.data.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-semibold text-slate-800">{selectedNode.data.deviceType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status:</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Position:</span>
                  <span className="font-mono text-xs text-slate-600">
                    ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
                  </span>
                </div>
                <hr className="border-slate-100" />
                <p className="text-xs text-slate-400">Click and drag handles (circles) to connect cables between devices.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click a device on the canvas to view its properties.</p>
            )}
          </div>

          {/* Activity Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" style={{ maxHeight: 200, overflow: 'auto' }}>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activity Log</h3>
            {log.length === 0 ? (
              <p className="text-xs text-slate-400">No activity yet. Start building your topology!</p>
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

      {/* Stats bar */}
      <div className="flex items-center gap-6 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-indigo-600">{nodes.length}</span> Devices
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-indigo-600">{edges.length}</span> Cables
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-indigo-600">{nodes.filter(n => n.data.deviceType === 'PC').length}</span> PCs
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-indigo-600">{nodes.filter(n => n.data.deviceType === 'Router').length}</span> Routers
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-indigo-600">{nodes.filter(n => n.data.deviceType === 'Switch').length}</span> Switches
        </div>
      </div>
    </div>
  );
}
