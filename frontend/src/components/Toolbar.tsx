import React from 'react';
import {
  Play,
  Square,
  Code,
  RotateCw,
  Trash2,
  Undo2,
  Redo2,
  Activity,
  Cpu,
  LayoutDashboard,
  CircuitBoard,
  Eraser,
} from 'lucide-react';

interface ToolbarProps {
  viewMode: 'circuit' | 'dashboard';
  onChangeViewMode: (mode: 'circuit' | 'dashboard') => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  simulationMode: 'circuit' | 'code';
  onChangeSimulationMode: (mode: 'circuit' | 'code') => void;
  isCodeOpen: boolean;
  onToggleCode: () => void;
  onClearCanvas: () => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  onChangeViewMode,
  isSimulating,
  onToggleSimulation,
  simulationMode,
  onChangeSimulationMode,
  isCodeOpen,
  onToggleCode,
  onClearCanvas,
  onRotateSelected,
  onDeleteSelected,
  selectedId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => (
  <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 bg-[#0f172a] px-5 text-slate-100 shadow-md select-none">
    {/* Left: Logo & Project Info */}
    <div className="flex items-center gap-6">
      <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-extrabold text-white shadow-lg">SI</div>
        <div>
          <div className="text-lg font-bold tracking-tight text-white leading-tight">StudioIOT</div>
          <div className="text-xs font-medium uppercase tracking-widest text-cyan-400">Circuit Lab</div>
        </div>
      </div>

      <div className="hidden h-8 w-px bg-slate-700 md:block" />

      {/* Main Views */}
      <div className="hidden items-center rounded-lg bg-slate-800/50 p-1 md:flex border border-slate-700/50">
        <button
          type="button"
          onClick={() => onChangeViewMode('circuit')}
          className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            viewMode === 'circuit' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CircuitBoard className="h-4 w-4" />
          Circuit
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('dashboard')}
          className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            viewMode === 'dashboard' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          IoT Dashboard
        </button>
      </div>
    </div>

    {/* Center: Action Tools (Undo, Redo, Delete) */}
    <div className="hidden items-center gap-1.5 rounded-lg bg-slate-800/50 p-1.5 md:flex border border-slate-700/50">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        title="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        title="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-slate-700" />
      <button
        type="button"
        onClick={onRotateSelected}
        disabled={!selectedId}
        className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        title="Rotate (R)"
      >
        <RotateCw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={!selectedId}
        className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-slate-700" />
      <button
        type="button"
        onClick={onClearCanvas}
        className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700 hover:text-red-400"
        title="Clear canvas"
      >
        <Eraser className="h-4 w-4" />
      </button>
    </div>

    {/* Right: Simulation & Code */}
    <div className="flex shrink-0 items-center gap-3">
      {viewMode === 'circuit' && (
        <button
          type="button"
          onClick={onToggleCode}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition shadow-sm ${
            isCodeOpen 
              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
              : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white'
          }`}
        >
          <Code className="h-4 w-4" />
          Code
        </button>
      )}

      <button
        type="button"
        onClick={onToggleSimulation}
        className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold shadow-lg transition-all ${
          isSimulating
            ? 'bg-red-500 text-white hover:bg-red-400 hover:shadow-red-500/25 ring-2 ring-red-500/50'
            : 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-emerald-500/25 ring-2 ring-emerald-500/50'
        }`}
      >
        {isSimulating ? (
          <>
            <Square className="h-4 w-4 fill-current" />
            Stop Simulation
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" />
            Start Simulation
          </>
        )}
      </button>
    </div>
  </header>
);
