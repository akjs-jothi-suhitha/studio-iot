// Pin positions from @wokwi/elements (MIT) — https://github.com/wokwi/wokwi-elements
import { ComponentType, Pin } from '../types';

export interface WokwiPartMap {
  wokwiTag: string;
  width: number;
  height: number;
  pins: Pin[];
  usesWokwi: boolean;
}

export const WOKWI_PART_MAPS: Partial<Record<ComponentType, WokwiPartMap>> = {
  arduino_uno: {
    wokwiTag: 'wokwi-arduino-uno',
    width: 268,
    height: 204,
    usesWokwi: true,
    pins: [
      { id: 'pin_scl', name: 'SCL', x: 87, y: 9, type: 'passive' },
      { id: 'pin_sda', name: 'SDA', x: 97, y: 9, type: 'passive' },
      { id: 'pin_aref', name: 'AREF', x: 106, y: 9, type: 'passive' },
      { id: 'pin_gnd1', name: 'GND', x: 115.5, y: 9, type: 'ground' },
      { id: 'pin_13', name: 'D13', x: 125, y: 9, type: 'digital' },
      { id: 'pin_12', name: 'D12', x: 134.5, y: 9, type: 'digital' },
      { id: 'pin_11', name: 'D11', x: 144, y: 9, type: 'digital' },
      { id: 'pin_10', name: 'D10', x: 153.5, y: 9, type: 'digital' },
      { id: 'pin_9', name: 'D9', x: 163, y: 9, type: 'digital' },
      { id: 'pin_8', name: 'D8', x: 173, y: 9, type: 'digital' },
      { id: 'pin_7', name: 'D7', x: 189, y: 9, type: 'digital' },
      { id: 'pin_6', name: 'D6', x: 198.5, y: 9, type: 'digital' },
      { id: 'pin_5', name: 'D5', x: 208, y: 9, type: 'digital' },
      { id: 'pin_4', name: 'D4', x: 217.5, y: 9, type: 'digital' },
      { id: 'pin_3', name: 'D3', x: 227, y: 9, type: 'digital' },
      { id: 'pin_2', name: 'D2', x: 236.5, y: 9, type: 'digital' },
      { id: 'pin_1', name: 'D1/TX', x: 246, y: 9, type: 'digital' },
      { id: 'pin_0', name: 'D0/RX', x: 255.5, y: 9, type: 'digital' },
      { id: 'pin_ioref', name: 'IOREF', x: 131, y: 191.5, type: 'power' },
      { id: 'pin_reset', name: 'RESET', x: 140.5, y: 191.5, type: 'passive' },
      { id: 'pin_3v3', name: '3.3V', x: 150, y: 191.5, type: 'power' },
      { id: 'pin_5v', name: '5V', x: 160, y: 191.5, type: 'power' },
      { id: 'pin_gnd2', name: 'GND', x: 169.5, y: 191.5, type: 'ground' },
      { id: 'pin_gnd3', name: 'GND', x: 179, y: 191.5, type: 'ground' },
      { id: 'pin_vin', name: 'VIN', x: 188.5, y: 191.5, type: 'power' },
      { id: 'pin_a0', name: 'A0', x: 208, y: 191.5, type: 'analog' },
      { id: 'pin_a1', name: 'A1', x: 217.5, y: 191.5, type: 'analog' },
      { id: 'pin_a2', name: 'A2', x: 227, y: 191.5, type: 'analog' },
      { id: 'pin_a3', name: 'A3', x: 236.5, y: 191.5, type: 'analog' },
      { id: 'pin_a4', name: 'A4', x: 246, y: 191.5, type: 'analog' },
      { id: 'pin_a5', name: 'A5', x: 255.5, y: 191.5, type: 'analog' },
    ],
  },
  led: {
    wokwiTag: 'wokwi-led',
    width: 40,
    height: 55,
    usesWokwi: true,
    pins: [
      { id: 'anode', name: 'Anode (+)', x: 25, y: 42, type: 'passive' },
      { id: 'cathode', name: 'Cathode (-)', x: 15, y: 42, type: 'passive' },
    ],
  },
  resistor: {
    wokwiTag: 'wokwi-resistor',
    width: 71,
    height: 18,
    usesWokwi: true,
    pins: [
      { id: 'pin_1', name: 'Terminal 1', x: 0, y: 5.7, type: 'passive' },
      { id: 'pin_2', name: 'Terminal 2', x: 58.8, y: 5.7, type: 'passive' },
    ],
  },
  push_button: {
    wokwiTag: 'wokwi-pushbutton',
    width: 79,
    height: 44,
    usesWokwi: true,
    pins: [
      { id: 'terminal_1a', name: '1L', x: 0, y: 13 },
      { id: 'terminal_2a', name: '2L', x: 0, y: 32 },
      { id: 'terminal_1b', name: '1R', x: 67, y: 13 },
      { id: 'terminal_2b', name: '2R', x: 67, y: 32 },
    ],
  },
  buzzer: {
    wokwiTag: 'wokwi-buzzer',
    width: 64,
    height: 96,
    usesWokwi: true,
    pins: [
      { id: 'positive', name: 'Positive (+)', x: 27, y: 84, type: 'passive' },
      { id: 'negative', name: 'Negative (-)', x: 37, y: 84, type: 'ground' },
    ],
  },
  potentiometer: {
    wokwiTag: 'wokwi-potentiometer',
    width: 58,
    height: 72,
    usesWokwi: true,
    pins: [
      { id: 'pin_1', name: 'GND', x: 29, y: 68.5, type: 'ground' },
      { id: 'pin_wiper', name: 'SIG', x: 39, y: 68.5, type: 'analog' },
      { id: 'pin_3', name: 'VCC', x: 49, y: 68.5, type: 'power' },
    ],
  },
  servo: {
    wokwiTag: 'wokwi-servo',
    width: 170,
    height: 120,
    usesWokwi: true,
    pins: [
      { id: 'gnd', name: 'GND', x: 0, y: 50, type: 'ground' },
      { id: 'vcc', name: 'VCC', x: 0, y: 59.5, type: 'power' },
      { id: 'signal', name: 'PWM', x: 0, y: 69, type: 'digital' },
    ],
  },
  lcd_16x2: {
    wokwiTag: 'wokwi-lcd1602',
    width: 188,
    height: 145,
    usesWokwi: true,
    pins: [
      { id: 'lcd_vss', name: 'GND', x: 32, y: 131, type: 'ground' },
      { id: 'lcd_vdd', name: 'VCC', x: 41.5, y: 131, type: 'power' },
      { id: 'lcd_vo', name: 'Vo', x: 51.5, y: 131 },
      { id: 'lcd_rs', name: 'RS', x: 60.5, y: 131 },
      { id: 'lcd_rw', name: 'RW', x: 70.5, y: 131 },
      { id: 'lcd_e', name: 'E', x: 80, y: 131 },
      { id: 'lcd_d0', name: 'D0', x: 89.5, y: 131 },
      { id: 'lcd_d1', name: 'D1', x: 99.5, y: 131 },
      { id: 'lcd_d2', name: 'D2', x: 109, y: 131 },
      { id: 'lcd_d3', name: 'D3', x: 118.5, y: 131 },
      { id: 'lcd_d4', name: 'D4', x: 128, y: 131 },
      { id: 'lcd_d5', name: 'D5', x: 137.5, y: 131 },
      { id: 'lcd_d6', name: 'D6', x: 147, y: 131 },
      { id: 'lcd_d7', name: 'D7', x: 156.5, y: 131 },
      { id: 'lcd_a', name: 'LED+', x: 166.5, y: 131, type: 'power' },
      { id: 'lcd_k', name: 'LED-', x: 176, y: 131, type: 'ground' },
    ],
  },
  gas_sensor: {
    wokwiTag: 'wokwi-gas-sensor',
    width: 149,
    height: 62,
    usesWokwi: true,
    pins: [
      { id: 'pin_a1', name: 'AOUT', x: 137, y: 16.5 },
      { id: 'pin_b1', name: 'DOUT', x: 137, y: 26.4 },
      { id: 'pin_gnd', name: 'GND', x: 137, y: 36.5, type: 'ground' },
      { id: 'pin_vcc', name: 'VCC', x: 137, y: 46.2, type: 'power' },
    ],
  },
  ldr: {
    wokwiTag: 'wokwi-photoresistor-sensor',
    width: 174,
    height: 62,
    usesWokwi: true,
    pins: [
      { id: 'pin_1', name: 'VCC', x: 172, y: 16, type: 'power' },
      { id: 'pin_gnd', name: 'GND', x: 172, y: 26, type: 'ground' },
      { id: 'pin_2', name: 'AO', x: 172, y: 45.5, type: 'analog' },
    ],
  },
  dht11: {
    wokwiTag: 'wokwi-dht22',
    width: 56,
    height: 127,
    usesWokwi: true,
    pins: [
      { id: 'vcc', name: 'VCC', x: 15, y: 114.9, type: 'power' },
      { id: 'data', name: 'DATA', x: 24.5, y: 114.9, type: 'digital' },
      { id: 'nc', name: 'NC', x: 34.1, y: 114.9 },
      { id: 'gnd', name: 'GND', x: 43.8, y: 114.9, type: 'ground' },
    ],
  },
  ultrasonic: {
    wokwiTag: 'wokwi-hc-sr04',
    width: 114,
    height: 107,
    usesWokwi: true,
    pins: [
      { id: 'vcc', name: 'VCC', x: 71.3, y: 94.5, type: 'power' },
      { id: 'trig', name: 'TRIG', x: 81.3, y: 94.5, type: 'digital' },
      { id: 'echo', name: 'ECHO', x: 91.3, y: 94.5, type: 'digital' },
      { id: 'gnd', name: 'GND', x: 101.3, y: 94.5, type: 'ground' },
    ],
  },
};

export const usesWokwiElement = (type: ComponentType): boolean =>
  Boolean(WOKWI_PART_MAPS[type]?.usesWokwi);
