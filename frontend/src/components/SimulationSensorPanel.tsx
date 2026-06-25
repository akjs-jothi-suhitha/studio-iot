import React from 'react';
import { Sliders, Cloud, Sun, Gauge, Radio, Thermometer, Droplets } from 'lucide-react';
import { ComponentInstance } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';

interface SimulationSensorPanelProps {
  components: ComponentInstance[];
  onValueChange: (id: string, value: number) => void;
  onComponentStateChange?: (id: string, partialState: ComponentInstance['state']) => void;
  isSimulating: boolean;
}

const SENSOR_TYPES = ['gas_sensor', 'ldr', 'ultrasonic', 'dht11'] as const;

export const SimulationSensorPanel: React.FC<SimulationSensorPanelProps> = ({
  components,
  onValueChange,
  onComponentStateChange,
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
          hint: 'Higher = more smoke detected',
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
      case 'ultrasonic':
        return {
          icon: Radio,
          label: 'Distance',
          min: 2,
          max: 400,
          unit: 'cm',
          color: 'from-purple-500/20 to-indigo-500/20',
          hint: 'Object distance from sensor (pulseIn uses this)',
        };
      case 'dht11':
        return {
          icon: Thermometer,
          label: 'DHT11 Sensor',
          min: 0,
          max: 100,
          unit: '',
          color: 'from-rose-500/20 to-orange-500/20',
          hint: 'Adjust temperature and humidity below',
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
    <div className="absolute bottom-4 right-4 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <Sliders className="h-4 w-4" />
        </div>
        <div>
          <span className="block text-xs font-bold uppercase tracking-widest text-emerald-800">Live inputs</span>
          <span className="text-[10px] text-emerald-600">Drag sliders to simulate sensor values</span>
        </div>
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto p-3">
        {sensors.map((comp) => {
          const def = COMPONENT_DEFINITIONS[comp.type];
          const config = getSensorConfig(comp);
          const Icon = config.icon;

          if (comp.type === 'dht11') {
            const tempC = comp.state?.tempC ?? 25;
            const humidity = comp.state?.humidity ?? 50;
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
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-600">
                      <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temperature</span>
                      <span className="font-mono font-bold text-rose-700">{tempC}°C</span>
                    </div>
                    <input
                      type="range"
                      min={-10}
                      max={50}
                      value={tempC}
                      onChange={(e) => onComponentStateChange?.(comp.id, { tempC: Number(e.target.value), humidity })}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-rose-500"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-600">
                      <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> Humidity</span>
                      <span className="font-mono font-bold text-blue-700">{humidity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={humidity}
                      onChange={(e) => onComponentStateChange?.(comp.id, { humidity: Number(e.target.value), tempC })}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            );
          }

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
      <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[9px] text-slate-500">
        Components are locked during simulation. Use potentiometer & buttons on the workplane.
      </p>
    </div>
  );
};
