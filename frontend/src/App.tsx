import React, { useState, useEffect, useRef } from 'react';
import { Toolbar } from './components/Toolbar';
import { ComponentSidebar } from './components/ComponentSidebar';
import { Canvas } from './components/Canvas';
import { CodePanel } from './components/CodePanel';
import { DashboardPanel } from './components/DashboardPanel';
import { CODE_PRESETS } from './utils/codePresets';
import { ComponentType, ComponentInstance, Wire, DashboardWidget, ProjectState } from './types';
import { CircuitSimulator, SimulationState } from './simulation/circuitSimulator';
import { LayoutGrid, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  // View mode: 'circuit' for designer canvas, 'dashboard' for Blynk IoT dashboard
  const [viewMode, setViewMode] = useState<'circuit' | 'dashboard'>('circuit');

  // Canvas details
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isWireSelected, setIsWireSelected] = useState<boolean>(false);
  const [activeWireColor, setActiveWireColor] = useState<string>('#ef4444'); // default Red
  const [zoom, setZoom] = useState<number>(100);

  // Editor states
  const [code, setCode] = useState<string>('');
  const [isCodeOpen, setIsCodeOpen] = useState<boolean>(true);

  // IoT Dashboard states
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  // Simulation status states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationMode, setSimulationMode] = useState<'circuit' | 'code'>('circuit');
  const [ledStates, setLedStates] = useState<Record<string, boolean>>({});
  const [ledWarnings, setLedWarnings] = useState<Record<string, string>>({});
  const [buzzerStates, setBuzzerStates] = useState<Record<string, boolean>>({});
  const [servoAngles, setServoAngles] = useState<Record<string, number>>({});
  const [motorSpeeds, setMotorSpeeds] = useState<Record<string, number>>({});
  const [lcdLines, setLcdLines] = useState<Record<string, [string, string]>>({});
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [digitalPins, setDigitalPins] = useState<Record<string, number>>({});
  const [analogPins, setAnalogPins] = useState<Record<string, number>>({});

  // Undo/Redo History Stacks
  const [history, setHistory] = useState<ProjectState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Simulator Instance Reference
  const simulatorRef = useRef<CircuitSimulator | null>(null);

  // Push to history helper
  const pushHistory = (nextComps: ComponentInstance[], nextWires: Wire[]) => {
    const stateSnapshot: ProjectState = {
      components: nextComps,
      wires: nextWires,
      code,
      widgets,
    };

    // Slice off any redo history if we made a new action
    const slicedHistory = history.slice(0, historyIndex + 1);
    const nextHistory = [...slicedHistory, stateSnapshot];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const prevState = history[prevIdx];
      setComponents(prevState.components);
      setWires(prevState.wires);
      setCode(prevState.code);
      setWidgets(prevState.widgets);
      setSelectedId(null);
      if (simulatorRef.current) {
        simulatorRef.current.updateCircuit(prevState.components, prevState.wires);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const nextState = history[nextIdx];
      setComponents(nextState.components);
      setWires(nextState.wires);
      setCode(nextState.code);
      setWidgets(nextState.widgets);
      setSelectedId(null);
      if (simulatorRef.current) {
        simulatorRef.current.updateCircuit(nextState.components, nextState.wires);
      }
    }
  };

  // Initialize simulator
  useEffect(() => {
    simulatorRef.current = new CircuitSimulator((state: SimulationState) => {
      setLedStates(state.ledStates);
      setLedWarnings(state.ledWarnings);
      setBuzzerStates(state.buzzerStates);
      setServoAngles(state.servoAngles);
      setMotorSpeeds(state.motorSpeeds);
      setLcdLines(state.lcdLines);
      setSerialLogs(state.serialLogs);
      setValidationErrors(state.validationErrors);
      setDigitalPins(state.digitalPins);
      setAnalogPins(state.analogPins);
    });

    // Boot up with standard 'blink' template pre-loaded
    loadTemplatePreset('blink');
  }, []);

  // Update simulator when circuit changes
  useEffect(() => {
    if (simulatorRef.current) {
      simulatorRef.current.updateCircuit(components, wires);
    }
  }, [components, wires]);

  // Load a project template preset
  const loadTemplatePreset = (key: string) => {
    const template = CODE_PRESETS[key];
    if (template) {
      setComponents(template.components);
      setWires(template.wires);
      setCode(template.code);
      setWidgets(template.widgets || []);
      setSelectedId(null);
      
      // Initialize template index inside history
      const stateSnapshot: ProjectState = {
        components: template.components,
        wires: template.wires,
        code: template.code,
        widgets: template.widgets || [],
      };
      setHistory([stateSnapshot]);
      setHistoryIndex(0);

      if (simulatorRef.current) {
        simulatorRef.current.updateCircuit(template.components, template.wires);
      }
    }
  };

  // Add component to canvas center
  const handleAddComponent = (type: ComponentType) => {
    // Offset from center slightly if multiples placed
    const offset = components.length * 15;
    const newComp: ComponentInstance = {
      id: `${type}_${Date.now()}`,
      type,
      name: `${type.toUpperCase().replace('_', ' ')} ${components.length + 1}`,
      x: 300 + (offset % 100),
      y: 150 + (offset % 100),
      rotation: 0,
      color: type === 'led' ? '#ef4444' : undefined, // default Red for led
      value: type === 'resistor' ? 220 : undefined,
      state: type === 'gas_sensor' ? { sensorValue: 120 } : type === 'ldr' ? { sensorValue: 500 } : type === 'potentiometer' ? { sensorValue: 512 } : {},
    };

    const nextComps = [...components, newComp];
    setComponents(nextComps);
    pushHistory(nextComps, wires);
  };

  // Delete selection
  const handleDeleteSelected = () => {
    if (!selectedId) return;

    if (isWireSelected) {
      const nextWires = wires.filter(w => w.id !== selectedId);
      setWires(nextWires);
      pushHistory(components, nextWires);
    } else {
      const nextComps = components.filter(c => c.id !== selectedId);
      const nextWires = wires.filter(w => w.fromComponentId !== selectedId && w.toComponentId !== selectedId);
      setComponents(nextComps);
      setWires(nextWires);
      pushHistory(nextComps, nextWires);
    }
    setSelectedId(null);
  };

  // Rotate selection
  const handleRotateSelected = () => {
    if (!selectedId || isWireSelected) return;

    const nextComps = components.map(c => {
      if (c.id === selectedId) {
        return { ...c, rotation: ((c.rotation || 0) + 90) % 360 };
      }
      return c;
    });
    setComponents(nextComps);
    pushHistory(nextComps, wires);
  };

  // Adjust sensor slider value change
  const handleSensorValueChange = (compId: string, value: any) => {
    const nextComps = components.map(c => {
      if (c.id === compId) {
        return {
          ...c,
          state: {
            ...c.state,
            sensorValue: value,
          },
        };
      }
      return c;
    });
    setComponents(nextComps);
    // Don't clutter history stack with slider movements, but update simulation immediately
    if (simulatorRef.current) {
      simulatorRef.current.updateCircuit(nextComps, wires);
    }
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    pushHistory([], []);
  };

  // Start / Stop Simulation
  const handleToggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      simulatorRef.current?.stop();
    } else {
      setIsSimulating(true);
      simulatorRef.current?.start(code, simulationMode);
    }
  };

  // IoT Dashboard Switch Widget Toggle input interaction
  const handleWidgetInteraction = (pin: string, value: number) => {
    if (simulatorRef.current) {
      // Toggle virtual pin states in simulator
      setDigitalPins(prev => ({
        ...prev,
        [pin]: value,
      }));
      // In simulator state:
      (simulatorRef.current as any).state.digitalPins[pin] = value;
      (simulatorRef.current as any).evaluateElectricalNets();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#e8ebf0] font-sans antialiased text-slate-800">
      
      {/* 1. Header Toolbar Controls */}
      <Toolbar
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        simulationMode={simulationMode}
        onChangeSimulationMode={setSimulationMode}
        isCodeOpen={isCodeOpen}
        onToggleCode={() => setIsCodeOpen(!isCodeOpen)}
        activeWireColor={activeWireColor}
        onChangeWireColor={setActiveWireColor}
        onClearCanvas={handleClearCanvas}
        onRotateSelected={handleRotateSelected}
        onDeleteSelected={handleDeleteSelected}
        selectedId={selectedId}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* View Tabs switcher (Circuit Designer vs. IoT Dashboard) */}
      <div className="flex items-center space-x-1 px-4 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold select-none">
        <button
          onClick={() => setViewMode('circuit')}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md transition ${
            viewMode === 'circuit'
              ? 'bg-white shadow text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Circuit Designer</span>
        </button>
        <button
          onClick={() => setViewMode('dashboard')}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md transition ${
            viewMode === 'dashboard'
              ? 'bg-white shadow text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Blynk IoT Dashboard</span>
        </button>
      </div>

      {/* 2. Main content container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Components Library Sidebar on the Left (Only show in 'circuit' mode) */}
        {viewMode === 'circuit' && (
          <ComponentSidebar
            onAddComponent={handleAddComponent}
            isSimulating={isSimulating}
          />
        )}

        {/* View Workspace: Switch between Circuit canvas and Dashboard grid */}
        {viewMode === 'circuit' ? (
          <Canvas
            components={components}
            wires={wires}
            selectedId={selectedId}
            onSelect={(id, isWire = false) => {
              setSelectedId(id);
              setIsWireSelected(isWire);
            }}
            onUpdateComponents={setComponents}
            onUpdateWires={setWires}
            activeWireColor={activeWireColor}
            isSimulating={isSimulating}
            ledStates={ledStates}
            ledWarnings={ledWarnings}
            buzzerStates={buzzerStates}
            servoAngles={servoAngles}
            motorSpeeds={motorSpeeds}
            lcdLines={lcdLines}
            validationErrors={validationErrors}
            onValueChange={handleSensorValueChange}
            zoom={zoom}
            setZoom={setZoom}
            pushHistory={pushHistory}
          />
        ) : (
          <DashboardPanel
            widgets={widgets}
            onUpdateWidgets={(w) => {
              setWidgets(w);
              pushHistory(components, wires);
            }}
            digitalPins={digitalPins}
            analogPins={analogPins}
            serialLogs={serialLogs}
            components={components}
            isSimulating={isSimulating}
            onWidgetInteraction={handleWidgetInteraction}
          />
        )}

        {/* 3. Arduino Editor Code Panel on the Right */}
        {isCodeOpen && viewMode === 'circuit' && (
          <CodePanel
            code={code}
            onChangeCode={setCode}
            serialLogs={serialLogs}
            onClearSerial={() => setSerialLogs([])}
            onLoadTemplate={loadTemplatePreset}
            isSimulating={isSimulating}
          />
        )}
      </div>

      {/* Center instructions dialog */}
      {viewMode === 'circuit' && (
        <div className="absolute bottom-4 left-80 bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-xl text-[10.5px] text-slate-500 shadow-sm max-w-md select-none leading-relaxed pointer-events-none z-20 font-medium font-sans">
          🖱 Scroll to zoom &bull; Left-click drag background to pan &bull; Drag components to align &bull; Click pin to pin to connect wires &bull; Press <span className="font-bold text-slate-800 font-mono bg-slate-100 px-1 border rounded">R</span> to rotate selected.
        </div>
      )}
    </div>
  );
};
export default App;
