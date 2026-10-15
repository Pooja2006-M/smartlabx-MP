import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Monitor, Server, Router as RouterIcon, Wifi, HardDrive } from 'lucide-react';

const deviceConfig = {
  PC: {
    icon: Monitor,
    color: 'from-blue-400 to-blue-600',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
  },
  Router: {
    icon: RouterIcon,
    color: 'from-indigo-400 to-indigo-600',
    borderColor: 'border-indigo-300',
    bgColor: 'bg-indigo-50',
  },
  Switch: {
    icon: HardDrive,
    color: 'from-emerald-400 to-emerald-600',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50',
  },
  Hub: {
    icon: Wifi,
    color: 'from-amber-400 to-amber-600',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
  },
  Server: {
    icon: Server,
    color: 'from-purple-400 to-purple-600',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
  },
};

const handleCommon = {
  width: 14,
  height: 14,
  background: '#6366f1',
  border: '3px solid white',
  borderRadius: '50%',
  cursor: 'crosshair',
  zIndex: 10,
};

export default function CustomDeviceNode({ data, selected }) {
  const config = deviceConfig[data.deviceType] || deviceConfig.PC;
  const Icon = config.icon;

  return (
    <div className={`relative flex flex-col items-center ${selected ? 'scale-110' : ''}`} style={{ minWidth: 90, transition: 'transform 0.2s' }}>
      
      {/* 4 source handles — connectionMode="loose" lets them act as both source AND target */}
      <Handle type="source" position={Position.Top}    id="top"    style={handleCommon} />
      <Handle type="source" position={Position.Right}  id="right"  style={handleCommon} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleCommon} />
      <Handle type="source" position={Position.Left}   id="left"   style={handleCommon} />

      {/* Device body */}
      <div
        className={`flex flex-col items-center rounded-xl border-2 ${selected ? 'border-indigo-500 shadow-lg shadow-indigo-200' : config.borderColor} ${config.bgColor} p-3 hover:shadow-md cursor-pointer`}
        style={{ minWidth: 80, transition: 'box-shadow 0.2s' }}
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${config.color} text-white shadow-sm`}>
          <Icon size={20} />
        </div>
        <span className="mt-1.5 text-xs font-bold text-slate-800">{data.label}</span>
        {data.ip && <span className="mt-0.5 text-[10px] font-mono text-slate-500">{data.ip}</span>}
        <span className={`mt-1 h-2 w-2 rounded-full ${data.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      </div>
    </div>
  );
}
