import React from 'react';
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  Undo2,
  Redo2,
  LayoutDashboard,
  CircuitBoard,
  Eraser,
  Code2,
  FolderOpen,
  Save,
  Upload,
} from 'lucide-react';
import { ViewMode } from '../types';

interface ToolbarProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onClearCanvas: () => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  projectName: string;
  onBackToProjects: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onManualSave: () => void;
  onUploadToBoard: () => void;
  canUpload: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  onChangeViewMode,
  isSimulating,
  onToggleSimulation,
  onClearCanvas,
  onRotateSelected,
  onDeleteSelected,
  selectedId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  projectName,
  onBackToProjects,
  saveStatus,
  onManualSave,
  onUploadToBoard,
  canUpload,
}) => (
  <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 bg-[#0f172a] px-4 text-slate-100 shadow-md select-none">
    <div className="flex min-w-0 items-center gap-4">
      <button
        type="button"
        onClick={onBackToProjects}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-white"
      >
        <FolderOpen className="h-4 w-4" />
        Projects
      </button>

      <div className="hidden h-8 w-px bg-slate-700 sm:block" />

      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-white">{projectName}</div>
        <div className="text-[10px] text-slate-500">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'All changes saved'}
          {saveStatus === 'unsaved' && 'Unsaved changes'}
        </div>
      </div>

      <div className="hidden items-center rounded-lg bg-slate-800/50 p-1 md:flex border border-slate-700/50">
        <button
          type="button"
          onClick={() => onChangeViewMode('circuit')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === 'circuit' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CircuitBoard className="h-3.5 w-3.5" />
          Circuit
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('arduino')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === 'arduino' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          Arduino IDE
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('dashboard')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === 'dashboard' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          IoT Dashboard
        </button>
      </div>
    </div>

    {viewMode === 'circuit' && (
      <div className="hidden items-center gap-1 rounded-lg bg-slate-800/50 p-1 md:flex border border-slate-700/50">
        <button type="button" onClick={onUndo} disabled={!canUndo || isSimulating} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30" title="Undo">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo || isSimulating} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30" title="Redo">
          <Redo2 className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-slate-700" />
        <button type="button" onClick={onRotateSelected} disabled={!selectedId || isSimulating} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-30" title="Rotate">
          <RotateCw className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDeleteSelected} disabled={!selectedId || isSimulating} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400 disabled:opacity-30" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-slate-700" />
        <button type="button" onClick={onClearCanvas} disabled={isSimulating} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400 disabled:opacity-30" title="Clear">
          <Eraser className="h-4 w-4" />
        </button>
      </div>
    )}

    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onManualSave}
        disabled={saveStatus === 'saving'}
        className="hidden items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 sm:flex"
      >
        <Save className="h-3.5 w-3.5" />
        Save
      </button>

      {viewMode === 'arduino' && (
        <button
          type="button"
          onClick={onUploadToBoard}
          disabled={!canUpload || isSimulating}
          className="flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-600/10 px-3 py-1.5 text-xs font-bold text-teal-400 disabled:opacity-40"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
      )}

      <button
        type="button"
        onClick={onToggleSimulation}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-lg transition-all ${
          isSimulating
            ? 'bg-red-500 text-white hover:bg-red-400 ring-2 ring-red-500/50'
            : 'bg-emerald-500 text-white hover:bg-emerald-400 ring-2 ring-emerald-500/50'
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
            Simulate
          </>
        )}
      </button>
    </div>
  </header>
);
