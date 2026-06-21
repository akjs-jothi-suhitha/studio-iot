import React, { useState } from 'react';
import { COMPONENT_DEFINITIONS, ComponentDef } from '../utils/componentDefinitions';
import { ComponentType } from '../types';

interface ComponentSidebarProps {
  onAddComponent: (type: ComponentType) => void;
  isSimulating: boolean;
}

export const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  onAddComponent,
  isSimulating,
}) => {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const COMPONENT_ORDER = [
    'arduino_uno',
    'breadboard_small',
    'led',
    'resistor',
    'push_button',
    'lcd_16x2',
    'buzzer',
    'dht11',
    'servo'
  ];

  // Filter definitions based on search and category
  const filteredDefs = Object.values(COMPONENT_DEFINITIONS).filter((def) => {
    const matchesCategory = category === 'all' || def.category === category;
    const matchesSearch = def.name.toLowerCase().includes(search.toLowerCase()) || 
                          def.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    let indexA = COMPONENT_ORDER.indexOf(a.type);
    let indexB = COMPONENT_ORDER.indexOf(b.type);
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    if (indexA !== indexB) return indexA - indexB;
    return a.name.localeCompare(b.name);
  });

  // Render a mini preview icon for each component type
  const renderMiniIcon = (type: ComponentType) => {
    switch (type) {
      case 'arduino_uno':
        return (
          <svg width="45" height="35" viewBox="0 0 240 160">
            <rect width="240" height="160" rx="8" fill="#1e3a8a" />
            <rect x="0" y="20" width="30" height="30" fill="#9ca3af" />
            <rect x="50" y="5" width="170" height="10" fill="#111827" />
            <rect x="62" y="145" width="130" height="10" fill="#111827" />
            <rect x="140" y="70" width="80" height="22" rx="2" fill="#1f2937" />
          </svg>
        );
      case 'breadboard_small':
        return (
          <svg width="45" height="35" viewBox="0 0 320 160">
            <rect width="320" height="160" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="10" y="75" width="300" height="10" fill="#cbd5e1" />
            <line x1="20" y1="15" x2="300" y2="15" stroke="#ef4444" strokeWidth="2" />
            <line x1="20" y1="145" x2="300" y2="145" stroke="#3b82f6" strokeWidth="2" />
          </svg>
        );
      case 'resistor':
        return (
          <svg width="45" height="35" viewBox="0 0 80 20">
            <line x1="0" y1="10" x2="25" y2="10" stroke="#94a3b8" strokeWidth="3" />
            <line x1="55" y1="10" x2="80" y2="10" stroke="#94a3b8" strokeWidth="3" />
            <rect x="23" y="3" width="34" height="14" rx="4" fill="#fef08a" stroke="#eab308" strokeWidth="1.5" />
            <rect x="29" y="3" width="3" height="14" fill="#ef4444" />
            <rect x="35" y="3" width="3" height="14" fill="#ef4444" />
            <rect x="41" y="3" width="3" height="14" fill="#78350f" />
          </svg>
        );
      case 'led':
        return (
          <svg width="45" height="35" viewBox="0 0 30 40">
            <line x1="10" y1="20" x2="10" y2="35" stroke="#94a3b8" strokeWidth="3" />
            <path d="M 20 20 L 20 25 L 24 30 L 20 35" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <path d="M 5 18 L 5 10 A 10 10 0 0 1 25 10 L 25 18 Z" fill="#ef4444" />
          </svg>
        );
      case 'push_button':
        return (
          <svg width="45" height="35" viewBox="0 0 30 30">
            <rect x="5" y="5" width="20" height="20" rx="3" fill="#1e293b" />
            <circle cx="15" cy="15" r="7" fill="#64748b" />
            <circle cx="15" cy="15" r="5" fill="#3b82f6" />
          </svg>
        );
      case 'buzzer':
        return (
          <svg width="45" height="35" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="23" fill="#1f2937" />
            <circle cx="25" cy="25" r="14" fill="#111827" />
            <circle cx="25" cy="25" r="4" fill="#b45309" />
          </svg>
        );
      case 'lcd_16x2':
        return (
          <svg width="45" height="35" viewBox="0 0 180 80">
            <rect width="180" height="80" rx="4" fill="#065f46" />
            <rect x="15" y="15" width="150" height="50" fill="#334155" />
            <rect x="20" y="20" width="140" height="40" fill="#1e3a8a" />
          </svg>
        );
      case 'gas_sensor':
        return (
          <svg width="45" height="35" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="23" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="30" cy="30" r="16" fill="#475569" />
          </svg>
        );
      case 'ldr':
        return (
          <svg width="45" height="35" viewBox="0 0 30 15">
            <rect x="2" y="2" width="26" height="10" rx="2" fill="#e2e8f0" />
            <rect x="3" y="3" width="24" height="8" rx="1" fill="#ea580c" />
            <path d="M 6 5 L 10 5 L 10 9 L 14 9 L 14 5 L 18 5 L 18 9 L 22 9" fill="none" stroke="#fef08a" strokeWidth="1" />
          </svg>
        );
      case 'potentiometer':
        return (
          <svg width="45" height="35" viewBox="0 0 40 45">
            <circle cx="20" cy="18" r="18" fill="#3b82f6" />
            <circle cx="20" cy="18" r="12" fill="#cbd5e1" />
            <circle cx="20" cy="18" r="8" fill="#475569" />
            <line x1="20" y1="18" x2="20" y2="10" stroke="#ffffff" strokeWidth="2.5" />
          </svg>
        );
      case 'dc_motor':
        return (
          <svg width="45" height="35" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="#94a3b8" />
            <circle cx="30" cy="30" r="6" fill="#cbd5e1" />
            <circle cx="30" cy="30" r="3" fill="#f59e0b" />
            <line x1="30" y1="30" x2="30" y2="10" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="30" y1="30" x2="30" y2="50" stroke="#dc2626" strokeWidth="2.5" />
          </svg>
        );
      case 'servo':
        return (
          <svg width="45" height="35" viewBox="0 0 60 50">
            <rect y="8" width="60" height="28" rx="2" fill="#1e40af" />
            <circle cx="45" cy="22" r="8" fill="#1e3a8a" />
            <circle cx="45" cy="22" r="4" fill="#f1f5f9" />
            <line x1="45" y1="22" x2="20" y2="22" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'battery_9v':
        return (
          <svg width="45" height="35" viewBox="0 0 60 90">
            <rect width="60" height="90" rx="6" fill="#111827" />
            <circle cx="18" cy="15" r="8" fill="#94a3b8" />
            <polygon points="42,7 48,11 48,19 42,23 36,19 36,11" fill="#94a3b8" />
            <rect x="5" y="35" width="50" height="40" fill="#f59e0b" rx="2" />
          </svg>
        );
      case 'battery_aa':
        return (
          <svg width="45" height="35" viewBox="0 0 90 30">
            <rect width="86" height="30" rx="4" fill="#1e293b" />
            <rect x="86" y="8" width="4" height="14" fill="#cbd5e1" />
            <rect x="60" y="1" width="25" height="28" fill="#ea580c" />
          </svg>
        );
      case 'battery_coin':
        return (
          <svg width="45" height="35" viewBox="0 0 45 45">
            <circle cx="22.5" cy="22.5" r="20" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="22.5" cy="22.5" r="15" fill="#e2e8f0" />
          </svg>
        );
      case 'seven_segment':
        return (
          <svg width="45" height="35" viewBox="0 0 40 60">
            <rect width="40" height="60" rx="2" fill="#111827" />
            <rect x="5" y="10" width="30" height="40" fill="#1e293b" />
            <rect x="10" y="12" width="20" height="4" fill="#ef4444" />
            <rect x="26" y="14" width="4" height="14" fill="#ef4444" />
          </svg>
        );
      default:
        return (
          <div className="w-10 h-8 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-500">
            PART
          </div>
        );
    }
  };

  return (
    <div className="w-72 border-r border-slate-200 bg-white flex flex-col h-full select-none shadow-sm z-10">
      
      {/* Search & Category Filter Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col space-y-3 bg-slate-50/50">
        <div>
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
            COMPONENTS
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value="all">All Components</option>
            <option value="boards">Boards</option>
            <option value="basic">Basic Elements</option>
            <option value="sensors">Sensors</option>
            <option value="displays">Displays</option>
            <option value="actuators">Actuators</option>
            <option value="power">Power Sources</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Components Grid Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="grid grid-cols-2 gap-3">
          {filteredDefs.map((def) => {
            return (
              <button
                key={def.type}
                onClick={() => onAddComponent(def.type)}
                disabled={isSimulating}
                className="flex flex-col items-center justify-between p-2 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:border-slate-100 transition text-center group"
              >
                {/* Miniature SVG Icon Preview */}
                <div className="h-16 flex items-center justify-center w-full bg-slate-50/50 group-hover:bg-blue-50/20 rounded-lg transition mb-2.5 p-1 border border-dashed border-slate-100 group-hover:border-blue-100">
                  {renderMiniIcon(def.type)}
                </div>

                {/* Name & Desc */}
                <div className="w-full">
                  <div className="text-[11.5px] font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition truncate">
                    {def.name}
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5 leading-normal line-clamp-2 px-1">
                    {def.description}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredDefs.length === 0 && (
            <div className="col-span-2 text-center py-8 text-xs text-slate-400">
              No matching components found
            </div>
          )}
        </div>
      </div>
      
      {/* Help Tip footer */}
      <div className="p-3 border-t border-slate-100 text-[10px] text-slate-400 bg-slate-50 text-center leading-relaxed">
        💡 Click on a component to place it in the workspace center.
      </div>
    </div>
  );
};
