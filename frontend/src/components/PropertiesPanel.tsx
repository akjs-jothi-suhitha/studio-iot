import React from 'react';
import { ComponentInstance, Wire } from '../types';
import { WIRE_COLORS } from '../utils/wireUtils';

interface PropertiesPanelProps {
  selectedComponent: ComponentInstance | null;
  selectedWire: Wire | null;
  wireMode?: boolean;
  activeWireColor?: string;
  onChangeWireColor?: (color: string, manual?: boolean) => void;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onUpdateWire: (id: string, updates: Partial<Wire>) => void;
  onDeleteSelected: () => void;
  isSimulating?: boolean;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedComponent,
  selectedWire,
  wireMode = false,
  activeWireColor = '#3b82f6',
  onChangeWireColor,
  onUpdateComponent,
  onUpdateWire,
  onDeleteSelected,
  isSimulating = false,
}) => {
  const showWirePanel = wireMode || Boolean(selectedWire);
  if (!selectedComponent && !showWirePanel) {
    return null;
  }

  const showComponentPanel = Boolean(selectedComponent) && !wireMode;

  const wireColorTarget = selectedWire?.color ?? activeWireColor;

  const handleWireColorPick = (hex: string) => {
    onChangeWireColor?.(hex, true);
    if (selectedWire) {
      onUpdateWire(selectedWire.id, { color: hex });
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 w-72 rounded-xl border border-[#323844] bg-[#15181e] shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-[#272c36] px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {showComponentPanel ? 'Component' : selectedWire ? 'Wire' : 'Wire tool'}
        </h3>
        {(showComponentPanel || selectedWire) && (
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={isSimulating}
            className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        {showComponentPanel && selectedComponent && (
          <>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Name</label>
              <input
                type="text"
                value={selectedComponent.name}
                disabled={isSimulating}
                onChange={(e) => onUpdateComponent(selectedComponent.id, { name: e.target.value })}
                className="w-full rounded-md border border-[#323844] px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 disabled:bg-[#1e222a]"
              />
            </div>

            <div className="rounded-md bg-[#1e222a] px-2.5 py-1.5 text-[10px] text-slate-500 capitalize">
              {selectedComponent.type.replace(/_/g, ' ')}
            </div>

            {selectedComponent.type === 'resistor' && (
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Resistance (Ω)</label>
                <input
                  type="number"
                  value={selectedComponent.value as number}
                  disabled={isSimulating}
                  onChange={(e) => onUpdateComponent(selectedComponent.id, { value: Number(e.target.value) })}
                  className="w-full rounded-md border border-[#323844] px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 disabled:bg-[#1e222a]"
                />
              </div>
            )}

            {selectedComponent.type === 'led' && (
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Color</label>
                <select
                  value={selectedComponent.color || '#ef4444'}
                  disabled={isSimulating}
                  onChange={(e) => onUpdateComponent(selectedComponent.id, { color: e.target.value })}
                  className="w-full rounded-md border border-[#323844] px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 disabled:bg-[#1e222a]"
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
          </>
        )}

        {showWirePanel && (
          <>
            {wireMode && !selectedWire && (
              <p className="text-[10px] leading-snug text-slate-500">
                Pick a wire color, then click two pins to connect. Select an existing wire to edit it.
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase text-slate-500">Wire Color</label>
              <div className="flex flex-wrap gap-2">
                {WIRE_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    disabled={isSimulating}
                    onClick={() => handleWireColorPick(color.hex)}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      wireColorTarget === color.hex
                        ? 'border-slate-800 ring-2 ring-cyan-200 scale-110'
                        : 'border-[#323844] hover:scale-105'
                    } disabled:opacity-40`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {selectedWire && (
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Wire Type</label>
                <select
                  value={selectedWire.wireType || 'hookup'}
                  disabled={isSimulating}
                  onChange={(e) => onUpdateWire(selectedWire.id, { wireType: e.target.value as Wire['wireType'] })}
                  className="w-full rounded-md border border-[#323844] px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 disabled:bg-[#1e222a]"
                >
                  <option value="hookup">Hookup Wire</option>
                  <option value="alligator">Alligator Clips</option>
                  <option value="retractable">Retractable</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
