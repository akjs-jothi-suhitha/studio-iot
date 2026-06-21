import React, { useState } from 'react';
import { LayoutGrid, Gauge as GaugeIcon, ToggleLeft, Activity, Radio, Plus, Trash2, Sliders } from 'lucide-react';
import { DashboardWidget } from '../types';

interface DashboardPanelProps {
  widgets: DashboardWidget[];
  onUpdateWidgets: (w: DashboardWidget[]) => void;
  digitalPins: Record<string, number>;
  analogPins: Record<string, number>;
  serialLogs: string[];
  components: any[];
  isSimulating: boolean;
  onWidgetInteraction: (pin: string, value: number) => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  widgets,
  onUpdateWidgets,
  digitalPins,
  analogPins,
  serialLogs,
  components,
  isSimulating,
  onWidgetInteraction,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Read current value for a given pin/indicator
  const getBindingValue = (pin: string): string | number => {
    if (!isSimulating) return '---';

    if (pin.toUpperCase() === 'SERIAL') {
      const lastLine = serialLogs[serialLogs.length - 1] || '';
      // extract content inside bracket logs
      return lastLine.replace(/\[\d{2}:\d{2}:\d{2}\]\s*/, '');
    }

    if (pin.toUpperCase() === 'A0') {
      const gas = components.find(c => c.type === 'gas_sensor');
      return gas?.state?.sensorValue ?? 120;
    }

    if (pin.toUpperCase() === 'A1') {
      const ldr = components.find(c => c.type === 'ldr');
      return ldr?.state?.sensorValue ?? 500;
    }

    // Check digital pins
    if (digitalPins[pin] !== undefined) {
      return digitalPins[pin];
    }

    return 0;
  };

  const handleAddWidget = (type: DashboardWidget['type']) => {
    // Generate default titles & pin bounds
    let title = 'New Widget';
    let pin = '13';
    
    if (type === 'gauge') {
      title = 'Gas Level';
      pin = 'A0';
    } else if (type === 'chart') {
      title = 'Light Sensor';
      pin = 'A1';
    } else if (type === 'switch' || type === 'button') {
      title = 'Button Control';
      pin = '2'; // digital input pin
    } else if (type === 'terminal') {
      title = 'Console Output';
      pin = 'serial';
    }

    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type,
      title,
      pin,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    };

    onUpdateWidgets([...widgets, newWidget]);
    setShowAddMenu(false);
  };

  const handleDeleteWidget = (id: string) => {
    onUpdateWidgets(widgets.filter(w => w.id !== id));
  };

  return (
    <div className="flex-1 h-full bg-[#f1f5f9] p-6 overflow-y-auto select-none">
      
      {/* 1. Header controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            <span>Smart IOT Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Blynk-inspired live telemetry feeds from your simulated hardware environment.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Widget</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 font-semibold text-xs">
              <button
                onClick={() => handleAddWidget('gauge')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
              >
                <GaugeIcon className="w-4 h-4 text-blue-500" />
                <span>Radial Gauge</span>
              </button>
              <button
                onClick={() => handleAddWidget('chart')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
              >
                <Activity className="w-4 h-4 text-green-500" />
                <span>Live Line Chart</span>
              </button>
              <button
                onClick={() => handleAddWidget('led')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
              >
                <Radio className="w-4 h-4 text-red-500" />
                <span>LED Indicator</span>
              </button>
              <button
                onClick={() => handleAddWidget('switch')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
              >
                <ToggleLeft className="w-4 h-4 text-orange-500" />
                <span>Input Switch</span>
              </button>
              <button
                onClick={() => handleAddWidget('value_card')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
              >
                <Sliders className="w-4 h-4 text-purple-500" />
                <span>Value Card</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Grid Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => {
          const rawVal = getBindingValue(widget.pin);
          
          return (
            <div
              key={widget.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between min-h-[160px] relative group"
            >
              {/* Delete Widget Icon */}
              <button
                onClick={() => handleDeleteWidget(widget.id)}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                title="Delete Widget"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Title & Pin tag */}
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{widget.title}</h3>
                <span className="text-[10px] font-mono text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Pin: {widget.pin.toUpperCase()}
                </span>
              </div>

              {/* Main Widget Graphic Render */}
              <div className="flex-1 flex items-center justify-center my-3">
                {widget.type === 'led' && (
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full border-4 border-slate-200 transition shadow-inner ${
                        rawVal === 1 || rawVal === '1'
                          ? 'bg-red-500 shadow-red-200 glow-red'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span className="text-xs text-slate-500 mt-2 font-bold font-mono">
                      {rawVal === 1 || rawVal === '1' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )}

                {widget.type === 'gauge' && (
                  <div className="flex flex-col items-center w-full">
                    {/* Simplified gauge representation */}
                    <div className="relative w-24 h-12 overflow-hidden flex items-end justify-center">
                      {/* Arc */}
                      <div className="absolute inset-0 border-t-8 border-l-8 border-r-8 border-slate-100 rounded-t-full" />
                      <div className="absolute inset-0 border-t-8 border-l-8 border-r-8 border-blue-500 rounded-t-full" 
                           style={{ clipPath: `inset(0px ${100 - (Number(rawVal) / 1023) * 100}% 0px 0px)` }} />
                      
                      <span className="text-sm font-bold font-mono text-slate-700 z-10">
                        {rawVal}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Range: 0-1023</span>
                  </div>
                )}

                {widget.type === 'switch' && (
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        const newVal = rawVal === 1 ? 0 : 1;
                        onWidgetInteraction(widget.pin, newVal);
                      }}
                      className={`w-14 h-7 rounded-full transition-colors relative border ${
                        rawVal === 1 ? 'bg-green-500 border-green-400' : 'bg-slate-300 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                          rawVal === 1 ? 'left-8' : 'left-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] text-slate-400 mt-1.5 font-bold font-mono">
                      {rawVal === 1 ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                )}

                {widget.type === 'value_card' && (
                  <div className="text-center">
                    <span className="text-3xl font-extrabold font-mono text-slate-800">
                      {rawVal}
                    </span>
                  </div>
                )}

                {widget.type === 'chart' && (
                  <div className="w-full h-16 flex items-end space-x-1 px-2 border-b border-slate-100">
                    {/* Draw static simulated chart bars for aesthetic visual */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const hVal = isSimulating ? (Math.sin(Date.now() / 2000 + i) * 20 + 35) : 10;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-green-500 rounded-t transition-all duration-300"
                          style={{ height: `${hVal}%` }}
                        />
                      );
                    })}
                  </div>
                )}

                {widget.type === 'terminal' && (
                  <div className="w-full bg-slate-900 text-green-400 p-2.5 rounded font-mono text-[10px] overflow-hidden truncate h-12 leading-relaxed shadow-inner">
                    {rawVal}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {widgets.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <LayoutGrid className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <h4 className="font-bold text-sm text-slate-700">No active widgets</h4>
            <p className="text-xs text-slate-400 mt-1">
              Add Gauges, Charts, or LED indicator widgets to build your IoT dashboard workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
