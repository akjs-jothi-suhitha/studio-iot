import React, { useEffect, useRef } from 'react';
import { ComponentInstance } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';
import { getPinHitRadius } from '../utils/pinCoords';
import { getSelectionBoundsForInstance } from '../utils/componentBounds';
import { WOKWI_PART_MAPS } from '../utils/wokwiPinMaps';
import { SvgComponent } from './SvgComponent';

interface CircuitComponentProps {
  instance: ComponentInstance;
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

const LED_COLORS: Record<string, string> = {
  '#ef4444': 'red',
  '#22c55e': 'green',
  '#3b82f6': 'blue',
  '#eab308': 'yellow',
  '#f97316': 'orange',
  '#ffffff': 'white',
};

const buildWokwiProps = (
  instance: ComponentInstance,
  props: CircuitComponentProps,
): Record<string, unknown> => {
  const { isSimulating, ledState, onboardLed13, buzzerState, servoAngle, lcdText, onComponentStateChange } = props;
  const sensorValue = instance.state?.sensorValue ?? 512;

  switch (instance.type) {
    case 'arduino_uno':
      return {
        led13: onboardLed13,
        ledPower: isSimulating,
        ledRX: false,
        ledTX: false,
      };
    case 'arduino_nano':
      return {
        ledBuiltIn: onboardLed13,
        ledPower: isSimulating,
      };
    case 'esp32':
      return {
        ledPower: isSimulating,
        led1: false,
      };
    case 'esp8266':
      return {
        ledPower: isSimulating,
        ledBlue: isSimulating,
      };
    case 'led':
      return {
        value: ledState,
        color: LED_COLORS[instance.color || ''] || 'red',
        brightness: ledState ? 1 : 0.3,
      };
    case 'resistor':
      return { value: String(instance.value ?? 220) };
    case 'push_button':
      return {
        pressed: Boolean(instance.state?.active),
        color: 'blue',
      };
    case 'buzzer':
      return { hasSignal: buzzerState };
    case 'potentiometer':
      return { value: sensorValue, min: 0, max: 1023 };
    case 'servo':
      return { angle: servoAngle ?? 90 };
    case 'lcd_16x2': {
      const line1 = (lcdText?.[0] || '').padEnd(16, ' ').slice(0, 16);
      const line2 = (lcdText?.[1] || '').padEnd(16, ' ').slice(0, 16);
      return {
        text: line1 + line2,
        backlight: isSimulating,
        pins: 'full',
        background: 'green',
      };
    }
    case 'gas_sensor':
      return { ledPower: isSimulating, ledD0: sensorValue > 400 };
    case 'ldr':
      return { ledPower: isSimulating, ledDO: sensorValue < 300 };
    case 'dht11':
      return {};
    case 'ultrasonic':
      return {};
    default:
      return {};
  }
};

const WokwiElementHost: React.FC<{
  tag: string;
  width: number;
  height: number;
  props: Record<string, unknown>;
  instance: ComponentInstance;
  onComponentStateChange?: CircuitComponentProps['onComponentStateChange'];
  onValueChange?: CircuitComponentProps['onValueChange'];
}> = ({ tag, width, height, props, instance, onComponentStateChange, onValueChange }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = '';
    const element = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        (element as unknown as Record<string, unknown>)[key] = value;
      }
    });

    if (instance.type === 'push_button') {
      const onDown = () => onComponentStateChange?.(instance.id, { active: true });
      const onUp = () => onComponentStateChange?.(instance.id, { active: false });
      element.addEventListener('mousedown', onDown);
      element.addEventListener('mouseup', onUp);
      element.addEventListener('mouseleave', onUp);
      host.appendChild(element);
      return () => {
        element.removeEventListener('mousedown', onDown);
        element.removeEventListener('mouseup', onUp);
        element.removeEventListener('mouseleave', onUp);
        if (host.contains(element)) host.removeChild(element);
      };
    }

    host.appendChild(element);
    return () => {
      if (host.contains(element)) host.removeChild(element);
    };
  }, [tag, props, instance.id, instance.type, onComponentStateChange, onValueChange]);

  return (
    <div
      ref={hostRef}
      style={{ width, height, pointerEvents: instance.type === 'push_button' ? 'auto' : 'none' }}
    />
  );
};

export const CircuitComponent: React.FC<CircuitComponentProps> = (componentProps) => {
  const { instance } = componentProps;
  const def = COMPONENT_DEFINITIONS[instance.type];
  const wokwi = WOKWI_PART_MAPS[instance.type];

  if (!def) return null;

  const { width, height } = def;

  if (!wokwi?.usesWokwi) {
    return <SvgComponent {...componentProps} />;
  }

  const wokwiProps = buildWokwiProps(instance, componentProps);
  const pinRadius = getPinHitRadius(instance.type, def.pins.length);
  const bounds = getSelectionBoundsForInstance(instance);

  return (
    <g transform={`translate(${instance.x}, ${instance.y}) rotate(${instance.rotation || 0}, ${bounds.cx}, ${bounds.cy})`}>
      <rect
        x={bounds.ox}
        y={bounds.oy}
        width={bounds.width}
        height={bounds.height}
        fill="transparent"
        pointerEvents="all"
        style={{ cursor: 'move' }}
      />

      <foreignObject
        x={0}
        y={0}
        width={width}
        height={height}
        overflow="visible"
        pointerEvents="none"
      >
        <div style={{ width, height, overflow: 'visible', pointerEvents: 'none' }}>
          <WokwiElementHost
            tag={wokwi.wokwiTag}
            width={width}
            height={height}
            props={wokwiProps}
            instance={instance}
            onComponentStateChange={componentProps.onComponentStateChange}
            onValueChange={componentProps.onValueChange}
          />
        </div>
      </foreignObject>

      {instance.type === 'gas_sensor' && componentProps.isSimulating && (
        <g pointerEvents="none">
          {(instance.state?.sensorValue ?? 0) > 150 && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <circle
                  key={i}
                  cx={width * 0.5 + (i - 2) * 12}
                  cy={-10 - i * 8}
                  r={4 + (instance.state?.sensorValue ?? 0) / 200}
                  fill="#94a3b8"
                  opacity={0.15 + (instance.state?.sensorValue ?? 0) / 2000}
                >
                  <animate attributeName="cy" values={`${-5};${-35 - i * 10};${-5}`} dur={`${1.2 + i * 0.2}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.05;0.35;0.05" dur={`${1.2 + i * 0.2}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </>
          )}
        </g>
      )}

      {def.pins.map((pin) => (
        <g key={pin.id}>
          <circle
            cx={pin.x}
            cy={pin.y}
            r={pinRadius}
            fill="transparent"
            stroke="transparent"
            data-pin-id={pin.id}
            data-component-id={instance.id}
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
          >
            <title>{pin.name}</title>
          </circle>
          <circle
            cx={pin.x}
            cy={pin.y}
            r={Math.max(2, pinRadius - 3)}
            fill={pin.type === 'power' ? '#ef4444' : pin.type === 'ground' ? '#1f2937' : pin.type === 'analog' ? '#8b5cf6' : '#10b981'}
            opacity={0.35}
            pointerEvents="none"
          />
        </g>
      ))}
    </g>
  );
};
