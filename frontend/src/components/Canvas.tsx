import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ComponentInstance, ComponentType, Wire } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
import { findNearestPin, getPinAbsoluteCoords, collectPinHits, findPinDefinition } from '../utils/pinCoords';
import { buildWirePath, getPinHighlightColor, suggestWireColor, wireLaneIndex } from '../utils/wireUtils';
import { getSelectionBoundsForInstance } from '../utils/componentBounds';
import { RealisticComponent } from './RealisticComponent';
import { SimulationSensorPanel } from './SimulationSensorPanel';

interface CanvasProps {
  components: ComponentInstance[];
  wires: Wire[];
  selectedId: string | null;
  onSelect: (id: string | null, isWire?: boolean) => void;
  onUpdateComponents: (comps: ComponentInstance[]) => void;
  onUpdateWires: (wires: Wire[]) => void;
  activeWireColor: string;
  onChangeWireColor: (color: string, manual?: boolean) => void;
  isSimulating: boolean;
  ledStates: Record<string, boolean>;
  ledWarnings: Record<string, string>;
  buzzerStates: Record<string, boolean>;
  servoAngles: Record<string, number>;
  motorSpeeds: Record<string, number>;
  lcdLines: Record<string, [string, string]>;
  digitalPins: Record<string, number>;
  validationErrors?: string[];
  onValueChange: (id: string, val: unknown) => void;
  onComponentStateChange: (id: string, partialState: ComponentInstance['state']) => void;
  onReleaseMomentaryInputs: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pushHistory: (comps: ComponentInstance[], wires: Wire[]) => void;
  pendingComponentType: ComponentType | null;
  onPlaceComponent: (type: ComponentType, x: number, y: number) => void;
  onCancelPlacement: () => void;
  wireMode: boolean;
  manualWireColor: boolean;
}

const GRID_SIZE = 10;
const PIN_SNAP_DISTANCE = 18;

export { getPinAbsoluteCoords };

const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

export const Canvas: React.FC<CanvasProps> = ({
  components,
  wires,
  selectedId,
  onSelect,
  onUpdateComponents,
  onUpdateWires,
  activeWireColor,
  onChangeWireColor,
  isSimulating,
  ledStates,
  ledWarnings,
  buzzerStates,
  servoAngles,
  motorSpeeds,
  lcdLines,
  digitalPins,
  validationErrors = [],
  onValueChange,
  onComponentStateChange,
  onReleaseMomentaryInputs,
  zoom,
  setZoom,
  pushHistory,
  pendingComponentType,
  onPlaceComponent,
  onCancelPlacement,
  wireMode,
  manualWireColor,
}) => {
  const [panX, setPanX] = useState(40);
  const [panY, setPanY] = useState(30);
  const [isPanning, setIsPanning] = useState(false);
  const [draggedCompId, setDraggedCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeWiringSrc, setActiveWiringSrc] = useState<{ compId: string; pinId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<{ compId: string; pinId: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggedSnapshotRef = useRef<ComponentInstance[] | null>(null);

  const isWiring = Boolean(activeWiringSrc);

  const pendingPreview = useMemo(() => {
    if (!pendingComponentType) {
      return null;
    }
    const def = COMPONENT_DEFINITIONS[pendingComponentType];
    if (!def) {
      return null;
    }
    return {
      x: snapToGrid(mousePos.x - def.width / 2),
      y: snapToGrid(mousePos.y - def.height / 2),
      width: def.width,
      height: def.height,
      type: pendingComponentType,
    };
  }, [mousePos.x, mousePos.y, pendingComponentType]);

  const clientToCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) {
      return { x: clientX, y: clientY };
    }
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / (zoom / 100),
      y: (clientY - rect.top - panY - 44) / (zoom / 100),
    };
  };

  const finishInteraction = () => {
    if (draggedCompId && draggedSnapshotRef.current) {
      pushHistory(draggedSnapshotRef.current, wires);
    }
    draggedSnapshotRef.current = null;
    setDraggedCompId(null);
    setIsPanning(false);
    onReleaseMomentaryInputs();
  };

  const resolvePinFromEvent = (event: React.MouseEvent, canvasCoords: { x: number; y: number }) => {
    const target = event.target as Element;
    const pinElement = target.closest('[data-pin-id]');
    if (pinElement) {
      const compId = pinElement.getAttribute('data-component-id');
      const pinId = pinElement.getAttribute('data-pin-id');
      if (compId && pinId) {
        return { compId, pinId };
      }
    }
    const nearest = findNearestPin(components, canvasCoords, PIN_SNAP_DISTANCE);
    if (nearest) {
      return { compId: nearest.componentId, pinId: nearest.pinId };
    }
    return null;
  };

  const wireExists = (from: { compId: string; pinId: string }, to: { compId: string; pinId: string }) =>
    wires.some((wire) => {
      const same =
        wire.fromComponentId === from.compId &&
        wire.fromPinId === from.pinId &&
        wire.toComponentId === to.compId &&
        wire.toPinId === to.pinId;
      const opposite =
        wire.toComponentId === from.compId &&
        wire.toPinId === from.pinId &&
        wire.fromComponentId === to.compId &&
        wire.fromPinId === to.pinId;
      return same || opposite;
    });

  const connectPins = (from: { compId: string; pinId: string }, to: { compId: string; pinId: string }) => {
    if (from.compId === to.compId && from.pinId === to.pinId) {
      return;
    }
    if (wireExists(from, to)) {
      return;
    }

    const fromComp = components.find((c) => c.id === from.compId);
    const toComp = components.find((c) => c.id === to.compId);
    const fromPin = fromComp ? findPinDefinition(fromComp, from.pinId) : undefined;
    const toPin = toComp ? findPinDefinition(toComp, to.pinId) : undefined;
    const autoColor = suggestWireColor(fromPin?.type, toPin?.type);
    const wireColor = manualWireColor ? activeWireColor : autoColor;

    const nextWires = [
      ...wires,
      {
        id: `wire_${Date.now()}`,
        fromComponentId: from.compId,
        fromPinId: from.pinId,
        toComponentId: to.compId,
        toPinId: to.pinId,
        color: wireColor,
      },
    ];
    onUpdateWires(nextWires);
    if (!manualWireColor) onChangeWireColor(autoColor);
    pushHistory(components, nextWires);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (isSimulating) return;
      if (event.key === 'Escape') {
        if (activeWiringSrc) {
          setActiveWiringSrc(null);
          setHoveredPin(null);
        } else if (pendingComponentType) {
          onCancelPlacement();
        } else {
          onSelect(null);
        }
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        if (wires.some((wire) => wire.id === selectedId)) {
          const nextWires = wires.filter((wire) => wire.id !== selectedId);
          onUpdateWires(nextWires);
          pushHistory(components, nextWires);
        } else {
          const nextComps = components.filter((component) => component.id !== selectedId);
          const nextWires = wires.filter(
            (wire) => wire.fromComponentId !== selectedId && wire.toComponentId !== selectedId,
          );
          onUpdateComponents(nextComps);
          onUpdateWires(nextWires);
          pushHistory(nextComps, nextWires);
        }
        onSelect(null);
      }
      if ((event.key === 'r' || event.key === 'R') && selectedId && !wires.some((wire) => wire.id === selectedId)) {
        const nextComps = components.map((component) =>
          component.id === selectedId
            ? { ...component, rotation: ((component.rotation || 0) + 90) % 360 }
            : component,
        );
        onUpdateComponents(nextComps);
        pushHistory(nextComps, wires);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', finishInteraction);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', finishInteraction);
    };
  }, [
    activeWiringSrc,
    components,
    onCancelPlacement,
    onSelect,
    onUpdateComponents,
    onUpdateWires,
    pendingComponentType,
    pushHistory,
    selectedId,
    wires,
    isSimulating,
  ]);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    setZoom(Math.max(20, Math.min(200, event.deltaY > 0 ? zoom - 5 : zoom + 5)));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (isSimulating) return;
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      if (data.type) {
        const canvasCoords = clientToCanvasCoords(event.clientX, event.clientY);
        const def = COMPONENT_DEFINITIONS[data.type as ComponentType];
        onPlaceComponent(data.type, snapToGrid(canvasCoords.x - def.width / 2), snapToGrid(canvasCoords.y - def.height / 2));
      }
    } catch (err) {}
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (isSimulating) {
      onSelect(null);
      return;
    }

    const canvasCoords = clientToCanvasCoords(event.clientX, event.clientY);
    setMousePos(canvasCoords);

    if (!pendingComponentType && (wireMode || activeWiringSrc)) {
      const pinHit = resolvePinFromEvent(event, canvasCoords);
      if (pinHit) {
        event.stopPropagation();
        if (!activeWiringSrc) {
          setActiveWiringSrc(pinHit);
          const start = getPinAbsoluteCoords(
            components.find((c) => c.id === pinHit.compId)!,
            pinHit.pinId,
          );
          setMousePos(start);
          const srcComp = components.find((c) => c.id === pinHit.compId);
          const srcPin = srcComp ? findPinDefinition(srcComp, pinHit.pinId) : undefined;
          if (!manualWireColor) onChangeWireColor(suggestWireColor(srcPin?.type));
        } else {
          connectPins(activeWiringSrc, pinHit);
          setActiveWiringSrc(null);
          setHoveredPin(null);
        }
        return;
      }
    }

    const componentElement = (event.target as Element).closest('[data-component-instance-id]');
    if (componentElement && !pendingComponentType && !activeWiringSrc && !wireMode) {
      event.stopPropagation();
      const compId = componentElement.getAttribute('data-component-instance-id');
      if (!compId) {
        return;
      }
      const component = components.find((item) => item.id === compId);
      if (!component) {
        return;
      }
      onSelect(compId, false);
      setDraggedCompId(compId);
      setDragOffset({ x: canvasCoords.x - component.x, y: canvasCoords.y - component.y });
      return;
    }

    if (activeWiringSrc) {
      setActiveWiringSrc(null);
      setHoveredPin(null);
      return;
    }

    if (pendingComponentType) {
      const definition = COMPONENT_DEFINITIONS[pendingComponentType];
      onPlaceComponent(
        pendingComponentType,
        snapToGrid(canvasCoords.x - definition.width / 2),
        snapToGrid(canvasCoords.y - definition.height / 2),
      );
      return;
    }

    onSelect(null);
    setIsPanning(true);
    panStartRef.current = { x: event.clientX - panX, y: event.clientY - panY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const canvasCoords = clientToCanvasCoords(event.clientX, event.clientY);
    setMousePos(canvasCoords);

    if (activeWiringSrc) {
      const nearest = findNearestPin(components, canvasCoords, PIN_SNAP_DISTANCE, {
        componentId: activeWiringSrc.compId,
        pinId: activeWiringSrc.pinId,
      });
      setHoveredPin(nearest ? { compId: nearest.componentId, pinId: nearest.pinId } : null);
      if (nearest) {
        setMousePos({ x: nearest.x, y: nearest.y });
      }
      return;
    }

    if (isPanning) {
      setPanX(event.clientX - panStartRef.current.x);
      setPanY(event.clientY - panStartRef.current.y);
      return;
    }

    if (draggedCompId) {
      if (isSimulating) return;
      const nextComps = components.map((component) =>
        component.id === draggedCompId
          ? {
              ...component,
              x: snapToGrid(canvasCoords.x - dragOffset.x),
              y: snapToGrid(canvasCoords.y - dragOffset.y),
            }
          : component,
      );
      draggedSnapshotRef.current = nextComps;
      onUpdateComponents(nextComps);
    }
  };

  const renderWire = (wire: Wire) => {
    const fromComp = components.find((component) => component.id === wire.fromComponentId);
    const toComp = components.find((component) => component.id === wire.toComponentId);
    if (!fromComp || !toComp) {
      return null;
    }

    const fromCoords = getPinAbsoluteCoords(fromComp, wire.fromPinId);
    const toCoords = getPinAbsoluteCoords(toComp, wire.toPinId);
    const path = buildWirePath(fromCoords, toCoords, wireLaneIndex(wire.id));
    const isSelected = selectedId === wire.id;
    const isAlligator = wire.wireType === 'alligator';
    const isRetractable = wire.wireType === 'retractable';
    const strokeW = isAlligator ? 5 : isRetractable ? 2.5 : 3;

    return (
      <g key={wire.id} onClick={(event) => { event.stopPropagation(); onSelect(wire.id, true); }}>
        <path d={path} fill="none" stroke="transparent" strokeWidth="18" className="cursor-pointer" />
        {isSelected && <path d={path} fill="none" stroke="#2563eb" strokeWidth={strokeW + 5} opacity="0.22" strokeLinecap="round" />}
        <path
          d={path}
          fill="none"
          stroke={wire.color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isRetractable ? '6 4' : 'none'}
          opacity={0.95}
          filter={isSelected ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' : undefined}
        />
        <circle cx={fromCoords.x} cy={fromCoords.y} r={isAlligator ? 4.5 : 3} fill={wire.color} stroke="#fff" strokeWidth="1.2" pointerEvents="none" />
        <circle cx={toCoords.x} cy={toCoords.y} r={isAlligator ? 4.5 : 3} fill={wire.color} stroke="#fff" strokeWidth="1.2" pointerEvents="none" />
      </g>
    );
  };

  const renderPinHighlights = () => {
    if (!activeWiringSrc && !hoveredPin) return null;

    const pins = collectPinHits(components);
    return pins.map((pin) => {
      const def = COMPONENT_DEFINITIONS[components.find((c) => c.id === pin.componentId)?.type || 'led'];
      const pinDef = def?.pins.find((p) => p.id === pin.pinId);
      const isSource =
        activeWiringSrc &&
        pin.componentId === activeWiringSrc.compId &&
        pin.pinId === activeWiringSrc.pinId;
      const isTarget =
        hoveredPin &&
        pin.componentId === hoveredPin.compId &&
        pin.pinId === hoveredPin.pinId;
      if (!isSource && !isTarget && !activeWiringSrc) return null;

      let role: 'source' | 'target' | 'hover' = 'hover';
      if (isSource) role = 'source';
      else if (isTarget) role = 'target';
      else if (!activeWiringSrc) return null;

      const color = getPinHighlightColor(pinDef?.type, role);
      const radius = isSource || isTarget ? 8 : 0;

      if (radius === 0) return null;

      return (
        <g key={`${pin.componentId}-${pin.pinId}`} pointerEvents="none">
          <circle cx={pin.x} cy={pin.y} r={radius + 4} fill={color} opacity="0.2" />
          <circle cx={pin.x} cy={pin.y} r={radius} fill="none" stroke={color} strokeWidth="2.5" />
        </g>
      );
    });
  };

  const renderActiveWire = () => {
    if (!activeWiringSrc) {
      return null;
    }
    const source = components.find((component) => component.id === activeWiringSrc.compId);
    if (!source) {
      return null;
    }
    const startCoords = getPinAbsoluteCoords(source, activeWiringSrc.pinId);
    const endCoords = hoveredPin
      ? getPinAbsoluteCoords(
          components.find((c) => c.id === hoveredPin.compId)!,
          hoveredPin.pinId,
        )
      : mousePos;
    const path = buildWirePath(startCoords, endCoords, wireLaneIndex('preview'));
    const previewPin = findPinDefinition(source, activeWiringSrc.pinId);
    const color = hoveredPin ? '#f59e0b' : (manualWireColor ? activeWireColor : suggestWireColor(previewPin?.type));

    return (
      <path d={path} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray="8 4" opacity="0.85" strokeLinecap="round" />
    );
  };

  const renderComponentLayer = () =>
    components.map((component) => {
      const bounds = getSelectionBoundsForInstance(component);
      const isSelected = selectedId === component.id;
      const onboardLed13 =
        component.type === 'arduino_uno' &&
        (digitalPins['13'] === 1 || ledStates[component.id] === true);
      const rotCx = component.x + bounds.cx;
      const rotCy = component.y + bounds.cy;

      return (
        <g key={component.id} data-component-instance-id={component.id}>
          {isSelected && (
            <rect
              x={component.x + bounds.ox - 4}
              y={component.y + bounds.oy - 4}
              width={bounds.width + 8}
              height={bounds.height + 8}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeDasharray="5 4"
              rx="4"
              transform={`rotate(${component.rotation || 0}, ${rotCx}, ${rotCy})`}
              pointerEvents="none"
            />
          )}
          <RealisticComponent
            instance={component}
            onboardLed13={onboardLed13}
            ledState={ledStates[component.id]}
            ledWarning={ledWarnings[component.id]}
            buzzerState={buzzerStates[component.id]}
            servoAngle={servoAngles[component.id]}
            motorSpeed={motorSpeeds[component.id]}
            lcdText={lcdLines[component.id]}
            onValueChange={onValueChange}
            onComponentStateChange={onComponentStateChange}
            isSimulating={isSimulating}
          />
        </g>
      );
    });

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-slate-200 select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={finishInteraction}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: isSimulating ? 'default' : pendingComponentType ? 'copy' : wireMode || isWiring ? 'crosshair' : isPanning ? 'grabbing' : 'default' }}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between border-b border-slate-200 bg-white/95 px-4 text-xs text-slate-700 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 font-semibold">
          <span className="uppercase tracking-widest text-slate-500">Workplane</span>
          {isSimulating && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">Simulation active</span>
          )}
          {pendingComponentType && !isSimulating && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
              Place {COMPONENT_DEFINITIONS[pendingComponentType].name}
            </span>
          )}
          {wireMode && !isSimulating && !isWiring && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
              Wire mode — click two pins
            </span>
          )}
          {isWiring && (
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-sky-800">
              Click destination pin to connect
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setZoom(Math.max(20, zoom - 10))} className="rounded bg-white px-2 py-1 shadow-sm">−</button>
          <span className="min-w-12 text-center font-mono">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="rounded border border-slate-200 bg-white px-2 py-1 shadow-sm">+</button>
          <button
            onClick={() => { setZoom(100); setPanX(40); setPanY(30); }}
            className="rounded border border-slate-200 bg-white px-2 py-1 shadow-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {isSimulating && validationErrors.length > 0 && (
        <div className="absolute left-1/2 top-14 z-30 w-full max-w-xl -translate-x-1/2 space-y-2 px-4">
          {validationErrors.map((error, index) => (
            <div key={`${error}-${index}`} className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          ))}
        </div>
      )}

      <div
        className="absolute inset-0 mt-11"
        style={{
          backgroundColor: '#dbe3ea',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE * (zoom / 100)}px ${GRID_SIZE * (zoom / 100)}px`,
          backgroundPosition: `${panX}px ${panY}px`,
        }}
      />

      <svg className="relative z-10 h-full w-full" style={{ overflow: 'visible' }}>
        <g transform={`translate(${panX}, ${panY + 44}) scale(${zoom / 100})`}>
          {renderComponentLayer()}
          {wires.map(renderWire)}
          {renderPinHighlights()}
          {renderActiveWire()}
          {pendingPreview && (
            <g opacity="0.45" pointerEvents="none">
              <RealisticComponent
                instance={{
                  id: 'preview',
                  type: pendingPreview.type,
                  name: COMPONENT_DEFINITIONS[pendingPreview.type].name,
                  x: pendingPreview.x,
                  y: pendingPreview.y,
                  rotation: 0,
                }}
                isSimulating={false}
              />
            </g>
          )}
        </g>
      </svg>

      <SimulationSensorPanel
        components={components}
        onValueChange={onValueChange}
        onComponentStateChange={onComponentStateChange}
        isSimulating={isSimulating}
      />
    </div>
  );
};
