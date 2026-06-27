export type ComponentType =
  | 'arduino_uno'
  | 'arduino_nano'
  | 'esp32'
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
    sensorValue?: number;
    tempC?: number;
    humidity?: number;
    displayVal?: string;
    potentiometerPos?: number;
  };
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  color: string;
  wireType?: 'hookup' | 'alligator' | 'retractable';
}

export type ViewMode = 'circuit' | 'dashboard' | 'arduino';

export type BoardType = 'arduino_uno' | 'arduino_nano' | 'arduino_mega' | 'esp32';

export interface ProjectState {
  components: ComponentInstance[];
  wires: Wire[];
  code: string;
  widgets: DashboardWidget[];
  componentNotes?: Record<string, string>;
  boardType?: BoardType;
}

/** Blynk-style virtual datastream (V0, V1, …) */
export interface BlynkDatastream {
  id: string;
  virtualPin: string; // e.g. V0
  name: string;
  dataType: 'integer' | 'double' | 'string';
  min?: number;
  max?: number;
}

export interface DashboardWidget {
  id: string;
  type: 'gauge' | 'chart' | 'button' | 'switch' | 'led' | 'terminal' | 'value_card' | 'progress' | 'slider';
  title: string;
  /** Legacy physical pin — prefer virtualPin */
  pin: string;
  /** Blynk virtual pin e.g. V0 */
  virtualPin?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  value?: string | number;
}

export interface BlynkDeviceConfig {
  templateId: string;
  authToken: string;
  deviceName: string;
  datastreams: BlynkDatastream[];
}

export interface CloudMqttConfig {
  brokerUrl: string;
  username: string;
  password: string;
}

export interface CodeTemplate {
  name: string;
  description: string;
  code: string;
  components: ComponentInstance[];
  wires: Wire[];
  widgets?: DashboardWidget[];
}
