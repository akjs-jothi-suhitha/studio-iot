import React, { useEffect, useRef, useState } from 'react';
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
  Pencil,
  Check,
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
  onProjectNameChange: (name: string) => void;
  onBackToProjects: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onManualSave: () => void;
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
  onProjectNameChange,
  onBackToProjects,
  saveStatus,
  onManualSave,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(projectName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingName) setDraftName(projectName);
  }, [projectName, editingName]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const commitName = () => {
    const trimmed = draftName.trim() || 'Untitled Project';
    onProjectNameChange(trimmed);
    setDraftName(trimmed);
    setEditingName(false);
  };

  return (
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
        {editingName ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={nameInputRef}
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') {
                  setDraftName(projectName);
                  setEditingName(false);
                }
              }}
              className="w-40 rounded-md border border-cyan-500 bg-slate-900 px-2 py-1 text-sm font-bold text-white outline-none sm:w-52"
            />
            <button type="button" onClick={commitName} className="rounded p-1 text-emerald-400 hover:bg-slate-800" title="Save name">
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="group flex max-w-full items-center gap-1.5 text-left"
            title="Click to rename project"
          >
            <span className="truncate text-sm font-bold text-white">{projectName}</span>
            <Pencil className="h-3 w-3 shrink-0 text-slate-500 opacity-0 transition group-hover:opacity-100" />
          </button>
        )}
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
};
