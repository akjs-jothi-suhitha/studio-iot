import React, { useState } from 'react';
import { Play, Square, Code, RotateCw, Trash2, ChevronLeft, ChevronRight, Activity, Cpu } from 'lucide-react';

interface ToolbarProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  simulationMode: 'circuit' | 'code';
  onChangeSimulationMode: (mode: 'circuit' | 'code') => void;
  isCodeOpen: boolean;
  onToggleCode: () => void;
  activeWireColor: string;
  onChangeWireColor: (color: string) => void;
  onClearCanvas: () => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const WIRE_COLORS = [
  { name: 'Black', hex: '#1f2937' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Turquoise', hex: '#06b6d4' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'Grey', hex: '#64748b' },
  { name: 'White', hex: '#ffffff' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  isSimulating,
  onToggleSimulation,
  simulationMode,
  onChangeSimulationMode,
  isCodeOpen,
  onToggleCode,
  activeWireColor,
  onChangeWireColor,
  onClearCanvas,
  onRotateSelected,
  onDeleteSelected,
  selectedId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const activeColorObj = WIRE_COLORS.find(c => c.hex === activeWireColor) || WIRE_COLORS[1];

  return (
    <div className="flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 shadow-sm select-none">
      
      {/* 1. Left Section - Branding & Logo */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-100">
          S
        </div>
        <div>
          <span className="font-extrabold text-slate-800 tracking-tight text-base">Smart IOT</span>
          <span className="text-[10px] text-blue-600 block -mt-1 font-semibold tracking-wider uppercase">Simulator</span>
        </div>
      </div>

      {/* 2. Middle Section - Edit Controls & Colors */}
      <div className="flex items-center space-x-2">
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition"
          title="Undo"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition"
          title="Redo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-2" />

        {/* Selected Component Operations */}
        <button
          onClick={onRotateSelected}
          disabled={!selectedId}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition"
          title="Rotate (R)"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={!selectedId}
          className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition"
          title="Delete (Del)"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-2" />

        {/* Wire Color Selection Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 transition text-sm text-slate-700 font-medium"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm"
              style={{ backgroundColor: activeColorObj.hex }}
            />
            <span>{activeColorObj.name}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {isColorDropdownOpen && (
            <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 grid grid-cols-1 max-h-60 overflow-y-auto">
              {WIRE_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => {
                    onChangeWireColor(color.hex);
                    setIsColorDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-left text-xs text-slate-700 font-medium transition"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Button */}
        <button
          onClick={onClearCanvas}
          className="px-3 py-1.5 rounded border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition text-sm text-slate-600 font-medium"
        >
          Clear
        </button>
      </div>

      {/* 3. Right Section - Execution Controls */}
      <div className="flex items-center space-x-3">
        {/* Sim Status Label */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {isSimulating ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600">Simulating</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Idle</span>
            </>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button
            onClick={() => onChangeSimulationMode('circuit')}
            className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              simulationMode === 'circuit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            disabled={isSimulating}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Circuit Mode</span>
          </button>
          <button
            onClick={() => onChangeSimulationMode('code')}
            className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              simulationMode === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            disabled={isSimulating}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Code Mode</span>
          </button>
        </div>

        {/* Code Button */}
        <button
          onClick={onToggleCode}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded border text-sm font-semibold transition ${
            isCodeOpen
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Code</span>
        </button>

        {/* Start / Stop Simulation */}
        <button
          onClick={onToggleSimulation}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold shadow transition ${
            isSimulating
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Simulation</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Start Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
