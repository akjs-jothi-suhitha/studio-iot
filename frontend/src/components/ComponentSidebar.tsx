import React, { useMemo, useState } from 'react';
import { Cable, MousePointer2 } from 'lucide-react';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
import { ComponentType } from '../types';

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
  'esp8266',
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

const COMPONENT_ICONS: Partial<Record<ComponentType, string>> = {
  arduino_uno: '🔵',
  arduino_nano: '🟢',
  esp32: '📡',
  esp8266: '📶',
  breadboard_small: '⬜',
  led: '💡',
  resistor: '〰️',
  push_button: '🔘',
  potentiometer: '🎚️',
  buzzer: '🔊',
  gas_sensor: '☁️',
  ldr: '☀️',
  dht11: '🌡️',
  ultrasonic: '📡',
  lcd_16x2: '🖥️',
  seven_segment: '8️⃣',
  servo: '⚙️',
  dc_motor: '🌀',
  battery_9v: '🔋',
  battery_aa: '🔋',
  battery_coin: '🔋',
};

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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[#aeb4bc] bg-[#eef1f4] select-none">
      <div className="border-b border-[#aeb4bc] bg-[#dfe3e8] px-3 py-2.5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Parts</div>
        <div className="text-sm font-semibold text-slate-100">Component library</div>
      </div>

      <div className="border-b border-[#aeb4bc] bg-[#15181e] px-3 py-2.5">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tools</div>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => onSetCanvasTool('select')}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-[10px] font-semibold transition ${
              canvasTool === 'select' && !pendingComponentType
                ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                : 'border-[#323844] bg-[#1e222a] text-slate-300 hover:border-[#3f4755]'
            }`}
          >
            <MousePointer2 className="h-4 w-4" />
            Select
          </button>
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => onSetCanvasTool('wire')}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-[10px] font-semibold transition ${
              canvasTool === 'wire'
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-[#323844] bg-[#1e222a] text-slate-300 hover:border-[#3f4755]'
            }`}
          >
            <Cable className="h-4 w-4" />
            Wire
          </button>
        </div>
        {canvasTool === 'wire' && !isSimulating && (
          <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] leading-snug text-amber-900">
            Click a pin, then click another pin to connect. Wire color options appear in the panel below the workplane.
          </p>
        )}
      </div>

      <div className="border-b border-[#aeb4bc] px-3 py-2.5">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-[#3f4755] bg-[#15181e] px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                category === key
                  ? 'bg-[#0097a7] text-white'
                  : 'bg-[#15181e] text-slate-300 hover:bg-[#272c36]'
              }`}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-0 overflow-y-auto bg-[#15181e] content-start">
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
              className={`flex w-full flex-col items-center gap-1 border-b border-[#272c36] px-2 py-2.5 text-center transition ${
                isPending ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : 'hover:bg-[#1e222a]'
              } ${isSimulating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#323844] bg-[#1e222a] text-xl">
                {COMPONENT_ICONS[def.type] || '📦'}
              </div>
              <div className="w-full truncate text-[10px] font-semibold text-slate-200">{def.name}</div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#aeb4bc] bg-[#dfe3e8] px-3 py-2 text-[10px] text-slate-300">
        {isSimulating
          ? 'Simulation running — adjust sensors on the right panel.'
          : canvasTool === 'wire'
            ? 'Wire mode: click pins to connect (not components).'
            : 'Select tool to move parts · Wire tool to connect pins'}
      </div>
    </aside>
  );
};
