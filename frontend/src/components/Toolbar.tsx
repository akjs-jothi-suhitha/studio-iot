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
    <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 text-slate-700 shadow-sm select-none">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-600 text-sm font-bold text-white shadow-sm">SI</div>
          <div>
            <div className="text-sm font-bold leading-none text-slate-900">Studio IoT</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Circuit Lab</div>
          </div>
        </div>

        <div className="hidden items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold md:flex">
          <button
            type="button"
            onClick={() => onChangeViewMode('circuit')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 transition ${
              viewMode === 'circuit' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CircuitBoard className="h-4 w-4" />
            Circuit
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('dashboard')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 transition ${
              viewMode === 'dashboard' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            IoT Dashboard
          </button>
        </div>

        <div className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 md:flex">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRotateSelected}
            disabled={!selectedId}
            className="rounded p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-30"
            title="Rotate (R)"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!selectedId}
            className="rounded p-1.5 text-slate-600 transition hover:bg-white hover:text-red-600 disabled:opacity-30"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onClearCanvas}
          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
          title="Clear canvas"
        >
          <Eraser className="h-4 w-4" />
        </button>

        <div className="hidden h-7 w-px bg-slate-200 sm:block" />

        <div className="hidden items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 sm:flex">
          <button
            type="button"
            onClick={() => onChangeSimulationMode('circuit')}
            disabled={isSimulating}
            title="Test the physical wiring without running Arduino code"
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition ${
              simulationMode === 'circuit' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Wiring
          </button>
          <button
            type="button"
            onClick={() => onChangeSimulationMode('code')}
            disabled={isSimulating}
            title="Run the Arduino sketch from the editor"
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition ${
              simulationMode === 'code' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Sketch
          </button>
        </div>

        {viewMode === 'circuit' && (
          <button
            type="button"
            onClick={onToggleCode}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
              isCodeOpen ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Code className="h-4 w-4" />
            Editor
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSimulation}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold shadow-sm transition ${
            isSimulating
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              Start
            </>
          )}
        </button>
      </div>
    </header>
  );
