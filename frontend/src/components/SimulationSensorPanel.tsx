import React from 'react';
import { Sliders, Cloud, Sun, Gauge, Radio } from 'lucide-react';
import { ComponentInstance } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';

interface SimulationSensorPanelProps {
  components: ComponentInstance[];
  onValueChange: (id: string, value: number) => void;
  isSimulating: boolean;
}

const SENSOR_TYPES = ['gas_sensor', 'ldr', 'potentiometer', 'ultrasonic', 'dht11'] as const;

export const SimulationSensorPanel: React.FC<SimulationSensorPanelProps> = ({
  components,
  onValueChange,
  isSimulating,
}) => {
  if (!isSimulating) return null;

  const sensors = components.filter((c) =>
    SENSOR_TYPES.includes(c.type as (typeof SENSOR_TYPES)[number]),
  );

  if (sensors.length === 0) return null;

  const getSensorConfig = (comp: ComponentInstance) => {
    switch (comp.type) {
      case 'gas_sensor':
        return {
          icon: Cloud,
          label: 'Gas / Smoke Level',
          min: 0,
          max: 1023,
          unit: 'ppm',
          color: 'from-orange-500/20 to-red-500/20',
          hint: 'Drag slider — higher = more smoke detected',
        };
      case 'ldr':
        return {
          icon: Sun,
          label: 'Light Level',
          min: 0,
          max: 1023,
          unit: 'lux',
          color: 'from-yellow-500/20 to-amber-500/20',
          hint: 'Lower = darker, higher = brighter',
        };
      case 'potentiometer':
        return {
          icon: Gauge,
          label: 'Knob Position',
          min: 0,
          max: 1023,
          unit: '',
          color: 'from-blue-500/20 to-cyan-500/20',
          hint: 'Rotate potentiometer value',
        };
      case 'ultrasonic':
        return {
          icon: Radio,
          label: 'Distance',
          min: 2,
          max: 400,
          unit: 'cm',
          color: 'from-purple-500/20 to-indigo-500/20',
          hint: 'Object distance from sensor',
        };
      default:
        return {
          icon: Sliders,
          label: comp.name,
          min: 0,
          max: 1023,
          unit: '',
          color: 'from-slate-500/20 to-slate-600/20',
          hint: '',
        };
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 w-72 rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <Sliders className="h-4 w-4 text-cyan-600" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Simulation Inputs</span>
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto p-3">
        {sensors.map((comp) => {
          const def = COMPONENT_DEFINITIONS[comp.type];
          const config = getSensorConfig(comp);
          const Icon = config.icon;
          const value = comp.state?.sensorValue ?? (comp.type === 'ultrasonic' ? 50 : 512);

          return (
            <div
              key={comp.id}
              className={`rounded-lg bg-gradient-to-r ${config.color} p-3`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-800">{comp.name || def?.name}</div>
                  <div className="text-[10px] text-slate-500">{config.label}</div>
                </div>
                <span className="font-mono text-sm font-bold text-cyan-700">
                  {value}
                  {config.unit && <span className="ml-0.5 text-[10px] font-normal">{config.unit}</span>}
                </span>
              </div>
              <input
                type="range"
                min={config.min}
                max={config.max}
                value={value}
                onChange={(e) => onValueChange(comp.id, Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-cyan-600"
              />
              {config.hint && <p className="mt-1 text-[9px] text-slate-500">{config.hint}</p>}
              {comp.type === 'gas_sensor' && value > 300 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-orange-600">
                  <Cloud className="h-3 w-3" />
                  Smoke detected — level {Math.round((value / 1023) * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
