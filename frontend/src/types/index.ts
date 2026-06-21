export type ComponentType =
  | 'arduino_uno'
  | 'breadboard_small'
  | 'resistor'
  | 'led'
  | 'push_button'
  | 'buzzer'
  | 'lcd_16x2'
  | 'ultrasonic'
  | 'gas_sensor'
  | 'ldr'
  | 'dht11'
  | 'battery_9v'
  | 'battery_aa'
  | 'battery_coin'
  | 'dc_motor'
  | 'servo'
  | 'seven_segment'
  | 'potentiometer';

export interface Pin {
  id: string;
  name: string;
  x: number; // Relative to component's top-left corner
  y: number; // Relative to component's top-left corner
  type?: 'power' | 'ground' | 'digital' | 'analog' | 'passive';
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  name: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  color?: string; // For LEDs, wires, etc.
  value?: string | number; // e.g. "220" for resistor value in ohms, or thresholds
  state?: {
    glowing?: boolean;
    active?: boolean;
    textLine1?: string;
    textLine2?: string;
    speed?: number;
    angle?: number;
    sensorValue?: number; // Current value of a sensor (e.g. gas level)
    displayVal?: string; // Seven-segment code
    potentiometerPos?: number; // 0 to 1
  };
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  color: string;
}

export interface ProjectState {
  components: ComponentInstance[];
  wires: Wire[];
  code: string;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'gauge' | 'chart' | 'button' | 'switch' | 'led' | 'terminal' | 'value_card' | 'progress';
  title: string;
  pin: string; // Connected Arduino pin/variable name
  x: number;
  y: number;
  w: number;
  h: number;
  value?: string | number;
}

export interface CodeTemplate {
  name: string;
  description: string;
  code: string;
  components: ComponentInstance[];
  wires: Wire[];
  widgets?: DashboardWidget[];
}
