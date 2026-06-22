import React, { useMemo, useState } from 'react';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
import { ComponentType } from '../types';

interface ComponentSidebarProps {
  onPickComponent: (type: ComponentType) => void;
  pendingComponentType: ComponentType | null;
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
        <div className="text-sm font-semibold text-slate-800">Component library</div>
      </div>

      <div className="border-b border-[#aeb4bc] px-3 py-2.5">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-sky-500"
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
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        {filteredDefs.map((def) => {
          const isPending = pendingComponentType === def.type;
          return (
            <button
              key={def.type}
              type="button"
              onClick={() => onPickComponent(def.type)}
              disabled={isSimulating}
              className={`flex w-full items-center gap-2 border-b border-slate-100 px-2.5 py-2 text-left transition ${
                isPending ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : 'hover:bg-slate-50'
              } ${isSimulating ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg">
                {COMPONENT_ICONS[def.type] || '📦'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-800">{def.name}</div>
                <div className="truncate text-[10px] text-slate-500">{def.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#aeb4bc] bg-[#dfe3e8] px-3 py-2 text-[10px] text-slate-600">
        {isSimulating
          ? 'Stop simulation to edit the circuit.'
          : pendingComponentType
            ? 'Click workplane to place • Esc to cancel'
            : 'Select a part, then click the workplane'}
      </div>
    </aside>
  );
};
