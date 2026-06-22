import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ComponentInstance, ComponentType, Wire } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
import { findNearestPin, getPinAbsoluteCoords } from '../utils/pinCoords';
import { RealisticComponent } from './RealisticComponent';

interface CanvasProps {
  components: ComponentInstance[];
  wires: Wire[];
  selectedId: string | null;
  onSelect: (id: string | null, isWire?: boolean) => void;
  onUpdateComponents: (comps: ComponentInstance[]) => void;
  onUpdateWires: (wires: Wire[]) => void;
  activeWireColor: string;
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
}

const GRID_SIZE = 10;
const WIRE_SAG = 48;
const PIN_SNAP_DISTANCE = 20;

export { getPinAbsoluteCoords };

const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

const buildBezierPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
  const midY = Math.max(from.y, to.y) + WIRE_SAG;
  return `M ${from.x} ${from.y} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${to.y}`;
};

export const Canvas: React.FC<CanvasProps> = ({
  components,
  wires,
  selectedId,
  onSelect,
  onUpdateComponents,
  onUpdateWires,
  activeWireColor,
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
    const nextWires = [
      ...wires,
      {
        id: `wire_${Date.now()}`,
        fromComponentId: from.compId,
        fromPinId: from.pinId,
        toComponentId: to.compId,
        toPinId: to.pinId,
        color: activeWireColor,
      },
    ];
    onUpdateWires(nextWires);
    pushHistory(components, nextWires);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
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
  ]);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    setZoom(Math.max(20, Math.min(200, event.deltaY > 0 ? zoom - 5 : zoom + 5)));
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const canvasCoords = clientToCanvasCoords(event.clientX, event.clientY);
    setMousePos(canvasCoords);

    if (!pendingComponentType) {
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
        } else {
          connectPins(activeWiringSrc, pinHit);
          setActiveWiringSrc(null);
          setHoveredPin(null);
        }
        return;
      }
    }

    const componentElement = (event.target as Element).closest('[data-component-instance-id]');
    if (componentElement && !pendingComponentType && !activeWiringSrc) {
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
    const path = buildBezierPath(fromCoords, toCoords);
    const isSelected = selectedId === wire.id;

    return (
      <g key={wire.id} onClick={(event) => { event.stopPropagation(); onSelect(wire.id, true); }}>
        <path d={path} fill="none" stroke="transparent" strokeWidth="16" className="cursor-pointer" />
        {isSelected && <path d={path} fill="none" stroke="#2563eb" strokeWidth="8" opacity="0.35" />}
        <path d={path} fill="none" stroke={wire.color} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
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
    const path = buildBezierPath(startCoords, mousePos);
    const color = hoveredPin ? '#f59e0b' : activeWireColor;

    return (
      <path d={path} fill="none" stroke={color} strokeWidth="4" strokeDasharray="7 5" opacity="0.9" />
    );
  };

  const renderComponentLayer = () =>
    components.map((component) => {
      const definition = COMPONENT_DEFINITIONS[component.type];
      const isSelected = selectedId === component.id;
      const onboardLed13 =
        component.type === 'arduino_uno' &&
        (digitalPins['13'] === 1 || ledStates[component.id] === true);

      return (
        <g key={component.id} data-component-instance-id={component.id}>
          {isSelected && (
            <rect
              x={component.x - 4}
              y={component.y - 4}
              width={definition.width + 8}
              height={definition.height + 8}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeDasharray="5 4"
              rx="4"
              transform={`rotate(${component.rotation || 0}, ${component.x + definition.width / 2}, ${component.y + definition.height / 2})`}
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
      className="relative flex-1 overflow-hidden bg-[#c8ccd2] select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={finishInteraction}
      style={{ cursor: pendingComponentType ? 'copy' : isPanning ? 'grabbing' : isWiring ? 'crosshair' : 'default' }}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between border-b border-[#aeb4bc] bg-[#dfe3e8] px-4 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-semibold">
          <span className="uppercase tracking-widest text-slate-500">Workplane</span>
          {pendingComponentType && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
              Place {COMPONENT_DEFINITIONS[pendingComponentType].name}
            </span>
          )}
          {isWiring && (
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-sky-800">
              Click another pin to connect wire
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(Math.max(20, zoom - 10))} className="rounded bg-white px-2 py-1 shadow-sm">−</button>
          <span className="min-w-12 text-center font-mono">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="rounded bg-white px-2 py-1 shadow-sm">+</button>
          <button
            onClick={() => { setZoom(100); setPanX(40); setPanY(30); }}
            className="rounded bg-white px-2 py-1 shadow-sm"
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
          backgroundColor: '#c8ccd2',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE * (zoom / 100)}px ${GRID_SIZE * (zoom / 100)}px`,
          backgroundPosition: `${panX}px ${panY}px`,
        }}
      />

      <svg className="relative z-10 h-full w-full">
        <g transform={`translate(${panX}, ${panY + 44}) scale(${zoom / 100})`}>
          {renderComponentLayer()}
          {wires.map(renderWire)}
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
    </div>
  );
};
