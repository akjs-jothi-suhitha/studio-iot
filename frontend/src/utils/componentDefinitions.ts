import { ComponentType, Pin } from '../types';
import { WOKWI_PART_MAPS } from './wokwiPinMaps';

export interface ComponentDef {
  type: ComponentType;
  name: string;
  category: 'boards' | 'basic' | 'sensors' | 'displays' | 'actuators' | 'power';
  width: number;
  height: number;
  description: string;
  pins: Pin[];
}

// Helper to generate Small Breadboard pins
const generateBreadboardPins = (): Pin[] => {
  const pins: Pin[] = [];
  const colSpacing = 9.5;
  const startX = 20;

  // Power rails: Top '-' and '+'
  // Divided into 2 banks (1-15, 16-30) or single bank for simplicity.
  // We'll create 60 holes for top '-', 60 holes for top '+'
  for (let c = 0; c < 60; c++) {
    const x = startX + c * colSpacing;
    // Top '-' rail
    pins.push({
      id: `top_minus_${c}`,
      name: `Top - Rail Pin ${c + 1}`,
      x,
      y: 10,
      type: 'ground',
    });
    // Top '+' rail
    pins.push({
      id: `top_plus_${c}`,
      name: `Top + Rail Pin ${c + 1}`,
      x,
      y: 19,
      type: 'power',
    });
  }

  // Row columns: A-E (columns 1 to 60)
  const rowsTop = ['a', 'b', 'c', 'd', 'e'];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 60; c++) {
      const x = startX + c * colSpacing;
      const y = 33 + r * 8.5;
      const rowName = rowsTop[r];
      pins.push({
        id: `hole_${rowName}_${c + 1}`,
        name: `Hole ${rowName.toUpperCase()}${c + 1}`,
        x,
        y,
        type: 'passive',
      });
    }
  }

  // Row columns: F-J (columns 1 to 60)
  const rowsBottom = ['f', 'g', 'h', 'i', 'j'];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 60; c++) {
      const x = startX + c * colSpacing;
      const y = 92 + r * 8.5;
      const rowName = rowsBottom[r];
      pins.push({
        id: `hole_${rowName}_${c + 1}`,
        name: `Hole ${rowName.toUpperCase()}${c + 1}`,
        x,
        y,
        type: 'passive',
      });
    }
  }

  // Power rails: Bottom '-' and '+'
  for (let c = 0; c < 60; c++) {
    const x = startX + c * colSpacing;
    // Bottom '-' rail
    pins.push({
      id: `bottom_minus_${c}`,
      name: `Bottom - Rail Pin ${c + 1}`,
      x,
      y: 140,
      type: 'ground',
    });
    // Bottom '+' rail
    pins.push({
      id: `bottom_plus_${c}`,
      name: `Bottom + Rail Pin ${c + 1}`,
      x,
      y: 149,
      type: 'power',
    });
  }

  return pins;
};

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDef> = {
  arduino_uno: {
    type: 'arduino_uno',
    name: 'Arduino Uno R3',
    category: 'boards',
    width: 240,
    height: 160,
    description: 'An open-source microcontroller board based on the Microchip ATmega328P.',
    pins: [
      // Digital Pins (Top)
      { id: 'pin_0', name: 'RX<-0', x: 219, y: 7, type: 'digital' },
      { id: 'pin_1', name: 'TX->1', x: 210, y: 7, type: 'digital' },
      { id: 'pin_2', name: 'D2', x: 200, y: 7, type: 'digital' },
      { id: 'pin_3', name: '~D3', x: 191, y: 7, type: 'digital' },
      { id: 'pin_4', name: 'D4', x: 181, y: 7, type: 'digital' },
      { id: 'pin_5', name: '~D5', x: 172, y: 7, type: 'digital' },
      { id: 'pin_6', name: '~D6', x: 162, y: 7, type: 'digital' },
      { id: 'pin_7', name: 'D7', x: 153, y: 7, type: 'digital' },
      { id: 'pin_8', name: 'D8', x: 137, y: 7, type: 'digital' },
      { id: 'pin_9', name: '~D9', x: 128, y: 7, type: 'digital' },
      { id: 'pin_10', name: '~D10', x: 118, y: 7, type: 'digital' },
      { id: 'pin_11', name: '~D11', x: 109, y: 7, type: 'digital' },
      { id: 'pin_12', name: 'D12', x: 99, y: 7, type: 'digital' },
      { id: 'pin_13', name: 'D13', x: 90, y: 7, type: 'digital' },
      { id: 'pin_gnd1', name: 'GND', x: 80, y: 7, type: 'ground' },
      { id: 'pin_aref', name: 'AREF', x: 71, y: 7, type: 'passive' },
      { id: 'pin_sda', name: 'SDA', x: 61, y: 7, type: 'passive' },
      { id: 'pin_scl', name: 'SCL', x: 52, y: 7, type: 'passive' },

      // Power / Analog Pins (Bottom)
      { id: 'pin_ioref', name: 'IOREF', x: 65, y: 152, type: 'power' },
      { id: 'pin_reset', name: 'RESET', x: 74, y: 152, type: 'passive' },
      { id: 'pin_3v3', name: '3.3V', x: 84, y: 152, type: 'power' },
      { id: 'pin_5v', name: '5V', x: 93, y: 152, type: 'power' },
      { id: 'pin_gnd2', name: 'GND', x: 103, y: 152, type: 'ground' },
      { id: 'pin_gnd3', name: 'GND', x: 112, y: 152, type: 'ground' },
      { id: 'pin_vin', name: 'VIN', x: 122, y: 152, type: 'power' },

      { id: 'pin_a0', name: 'A0', x: 141, y: 152, type: 'analog' },
      { id: 'pin_a1', name: 'A1', x: 150, y: 152, type: 'analog' },
      { id: 'pin_a2', name: 'A2', x: 160, y: 152, type: 'analog' },
      { id: 'pin_a3', name: 'A3', x: 169, y: 152, type: 'analog' },
      { id: 'pin_a4', name: 'A4', x: 179, y: 152, type: 'analog' },
      { id: 'pin_a5', name: 'A5', x: 188, y: 152, type: 'analog' },
    ],
  },
  esp32: {
    type: 'esp32',
    name: 'ESP32 DevKit',
    category: 'boards',
    width: 200,
    height: 120,
    description: 'Wi-Fi + Bluetooth microcontroller. Use with IoT Dashboard virtual pins (Blynk-style).',
    pins: [
      { id: 'pin_3v3', name: '3V3', x: 8, y: 8, type: 'power' },
      { id: 'pin_gnd1', name: 'GND', x: 18, y: 8, type: 'ground' },
      { id: 'pin_15', name: 'D15', x: 28, y: 8, type: 'digital' },
      { id: 'pin_2', name: 'D2', x: 38, y: 8, type: 'digital' },
      { id: 'pin_4', name: 'D4', x: 48, y: 8, type: 'digital' },
      { id: 'pin_16', name: 'D16', x: 58, y: 8, type: 'digital' },
      { id: 'pin_17', name: 'D17', x: 68, y: 8, type: 'digital' },
      { id: 'pin_5', name: 'D5', x: 78, y: 8, type: 'digital' },
      { id: 'pin_18', name: 'D18', x: 88, y: 8, type: 'digital' },
      { id: 'pin_19', name: 'D19', x: 98, y: 8, type: 'digital' },
      { id: 'pin_21', name: 'D21', x: 108, y: 8, type: 'digital' },
      { id: 'pin_3', name: 'RX0', x: 118, y: 8, type: 'digital' },
      { id: 'pin_1', name: 'TX0', x: 128, y: 8, type: 'digital' },
      { id: 'pin_22', name: 'D22', x: 138, y: 8, type: 'digital' },
      { id: 'pin_23', name: 'D23', x: 148, y: 8, type: 'digital' },
      { id: 'pin_vin', name: 'VIN', x: 8, y: 112, type: 'power' },
      { id: 'pin_gnd2', name: 'GND', x: 18, y: 112, type: 'ground' },
      { id: 'pin_13', name: 'D13', x: 28, y: 112, type: 'digital' },
      { id: 'pin_12', name: 'D12', x: 38, y: 112, type: 'digital' },
      { id: 'pin_14', name: 'D14', x: 48, y: 112, type: 'digital' },
      { id: 'pin_27', name: 'D27', x: 58, y: 112, type: 'digital' },
      { id: 'pin_26', name: 'D26', x: 68, y: 112, type: 'digital' },
      { id: 'pin_25', name: 'D25', x: 78, y: 112, type: 'digital' },
      { id: 'pin_33', name: 'D33', x: 88, y: 112, type: 'digital' },
      { id: 'pin_32', name: 'D32', x: 98, y: 112, type: 'digital' },
      { id: 'pin_35', name: 'D35', x: 108, y: 112, type: 'analog' },
      { id: 'pin_34', name: 'D34', x: 118, y: 112, type: 'analog' },
      { id: 'pin_39', name: 'VN', x: 128, y: 112, type: 'analog' },
      { id: 'pin_36', name: 'VP', x: 138, y: 112, type: 'analog' },
      { id: 'pin_en', name: 'EN', x: 148, y: 112, type: 'passive' },
    ],
  },
  arduino_nano: {
    type: 'arduino_nano',
    name: 'Arduino Nano',
    category: 'boards',
    width: 180,
    height: 68,
    description: 'Compact ATmega328P board — ideal for breadboard projects.',
    pins: [
      { id: 'pin_vin', name: 'VIN', x: 8, y: 34, type: 'power' },
      { id: 'pin_gnd1', name: 'GND', x: 18, y: 34, type: 'ground' },
      { id: 'pin_5v', name: '5V', x: 28, y: 34, type: 'power' },
      { id: 'pin_a7', name: 'A7', x: 38, y: 34, type: 'analog' },
      { id: 'pin_a6', name: 'A6', x: 48, y: 34, type: 'analog' },
      { id: 'pin_a5', name: 'A5', x: 58, y: 34, type: 'analog' },
      { id: 'pin_a4', name: 'A4', x: 68, y: 34, type: 'analog' },
      { id: 'pin_a3', name: 'A3', x: 78, y: 34, type: 'analog' },
      { id: 'pin_a2', name: 'A2', x: 88, y: 34, type: 'analog' },
      { id: 'pin_a1', name: 'A1', x: 98, y: 34, type: 'analog' },
      { id: 'pin_a0', name: 'A0', x: 108, y: 34, type: 'analog' },
      { id: 'pin_13', name: 'D13', x: 118, y: 34, type: 'digital' },
      { id: 'pin_12', name: 'D12', x: 128, y: 34, type: 'digital' },
      { id: 'pin_11', name: 'D11', x: 138, y: 34, type: 'digital' },
      { id: 'pin_10', name: 'D10', x: 148, y: 34, type: 'digital' },
      { id: 'pin_9', name: 'D9', x: 158, y: 34, type: 'digital' },
      { id: 'pin_8', name: 'D8', x: 168, y: 34, type: 'digital' },
      { id: 'pin_7', name: 'D7', x: 8, y: 58, type: 'digital' },
      { id: 'pin_6', name: 'D6', x: 18, y: 58, type: 'digital' },
      { id: 'pin_5', name: 'D5', x: 28, y: 58, type: 'digital' },
      { id: 'pin_4', name: 'D4', x: 38, y: 58, type: 'digital' },
      { id: 'pin_3', name: 'D3', x: 48, y: 58, type: 'digital' },
      { id: 'pin_2', name: 'D2', x: 58, y: 58, type: 'digital' },
      { id: 'pin_1', name: 'TX', x: 68, y: 58, type: 'digital' },
      { id: 'pin_0', name: 'RX', x: 78, y: 58, type: 'digital' },
      { id: 'pin_reset', name: 'RESET', x: 88, y: 58, type: 'passive' },
      { id: 'pin_gnd2', name: 'GND', x: 98, y: 58, type: 'ground' },
      { id: 'pin_3v3', name: '3.3V', x: 108, y: 58, type: 'power' },
    ],
  },

  breadboard_small: {
    type: 'breadboard_small',
    name: 'Full Breadboard',
    category: 'boards',
    width: 610,
    height: 160,
    description: 'A full-size prototyping breadboard with 60 columns and power rails.',
    pins: generateBreadboardPins(),
  },
  resistor: {
    type: 'resistor',
    name: 'Resistor',
    category: 'basic',
    width: 80,
    height: 20,
    description: 'Limits the flow of electrical current. Resistance configurable in ohms.',
    pins: [
      { id: 'pin_1', name: 'Terminal 1', x: 5, y: 10, type: 'passive' },
      { id: 'pin_2', name: 'Terminal 2', x: 75, y: 10, type: 'passive' },
    ],
  },
  led: {
    type: 'led',
    name: 'LED',
    category: 'basic',
    width: 30,
    height: 40,
    description: 'A light-emitting diode. Glows when forward-biased.',
    pins: [
      { id: 'cathode', name: 'Cathode (-)', x: 10, y: 35, type: 'passive' },
      { id: 'anode', name: 'Anode (+)', x: 20, y: 35, type: 'passive' },
    ],
  },
  push_button: {
    type: 'push_button',
    name: 'Push Button',
    category: 'basic',
    width: 30,
    height: 30,
    description: 'Momentary tactile switch. Connects terminals when pressed.',
    pins: [
      { id: 'terminal_1a', name: 'Terminal 1A', x: 6, y: 6 },
      { id: 'terminal_1b', name: 'Terminal 1B', x: 24, y: 6 },
      { id: 'terminal_2a', name: 'Terminal 2A', x: 6, y: 24 },
      { id: 'terminal_2b', name: 'Terminal 2B', x: 24, y: 24 },
    ],
  },
  buzzer: {
    type: 'buzzer',
    name: 'Piezo Buzzer',
    category: 'basic',
    width: 50,
    height: 50,
    description: 'A piezo buzzer that emits sound when powered with a signal.',
    pins: [
      { id: 'positive', name: 'Positive (+)', x: 15, y: 40, type: 'passive' },
      { id: 'negative', name: 'Negative (-)', x: 35, y: 40, type: 'ground' },
    ],
  },
  lcd_16x2: {
    type: 'lcd_16x2',
    name: 'LCD 16x2 Screen',
    category: 'displays',
    width: 180,
    height: 80,
    description: 'Alphanumeric liquid crystal display. Shows 2 lines of 16 characters.',
    pins: [
      { id: 'lcd_vss', name: 'GND (Vss)', x: 15, y: 73, type: 'ground' },
      { id: 'lcd_vdd', name: 'VCC (Vdd)', x: 25, y: 73, type: 'power' },
      { id: 'lcd_vo', name: 'Contrast (Vo)', x: 35, y: 73 },
      { id: 'lcd_rs', name: 'Register Select (RS)', x: 45, y: 73 },
      { id: 'lcd_rw', name: 'Read/Write (RW)', x: 55, y: 73 },
      { id: 'lcd_e', name: 'Enable (E)', x: 65, y: 73 },
      { id: 'lcd_d0', name: 'D0', x: 75, y: 73 },
      { id: 'lcd_d1', name: 'D1', x: 85, y: 73 },
      { id: 'lcd_d2', name: 'D2', x: 95, y: 73 },
      { id: 'lcd_d3', name: 'D3', x: 105, y: 73 },
      { id: 'lcd_d4', name: 'D4', x: 115, y: 73 },
      { id: 'lcd_d5', name: 'D5', x: 125, y: 73 },
      { id: 'lcd_d6', name: 'D6', x: 135, y: 73 },
      { id: 'lcd_d7', name: 'D7', x: 145, y: 73 },
      { id: 'lcd_a', name: 'LED Anode (LED+)', x: 155, y: 73, type: 'power' },
      { id: 'lcd_k', name: 'LED Cathode (LED-)', x: 165, y: 73, type: 'ground' },
    ],
  },
  ultrasonic: {
    type: 'ultrasonic',
    name: 'Ultrasonic Sensor',
    category: 'sensors',
    width: 80,
    height: 45,
    description: 'HC-SR04 ultrasonic range finder sensor measuring 2cm to 400cm.',
    pins: [
      { id: 'vcc', name: 'VCC', x: 25, y: 39, type: 'power' },
      { id: 'trig', name: 'Trig', x: 35, y: 39, type: 'digital' },
      { id: 'echo', name: 'Echo', x: 45, y: 39, type: 'digital' },
      { id: 'gnd', name: 'GND', x: 55, y: 39, type: 'ground' },
    ],
  },
  gas_sensor: {
    type: 'gas_sensor',
    name: 'Gas Sensor',
    category: 'sensors',
    width: 60,
    height: 60,
    description: 'Gas concentration/smoke detector. Resistance changes with air quality.',
    pins: [
      { id: 'pin_a1', name: 'A1', x: 15, y: 15 },
      { id: 'pin_a2', name: 'A2', x: 30, y: 10 },
      { id: 'pin_a3', name: 'A3', x: 45, y: 15 },
      { id: 'pin_b1', name: 'B1', x: 15, y: 45 },
      { id: 'pin_b2', name: 'B2', x: 30, y: 50 },
      { id: 'pin_b3', name: 'B3', x: 45, y: 45 },
    ],
  },
  ldr: {
    type: 'ldr',
    name: 'Photoresistor (LDR)',
    category: 'sensors',
    width: 30,
    height: 15,
    description: 'Light-dependent resistor. Resistance drops in brighter light.',
    pins: [
      { id: 'pin_1', name: 'Terminal 1', x: 5, y: 7 },
      { id: 'pin_2', name: 'Terminal 2', x: 25, y: 7 },
    ],
  },
  dht11: {
    type: 'dht11',
    name: 'DHT11 Temp/Humid',
    category: 'sensors',
    width: 35,
    height: 50,
    description: 'Basic low-cost digital temperature and humidity sensor.',
    pins: [
      { id: 'vcc', name: 'VCC', x: 8, y: 44, type: 'power' },
      { id: 'data', name: 'Data', x: 15, y: 44, type: 'digital' },
      { id: 'nc', name: 'NC', x: 21, y: 44 },
      { id: 'gnd', name: 'GND', x: 27, y: 44, type: 'ground' },
    ],
  },
  battery_9v: {
    type: 'battery_9v',
    name: '9V Battery',
    category: 'power',
    width: 60,
    height: 90,
    description: 'Standard heavy-duty 9-volt battery cell source.',
    pins: [
      { id: 'positive', name: 'Positive (+)', x: 18, y: 12, type: 'power' },
      { id: 'negative', name: 'Negative (-)', x: 42, y: 12, type: 'ground' },
    ],
  },
  battery_aa: {
    type: 'battery_aa',
    name: '1.5V Battery (AA)',
    category: 'power',
    width: 90,
    height: 30,
    description: 'Standard 1.5V AA battery power source.',
    pins: [
      { id: 'negative', name: 'Negative (-)', x: 8, y: 15, type: 'ground' },
      { id: 'positive', name: 'Positive (+)', x: 82, y: 15, type: 'power' },
    ],
  },
  battery_coin: {
    type: 'battery_coin',
    name: '3V Coin Battery',
    category: 'power',
    width: 45,
    height: 45,
    description: '3V CR2032 lithium coin cell battery power source.',
    pins: [
      { id: 'negative', name: 'Negative (-)', x: 10, y: 22, type: 'ground' },
      { id: 'positive', name: 'Positive (+)', x: 35, y: 22, type: 'power' },
    ],
  },
  dc_motor: {
    type: 'dc_motor',
    name: 'DC Motor',
    category: 'actuators',
    width: 60,
    height: 60,
    description: 'Standard direct-current motor. Rotates fan blades when powered.',
    pins: [
      { id: 'pin_pos', name: 'Positive', x: 15, y: 50, type: 'passive' },
      { id: 'pin_neg', name: 'Negative', x: 45, y: 50, type: 'passive' },
    ],
  },
  servo: {
    type: 'servo',
    name: 'Micro Servo',
    category: 'actuators',
    width: 60,
    height: 50,
    description: 'Positional micro servo motor. Rotates horn to specific angles.',
    pins: [
      { id: 'gnd', name: 'GND (Brown)', x: 15, y: 42, type: 'ground' },
      { id: 'vcc', name: 'VCC (Red)', x: 30, y: 42, type: 'power' },
      { id: 'signal', name: 'Signal (Orange)', x: 45, y: 42, type: 'digital' },
    ],
  },
  seven_segment: {
    type: 'seven_segment',
    name: '7-Segment Display',
    category: 'displays',
    width: 42,
    height: 70,
    description: 'Common-cathode 7-segment display for displaying numbers.',
    pins: [
      // Top pins left-to-right (g, f, com1, a, b)
      { id: 'pin_g', name: 'G', x: 7, y: 8 },
      { id: 'pin_f', name: 'F', x: 14, y: 8 },
      { id: 'pin_com1', name: 'COM1', x: 21, y: 8, type: 'ground' },
      { id: 'pin_a', name: 'A', x: 28, y: 8 },
      { id: 'pin_b', name: 'B', x: 35, y: 8 },

      { id: 'pin_e', name: 'E', x: 7, y: 62 },
      { id: 'pin_d', name: 'D', x: 14, y: 62 },
      { id: 'pin_com2', name: 'COM2', x: 21, y: 62, type: 'ground' },
      { id: 'pin_c', name: 'C', x: 28, y: 62 },
      { id: 'pin_dp', name: 'DP', x: 35, y: 62 },
    ],
  },
  potentiometer: {
    type: 'potentiometer',
    name: 'Potentiometer',
    category: 'basic',
    width: 40,
    height: 45,
    description: 'Three-terminal resistor with a rotating dial forming an adjustable voltage divider.',
    pins: [
      { id: 'pin_1', name: 'Terminal 1', x: 8, y: 38 },
      { id: 'pin_wiper', name: 'Wiper', x: 20, y: 38 },
      { id: 'pin_3', name: 'Terminal 2', x: 32, y: 38 },
    ],
  },
};

for (const [type, map] of Object.entries(WOKWI_PART_MAPS)) {
  const key = type as ComponentType;
  const def = COMPONENT_DEFINITIONS[key];
  if (def && map) {
    def.width = map.width;
    def.height = map.height;
    def.pins = map.pins;
  }
}
