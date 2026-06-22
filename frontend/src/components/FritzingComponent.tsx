import React from 'react';
import { ComponentInstance } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
import { getFritzingAsset } from '../utils/fritzingAssets';

interface FritzingComponentProps {
  instance: ComponentInstance;
  isSelected?: boolean;
  isWiring?: boolean;
  wiringHoverPinId?: string | null;
  ledState?: boolean;
  ledWarning?: string;
  onboardLed13?: boolean;
  buzzerState?: boolean;
  servoAngle?: number;
  motorSpeed?: number;
  lcdText?: [string, string];
  onValueChange?: (id: string, val: unknown) => void;
  onComponentStateChange?: (id: string, partialState: ComponentInstance['state']) => void;
  isSimulating: boolean;
}

export const FritzingComponent: React.FC<FritzingComponentProps> = ({
  instance,
  isSelected = false,
  isWiring = false,
  wiringHoverPinId = null,
  ledState = false,
  ledWarning = '',
  onboardLed13 = false,
  buzzerState = false,
  servoAngle = 90,
  motorSpeed = 0,
  lcdText = ['', ''],
  onValueChange,
  onComponentStateChange,
  isSimulating,
}) => {
  const def = COMPONENT_DEFINITIONS[instance.type];
  if (!def) {
    return null;
  }

  const { width, height } = def;
  const asset = getFritzingAsset(instance.type);
  const showControl = isSelected || isSimulating;

  const renderSimulationOverlay = () => {
    switch (instance.type) {
      case 'arduino_uno':
        return (
          <g pointerEvents="none">
            <circle
              cx={width * 0.31}
              cy={height * 0.27}
              r={4}
              fill={isSimulating ? '#22c55e' : '#15803d'}
              stroke="#166534"
              strokeWidth="0.6"
            />
            <circle
              cx={width * 0.42}
              cy={height * 0.05}
              r={3.5}
              fill={onboardLed13 ? '#fef08a' : '#15803d'}
              stroke={onboardLed13 ? '#ca8a04' : '#166534'}
              strokeWidth="0.6"
              opacity={onboardLed13 ? 1 : 0.85}
            />
            {onboardLed13 && (
              <circle cx={width * 0.42} cy={height * 0.05} r={7} fill="#fde047" opacity="0.35" />
            )}
          </g>
        );

      case 'led': {
        const color = instance.color || '#ef4444';
        if (!ledState) {
          return null;
        }
        return (
          <g pointerEvents="none">
            <circle cx={width * 0.29} cy={height * 0.28} r={9} fill={color} opacity="0.35" />
            <circle cx={width * 0.76} cy={height * 0.28} r={9} fill={color} opacity="0.35" />
            {ledWarning && (
              <text x={width - 2} y={8} fill="#92400e" fontSize="8" fontWeight="bold" textAnchor="end">!</text>
            )}
          </g>
        );
      }

      case 'lcd_16x2':
        return (
          <g pointerEvents="none">
            <rect
              x={width * 0.1}
              y={height * 0.2}
              width={width * 0.8}
              height={height * 0.55}
              fill={isSimulating ? '#8ba36b' : 'transparent'}
              opacity={isSimulating ? 0.85 : 0}
              rx={2}
            />
            {isSimulating && (
              <>
                <text x={width * 0.12} y={height * 0.4} fill="#1a2e05" fontSize="8" fontFamily="monospace">
                  {(lcdText[0] || '').substring(0, 16)}
                </text>
                <text x={width * 0.12} y={height * 0.58} fill="#1a2e05" fontSize="8" fontFamily="monospace">
                  {(lcdText[1] || '').substring(0, 16)}
                </text>
              </>
            )}
          </g>
        );

      case 'buzzer':
        if (!buzzerState) {
          return null;
        }
        return (
          <g pointerEvents="none">
            <circle cx={width * 0.17} cy={height * 0.31} r={12} fill="none" stroke="#3b82f6" strokeWidth="1.2" opacity="0.55" />
            <circle cx={width * 0.82} cy={height * 0.69} r={12} fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.35" />
          </g>
        );

      case 'dc_motor':
        return (
          <g transform={`translate(${width * 0.16}, ${height * 0.45}) rotate(${motorSpeed * 3.6})`} pointerEvents="none">
            <line x1={0} y1={-10} x2={0} y2={10} stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={-10} y1={0} x2={10} y2={0} stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );

      case 'servo':
        return (
          <g pointerEvents="none">
            <g transform={`rotate(${servoAngle - 90}, ${width * 0.78}, ${height * 0.55})`}>
              <line
                x1={width * 0.78}
                y1={height * 0.55}
                x2={width * 0.55}
                y2={height * 0.55}
                stroke="#f8fafc"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </g>
        );

      case 'push_button': {
        const active = Boolean(instance.state?.active);
        return (
          <rect
            x={width * 0.25}
            y={height * 0.2}
            width={width * 0.5}
            height={height * 0.45}
            rx={4}
            fill={active ? 'rgba(148,163,184,0.35)' : 'transparent'}
            onMouseDown={(event) => {
              event.stopPropagation();
              onComponentStateChange?.(instance.id, { active: true });
            }}
            style={{ cursor: 'pointer' }}
          />
        );
      }

      case 'seven_segment': {
        const value = instance.state?.displayVal || '0';
        const segments: Record<string, Record<string, boolean>> = {
          '0': { a: true, b: true, c: true, d: true, e: true, f: true, g: false },
          '1': { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
          '2': { a: true, b: true, c: false, d: true, e: true, f: false, g: true },
          '3': { a: true, b: true, c: true, d: true, e: false, f: false, g: true },
          '4': { a: false, b: true, c: true, d: false, e: false, f: true, g: true },
          '5': { a: true, b: false, c: true, d: true, e: false, f: true, g: true },
          '6': { a: true, b: false, c: true, d: true, e: true, f: true, g: true },
          '7': { a: true, b: true, c: true, d: false, e: false, f: false, g: false },
          '8': { a: true, b: true, c: true, d: true, e: true, f: true, g: true },
          '9': { a: true, b: true, c: true, d: true, e: false, f: true, g: true },
        };
        const current = segments[value] || segments['0'];
        const lit = (on: boolean) => (on && isSimulating ? '#ef4444' : 'transparent');
        const cx = width * 0.5;
        const cy = height * 0.5;
        return (
          <g pointerEvents="none">
            <rect x={cx - 10} y={cy - 14} width={20} height={3} rx={1} fill={lit(current.a)} />
            <rect x={cx + 7} y={cy - 12} width={3} height={12} rx={1} fill={lit(current.b)} />
            <rect x={cx + 7} y={cy + 2} width={3} height={12} rx={1} fill={lit(current.c)} />
            <rect x={cx - 10} y={cy + 11} width={20} height={3} rx={1} fill={lit(current.d)} />
            <rect x={cx - 10} y={cy + 2} width={3} height={12} rx={1} fill={lit(current.e)} />
            <rect x={cx - 10} y={cy - 12} width={3} height={12} rx={1} fill={lit(current.f)} />
            <rect x={cx - 10} y={cy - 1} width={20} height={3} rx={1} fill={lit(current.g)} />
          </g>
        );
      }

      default:
        return null;
    }
  };

  const renderSensorControls = () => {
    if (!showControl) {
      return null;
    }

    const sensorValue = instance.state?.sensorValue ?? 512;

    if (instance.type === 'gas_sensor') {
      return (
        <foreignObject x={width * 0.15} y={height * 0.55} width={width * 0.7} height={28}>
          <div className="flex items-center gap-1 rounded bg-white/90 px-1 py-0.5" onMouseDown={(e) => e.stopPropagation()}>
            <input
              type="range"
              min="0"
              max="1000"
              value={sensorValue}
              onChange={(event) => onValueChange?.(instance.id, Number(event.target.value))}
              className="w-full"
            />
          </div>
        </foreignObject>
      );
    }

    if (instance.type === 'ldr' || instance.type === 'potentiometer') {
      return (
        <foreignObject x={0} y={height * 0.55} width={width} height={28}>
          <div className="flex items-center gap-1 rounded bg-white/90 px-1 py-0.5" onMouseDown={(e) => e.stopPropagation()}>
            <input
              type="range"
              min="0"
              max="1023"
              value={sensorValue}
              onChange={(event) => onValueChange?.(instance.id, Number(event.target.value))}
              className="w-full"
            />
          </div>
        </foreignObject>
      );
    }

    return null;
  };

  return (
    <g transform={`translate(${instance.x}, ${instance.y}) rotate(${instance.rotation || 0}, ${width / 2}, ${height / 2})`}>
      <image
        href={asset}
        x={0}
        y={0}
        width={width}
        height={height}
        preserveAspectRatio="none"
        pointerEvents="none"
      />

      {renderSimulationOverlay()}
      {renderSensorControls()}

      {def.pins.map((pin) => {
        const isHovered = wiringHoverPinId === pin.id;
        const showHit = isWiring || isHovered;

        return (
          <circle
            key={pin.id}
            cx={pin.x}
            cy={pin.y}
            r={showHit ? 5 : 8}
            fill="transparent"
            stroke={showHit ? '#f59e0b' : 'transparent'}
            strokeWidth={showHit ? 1.5 : 0}
            data-pin-id={pin.id}
            data-component-id={instance.id}
            style={{ cursor: isWiring ? 'crosshair' : 'pointer' }}
          >
            <title>{pin.name}</title>
          </circle>
        );
      })}

      {isSelected && instance.type !== 'breadboard_small' && (
        <text
          x={width / 2}
          y={-6}
          fill="#2563eb"
          fontSize="7"
          fontFamily="sans-serif"
          fontWeight="600"
          textAnchor="middle"
          pointerEvents="none"
        >
          {instance.name}
        </text>
      )}
    </g>
  );
};

export { FritzingComponent as RealisticComponent };
