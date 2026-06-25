import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { ComponentSidebar } from './components/ComponentSidebar';
import { Canvas } from './components/Canvas';
import { DashboardPanel } from './components/DashboardPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ArduinoIDEPanel } from './components/ArduinoIDEPanel';
import { LoginScreen } from './components/LoginScreen';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { CODE_PRESETS } from './utils/codePresets';
import { ComponentType, ComponentInstance, Wire, DashboardWidget, ProjectState, ViewMode, BoardType } from './types';
import { CircuitSimulator, SimulationState } from './simulation/circuitSimulator';
import { api, ProjectRecord, User } from './services/api';

type AppPhase = 'login' | 'projects' | 'editor';

export const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(() =>
    localStorage.getItem('studioiot_user') ? 'projects' : 'login',
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('studioiot_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectApiKey, setProjectApiKey] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [boardType, setBoardType] = useState<BoardType>('arduino_uno');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  const [viewMode, setViewMode] = useState<ViewMode>('circuit');
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isWireSelected, setIsWireSelected] = useState(false);
  const [activeWireColor, setActiveWireColor] = useState('#ef4444');
  const [zoom, setZoom] = useState(100);
  const [pendingComponentType, setPendingComponentType] = useState<ComponentType | null>(null);

  const [code, setCode] = useState('');
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [componentNotes, setComponentNotes] = useState<Record<string, string>>({});

  const [isSimulating, setIsSimulating] = useState(false);
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

  const [history, setHistory] = useState<ProjectState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const simulatorRef = useRef<CircuitSimulator | null>(null);
  const arduinoUploadRef = useRef<(() => void) | null>(null);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus('unsaved');
  }, []);

  const pushHistory = (nextComps: ComponentInstance[], nextWires: Wire[]) => {
    const stateSnapshot: ProjectState = {
      components: nextComps,
      wires: nextWires,
      code,
      widgets,
      componentNotes,
      boardType,
    };
    const slicedHistory = history.slice(0, historyIndex + 1);
    const nextHistory = [...slicedHistory, stateSnapshot];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    markDirty();
  };

  const saveProject = useCallback(async () => {
    if (!projectId) return;
    setSaveStatus('saving');
    try {
      await api.updateProject(projectId, {
        name: projectName,
        boardType,
        circuitJson: JSON.stringify({ components, wires, componentNotes }),
        codeText: code,
        widgetsJson: JSON.stringify(widgets),
        notesJson: JSON.stringify(componentNotes),
      });
      isDirtyRef.current = false;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  }, [projectId, projectName, boardType, components, wires, code, widgets, componentNotes]);

  useEffect(() => {
    if (!projectId || phase !== 'editor') return;
    if (!isDirtyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProject();
    }, 2500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [components, wires, code, widgets, componentNotes, boardType, projectName, projectId, phase, saveProject]);

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
  }, []);

  useEffect(() => {
    simulatorRef.current?.updateCircuit(components, wires);
  }, [components, wires]);

  const loadProjectData = (project: ProjectRecord) => {
    setProjectId(project.id);
    setProjectApiKey(project.apiKey || null);
    setProjectName(project.name);
    setBoardType((project.boardType as BoardType) || 'arduino_uno');

    let loadedComponents: ComponentInstance[] = [];
    let loadedWires: Wire[] = [];
    let loadedNotes: Record<string, string> = {};

    try {
      const circuit = JSON.parse(project.circuitJson || '{}');
      if (Array.isArray(circuit)) {
        loadedComponents = circuit;
      } else {
        loadedComponents = circuit.components || [];
        loadedWires = circuit.wires || [];
        loadedNotes = circuit.componentNotes || {};
      }
    } catch {
      loadedComponents = [];
    }

    try {
      if (Object.keys(loadedNotes).length === 0) {
        loadedNotes = JSON.parse(project.notesJson || '{}');
      }
    } catch {
      loadedNotes = {};
    }

    setComponents(loadedComponents);
    setWires(loadedWires);
    setComponentNotes(loadedNotes);
    setCode(project.codeText || '');

    try {
      setWidgets(JSON.parse(project.widgetsJson || '[]'));
    } catch {
      setWidgets([]);
    }

    setSelectedId(null);
    setIsWireSelected(false);
    setPendingComponentType(null);
    setIsSimulating(false);
    simulatorRef.current?.stop();

    const snapshot: ProjectState = {
      components: loadedComponents,
      wires: loadedWires,
      code: project.codeText || '',
      widgets: JSON.parse(project.widgetsJson || '[]'),
      componentNotes: loadedNotes,
      boardType: (project.boardType as BoardType) || 'arduino_uno',
    };
    setHistory([snapshot]);
    setHistoryIndex(0);
    isDirtyRef.current = false;
    setSaveStatus('saved');
    setPhase('editor');
    setViewMode('circuit');

    simulatorRef.current?.updateCircuit(loadedComponents, loadedWires);
  };

  const loadTemplatePreset = (key: string) => {
    const template = CODE_PRESETS[key];
    if (!template) return;
    setComponents(template.components);
    setWires(template.wires);
    setCode(template.code);
    setWidgets(template.widgets || []);
    setSelectedId(null);
    setIsWireSelected(false);
    setPendingComponentType(null);
    const stateSnapshot: ProjectState = {
      components: template.components,
      wires: template.wires,
      code: template.code,
      widgets: template.widgets || [],
    };
    setHistory([stateSnapshot]);
    setHistoryIndex(0);
    simulatorRef.current?.updateCircuit(template.components, template.wires);
    markDirty();
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
            : type === 'ultrasonic'
              ? { sensorValue: 50 }
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

  const handleDeleteSelected = () => {
    if (!selectedId || isSimulating) return;
    if (isWireSelected) {
      const nextWires = wires.filter((w) => w.id !== selectedId);
      setWires(nextWires);
      pushHistory(components, nextWires);
    } else {
      const nextComps = components.filter((c) => c.id !== selectedId);
      const nextWires = wires.filter((w) => w.fromComponentId !== selectedId && w.toComponentId !== selectedId);
      setComponents(nextComps);
      setWires(nextWires);
      pushHistory(nextComps, nextWires);
    }
    setSelectedId(null);
  };

  const handleRotateSelected = () => {
    if (!selectedId || isWireSelected || isSimulating) return;
    const nextComps = components.map((c) =>
      c.id === selectedId ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 } : c,
    );
    setComponents(nextComps);
    pushHistory(nextComps, wires);
  };

  const handleSensorValueChange = (compId: string, value: unknown) => {
    const nextComps = components.map((c) =>
      c.id === compId ? { ...c, state: { ...c.state, sensorValue: value as number } } : c,
    );
    setComponents(nextComps);
    simulatorRef.current?.updateCircuit(nextComps, wires);
  };

  const handleComponentStateChange = (compId: string, partialState: ComponentInstance['state']) => {
    const nextComps = components.map((c) =>
      c.id === compId ? { ...c, state: { ...c.state, ...partialState } } : c,
    );
    setComponents(nextComps);
    simulatorRef.current?.updateCircuit(nextComps, wires);
  };

  const handleUpdateComponent = (id: string, updates: Partial<ComponentInstance>) => {
    const nextComps = components.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setComponents(nextComps);
    pushHistory(nextComps, wires);
    simulatorRef.current?.updateCircuit(nextComps, wires);
  };

  const handleUpdateWire = (id: string, updates: Partial<Wire>) => {
    const nextWires = wires.map((w) => (w.id === id ? { ...w, ...updates } : w));
    setWires(nextWires);
    pushHistory(components, nextWires);
  };

  const handleReleaseMomentaryInputs = () => {
    const hasActiveButton = components.some((c) => c.type === 'push_button' && c.state?.active);
    if (!hasActiveButton) return;
    const nextComps = components.map((c) =>
      c.type === 'push_button' && c.state?.active ? { ...c, state: { ...c.state, active: false } } : c,
    );
    setComponents(nextComps);
    simulatorRef.current?.updateCircuit(nextComps, wires);
  };

  const handleClearCanvas = () => {
    if (isSimulating) return;
    setComponents([]);
    setWires([]);
    setSelectedId(null);
    setIsWireSelected(false);
    setPendingComponentType(null);
    pushHistory([], []);
  };

  const handleUndo = () => {
    if (historyIndex > 0 && !isSimulating) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const prevState = history[prevIdx];
      setComponents(prevState.components);
      setWires(prevState.wires);
      setCode(prevState.code);
      setWidgets(prevState.widgets);
      setSelectedId(null);
      simulatorRef.current?.updateCircuit(prevState.components, prevState.wires);
      markDirty();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && !isSimulating) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const nextState = history[nextIdx];
      setComponents(nextState.components);
      setWires(nextState.wires);
      setCode(nextState.code);
      setWidgets(nextState.widgets);
      setSelectedId(null);
      simulatorRef.current?.updateCircuit(nextState.components, nextState.wires);
      markDirty();
    }
  };

  const validateBeforeSimulation = (): string[] => {
    const errors: string[] = [];
    const hasBoard = components.some((c) => c.type === 'arduino_uno');
    const hasPower = components.some((c) =>
      ['battery_9v', 'battery_aa', 'battery_coin'].includes(c.type),
    );
    if (!hasBoard) errors.push('Add an Arduino Uno board to the circuit.');
    if (!hasPower && wires.length > 0) {
      const hasPowerWire = wires.some((w) => {
        const fromPin = w.fromPinId;
        const toPin = w.toPinId;
        return fromPin.includes('5v') || fromPin.includes('vin') || toPin.includes('5v') || toPin.includes('plus');
      });
      if (!hasPowerWire) errors.push('Connect power (5V/VIN or battery) to run the circuit.');
    }
    if (!code.trim()) errors.push('Write code in the Arduino IDE tab before simulating.');
    if (!code.includes('void setup') || !code.includes('void loop')) {
      errors.push('Code must contain void setup() and void loop().');
    }
    return errors;
  };

  const handleToggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      simulatorRef.current?.stop();
    } else {
      const errors = validateBeforeSimulation();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors([]);
      setIsSimulating(true);
      simulatorRef.current?.start(code, 'code');
    }
  };

  const handleWidgetInteraction = (pin: string, value: number) => {
    setDigitalPins((prev) => ({ ...prev, [pin]: value }));
    simulatorRef.current?.setDigitalPin(pin, value);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    markDirty();
  };

  const handleUpdateComponentNote = (compId: string, note: string) => {
    setComponentNotes((prev) => ({ ...prev, [compId]: note }));
    markDirty();
  };

  const handleLogout = () => {
    localStorage.removeItem('studioiot_user');
    localStorage.removeItem('studioiot_token');
    setUser(null);
    setPhase('login');
  };

  const hasArduino = components.some((c) => c.type === 'arduino_uno');
  const hasWiresToBoard = wires.some((w) => {
    const fromComp = components.find((c) => c.id === w.fromComponentId);
    const toComp = components.find((c) => c.id === w.toComponentId);
    return fromComp?.type === 'arduino_uno' || toComp?.type === 'arduino_uno';
  });

  const selectedComponent = viewMode === 'circuit' && !isWireSelected ? components.find((c) => c.id === selectedId) || null : null;
  const selectedWire = viewMode === 'circuit' && isWireSelected ? wires.find((w) => w.id === selectedId) || null : null;

  if (phase === 'login') {
    return (
      <LoginScreen
        onLogin={(u) => {
          setUser(u);
          setPhase('projects');
        }}
      />
    );
  }

  if (phase === 'projects') {
    return (
      <ProjectsDashboard
        user={user!}
        onOpenProject={loadProjectData}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      <Toolbar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        onClearCanvas={handleClearCanvas}
        onRotateSelected={handleRotateSelected}
        onDeleteSelected={handleDeleteSelected}
        selectedId={selectedId}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        projectName={projectName}
        onBackToProjects={() => {
          if (isDirtyRef.current) saveProject();
          setPhase('projects');
        }}
        saveStatus={saveStatus}
        onManualSave={saveProject}
        onUploadToBoard={() => arduinoUploadRef.current?.()}
        canUpload={hasArduino && hasWiresToBoard && Boolean(code.trim())}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {viewMode === 'circuit' && (
          <ComponentSidebar
            onPickComponent={handleQueueComponent}
            pendingComponentType={pendingComponentType}
            isSimulating={isSimulating}
          />
        )}

        {viewMode === 'circuit' && (
          <>
            <Canvas
              components={components}
              wires={wires}
              selectedId={selectedId}
              onSelect={(id, isWire = false) => {
                setSelectedId(id);
                setIsWireSelected(Boolean(id) && isWire);
              }}
              onUpdateComponents={(comps) => {
                if (!isSimulating) {
                  setComponents(comps);
                  markDirty();
                }
              }}
              onUpdateWires={(w) => {
                if (!isSimulating) {
                  setWires(w);
                  markDirty();
                }
              }}
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
              isSimulating={isSimulating}
            />
          </>
        )}

        {viewMode === 'dashboard' && (
          <DashboardPanel
            widgets={widgets}
            onUpdateWidgets={(w) => {
              setWidgets(w);
              markDirty();
            }}
            digitalPins={digitalPins}
            analogPins={analogPins}
            serialLogs={serialLogs}
            components={components}
            isSimulating={isSimulating}
            onWidgetInteraction={handleWidgetInteraction}
            apiKey={projectApiKey}
          />
        )}

        {viewMode === 'arduino' && (
          <ArduinoIDEPanel
            code={code}
            onChangeCode={handleCodeChange}
            serialLogs={serialLogs}
            onClearSerial={() => setSerialLogs([])}
            boardType={boardType}
            onChangeBoardType={(b) => {
              setBoardType(b as BoardType);
              markDirty();
            }}
            components={components}
            wires={wires}
            isSimulating={isSimulating}
            projectName={projectName}
            componentNotes={componentNotes}
            onUpdateComponentNote={handleUpdateComponentNote}
            uploadRef={arduinoUploadRef}
          />
        )}
      </div>
    </div>
  );
};

export default App;
