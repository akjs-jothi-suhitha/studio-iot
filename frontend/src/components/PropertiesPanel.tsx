import React from 'react';
import { ComponentInstance, Wire } from '../types';

interface PropertiesPanelProps {
  selectedComponent: ComponentInstance | null;
  selectedWire: Wire | null;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onUpdateWire: (id: string, updates: Partial<Wire>) => void;
  onDeleteSelected: () => void;
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

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedComponent,
  selectedWire,
  onUpdateComponent,
  onUpdateWire,
  onDeleteSelected,
}) => {
  if (!selectedComponent && !selectedWire) {
    return null;
  }

  return (
    <div className="absolute right-4 top-4 z-30 w-64 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-sm font-bold text-slate-800">
          {selectedComponent ? 'Component Properties' : 'Wire Properties'}
        </h3>
        <button
          onClick={onDeleteSelected}
          className="text-xs font-semibold text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </div>

      {selectedComponent && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
            <input
              type="text"
              value={selectedComponent.name}
              onChange={(e) => onUpdateComponent(selectedComponent.id, { name: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {selectedComponent.type === 'resistor' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Resistance (Ω)</label>
              <input
                type="number"
                value={selectedComponent.value as number}
                onChange={(e) => onUpdateComponent(selectedComponent.id, { value: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}

          {selectedComponent.type === 'led' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Color</label>
              <select
                value={selectedComponent.color || '#ef4444'}
                onChange={(e) => onUpdateComponent(selectedComponent.id, { color: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="#ef4444">Red</option>
                <option value="#22c55e">Green</option>
                <option value="#3b82f6">Blue</option>
                <option value="#eab308">Yellow</option>
                <option value="#f97316">Orange</option>
                <option value="#ffffff">White</option>
              </select>
            </div>
          )}
        </div>
      )}

      {selectedWire && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {WIRE_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => onUpdateWire(selectedWire.id, { color: color.hex })}
                  className={`h-6 w-6 rounded-full border transition-transform ${
                    selectedWire.color === color.hex
                      ? 'border-slate-900 scale-110 ring-2 ring-cyan-200'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Wire Type</label>
            <select
              value={selectedWire.wireType || 'hookup'}
              onChange={(e) => onUpdateWire(selectedWire.id, { wireType: e.target.value as any })}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="hookup">Hookup Wire</option>
              <option value="alligator">Alligator Clips</option>
              <option value="retractable">Retractable</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
