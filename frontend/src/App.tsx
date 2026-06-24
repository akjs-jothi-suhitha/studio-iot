import React, { useState, useEffect, useRef } from 'react';
import { Toolbar } from './components/Toolbar';
import { ComponentSidebar } from './components/ComponentSidebar';
import { Canvas } from './components/Canvas';
import { CodePanel } from './components/CodePanel';
import { DashboardPanel } from './components/DashboardPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { CODE_PRESETS } from './utils/codePresets';
import { ComponentType, ComponentInstance, Wire, DashboardWidget, ProjectState } from './types';
import { CircuitSimulator, SimulationState } from './simulation/circuitSimulator';

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
  const [pendingComponentType, setPendingComponentType] = useState<ComponentType | null>(null);

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
      setIsWireSelected(false);
      setPendingComponentType(null);
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
      setIsWireSelected(false);
      setPendingComponentType(null);
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
      setIsWireSelected(false);
      setPendingComponentType(null);
      
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

  const buildComponentInstance = (type: ComponentType, x: number, y: number): ComponentInstance => ({
    id: `${type}_${Date.now()}`,
    type,
    name: `${type.toUpperCase().replace('_', ' ')} ${components.length + 1}`,
    x,
    y,
    rotation: 0,
    color: type === 'led' ? '#ef4444' : undefined,
    value: type === 'resistor' ? 220 : undefined,
    state:
      type === 'gas_sensor'
        ? { sensorValue: 120 }
        : type === 'ldr'
          ? { sensorValue: 500 }
          : type === 'potentiometer'
            ? { sensorValue: 512 }
            : {},
  });

  const handleQueueComponent = (type: ComponentType) => {
    setPendingComponentType(type);
    setSelectedId(null);
    setIsWireSelected(false);
  };

  const handlePlaceComponent = (type: ComponentType, x: number, y: number) => {
    const newComp = buildComponentInstance(type, x, y);
    const nextComps = [...components, newComp];
    setComponents(nextComps);
    setSelectedId(newComp.id);
    setIsWireSelected(false);
    setPendingComponentType(null);
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

  const handleComponentStateChange = (compId: string, partialState: ComponentInstance['state']) => {
    const nextComps = components.map(c => {
      if (c.id === compId) {
        return {
          ...c,
          state: {
            ...c.state,
            ...partialState,
          },
        };
      }
      return c;
    });

    setComponents(nextComps);
    if (simulatorRef.current) {
      simulatorRef.current.updateCircuit(nextComps, wires);
    }
  };

  const handleUpdateComponent = (id: string, updates: Partial<ComponentInstance>) => {
    const nextComps = components.map(c => c.id === id ? { ...c, ...updates } : c);
    setComponents(nextComps);
    pushHistory(nextComps, wires);
    if (simulatorRef.current) {
      simulatorRef.current.updateCircuit(nextComps, wires);
    }
  };

  const handleUpdateWire = (id: string, updates: Partial<Wire>) => {
    const nextWires = wires.map(w => w.id === id ? { ...w, ...updates } : w);
    setWires(nextWires);
    pushHistory(components, nextWires);
  };

  const handleReleaseMomentaryInputs = () => {
    const hasActiveButton = components.some(c => c.type === 'push_button' && c.state?.active);
    if (!hasActiveButton) {
      return;
    }

    const nextComps = components.map(c => {
      if (c.type === 'push_button' && c.state?.active) {
        return {
          ...c,
          state: {
            ...c.state,
            active: false,
          },
        };
      }
      return c;
    });

    setComponents(nextComps);
    if (simulatorRef.current) {
      simulatorRef.current.updateCircuit(nextComps, wires);
    }
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setIsWireSelected(false);
    setPendingComponentType(null);
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
      simulatorRef.current.setDigitalPin(pin, value);
    }
  };

  const selectedComponent = viewMode === 'circuit' && !isWireSelected ? components.find(c => c.id === selectedId) || null : null;
  const selectedWire = viewMode === 'circuit' && isWireSelected ? wires.find(w => w.id === selectedId) || null : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      <Toolbar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        simulationMode={simulationMode}
        onChangeSimulationMode={setSimulationMode}
        isCodeOpen={isCodeOpen}
        onToggleCode={() => setIsCodeOpen(!isCodeOpen)}
        onClearCanvas={handleClearCanvas}
        onRotateSelected={handleRotateSelected}
        onDeleteSelected={handleDeleteSelected}
        selectedId={selectedId}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {viewMode === 'circuit' && (
          <ComponentSidebar
            onPickComponent={handleQueueComponent}
            pendingComponentType={pendingComponentType}
            isSimulating={isSimulating}
          />
        )}

        {viewMode === 'circuit' ? (
          <>
          <Canvas
            components={components}
            wires={wires}
            selectedId={selectedId}
            onSelect={(id, isWire = false) => {
              setSelectedId(id);
              setIsWireSelected(Boolean(id) && isWire);
            }}
            onUpdateComponents={setComponents}
            onUpdateWires={setWires}
            activeWireColor={activeWireColor}
            onChangeWireColor={setActiveWireColor}
            isSimulating={isSimulating}
            ledStates={ledStates}
            ledWarnings={ledWarnings}
            buzzerStates={buzzerStates}
            servoAngles={servoAngles}
            motorSpeeds={motorSpeeds}
            lcdLines={lcdLines}
            digitalPins={digitalPins}
            validationErrors={validationErrors}
            onValueChange={handleSensorValueChange}
            onComponentStateChange={handleComponentStateChange}
            onReleaseMomentaryInputs={handleReleaseMomentaryInputs}
            zoom={zoom}
            setZoom={setZoom}
            pushHistory={pushHistory}
            pendingComponentType={pendingComponentType}
            onPlaceComponent={handlePlaceComponent}
            onCancelPlacement={() => setPendingComponentType(null)}
          />
          <PropertiesPanel
            selectedComponent={selectedComponent}
            selectedWire={selectedWire}
            onUpdateComponent={handleUpdateComponent}
            onUpdateWire={handleUpdateWire}
            onDeleteSelected={handleDeleteSelected}
          />
        </>
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

        {isCodeOpen && viewMode === 'circuit' && (
          <CodePanel
            code={code}
            onChangeCode={setCode}
            serialLogs={serialLogs}
            onClearSerial={() => setSerialLogs([])}
            onLoadTemplate={loadTemplatePreset}
            onClose={() => setIsCodeOpen(false)}
            isSimulating={isSimulating}
          />
        )}
      </div>
    </div>
  );
};
export default App;
