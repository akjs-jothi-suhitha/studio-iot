import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Code, RotateCw, Trash2, Undo2, Redo2, Activity, Cpu } from 'lucide-react';

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
  { name: 'Red', hex: '#ef4444' },
  { name: 'Black', hex: '#1f2937' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'White', hex: '#f8fafc' },
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
  const [isColorOpen, setIsColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const activeColor = WIRE_COLORS.find((color) => color.hex === activeWireColor) || WIRE_COLORS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setIsColorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#aeb4bc] bg-[#0097a7] px-3 text-white select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">SI</div>
          <div>
            <div className="text-sm font-bold leading-none">Studio IoT</div>
            <div className="text-[10px] uppercase tracking-wider text-white/75">Circuit Simulator</div>
          </div>
        </div>

        <div className="ml-2 hidden h-6 w-px bg-white/25 md:block" />

        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded p-1.5 transition hover:bg-white/10 disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded p-1.5 transition hover:bg-white/10 disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRotateSelected}
            disabled={!selectedId}
            className="rounded p-1.5 transition hover:bg-white/10 disabled:opacity-30"
            title="Rotate (R)"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!selectedId}
            className="rounded p-1.5 transition hover:bg-white/10 disabled:opacity-30"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            onClick={() => setIsColorOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-white/15"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-white/40"
              style={{ backgroundColor: activeColor.hex }}
            />
            Wire
          </button>
          {isColorOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 grid w-36 grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
              {WIRE_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => {
                    onChangeWireColor(color.hex);
                    setIsColorOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 transition hover:scale-105"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClearCanvas}
          className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-white/15"
        >
          Clear
        </button>

        <div className="hidden h-6 w-px bg-white/25 sm:block" />

        <div className="hidden items-center rounded-lg bg-white/10 p-0.5 sm:flex">
          <button
            type="button"
            onClick={() => onChangeSimulationMode('circuit')}
            disabled={isSimulating}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
              simulationMode === 'circuit' ? 'bg-white text-[#00788a]' : 'text-white/85'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Circuit
          </button>
          <button
            type="button"
            onClick={() => onChangeSimulationMode('code')}
            disabled={isSimulating}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
              simulationMode === 'code' ? 'bg-white text-[#00788a]' : 'text-white/85'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Code
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCode}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            isCodeOpen ? 'bg-white text-[#00788a]' : 'bg-white/10 hover:bg-white/15'
          }`}
        >
          <Code className="h-4 w-4" />
          Code
        </button>

        <button
          type="button"
          onClick={onToggleSimulation}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow transition ${
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
};
