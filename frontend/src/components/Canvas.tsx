import React, { useState, useRef, useEffect } from 'react';
import { ComponentInstance, Wire } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
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
  validationErrors?: string[];
  onValueChange: (id: string, val: any) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pushHistory: (comps: ComponentInstance[], wires: Wire[]) => void;
}

// Helper to calculate absolute canvas pin coordinates under rotation
export const getPinAbsoluteCoords = (instance: ComponentInstance, pinId: string): { x: number; y: number } => {
  const def = COMPONENT_DEFINITIONS[instance.type];
  if (!def) return { x: 0, y: 0 };

  const pin = def.pins.find(p => p.id === pinId);
  if (!pin) return { x: 0, y: 0 };

  const cx = instance.x;
  const cy = instance.y;
  const W = def.width;
  const H = def.height;
  const rot = instance.rotation || 0;

  // Center coordinate
  const ox = cx + W / 2;
  const oy = cy + H / 2;

  // Relative pin coordinates from center
  const rx = pin.x - W / 2;
  const ry = pin.y - H / 2;

  // Rotate around center
  const rad = (rot * Math.PI) / 180;
  const rxRot = rx * Math.cos(rad) - ry * Math.sin(rad);
  const ryRot = rx * Math.sin(rad) + ry * Math.cos(rad);

  return {
    x: ox + rxRot,
    y: oy + ryRot,
  };
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
  validationErrors = [],
  onValueChange,
  zoom,
  setZoom,
  pushHistory,
}) => {
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [draggedCompId, setDraggedCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Wiring state
  const [activeWiringSrc, setActiveWiringSrc] = useState<{ compId: string; pinId: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<{ compId: string; pinId: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Grid Snapping
  const snapToGrid = (val: number): number => {
    return Math.round(val / 10) * 10;
  };

  // Convert client cursor coords to scaled, panned canvas coordinates
  const clientToCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panX) / (zoom / 100);
    const y = (clientY - rect.top - panY) / (zoom / 100);
    return { x, y };
  };

  // Key handlers for delete and rotate shortcut keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          // If wire is selected
          if (wires.some(w => w.id === selectedId)) {
            const nextWires = wires.filter(w => w.id !== selectedId);
            onUpdateWires(nextWires);
            pushHistory(components, nextWires);
          } else {
            // Component selected
            const nextComps = components.filter(c => c.id !== selectedId);
            // Delete connected wires
            const nextWires = wires.filter(w => w.fromComponentId !== selectedId && w.toComponentId !== selectedId);
            onUpdateComponents(nextComps);
            onUpdateWires(nextWires);
            pushHistory(nextComps, nextWires);
          }
          onSelect(null);
        }
      }

      if (e.key === 'r' || e.key === 'R') {
        if (selectedId && !wires.some(w => w.id === selectedId)) {
          const nextComps = components.map(c => {
            if (c.id === selectedId) {
              return { ...c, rotation: ((c.rotation || 0) + 90) % 360 };
            }
            return c;
          });
          onUpdateComponents(nextComps);
          pushHistory(nextComps, wires);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, components, wires]);

  // Handle zooming via mouse wheel scroll
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoomFactor = delta > 0 ? -5 : 5;
    const nextZoom = Math.min(200, Math.max(20, zoom + zoomFactor));
    setZoom(nextZoom);
  };

  // Canvas Mouse Actions
  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Check if clicking on pin target
    const pinEl = (e.target as HTMLElement).closest('[data-pin-id]');
    if (pinEl) {
      e.stopPropagation();
      const compId = pinEl.getAttribute('data-component-id')!;
      const pinId = pinEl.getAttribute('data-pin-id')!;

      if (!activeWiringSrc) {
        // Start wiring
        setActiveWiringSrc({ compId, pinId });
        const startCoords = getPinAbsoluteCoords(components.find(c => c.id === compId)!, pinId);
        setMousePos(startCoords);
      } else {
        // Complete wiring
        if (activeWiringSrc.compId !== compId || activeWiringSrc.pinId !== pinId) {
          const newWire: Wire = {
            id: `wire_${Date.now()}`,
            fromComponentId: activeWiringSrc.compId,
            fromPinId: activeWiringSrc.pinId,
            toComponentId: compId,
            toPinId: pinId,
            color: activeWireColor,
          };
          const nextWires = [...wires, newWire];
          onUpdateWires(nextWires);
          pushHistory(components, nextWires);
        }
        setActiveWiringSrc(null);
      }
      return;
    }

    // 2. Check if clicking a component element
    const compEl = (e.target as HTMLElement).closest('[data-component-instance-id]');
    if (compEl) {
      e.stopPropagation();
      const compId = compEl.getAttribute('data-component-instance-id')!;
      onSelect(compId, false);

      const comp = components.find(c => c.id === compId)!;
      const canvasCoords = clientToCanvasCoords(e.clientX, e.clientY);
      setDraggedCompId(compId);
      setDragOffset({
        x: canvasCoords.x - comp.x,
        y: canvasCoords.y - comp.y,
      });
      return;
    }

    // 3. Otherwise clicking empty canvas space -> Start panning
    if (activeWiringSrc) {
      // Cancel active wiring if clicked empty space
      setActiveWiringSrc(null);
      return;
    }

    onSelect(null);
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - panX,
      y: e.clientY - panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasCoords = clientToCanvasCoords(e.clientX, e.clientY);

    // Dynamic wiring line update
    if (activeWiringSrc) {
      setMousePos(canvasCoords);

      // Detect hovering over target pin
      const pinEl = (e.target as HTMLElement).closest('[data-pin-id]');
      if (pinEl) {
        const compId = pinEl.getAttribute('data-component-id')!;
        const pinId = pinEl.getAttribute('data-pin-id')!;
        setHoveredPin({ compId, pinId });
      } else {
        setHoveredPin(null);
      }
      return;
    }

    // Panning canvas
    if (isPanning) {
      setPanX(e.clientX - panStartRef.current.x);
      setPanY(e.clientY - panStartRef.current.y);
      return;
    }

    // Dragging component
    if (draggedCompId) {
      const nextComps = components.map(c => {
        if (c.id === draggedCompId) {
          return {
            ...c,
            x: snapToGrid(canvasCoords.x - dragOffset.x),
            y: snapToGrid(canvasCoords.y - dragOffset.y),
          };
        }
        return c;
      });
      onUpdateComponents(nextComps);
    }
  };

  const handleMouseUp = () => {
    if (draggedCompId) {
      pushHistory(components, wires);
    }
    setIsPanning(false);
    setDraggedCompId(null);
  };

  // Helper to render wire paths with nice 3D drooping curves and copper pins at ends
  const renderWire = (wire: Wire) => {
    const fromComp = components.find(c => c.id === wire.fromComponentId);
    const toComp = components.find(c => c.id === wire.toComponentId);
    if (!fromComp || !toComp) return null;

    const fromCoords = getPinAbsoluteCoords(fromComp, wire.fromPinId);
    const toCoords = getPinAbsoluteCoords(toComp, wire.toPinId);

    // Drooping Bezier Curve parameters: y+delta control points
    const dy = 55;
    const pathString = `M ${fromCoords.x} ${fromCoords.y} C ${fromCoords.x} ${fromCoords.y + dy} ${toCoords.x} ${toCoords.y + dy} ${toCoords.x} ${toCoords.y}`;

    const isSelected = selectedId === wire.id;

    return (
      <g key={wire.id} onClick={(e) => { e.stopPropagation(); onSelect(wire.id, true); }}>
        {/* Click hover expansion zone */}
        <path d={pathString} stroke="transparent" strokeWidth="12" fill="none" className="cursor-pointer" />
        
        {/* Selected Highlight backer */}
        {isSelected && (
          <path d={pathString} stroke="#3b82f6" strokeWidth="6.5" fill="none" opacity="0.5" />
        )}

        {/* Jumper wire pins at ends (metal tip and rubber boot) */}
        {/* Start Pin */}
        <circle cx={fromCoords.x} cy={fromCoords.y} r="2.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        <circle cx={fromCoords.x} cy={fromCoords.y} r="4" fill={wire.color} stroke="none" opacity="0.8" />
        
        {/* End Pin */}
        <circle cx={toCoords.x} cy={toCoords.y} r="2.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
        <circle cx={toCoords.x} cy={toCoords.y} r="4" fill={wire.color} stroke="none" opacity="0.8" />

        {/* Real wire line */}
        <path
          d={pathString}
          stroke={wire.color}
          strokeWidth="3.2"
          fill="none"
          strokeLinecap="round"
          className="transition-colors hover:stroke-opacity-80 cursor-pointer"
        />
        {/* Realistic wire core shadow */}
        <path d={pathString} stroke="#000000" strokeWidth="1" fill="none" opacity="0.15" />
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full overflow-hidden bg-[#e8ebf0] select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
          backgroundPosition: `${panX}px ${panY}px`
        }}
      />

      {/* Validation Errors Overlay */}
      {isSimulating && validationErrors.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 flex flex-col space-y-2">
          {validationErrors.map((error, idx) => (
            <div key={idx} className="bg-red-50/90 backdrop-blur border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-sm text-xs font-semibold flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* SVG Canvas Workspace */}
      <svg
        className="w-full h-full pointer-events-none"
        style={{ pointerEvents: 'auto' }}
      >
        <g transform={`translate(${panX}, ${panY}) scale(${zoom / 100})`}>
          
          {/* 1. Render Components */}
          {components.map((comp) => {
            const isSelected = selectedId === comp.id;
            const def = COMPONENT_DEFINITIONS[comp.type];
            const W = def?.width || 100;
            const H = def?.height || 100;

            return (
              <g key={comp.id} data-component-instance-id={comp.id} style={{ pointerEvents: 'auto' }}>
                
                {/* Selection Outline Box */}
                {isSelected && (
                  <rect
                    x={comp.x - 4}
                    y={comp.y - 4}
                    width={W + 8}
                    height={H + 8}
                    rx="6"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    transform={`rotate(${comp.rotation || 0}, ${comp.x + W/2}, ${comp.y + H/2})`}
                  />
                )}

                <RealisticComponent
                  instance={comp}
                  ledState={ledStates[comp.id]}
                  ledWarning={ledWarnings[comp.id]}
                  buzzerState={buzzerStates[comp.id]}
                  servoAngle={servoAngles[comp.id]}
                  motorSpeed={motorSpeeds[comp.id]}
                  lcdText={lcdLines[comp.id]}
                  onValueChange={onValueChange}
                  isSimulating={isSimulating}
                />
              </g>
            );
          })}

          {/* 2. Render Static completed Wires */}
          {wires.map(renderWire)}

          {/* 3. Render active Jumper Wire connector preview */}
          {activeWiringSrc && (
            <g>
              <line x1={mousePos.x} y1={mousePos.y} x2={mousePos.x} y2={mousePos.y} />
              {(() => {
                const srcComp = components.find(c => c.id === activeWiringSrc.compId)!;
                const startCoords = getPinAbsoluteCoords(srcComp, activeWiringSrc.pinId);
                const dy = 55;
                const pathString = `M ${startCoords.x} ${startCoords.y} C ${startCoords.x} ${startCoords.y + dy} ${mousePos.x} ${mousePos.y + dy} ${mousePos.x} ${mousePos.y}`;

                return (
                  <g>
                    {/* Metal pin tip end */}
                    <circle cx={mousePos.x} cy={mousePos.y} r="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />
                    {/* Visual wire connector collar */}
                    <circle cx={mousePos.x} cy={mousePos.y} r="3.5" fill={activeWireColor} opacity="0.8" />
                    <path d={pathString} stroke={activeWireColor} strokeWidth="3" fill="none" opacity="0.65" />
                  </g>
                );
              })()}
            </g>
          )}
        </g>
      </svg>
      {/* Zoom percentage & Interactive helper status footer */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs font-bold text-slate-700 z-20">
        <button
          onClick={() => setZoom(Math.max(20, zoom - 10))}
          className="hover:text-blue-600 transition px-1"
        >
          -
        </button>
        <span className="w-10 text-center select-none font-mono">
          {zoom}%
        </span>
        <button
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          className="hover:text-blue-600 transition px-1"
        >
          +
        </button>
        <button
          onClick={() => {
            setZoom(100);
            setPanX(0);
            setPanY(0);
          }}
          className="text-[10px] text-blue-600 hover:underline border-l border-slate-200 pl-2 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
