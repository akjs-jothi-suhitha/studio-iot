import React, { useMemo, useState, useEffect } from 'react';
import {
  LayoutGrid,
  Gauge as GaugeIcon,
  ToggleLeft,
  Activity,
  Radio,
  Plus,
  Trash2,
  Sliders,
  Terminal,
  MousePointerClick,
  ChevronRight,
  CheckCircle2,
  Wifi,
  Copy,
  CircuitBoard,
  Play,
} from 'lucide-react';
import { ComponentInstance, DashboardWidget, BlynkDatastream, ViewMode } from '../types';

export const DEFAULT_DATASTREAMS: BlynkDatastream[] = [
  { id: 'ds0', virtualPin: 'V0', name: 'Gas Level', dataType: 'integer', min: 0, max: 1023 },
  { id: 'ds1', virtualPin: 'V1', name: 'Light Level', dataType: 'integer', min: 0, max: 1023 },
  { id: 'ds2', virtualPin: 'V2', name: 'LED Control', dataType: 'integer', min: 0, max: 1 },
];

const SETUP_STEPS = [
  { title: 'Add hardware', detail: 'Place ESP32 or Arduino on the Circuit workplane and wire sensors.' },
  { title: 'Copy auth token', detail: 'Use the project Auth Token in your ESP32/Blynk-style sketch.' },
  { title: 'Define datastreams', detail: 'Map Virtual Pins (V0, V1…) to sensor values your code sends.' },
  { title: 'Build dashboard', detail: 'Add gauges, switches, and charts bound to those Virtual Pins.' },
  { title: 'Run simulation', detail: 'Start simulation on the Circuit tab to stream live values to widgets.' },
];

interface DashboardPanelProps {
  widgets: DashboardWidget[];
  onUpdateWidgets: (w: DashboardWidget[]) => void;
  datastreams: BlynkDatastream[];
  onUpdateDatastreams: (ds: BlynkDatastream[]) => void;
  setupStep: number;
  onSetupStepChange: (step: number) => void;
  digitalPins: Record<string, number>;
  analogPins: Record<string, number>;
  serialLogs: string[];
  components: ComponentInstance[];
  isSimulating: boolean;
  onWidgetInteraction: (pin: string, value: number) => void;
  apiKey?: string | null;
  onChangeViewMode: (mode: ViewMode) => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  widgets,
  onUpdateWidgets,
  datastreams,
  onUpdateDatastreams,
  setupStep,
  onSetupStepChange,
  digitalPins,
  analogPins,
  serialLogs,
  components,
  isSimulating,
  onWidgetInteraction,
  apiKey,
  onChangeViewMode,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDatastreams, setShowDatastreams] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, number | string>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const streams = datastreams.length > 0 ? datastreams : DEFAULT_DATASTREAMS;
  const hasBoard = components.some((c) => c.type === 'esp32' || c.type === 'arduino_uno');
  const wsUrl = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.hostname}:8080?apiKey=…`;
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${protocol}://${window.location.hostname}:8080?apiKey=${encodeURIComponent(apiKey)}`);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLiveTelemetry((prev) => ({ ...prev, ...data }));
        } catch { /* ignore */ }
      };
    } catch { /* unavailable */ }
    return () => { ws?.close(); setWsConnected(false); };
  }, [apiKey]);

  const activeDigitalPins = Object.values(digitalPins).filter((value) => value > 0).length;
  const analogValues = Object.values(analogPins);
  const analogAverage = analogValues.length
    ? Math.round(analogValues.reduce((sum, value) => sum + value, 0) / analogValues.length)
    : 0;

  const getBindingValue = (widget: DashboardWidget): string | number => {
    const vPin = (widget.virtualPin || widget.pin).toUpperCase();
    const live = liveTelemetry[vPin] ?? liveTelemetry[widget.pin];

    if (live !== undefined && live !== null) return live as number;

    if (!isSimulating) return wsConnected ? '…' : '---';

    if (vPin === 'SERIAL' || widget.pin.toLowerCase() === 'serial') {
      const lastLine = serialLogs[serialLogs.length - 1] || '';
      return lastLine.replace(/\[\d{2}:\d{2}:\d{2}\]\s*/, '');
    }

    if (vPin === 'V0' || widget.pin.toUpperCase() === 'A0') {
      const gas = components.find((c) => c.type === 'gas_sensor');
      return gas?.state?.sensorValue ?? 120;
    }

    if (vPin === 'V1' || widget.pin.toUpperCase() === 'A1') {
      const ldr = components.find((c) => c.type === 'ldr');
      return ldr?.state?.sensorValue ?? 500;
    }

    if (vPin === 'V2' || widget.pin === '13') return digitalPins['13'] ?? 0;

    if (digitalPins[widget.pin] !== undefined) return digitalPins[widget.pin];
    if (analogPins[widget.pin] !== undefined) return analogPins[widget.pin];

    return 0;
  };

  const widgetPin = (w: DashboardWidget) => w.virtualPin || w.pin;

  const sendVirtualPin = (pin: string, value: number) => {
    const vPin = pin.startsWith('V') ? pin : pin.toUpperCase();
    onWidgetInteraction(vPin, value);
    if (apiKey) {
      fetch('/api/blynk/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, pin: vPin, value }),
      }).catch(() => {});
    }
  };

  const updateWidget = (id: string, patch: Partial<DashboardWidget>) => {
    onUpdateWidgets(widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  };

  const handleAddWidget = (type: DashboardWidget['type']) => {
    let title = 'New Widget';
    let pin = 'V0';
    let virtualPin = 'V0';

    if (type === 'gauge') { title = 'Gas Level'; pin = 'V0'; virtualPin = 'V0'; }
    else if (type === 'chart') { title = 'Light Sensor'; pin = 'V1'; virtualPin = 'V1'; }
    else if (type === 'switch' || type === 'button') { title = 'Button Control'; pin = 'V2'; virtualPin = 'V2'; }
    else if (type === 'terminal') { title = 'Console Output'; pin = 'serial'; }
    else if (type === 'progress' || type === 'slider') { title = 'Analog Progress'; pin = 'V0'; virtualPin = 'V0'; }

    onUpdateWidgets([...widgets, {
      id: `widget_${Date.now()}`,
      type,
      title,
      pin,
      virtualPin,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }]);
    setShowAddMenu(false);
    if (setupStep < 4) onSetupStepChange(4);
  };

  const copyToken = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const advanceSetup = () => {
    if (setupStep === 0 && hasBoard) onSetupStepChange(1);
    else if (setupStep === 1 && apiKey) onSetupStepChange(2);
    else if (setupStep === 2 && streams.length > 0) onSetupStepChange(3);
    else if (setupStep === 3 && widgets.length > 0) onSetupStepChange(4);
    else if (setupStep < 4) onSetupStepChange(setupStep + 1);
  };

  return (
    <div className="flex-1 h-full bg-[#f1f5f9] p-6 overflow-y-auto select-none">
      <div className="mb-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Connection setup — step {Math.min(setupStep + 1, 5)} of 5</h3>
          {setupStep >= 4 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Ready
            </span>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {SETUP_STEPS.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => onSetupStepChange(index)}
              className={`rounded-lg border p-3 text-left transition ${
                setupStep === index
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                  : index < setupStep
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  index <= setupStep ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}>{index + 1}</span>
                <span className="text-xs font-bold text-slate-800">{step.title}</span>
              </div>
              <p className="text-[10px] leading-snug text-slate-500">{step.detail}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          {setupStep === 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-slate-600">
                {hasBoard ? '✓ Board detected on circuit.' : 'Add an ESP32 or Arduino Uno on the Circuit tab first.'}
              </p>
              <button type="button" onClick={() => onChangeViewMode('circuit')} className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                <CircuitBoard className="h-3.5 w-3.5" /> Open Circuit
              </button>
              {hasBoard && (
                <button type="button" onClick={advanceSetup} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                  Continue <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {setupStep === 1 && apiKey && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">Paste this Auth Token into your ESP32 sketch (BLYNK_AUTH_TOKEN):</p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-white px-2 py-1 font-mono text-xs text-slate-800">{apiKey}</code>
                <button type="button" onClick={copyToken} className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                  <Copy className="h-3 w-3" /> {copiedToken ? 'Copied!' : 'Copy'}
                </button>
                <button type="button" onClick={advanceSetup} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
          {setupStep === 2 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">Define Virtual Pin datastreams your firmware will update (V0, V1…):</p>
              <button type="button" onClick={() => setShowDatastreams(true)} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Edit datastreams ({streams.length})
              </button>
              <button type="button" onClick={advanceSetup} className="ml-2 text-xs font-semibold text-blue-600">
                Continue <ChevronRight className="h-3.5 w-3.5 inline" />
              </button>
            </div>
          )}
          {setupStep === 3 && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-slate-600">Add widgets and bind each to a Virtual Pin from your datastreams.</p>
              <button type="button" onClick={() => setShowAddMenu(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                + Add Widget
              </button>
              {widgets.length > 0 && (
                <button type="button" onClick={advanceSetup} className="text-xs font-semibold text-blue-600">
                  Continue <ChevronRight className="h-3.5 w-3.5 inline" />
                </button>
              )}
            </div>
          )}
          {setupStep >= 4 && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-slate-600">
                Start simulation on the Circuit tab. Telemetry flows: Hardware → Cloud ({wsUrl}) → Dashboard widgets.
              </p>
              <button type="button" onClick={() => onChangeViewMode('circuit')} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                <Play className="h-3.5 w-3.5" /> Go to Circuit & Simulate
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            <span>Blynk IoT Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Edit widgets below — bind titles and Virtual Pins like Blynk.</p>
          {apiKey && (
            <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-xs">
              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Template ID</span>
                  <div className="font-mono font-semibold text-slate-700">TMPL0001</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Auth Token</span>
                  <div className="font-mono font-semibold text-slate-800 select-all">{apiKey}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Cloud</span>
                  <div className={`flex items-center gap-1 font-semibold ${wsConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                    <Wifi className="h-3.5 w-3.5" />
                    {wsConnected ? 'Connected' : 'Offline — start simulation'}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500">
                POST /api/telemetry · WebSocket {wsUrl}
              </div>
            </div>
          )}
        </div>

        <div className="relative flex gap-2">
          <button
            type="button"
            onClick={() => setShowDatastreams(!showDatastreams)}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold"
          >
            <Sliders className="w-4 h-4" />
            <span>Datastreams</span>
          </button>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Widget</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 font-semibold text-xs">
              {[
                ['gauge', GaugeIcon, 'Radial Gauge', 'text-blue-500'],
                ['chart', Activity, 'Live Line Chart', 'text-green-500'],
                ['led', Radio, 'LED Indicator', 'text-red-500'],
                ['switch', ToggleLeft, 'Input Switch', 'text-orange-500'],
                ['value_card', Sliders, 'Value Card', 'text-purple-500'],
                ['progress', Sliders, 'Progress Bar', 'text-cyan-500'],
                ['button', MousePointerClick, 'Push Button', 'text-slate-500'],
                ['terminal', Terminal, 'Terminal', 'text-slate-700'],
              ].map(([type, Icon, label, color]) => (
                <button
                  key={type as string}
                  onClick={() => handleAddWidget(type as DashboardWidget['type'])}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDatastreams && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-800">Virtual Pin Datastreams</h3>
          <div className="grid gap-2 md:grid-cols-3">
            {streams.map((ds, index) => (
              <div key={ds.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <input
                  type="text"
                  value={ds.virtualPin}
                  onChange={(e) => {
                    const next = [...streams];
                    next[index] = { ...ds, virtualPin: e.target.value.toUpperCase() };
                    onUpdateDatastreams(next);
                  }}
                  className="mb-1 w-full rounded border border-slate-200 px-1.5 py-0.5 font-mono text-sm font-bold text-blue-600"
                />
                <input
                  type="text"
                  value={ds.name}
                  onChange={(e) => {
                    const next = [...streams];
                    next[index] = { ...ds, name: e.target.value };
                    onUpdateDatastreams(next);
                  }}
                  className="mb-1 w-full rounded border border-slate-200 px-1.5 py-0.5 text-xs font-semibold text-slate-700"
                />
                <div className="text-[10px] text-slate-500">{ds.dataType} · {ds.min}–{ds.max}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const n = streams.length;
              onUpdateDatastreams([...streams, {
                id: `ds${n}`,
                virtualPin: `V${n}`,
                name: `Stream ${n}`,
                dataType: 'integer',
                min: 0,
                max: 255,
              }]);
            }}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
          >
            + Add datastream
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</div>
          <div className={`mt-1 text-sm font-bold ${isSimulating ? 'text-emerald-600' : 'text-slate-600'}`}>
            {isSimulating ? 'Live simulation' : 'Standby'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hardware</div>
          <div className="mt-1 text-sm font-bold text-slate-800">{components.length} components</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Digital High</div>
          <div className="mt-1 text-sm font-bold text-slate-800">{activeDigitalPins} pins</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analog Avg</div>
          <div className="mt-1 text-sm font-bold text-slate-800">{analogAverage}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => {
          const rawVal = getBindingValue(widget);
          const vPin = widgetPin(widget).toUpperCase();

          return (
            <div
              key={widget.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between min-h-[180px] relative group"
            >
              <button
                onClick={() => onUpdateWidgets(widgets.filter((w) => w.id !== widget.id))}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                title="Delete Widget"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <input
                  type="text"
                  value={widget.title}
                  onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                  className="mb-1 w-full rounded border border-transparent bg-transparent text-sm font-bold text-slate-800 outline-none focus:border-slate-200 focus:bg-slate-50 px-1"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">PIN</span>
                  <input
                    type="text"
                    value={widget.virtualPin || widget.pin}
                    onChange={(e) => updateWidget(widget.id, {
                      virtualPin: e.target.value.toUpperCase(),
                      pin: e.target.value.toUpperCase(),
                    })}
                    className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-blue-600"
                  />
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center my-3">
                {widget.type === 'led' && (
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border-4 border-slate-200 transition shadow-inner ${
                      rawVal === 1 || rawVal === '1' ? 'bg-red-500 shadow-red-200' : 'bg-slate-300'
                    }`} />
                    <span className="text-xs text-slate-500 mt-2 font-bold font-mono">
                      {rawVal === 1 || rawVal === '1' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )}

                {widget.type === 'gauge' && (
                  <div className="flex flex-col items-center w-full">
                    <div className="relative w-24 h-12 overflow-hidden flex items-end justify-center">
                      <div className="absolute inset-0 border-t-8 border-l-8 border-r-8 border-slate-100 rounded-t-full" />
                      <div className="absolute inset-0 border-t-8 border-l-8 border-r-8 border-blue-500 rounded-t-full"
                           style={{ clipPath: `inset(0px ${100 - (Number(rawVal) / 1023) * 100}% 0px 0px)` }} />
                      <span className="text-sm font-bold font-mono text-slate-700 z-10">{rawVal}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Range: 0-1023</span>
                  </div>
                )}

                {widget.type === 'switch' && (
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => sendVirtualPin(vPin, rawVal === 1 ? 0 : 1)}
                      className={`w-14 h-7 rounded-full transition-colors relative border ${
                        rawVal === 1 ? 'bg-green-500 border-green-400' : 'bg-slate-300 border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                        rawVal === 1 ? 'left-8' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                )}

                {widget.type === 'button' && (
                  <button
                    onMouseDown={() => sendVirtualPin(vPin, 1)}
                    onMouseUp={() => sendVirtualPin(vPin, 0)}
                    onMouseLeave={() => sendVirtualPin(vPin, 0)}
                    className={`h-14 w-14 rounded-full border-4 text-[10px] font-black shadow-inner transition ${
                      rawVal === 1 ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    PUSH
                  </button>
                )}

                {widget.type === 'value_card' && (
                  <span className="text-3xl font-extrabold font-mono text-slate-800">{rawVal}</span>
                )}

                {widget.type === 'progress' && (
                  <div className="w-full px-2">
                    <div className="mb-2 flex items-end justify-between">
                      <span className="text-2xl font-extrabold font-mono text-slate-800">{rawVal}</span>
                      <span className="text-[10px] font-bold text-slate-400">/ 1023</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-cyan-500 transition-all"
                           style={{ width: `${Math.max(0, Math.min(100, (Number(rawVal) / 1023) * 100))}%` }} />
                    </div>
                  </div>
                )}

                {widget.type === 'chart' && (
                  <div className="w-full h-16 flex items-end space-x-1 px-2 border-b border-slate-100">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const hVal = isSimulating ? (Math.sin(Date.now() / 2000 + i) * 20 + 35) : 10;
                      return (
                        <div key={i} className="flex-1 bg-green-500 rounded-t transition-all duration-300"
                             style={{ height: `${hVal}%` }} />
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
            <p className="text-xs text-slate-400 mt-1">Follow the setup steps above, then add gauges, charts, or LED widgets.</p>
          </div>
        )}
      </div>
    </div>
  );
};
