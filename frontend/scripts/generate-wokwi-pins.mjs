/**
 * Extracts pin positions from @wokwi/elements (MIT) for accurate Tinkercad-style wiring.
 * Run: node scripts/generate-wokwi-pins.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ESM_DIR = join(__dirname, '../node_modules/@wokwi/elements/dist/esm');

const FILES = {
  arduino_uno: 'arduino-uno-element.js',
  led: 'led-element.js',
  resistor: 'resistor-element.js',
  push_button: 'pushbutton-element.js',
  buzzer: 'buzzer-element.js',
  potentiometer: 'potentiometer-element.js',
  servo: 'servo-element.js',
  lcd_16x2: 'lcd1602-element.js',
  gas_sensor: 'gas-sensor-element.js',
  ldr: 'photoresistor-sensor-element.js',
  dht11: 'dht22-element.js',
  ultrasonic: 'hc-sr04-element.js',
  seven_segment: '7segment-element.js',
};

const PIN_ID_MAP = {
  arduino_uno: {
    '0': 'pin_0', '1': 'pin_1', '2': 'pin_2', '3': 'pin_3', '4': 'pin_4',
    '5': 'pin_5', '6': 'pin_6', '7': 'pin_7', '8': 'pin_8', '9': 'pin_9',
    '10': 'pin_10', '11': 'pin_11', '12': 'pin_12', '13': 'pin_13',
    'GND.1': 'pin_gnd1', 'GND.2': 'pin_gnd2', 'GND.3': 'pin_gnd3',
    '5V': 'pin_5v', '3.3V': 'pin_3v3', 'VIN': 'pin_vin',
    'A0': 'pin_a0', 'A1': 'pin_a1', 'A2': 'pin_a2', 'A3': 'pin_a3', 'A4': 'pin_a4', 'A5': 'pin_a5',
    'AREF': 'pin_aref', 'SDA': 'pin_sda', 'SCL': 'pin_scl', 'IOREF': 'pin_ioref', 'RESET': 'pin_reset',
    'A4.2': 'pin_sda', 'A5.2': 'pin_scl',
  },
  led: { A: 'anode', C: 'cathode' },
  resistor: { '1': 'pin_1', '2': 'pin_2' },
  push_button: { '1.l': 'terminal_1a', '2.l': 'terminal_2a', '1.r': 'terminal_1b', '2.r': 'terminal_2b' },
  buzzer: { '1': 'positive', '2': 'negative' },
  potentiometer: { GND: 'pin_1', SIG: 'pin_wiper', VCC: 'pin_3' },
  servo: { GND: 'gnd', 'V+': 'vcc', PWM: 'signal' },
  ldr: { '1': 'pin_1', '2': 'pin_2' },
  dht11: { VCC: 'vcc', GND: 'gnd', DATA: 'data' },
  ultrasonic: { VCC: 'vcc', Trig: 'trig', Echo: 'echo', GND: 'gnd' },
};

function extractPinInfo(source) {
  const match = source.match(/pinInfo\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return null;
  try {
    // eslint-disable-next-line no-eval
    return eval(match[1]);
  } catch {
    return null;
  }
}

function extractViewBox(source) {
  const match = source.match(/viewBox="([^"]+)"/);
  if (!match) return null;
  const parts = match[1].split(/\s+/).map(Number);
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

function extractWidthHeight(source) {
  const w = source.match(/width="([^"]+)"/);
  const h = source.match(/height="([^"]+)"/);
  return {
    width: w ? parseFloat(w[1]) : null,
    height: h ? parseFloat(h[1]) : null,
  };
}

const output = {};

for (const [type, file] of Object.entries(FILES)) {
  const path = join(ESM_DIR, file);
  const source = readFileSync(path, 'utf8');
  const pinInfo = extractPinInfo(source);
  const viewBox = extractViewBox(source);
  const dims = extractWidthHeight(source);

  if (!pinInfo) {
    console.warn(`No pinInfo for ${type}`);
    continue;
  }

  const idMap = PIN_ID_MAP[type] || {};
  const pins = [];
  const seen = new Set();

  for (const pin of pinInfo) {
    const id = idMap[pin.name] || pin.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (seen.has(id)) continue;
    seen.add(id);
    pins.push({
      id,
      name: pin.description || pin.name,
      x: Math.round(pin.x * 10) / 10,
      y: Math.round(pin.y * 10) / 10,
      type: pin.signals?.[0]?.type === 'power'
        ? pin.signals[0].signal === 'GND' ? 'ground' : 'power'
        : pin.signals?.[0]?.type === 'analog' ? 'analog'
          : pin.signals?.[0]?.type === 'pwm' || pin.signals?.[0]?.type === 'digital' ? 'digital'
            : undefined,
    });
  }

  const maxX = Math.max(...pins.map((p) => p.x), 0);
  const maxY = Math.max(...pins.map((p) => p.y), 0);

  output[type] = {
    wokwiTag: `wokwi-${file.replace('-element.js', '').replace('7segment', '7segment').replace('hc-sr04', 'hc-sr04').replace('photoresistor-sensor', 'photoresistor-sensor').replace('gas-sensor', 'gas-sensor').replace('dht22', 'dht22').replace('lcd1602', 'lcd1602').replace('arduino-uno', 'arduino-uno').replace('pushbutton', 'pushbutton')}`,
    width: Math.ceil(maxX + 12),
    height: Math.ceil(maxY + 12),
    viewBox,
    pins,
  };
}

// Fix wokwi tags manually
const TAGS = {
  arduino_uno: 'wokwi-arduino-uno',
  led: 'wokwi-led',
  resistor: 'wokwi-resistor',
  push_button: 'wokwi-pushbutton',
  buzzer: 'wokwi-buzzer',
  potentiometer: 'wokwi-potentiometer',
  servo: 'wokwi-servo',
  lcd_16x2: 'wokwi-lcd1602',
  gas_sensor: 'wokwi-gas-sensor',
  ldr: 'wokwi-photoresistor-sensor',
  dht11: 'wokwi-dht22',
  ultrasonic: 'wokwi-hc-sr04',
  seven_segment: 'wokwi-7segment',
};
for (const [k, v] of Object.entries(TAGS)) {
  if (output[k]) output[k].wokwiTag = v;
}

const outPath = join(__dirname, '../src/utils/wokwiPinMaps.ts');
const ts = `// Auto-generated from @wokwi/elements — MIT License
// Regenerate: node scripts/generate-wokwi-pins.mjs
import { ComponentType } from '../types';
import { Pin } from '../types';

export interface WokwiPartMap {
  wokwiTag: string;
  width: number;
  height: number;
  pins: Pin[];
  usesWokwi: boolean;
}

export const WOKWI_PART_MAPS: Partial<Record<ComponentType, WokwiPartMap>> = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(output).map(([k, v]) => [
      k,
      { wokwiTag: v.wokwiTag, width: v.width, height: v.height, pins: v.pins, usesWokwi: true },
    ]),
  ),
  null,
  2,
)};
`;

writeFileSync(outPath, ts);
console.log(`Wrote ${outPath}`);
