import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { ComponentSidebar, CanvasTool } from './components/ComponentSidebar';
import { Canvas } from './components/Canvas';
import { DashboardPanel, DEFAULT_DATASTREAMS } from './components/DashboardPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ArduinoIDEPanel } from './components/ArduinoIDEPanel';
import { CircuitCodePanel } from './components/CircuitCodePanel';
import { LoginScreen } from './components/LoginScreen';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { CODE_PRESETS } from './utils/codePresets';
import { COMPONENT_DEFINITIONS } from './utils/componentDefinitions';
import { parseBoardCodes, serializeBoardCodes, getProgrammableBoardIds, BoardCodeFiles, defaultSketchForBoard } from './utils/boardCodes';
import { suggestCodeForBoard } from './utils/componentCodeSnippets';
import { ComponentType, ComponentInstance, Wire, DashboardWidget, ProjectState, ViewMode, BoardType, BlynkDatastream } from './types';
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
  const [activeWireColor, setActiveWireColor] = useState('#3b82f6');
  const [manualWireColor, setManualWireColor] = useState(false);
  const [canvasTool, setCanvasTool] = useState<CanvasTool>('select');
  const [zoom, setZoom] = useState(100);
  const [pendingComponentType, setPendingComponentType] = useState<ComponentType | null>(null);

  const [boardCodes, setBoardCodes] = useState<BoardCodeFiles>({ activeBoardId: null, files: {} });
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [datastreams, setDatastreams] = useState<BlynkDatastream[]>([]);
  const [dashboardSetupStep, setDashboardSetupStep] = useState(0);

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

  const activeSketchCode = useMemo(() => {
    const ids = getProgrammableBoardIds(components);
    const activeId = boardCodes.activeBoardId || ids[0];
    if (activeId && boardCodes.files[activeId]) return boardCodes.files[activeId];
    return Object.values(boardCodes.files)[0] || '';
  }, [boardCodes, components]);

  const handleChangeWireColor = (color: string, manual = false) => {
    setActiveWireColor(color);
    if (manual) setManualWireColor(true);
  };

  const handleSetCanvasTool = (tool: CanvasTool) => {
    setCanvasTool(tool);
    if (tool === 'wire') {
      setPendingComponentType(null);
      setManualWireColor(false);
    } else if (tool === 'select') {
      setPendingComponentType(null);
    }
  };

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus('unsaved');
  }, []);

  const pushHistory = (nextComps: ComponentInstance[], nextWires: Wire[]) => {
    const stateSnapshot: ProjectState = {
      components: nextComps,
      wires: nextWires,
      code: serializeBoardCodes(boardCodes),
      widgets,
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
        circuitJson: JSON.stringify({ components, wires }),
        codeText: serializeBoardCodes(boardCodes),
        widgetsJson: JSON.stringify({ widgets, datastreams, setupStep: dashboardSetupStep }),
      });
      isDirtyRef.current = false;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  }, [projectId, projectName, boardType, components, wires, boardCodes, widgets, datastreams, dashboardSetupStep]);

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
  }, [components, wires, boardCodes, widgets, datastreams, dashboardSetupStep, boardType, projectName, projectId, phase, saveProject]);

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
    let parsedCodes: BoardCodeFiles = { activeBoardId: null, files: {} };

    try {
      const circuit = JSON.parse(project.circuitJson || '{}');
      if (Array.isArray(circuit)) {
        loadedComponents = circuit;
      } else {
        loadedComponents = circuit.components || [];
        loadedWires = circuit.wires || [];
      }
    } catch {
      loadedComponents = [];
    }

    parsedCodes = parseBoardCodes(project.codeText || '', getProgrammableBoardIds(loadedComponents), loadedComponents);

    setComponents(loadedComponents);
    setWires(loadedWires);
    setBoardCodes(parsedCodes);

    try {
      const parsed = JSON.parse(project.widgetsJson || '[]');
      if (Array.isArray(parsed)) {
        setWidgets(parsed);
        setDatastreams(DEFAULT_DATASTREAMS);
        setDashboardSetupStep(parsed.length > 0 ? 4 : 0);
      } else {
        setWidgets(parsed.widgets || []);
        setDatastreams(parsed.datastreams?.length ? parsed.datastreams : DEFAULT_DATASTREAMS);
        setDashboardSetupStep(parsed.setupStep ?? 0);
      }
    } catch {
      setWidgets([]);
      setDatastreams(DEFAULT_DATASTREAMS);
      setDashboardSetupStep(0);
    }

    setSelectedId(null);
    setIsWireSelected(false);
    setPendingComponentType(null);
    setIsSimulating(false);
    simulatorRef.current?.stop();

    const snapshot: ProjectState = {
      components: loadedComponents,
      wires: loadedWires,
      code: serializeBoardCodes(parsedCodes),
      widgets: JSON.parse(project.widgetsJson || '[]'),
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
    setBoardCodes(parseBoardCodes(template.code, getProgrammableBoardIds(template.components), template.components));
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
    name:
      type === 'arduino_uno'
        ? `Arduino Uno ${components.filter((c) => c.type === 'arduino_uno').length + 1}`
        : type === 'esp32'
          ? `ESP32 ${components.filter((c) => c.type === 'esp32').length + 1}`
          : `${COMPONENT_DEFINITIONS[type]?.name || type} ${components.length + 1}`,
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
              : type === 'dht11'
                ? { tempC: 25, humidity: 50 }
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

    if (type === 'arduino_uno' || type === 'esp32') {
      const suggested = suggestCodeForBoard(newComp.id, nextComps, wires);
      setBoardCodes((prev) => ({
        activeBoardId: newComp.id,
        files: { ...prev.files, [newComp.id]: suggested },
      }));
      if (type === 'esp32') setBoardType('esp32');
    }

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
      setBoardCodes(parseBoardCodes(prevState.code, getProgrammableBoardIds(prevState.components), prevState.components));
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
      setBoardCodes(parseBoardCodes(nextState.code, getProgrammableBoardIds(nextState.components), nextState.components));
      setWidgets(nextState.widgets);
      setSelectedId(null);
      simulatorRef.current?.updateCircuit(nextState.components, nextState.wires);
      markDirty();
    }
  };

  const validateBeforeSimulation = (): string[] => {
    const errors: string[] = [];
    const boardIds = getProgrammableBoardIds(components);
    const hasBoard = boardIds.length > 0;
    const hasPower = components.some((c) =>
      ['battery_9v', 'battery_aa', 'battery_coin'].includes(c.type),
    );
    if (!hasBoard) errors.push('Add an Arduino Uno or ESP32 board to the circuit.');
    if (!hasPower && wires.length > 0) {
      const hasPowerWire = wires.some((w) => {
        const fromPin = w.fromPinId;
        const toPin = w.toPinId;
        return fromPin.includes('5v') || fromPin.includes('vin') || toPin.includes('5v') || toPin.includes('plus');
      });
      if (!hasPowerWire) errors.push('Connect power (5V/VIN or battery) to run the circuit.');
    }
    boardIds.forEach((id) => {
      const code = boardCodes.files[id] || '';
      const comp = components.find((c) => c.id === id);
      const label = comp?.name || id;
      if (!code.trim()) errors.push(`Write code for ${label} before simulating.`);
      else if (!code.includes('void setup') || !code.includes('void loop')) {
        errors.push(`${label}: code must contain void setup() and void loop().`);
      }
    });
    if (!hasBoard && !activeSketchCode.trim()) errors.push('Write code in the Code panel before simulating.');
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
      simulatorRef.current?.start(activeSketchCode, 'code');
    }
  };

  const handleWidgetInteraction = (pin: string, value: number) => {
    const key = pin.toUpperCase();
    setDigitalPins((prev) => ({ ...prev, [pin]: value, [key]: value }));
    if (key.startsWith('V')) {
      simulatorRef.current?.setDigitalPin(key, value);
    } else {
      simulatorRef.current?.setDigitalPin(pin, value);
    }
  };

  const handleBoardCodesChange = (data: BoardCodeFiles) => {
    setBoardCodes(data);
    markDirty();
  };

  // Sync board code files when Arduinos added/removed
  useEffect(() => {
    const ids = getProgrammableBoardIds(components);
    setBoardCodes((prev) => {
      const files = { ...prev.files };
      ids.forEach((id) => {
        if (!files[id]) {
          const comp = components.find((c) => c.id === id);
          files[id] = defaultSketchForBoard((comp?.type as ComponentType) || 'arduino_uno');
        }
      });
      Object.keys(files).forEach((id) => { if (!ids.includes(id)) delete files[id]; });
      const extraFiles = { ...(prev.extraFiles || {}) };
      const activeTab = { ...(prev.activeTab || {}) };
      Object.keys(extraFiles).forEach((id) => { if (!ids.includes(id)) delete extraFiles[id]; });
      Object.keys(activeTab).forEach((id) => { if (!ids.includes(id)) delete activeTab[id]; });
      return {
        activeBoardId: prev.activeBoardId && ids.includes(prev.activeBoardId) ? prev.activeBoardId : ids[0] || null,
        files,
        extraFiles,
        activeTab,
      };
    });
  }, [components.length, components.map((c) => c.id).join(',')]);

  // Publish Blynk-style telemetry during simulation
  useEffect(() => {
    if (!isSimulating || !projectApiKey) return;
    const interval = setInterval(() => {
      const gas = components.find((c) => c.type === 'gas_sensor');
      const ldr = components.find((c) => c.type === 'ldr');
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: projectApiKey,
          data: {
            V0: gas?.state?.sensorValue ?? analogPins['A0'] ?? 0,
            V1: ldr?.state?.sensorValue ?? analogPins['A1'] ?? 0,
            V2: digitalPins['13'] ?? 0,
            A0: gas?.state?.sensorValue ?? analogPins['A0'] ?? 0,
            A1: ldr?.state?.sensorValue ?? analogPins['A1'] ?? 0,
            D13: digitalPins['13'] ?? 0,
          },
        }),
      }).catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [isSimulating, projectApiKey, components, analogPins, digitalPins]);

  const handleLogout = () => {
    localStorage.removeItem('studioiot_user');
    localStorage.removeItem('studioiot_token');
    setUser(null);
    setPhase('login');
  };

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
        onProjectNameChange={(name) => {
          setProjectName(name);
          markDirty();
        }}
        onBackToProjects={() => {
          if (isDirtyRef.current) saveProject();
          setPhase('projects');
        }}
        saveStatus={saveStatus}
        onManualSave={saveProject}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {viewMode === 'circuit' && (
          <ComponentSidebar
            onPickComponent={handleQueueComponent}
            pendingComponentType={pendingComponentType}
            canvasTool={canvasTool}
            onSetCanvasTool={handleSetCanvasTool}
            isSimulating={isSimulating}
          />
        )}

        {viewMode === 'circuit' && (
          <>
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <Canvas
              components={components}
              wires={wires}
              selectedId={selectedId}
            onSelect={(id, isWire = false) => {
              setSelectedId(id);
              setIsWireSelected(Boolean(id) && isWire);
              if (isWire && id) {
                setCanvasTool('select');
              }
              if (id && !isWire) {
                const comp = components.find((c) => c.id === id);
                if (comp && (comp.type === 'arduino_uno' || comp.type === 'esp32')) {
                  setBoardCodes((prev) => ({ ...prev, activeBoardId: id }));
                }
              }
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
              onChangeWireColor={handleChangeWireColor}
              onUpdateWire={handleUpdateWire}
              wireMode={canvasTool === 'wire'}
              manualWireColor={manualWireColor}
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
            </div>
            <CircuitCodePanel
              boardCodes={boardCodes}
              onChangeBoardCodes={handleBoardCodesChange}
              components={components}
              wires={wires}
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
            datastreams={datastreams}
            onUpdateDatastreams={(ds) => {
              setDatastreams(ds);
              markDirty();
            }}
            setupStep={dashboardSetupStep}
            onSetupStepChange={(step) => {
              setDashboardSetupStep(step);
              markDirty();
            }}
            digitalPins={digitalPins}
            analogPins={analogPins}
            serialLogs={serialLogs}
            components={components}
            isSimulating={isSimulating}
            onWidgetInteraction={handleWidgetInteraction}
            apiKey={projectApiKey}
            onChangeViewMode={setViewMode}
          />
        )}

        {viewMode === 'arduino' && (
          <ArduinoIDEPanel
            boardCodes={boardCodes}
            onChangeBoardCodes={handleBoardCodesChange}
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
          />
        )}
      </div>
    </div>
  );
};

export default App;
