import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Router, Server, Monitor, SwitchCamera } from 'lucide-react'; // Using SwitchCamera as a temporary icon for Switch

const initialNodes = [];
const initialEdges = [];

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function NetworkCanvas() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // reactFlowInstance.screenToFlowPosition gives the projected position
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: getId(),
        type: 'default',
        position,
        data: { label: `${type} Node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex h-[600px] w-full flex-col lg:flex-row gap-4">
      {/* Device Library Sidebar */}
      <div className="w-full lg:w-48 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Devices</h3>
        <div className="space-y-3">
          <div 
            className="flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700 transition hover:bg-slate-100"
            onDragStart={(e) => onDragStart(e, 'Router')}
            draggable
          >
            <Router size={18} className="text-indigo-600" />
            Router
          </div>
          <div 
            className="flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700 transition hover:bg-slate-100"
            onDragStart={(e) => onDragStart(e, 'Switch')}
            draggable
          >
            <SwitchCamera size={18} className="text-indigo-600" />
            Switch
          </div>
          <div 
            className="flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700 transition hover:bg-slate-100"
            onDragStart={(e) => onDragStart(e, 'PC')}
            draggable
          >
            <Monitor size={18} className="text-indigo-600" />
            PC
          </div>
          <div 
            className="flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700 transition hover:bg-slate-100"
            onDragStart={(e) => onDragStart(e, 'Server')}
            draggable
          >
            <Server size={18} className="text-indigo-600" />
            Server
          </div>
        </div>
        <div className="mt-6 text-xs text-slate-500">
          Drag devices onto the canvas to build your topology.
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-inner h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
