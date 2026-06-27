import React, { useMemo, useState } from 'react';
import { Cable, MousePointer2 } from 'lucide-react';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
import { ComponentType } from '../types';
import { ComponentThumbnail } from './ComponentThumbnail';

export type CanvasTool = 'select' | 'wire' | 'place';

interface ComponentSidebarProps {
  onPickComponent: (type: ComponentType) => void;
  pendingComponentType: ComponentType | null;
  canvasTool: CanvasTool;
  onSetCanvasTool: (tool: CanvasTool) => void;
  isSimulating: boolean;
}

type CategoryKey = 'all' | 'boards' | 'basic' | 'sensors' | 'displays' | 'actuators' | 'power';

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: 'All',
  boards: 'Boards',
  basic: 'Basic',
  sensors: 'Sensors',
  displays: 'Displays',
  actuators: 'Output',
  power: 'Power',
};

const COMPONENT_ORDER: ComponentType[] = [
  'arduino_uno',
  'arduino_nano',
  'esp32',
  'breadboard_small',
  'led',
  'resistor',
  'push_button',
  'potentiometer',
  'buzzer',
  'gas_sensor',
  'ldr',
  'dht11',
  'ultrasonic',
  'lcd_16x2',
  'seven_segment',
  'servo',
  'dc_motor',
  'battery_9v',
  'battery_aa',
  'battery_coin',
];

export const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  onPickComponent,
  pendingComponentType,
  canvasTool,
  onSetCanvasTool,
  isSimulating,
}) => {
  const [category, setCategory] = useState<CategoryKey>('all');
  const [search, setSearch] = useState('');

  const filteredDefs = useMemo(() => {
    return Object.values(COMPONENT_DEFINITIONS)
      .filter((def) => {
        const matchesCategory = category === 'all' || def.category === category;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          def.name.toLowerCase().includes(query) ||
          def.description.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const indexA = COMPONENT_ORDER.indexOf(a.type);
        const indexB = COMPONENT_ORDER.indexOf(b.type);
        if (indexA !== indexB) {
          return indexA - indexB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [category, search]);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-white select-none shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Parts</div>
        <div className="text-sm font-bold text-white">Component Library</div>
      </div>

      {/* Tools */}
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tools</div>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => onSetCanvasTool('select')}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition ${
              canvasTool === 'select' && !pendingComponentType
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            Select
          </button>
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => onSetCanvasTool('wire')}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition ${
              canvasTool === 'wire'
                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Cable className="h-3.5 w-3.5" />
            Wire
          </button>
        </div>
        {canvasTool === 'wire' && !isSimulating && (
          <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] leading-snug text-amber-700">
            Click a pin, then another pin to connect.
          </p>
        )}
      </div>

      {/* Search + Category Filter */}
      <div className="border-b border-slate-100 bg-white px-3 py-2">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                category === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-0 overflow-y-auto bg-white content-start">
        {filteredDefs.map((def) => {
          const isPending = pendingComponentType === def.type;
          return (
            <button
              key={def.type}
              type="button"
              draggable={!isSimulating && canvasTool !== 'wire'}
              onClick={() => {
                if (isSimulating) return;
                onSetCanvasTool('place');
                onPickComponent(def.type);
              }}
              onDragStart={(e) => {
                if (canvasTool === 'wire') {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData('application/json', JSON.stringify({ type: def.type }));
              }}
              disabled={isSimulating}
              className={`flex w-full flex-col items-center gap-1 border-b border-r border-slate-100 px-2 py-2.5 text-center transition ${
                isPending
                  ? 'bg-amber-50 ring-1 ring-inset ring-amber-400'
                  : 'hover:bg-indigo-50'
              } ${isSimulating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border shadow-sm transition ${
                isPending ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
              }`}>
                <ComponentThumbnail type={def.type} size={38} />
              </div>
              <div className="w-full truncate text-[10px] font-semibold text-slate-600">{def.name}</div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] text-slate-400">
        {isSimulating
          ? '🔴 Simulation running'
          : canvasTool === 'wire'
            ? '⚡ Wire mode: click two pins'
            : '↖ Select • ⚡ Wire'}
      </div>
    </aside>
  );
};
