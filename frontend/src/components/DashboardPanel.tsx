import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Wifi,
  Copy,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Server,
  Key,
  Zap,
  Cloud,
  Database,
  Play,
  Pause,
} from 'lucide-react';
import { api } from '../services/api';
import { ComponentInstance, DashboardWidget, BlynkDatastream, ViewMode, CloudMqttConfig } from '../types';

export const DEFAULT_DATASTREAMS: BlynkDatastream[] = [
  { id: 'ds0', virtualPin: 'V0', name: 'Gas Level', dataType: 'integer', min: 0, max: 1023 },
  { id: 'ds1', virtualPin: 'V1', name: 'Temperature', dataType: 'double', min: -20, max: 60 },
  { id: 'ds2', virtualPin: 'V2', name: 'LED Control', dataType: 'integer', min: 0, max: 1 },
  { id: 'ds3', virtualPin: 'V6', name: 'Device Online', dataType: 'integer', min: 0, max: 1 },
  { id: 'ds4', virtualPin: 'V7', name: 'Humidity', dataType: 'integer', min: 0, max: 100 },
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
  cloudMqttConfig: CloudMqttConfig;
  onUpdateCloudMqttConfig: (config: CloudMqttConfig) => void;
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
  cloudMqttConfig,
  onUpdateCloudMqttConfig,
  onChangeViewMode,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDatastreams, setShowDatastreams] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'hivemq' | 'esp32code' | 'api'>('hivemq');
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, number | string>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttMessage, setMqttMessage] = useState('');
  const [mqttBusy, setMqttBusy] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const streams = datastreams.length > 0 ? datastreams : DEFAULT_DATASTREAMS;
  const hasBoard = components.some((c) => c.type === 'esp32' || c.type === 'arduino_uno');

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      api.mqttStatus()
        .then((d) => {
          if (!mounted) return;
          setMqttConnected(Boolean(d.connected));
          setMqttMessage(d.message || '');
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const updateCloudField = (field: keyof CloudMqttConfig, value: string) => {
    onUpdateCloudMqttConfig({ ...cloudMqttConfig, [field]: value });
  };

  const handleStartMqtt = async () => {
    setMqttBusy(true);
    setMqttMessage('');
    try {
      const status = await api.startMqtt(cloudMqttConfig);
      setMqttConnected(Boolean(status.connected));
      setMqttMessage(status.message || 'Starting MQTT bridge...');
    } catch (err) {
      setMqttConnected(false);
      setMqttMessage(err instanceof Error ? err.message : 'MQTT start failed');
    } finally {
      setMqttBusy(false);
    }
  };

  const handlePauseMqtt = async () => {
    setMqttBusy(true);
    try {
      const status = await api.pauseMqtt();
      setMqttConnected(false);
      setMqttMessage(status.message || 'MQTT paused');
    } catch (err) {
      setMqttMessage(err instanceof Error ? err.message : 'MQTT pause failed');
    } finally {
      setMqttBusy(false);
    }
  };

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    else if (type === 'switch' || type === 'button') { title = 'LED Control'; pin = 'V2'; virtualPin = 'V2'; }
    else if (type === 'terminal') { title = 'Serial Console'; pin = 'serial'; }
    else if (type === 'progress') { title = 'Analog Level'; pin = 'V0'; virtualPin = 'V0'; }
    else if (type === 'slider') { title = 'Slider Control'; pin = 'V3'; virtualPin = 'V3'; }
    else if (type === 'led') { title = 'Status LED'; pin = 'V2'; virtualPin = 'V2'; }
    else if (type === 'value_card') { title = 'Sensor Value'; pin = 'V0'; virtualPin = 'V0'; }

    onUpdateWidgets([...widgets, {
      id: `widget_${Date.now()}`,
      type, title, pin, virtualPin, x: 0, y: 0, w: 1, h: 1,
    }]);
    setShowAddMenu(false);
  };

  const copyToken = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const WIDGET_TYPES = [
    { type: 'gauge' as const, icon: GaugeIcon, label: 'Gauge', color: 'text-blue-600', bg: 'bg-blue-50' },
    { type: 'chart' as const, icon: Activity, label: 'Line Chart', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { type: 'led' as const, icon: Radio, label: 'LED Indicator', color: 'text-rose-600', bg: 'bg-rose-50' },
    { type: 'switch' as const, icon: ToggleLeft, label: 'Switch', color: 'text-orange-600', bg: 'bg-orange-50' },
    { type: 'value_card' as const, icon: Database, label: 'Value Card', color: 'text-violet-600', bg: 'bg-violet-50' },
    { type: 'progress' as const, icon: Sliders, label: 'Progress Bar', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { type: 'slider' as const, icon: Sliders, label: 'Slider', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { type: 'button' as const, icon: MousePointerClick, label: 'Push Button', color: 'text-slate-600', bg: 'bg-slate-50' },
    { type: 'terminal' as const, icon: Terminal, label: 'Terminal', color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  return (
    <div className="flex-1 h-full bg-slate-50 overflow-y-auto select-none">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
            <LayoutGrid className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">IoT Cloud Dashboard</h1>
            <p className="text-[11px] text-slate-400">Control & monitor your devices in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
            mqttConnected || wsConnected
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}>
            <div className={`h-2 w-2 rounded-full ${mqttConnected || wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {mqttConnected ? 'HiveMQ Live' : wsConnected ? 'WebSocket Live' : 'Offline'}
          </div>
          <button
            type="button"
            onClick={mqttConnected ? handlePauseMqtt : handleStartMqtt}
            disabled={mqttBusy}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              mqttConnected
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700'
            } disabled:opacity-50`}
          >
            {mqttConnected ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {mqttConnected ? 'Pause Cloud' : 'Start Cloud'}
          </button>
          {/* Guide Button */}
          <button
            onClick={() => { setShowGuide(!showGuide); setShowDatastreams(false); }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              showGuide ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Connection Guide
          </button>
          {/* Datastreams Button */}
          <button
            onClick={() => { setShowDatastreams(!showDatastreams); setShowGuide(false); }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              showDatastreams ? 'border-violet-400 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Virtual Pins
          </button>
          {/* Add Widget */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Widget
              {showAddMenu ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase text-slate-400">Choose Widget Type</div>
                {WIDGET_TYPES.map(({ type, icon: Icon, label, color, bg }) => (
                  <button
                    key={type}
                    onClick={() => handleAddWidget(type)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 transition text-slate-700"
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">HiveMQ Broker URL</span>
              <input
                type="text"
                value={cloudMqttConfig.brokerUrl}
                onChange={(e) => updateCloudField('brokerUrl', e.target.value)}
                placeholder="abc123.s1.eu.hivemq.cloud"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Username</span>
              <input
                type="text"
                value={cloudMqttConfig.username}
                onChange={(e) => updateCloudField('username', e.target.value)}
                placeholder="Project username"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Password</span>
              <input
                type="password"
                value={cloudMqttConfig.password}
                onChange={(e) => updateCloudField('password', e.target.value)}
                placeholder="Project password"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={mqttConnected ? handlePauseMqtt : handleStartMqtt}
                disabled={mqttBusy}
                className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
                  mqttConnected
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                } disabled:opacity-50`}
              >
                {mqttConnected ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {mqttBusy ? 'Working...' : mqttConnected ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
          {mqttMessage && (
            <div className={`border-t px-4 py-2 text-xs ${
              mqttConnected ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500'
            }`}>
              {mqttMessage}
            </div>
          )}
        </div>

        {/* Connection Guide Panel */}
        {showGuide && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800">HiveMQ Cloud Connection Guide</h2>
              </div>
              <div className="flex gap-1.5">
                {(['hivemq', 'esp32code', 'api'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setGuideTab(t)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      guideTab === t ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {t === 'hivemq' ? '1. HiveMQ Setup' : t === 'esp32code' ? '2. ESP32 Code' : '3. HTTP API'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {guideTab === 'hivemq' && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</div>
                        <h3 className="text-sm font-bold text-blue-900">Create Free Cluster</h3>
                      </div>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Go to <a href="https://console.hivemq.cloud" target="_blank" rel="noreferrer" className="underline font-semibold">console.hivemq.cloud</a> → Sign up → Create Cluster → Choose <strong>Serverless (Free)</strong> tier.
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">2</div>
                        <h3 className="text-sm font-bold text-violet-900">Copy Broker URL</h3>
                      </div>
                      <p className="text-xs text-violet-700 leading-relaxed">
                        From the cluster Overview page, copy your <strong>Cluster URL</strong> (e.g. <code className="bg-white px-1 py-0.5 rounded text-violet-800">abc123.s1.eu.hivemq.cloud</code>) and port <code className="bg-white px-1 py-0.5 rounded text-violet-800">8883</code>.
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</div>
                        <h3 className="text-sm font-bold text-emerald-900">Create Credentials</h3>
                      </div>
                      <div className="text-xs text-emerald-700 leading-relaxed space-y-1">
                        <p>In HiveMQ Console → <strong>Access Management</strong> tab → click <strong>"Add credentials"</strong>.</p>
                        <p className="rounded bg-white border border-emerald-200 px-2 py-1">
                          ⚠️ <strong>Permissions needed:</strong> In the "Manage Credentials" popup, set <strong>Role</strong> to <em>"Publish & Subscribe"</em> and topic to <code>#</code> (all topics). This gives full read/write access.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">4</div>
                        <h3 className="text-sm font-bold text-orange-900">Add to This Project</h3>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2.5 font-mono text-[10px] text-emerald-400">
                        Broker URL: abc123.s1.eu.hivemq.cloud<br />
                        Username: your_username<br />
                        Password: your_password
                      </div>
                      <p className="text-[10px] text-orange-600 mt-2">Paste these values into the project cloud fields above, then press Start.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-2 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" /> Data Flow
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <span className="rounded-lg bg-blue-100 px-2.5 py-1 font-semibold text-blue-800">ESP32 Device</span>
                      <span className="text-slate-400">→ MQTT/SSL →</span>
                      <span className="rounded-lg bg-violet-100 px-2.5 py-1 font-semibold text-violet-800">HiveMQ Cloud</span>
                      <span className="text-slate-400">→ Backend Server →</span>
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">This Dashboard</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">Your device publishes to <code>device/YOUR_TOKEN/telemetry</code> — the dashboard subscribes and shows it on your widgets live.</p>
                  </div>
                </div>
              )}

              {guideTab === 'esp32code' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Paste this into your Arduino IDE sketch. Replace the credentials with your HiveMQ values.</p>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-emerald-400 leading-relaxed max-h-80 select-all">
{`#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

// ====== SET YOUR CREDENTIALS BELOW ======
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* broker   = "abc123.s1.eu.hivemq.cloud"; // Your cluster URL
const int   port     = 8883;                         // Always 8883 for TLS
const char* user     = "your_hivemq_username";
const char* pass     = "your_hivemq_password";
const char* token    = "${apiKey || 'YOUR_AUTH_TOKEN'}";
// =========================================

WiFiClientSecure wifiClient;
PubSubClient client(wifiClient);

void callback(char* topic, byte* payload, unsigned int length) {
  // Incoming command from dashboard (e.g. button click → turn LED)
  String msg = "";
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.println("Command: " + msg);
  // Example: if msg contains V2=1, turn on LED pin 13
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(token, user, pass)) {
      Serial.println("connected!");
      // Subscribe to commands from dashboard
      client.subscribe((String("device/") + token + "/commands").c_str());
    } else {
      Serial.print("failed, rc="); Serial.println(client.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nWiFi OK");
  
  wifiClient.setInsecure(); // Skip TLS cert check (easy mode)
  client.setServer(broker, port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // Publish sensor data every 5 seconds
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 5000) {
    lastSend = millis();
    int gasVal = analogRead(34); // A0 / GPIO34
    String payload = "{\\"V0\\":" + String(gasVal) + "}";
    String topic = String("device/") + token + "/telemetry";
    client.publish(topic.c_str(), payload.c_str());
    Serial.println("Sent: " + payload);
  }
}`}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <strong>📦 Required Libraries:</strong> Install <code>PubSubClient</code> by Nick O'Leary in the Arduino Library Manager. Also install <code>WiFi</code> (included in ESP32 board package).
                  </div>
                </div>
              )}

              {guideTab === 'api' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Use HTTP APIs to send telemetry or control devices from anywhere — Node.js scripts, Python, mobile apps, etc.</p>
                  {apiKey && (
                    <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                      <Key className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-indigo-500">Your Auth Token</div>
                        <code className="text-sm font-bold text-indigo-800 select-all">{apiKey}</code>
                      </div>
                      <button onClick={copyToken} className="ml-auto flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200 transition">
                        <Copy className="h-3 w-3" /> {copiedToken ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-white text-[10px]">POST</span>
                        Push Sensor Data (Device → Dashboard)
                      </div>
                      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[10px] font-mono text-emerald-400 leading-relaxed select-all">
{`curl -X POST http://localhost:3001/api/telemetry \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${apiKey || 'YOUR_AUTH_TOKEN'}",
    "data": { "V0": 450, "V1": 24.5, "V2": 1 }
  }'`}
                      </pre>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="rounded-full bg-orange-600 px-2 py-0.5 text-white text-[10px]">POST</span>
                        Send Control Command (Dashboard → Device)
                      </div>
                      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[10px] font-mono text-emerald-400 leading-relaxed select-all">
{`curl -X POST http://localhost:3001/api/blynk/command \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${apiKey || 'YOUR_AUTH_TOKEN'}",
    "pin": "V2",
    "value": 1
  }'`}
                      </pre>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <strong>MQTT Topics:</strong><br />
                      📤 Device publishes to: <code className="bg-white px-1 rounded">device/TOKEN/telemetry</code><br />
                      📥 Device subscribes to: <code className="bg-white px-1 rounded">device/TOKEN/commands</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Virtual Pins / Datastreams Panel */}
        {showDatastreams && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-600" />
                <h2 className="text-sm font-bold text-slate-800">Virtual Pin Datastreams</h2>
              </div>
              <p className="text-[11px] text-slate-500">Map sensor data to widget pins (V0–V255)</p>
            </div>
            <div className="p-5">
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {streams.map((ds, index) => (
                  <div key={ds.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-indigo-300 transition">
                    <div className="mb-1.5 flex items-center justify-between">
                      <input
                        type="text"
                        value={ds.virtualPin}
                        onChange={(e) => {
                          const next = [...streams];
                          next[index] = { ...ds, virtualPin: e.target.value.toUpperCase() };
                          onUpdateDatastreams(next);
                        }}
                        className="w-16 rounded-lg border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-mono text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                      <span className="text-[9px] text-slate-400 uppercase">{ds.dataType}</span>
                    </div>
                    <input
                      type="text"
                      value={ds.name}
                      onChange={(e) => {
                        const next = [...streams];
                        next[index] = { ...ds, name: e.target.value };
                        onUpdateDatastreams(next);
                      }}
                      className="w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                    />
                    <div className="mt-1 text-[9px] text-slate-400">{ds.min} – {ds.max}</div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const n = streams.length;
                    onUpdateDatastreams([...streams, {
                      id: `ds${n}`, virtualPin: `V${n}`, name: `Stream ${n}`, dataType: 'integer', min: 0, max: 255,
                    }]);
                  }}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 p-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition min-h-[80px]"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">Add Pin</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Token & Connection Status Card */}
        {apiKey && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100">
                  <Key className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Auth Token (API Key)</div>
                  <code className="text-sm font-bold text-slate-700 select-all truncate block">{apiKey}</code>
                </div>
                <button onClick={copyToken} className="shrink-0 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition">
                  <Copy className="h-3 w-3" /> {copiedToken ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-slate-400" />
                  <span className={mqttConnected ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                    {mqttConnected ? 'MQTT Connected' : 'MQTT Offline'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cloud className="h-3.5 w-3.5 text-slate-400" />
                  <span className={wsConnected ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                    {wsConnected ? 'WebSocket Live' : 'WS Offline'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-400">{components.length} components</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Widget Grid */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">
              Dashboard Widgets
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{widgets.length}</span>
            </h2>
            {isSimulating && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Simulation Active
              </span>
            )}
          </div>

          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
                <LayoutGrid className="h-7 w-7 text-indigo-500" />
              </div>
              <h3 className="mb-1 text-base font-bold text-slate-700">No Widgets Yet</h3>
              <p className="mb-4 max-w-xs text-sm text-slate-400">
                Click <strong>"Add Widget"</strong> above to add gauges, switches, charts, and more. Bind each widget to a Virtual Pin (V0, V1…) to receive live data.
              </p>
              <button
                onClick={() => setShowAddMenu(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 transition"
              >
                <Plus className="h-4 w-4" /> Add Your First Widget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {widgets.map((widget) => {
                const rawVal = getBindingValue(widget);
                const vPin = widgetPin(widget).toUpperCase();

                return (
                  <div
                    key={widget.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition min-h-[180px]"
                  >
                    {/* Delete button */}
                    <button
                      onClick={() => onUpdateWidgets(widgets.filter((w) => w.id !== widget.id))}
                      className="absolute right-3 top-3 rounded-lg p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Widget Header */}
                    <div className="mb-2">
                      <input
                        type="text"
                        value={widget.title}
                        onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                        className="w-full rounded border border-transparent bg-transparent text-sm font-bold text-slate-800 outline-none focus:border-slate-200 focus:bg-slate-50 px-1 truncate"
                      />
                      <div className="mt-0.5 flex items-center gap-1.5 px-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400">PIN</span>
                        <input
                          type="text"
                          value={widget.virtualPin || widget.pin}
                          onChange={(e) => updateWidget(widget.id, {
                            virtualPin: e.target.value.toUpperCase(),
                            pin: e.target.value.toUpperCase(),
                          })}
                          className="w-16 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-600 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none"
                        />
                      </div>
                    </div>

                    {/* Widget Body */}
                    <div className="flex flex-1 items-center justify-center py-2">
                      {widget.type === 'led' && (
                        <div className="flex flex-col items-center gap-2">
                          <div className={`h-12 w-12 rounded-full border-4 transition ${
                            rawVal === 1 || rawVal === '1'
                              ? 'border-red-300 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                              : 'border-slate-200 bg-slate-200'
                          }`} />
                          <span className={`text-xs font-bold ${rawVal === 1 || rawVal === '1' ? 'text-red-600' : 'text-slate-400'}`}>
                            {rawVal === 1 || rawVal === '1' ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      )}

                      {widget.type === 'gauge' && (
                        <div className="flex w-full flex-col items-center gap-1">
                          <div className="relative h-14 w-28 overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 h-full border-l-[10px] border-r-[10px] border-t-[10px] border-slate-100 rounded-t-full" />
                            <div
                              className="absolute bottom-0 left-0 right-0 h-full border-l-[10px] border-r-[10px] border-t-[10px] border-indigo-500 rounded-t-full transition-all"
                              style={{ clipPath: `inset(0px ${100 - (Number(rawVal) / 1023) * 100}% 0px 0px)` }}
                            />
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-700 z-10">{rawVal}</div>
                          </div>
                          <span className="text-[10px] text-slate-400">0 – 1023</span>
                        </div>
                      )}

                      {widget.type === 'switch' && (
                        <button
                          onClick={() => sendVirtualPin(vPin, rawVal === 1 ? 0 : 1)}
                          className={`relative h-8 w-16 rounded-full border-2 transition-colors ${
                            rawVal === 1 ? 'border-emerald-400 bg-emerald-500' : 'border-slate-200 bg-slate-200'
                          }`}
                        >
                          <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all ${
                            rawVal === 1 ? 'left-9' : 'left-0.5'
                          }`} />
                        </button>
                      )}

                      {widget.type === 'button' && (
                        <button
                          onMouseDown={() => sendVirtualPin(vPin, 1)}
                          onMouseUp={() => sendVirtualPin(vPin, 0)}
                          onMouseLeave={() => sendVirtualPin(vPin, 0)}
                          className={`h-14 w-14 rounded-full border-4 text-[10px] font-black shadow-inner transition-all active:scale-95 ${
                            rawVal === 1
                              ? 'border-indigo-300 bg-indigo-600 text-white shadow-indigo-200'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          PUSH
                        </button>
                      )}

                      {widget.type === 'value_card' && (
                        <div className="text-center">
                          <span className="text-4xl font-extrabold font-mono text-indigo-600">{rawVal}</span>
                        </div>
                      )}

                      {widget.type === 'progress' && (
                        <div className="w-full px-1">
                          <div className="mb-1.5 flex items-end justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-700">{rawVal}</span>
                            <span className="text-[10px] text-slate-400">/ 1023</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, (Number(rawVal) / 1023) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {widget.type === 'chart' && (
                        <div className="w-full">
                          <div className="flex h-16 items-end gap-0.5 border-b-2 border-slate-100">
                            {Array.from({ length: 14 }).map((_, i) => {
                              const h = isSimulating ? Math.abs(Math.sin(Date.now() / 2000 + i * 0.7)) * 70 + 10 : 5;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-400 to-violet-400 transition-all duration-500"
                                  style={{ height: `${h}%` }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {widget.type === 'slider' && (
                        <div className="w-full px-1">
                          <div className="mb-1.5 flex items-end justify-between">
                            <span className="text-2xl font-extrabold font-mono text-slate-700">{rawVal}</span>
                            <span className="text-[10px] text-slate-400">/ 1023</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1023"
                            value={Number(rawVal) || 0}
                            onChange={(e) => sendVirtualPin(vPin, Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                          />
                        </div>
                      )}

                      {widget.type === 'terminal' && (
                        <div className="w-full overflow-hidden rounded-lg bg-slate-900 p-2.5 font-mono text-[10px] text-emerald-400 h-12 leading-relaxed truncate border border-slate-200">
                          {rawVal || '> waiting for data…'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
