import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../public/assets/fritzing');
const outFile = path.join(__dirname, '../src/utils/fritzingPinCalibration.ts');

function parseViewBox(content) {
  const m = content.match(/viewBox="([^"]+)"/);
  if (!m) return null;
  const [x, y, w, h] = m[1].split(/\s+/).map(Number);
  return { x, y, width: w, height: h };
}

function parseConnectorPins(content) {
  const pins = [];
  const tagRe = /<(circle|rect)[^>]*id="(connector\d+pin)"[^>]*>/gi;
  let m;
  while ((m = tagRe.exec(content)) !== null) {
    const tag = m[0];
    const id = m[2];
    const num = parseInt(id.replace('connector', '').replace('pin', ''), 10);
    const nameMatch = tag.match(/connectorname="([^"]+)"/i);
    const cx = tag.match(/\bcx="([^"]+)"/);
    const cy = tag.match(/\bcy="([^"]+)"/);
    const rx = tag.match(/\bx="([^"]+)"/);
    const ry = tag.match(/\by="([^"]+)"/);
    const rw = tag.match(/\bwidth="([^"]+)"/);
    const rh = tag.match(/\bheight="([^"]+)"/);

    let x = 0;
    let y = 0;
    if (cx && cy) {
      x = parseFloat(cx[1]);
      y = parseFloat(cy[1]);
    } else if (rx && ry) {
      x = parseFloat(rx[1]) + parseFloat((rw && rw[1]) || '1') / 2;
      y = parseFloat(ry[1]) + parseFloat((rh && rh[1]) || '1') / 2;
    }

    pins.push({ id, num, x, y, name: nameMatch ? nameMatch[1] : '' });
  }

  pins.sort((a, b) => a.num - b.num);
  return pins;
}

function parseBreadboardHolePins(content) {
  const pins = [];
  const groupRe = /<g id="([A-Z])(\d+)pin"[^>]*>[\s\S]*?<circle[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"/gi;
  let m;
  while ((m = groupRe.exec(content)) !== null) {
    pins.push({
      row: m[1],
      col: parseInt(m[2], 10),
      x: parseFloat(m[3]),
      y: parseFloat(m[4]),
    });
  }
  return pins;
}

function parseDhtPins(content) {
  const pins = [];
  const re = /<rect[^>]*id="(connector\d+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    const tag = m[0];
    const num = parseInt(m[1].replace('connector', ''), 10);
    const x = parseFloat((tag.match(/\bx="([^"]+)"/) || ['', '0'])[1]);
    const y = parseFloat((tag.match(/\by="([^"]+)"/) || ['', '0'])[1]);
    const w = parseFloat((tag.match(/\bwidth="([^"]+)"/) || ['', '1'])[1]);
    const h = parseFloat((tag.match(/\bheight="([^"]+)"/) || ['', '1'])[1]);
    pins.push({ num, x: x + w / 2, y: y + h / 2 });
  }
  return pins.sort((a, b) => a.num - b.num);
}

function scaleCoord(value, fromSize, toSize) {
  return Math.round((value * toSize) / fromSize * 100) / 100;
}

function fitDisplaySize(viewBox, maxWidth = 240, maxHeight = 160) {
  const scale = Math.min(maxWidth / viewBox.width, maxHeight / viewBox.height, 1);
  return {
    width: Math.round(viewBox.width * scale * 100) / 100,
    height: Math.round(viewBox.height * scale * 100) / 100,
    scale,
  };
}

function scalePins(pins, viewBox, display) {
  return pins.map((pin) => ({
    ...pin,
    x: scaleCoord(pin.x, viewBox.width, display.width),
    y: scaleCoord(pin.y, viewBox.height, display.height),
  }));
}

function readSvg(name) {
  return fs.readFileSync(path.join(assetsDir, `${name}.svg`), 'utf8');
}

function byConnector(pins, index) {
  const pin = pins.find((item) => item.num === index);
  if (!pin) throw new Error(`Missing connector${index}pin`);
  return { x: pin.x, y: pin.y };
}

const calibrations = {};

// --- Arduino Uno ---
{
  const content = readSvg('arduino_uno');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 212, 151);
  const scaled = scalePins(pins, viewBox, display);
  const get = (num) => {
    const pin = scaled.find((item) => item.num === num);
    return { x: pin.x, y: pin.y };
  };

  calibrations.arduino_uno = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'pin_0', name: 'RX<-0', x: get(61).x, y: get(61).y, type: 'digital' },
      { id: 'pin_1', name: 'TX->1', x: get(62).x, y: get(62).y, type: 'digital' },
      { id: 'pin_2', name: 'D2', x: get(63).x, y: get(63).y, type: 'digital' },
      { id: 'pin_3', name: '~D3', x: get(64).x, y: get(64).y, type: 'digital' },
      { id: 'pin_4', name: 'D4', x: get(65).x, y: get(65).y, type: 'digital' },
      { id: 'pin_5', name: '~D5', x: get(66).x, y: get(66).y, type: 'digital' },
      { id: 'pin_6', name: '~D6', x: get(67).x, y: get(67).y, type: 'digital' },
      { id: 'pin_7', name: 'D7', x: get(68).x, y: get(68).y, type: 'digital' },
      { id: 'pin_8', name: 'D8', x: get(51).x, y: get(51).y, type: 'digital' },
      { id: 'pin_9', name: '~D9', x: get(52).x, y: get(52).y, type: 'digital' },
      { id: 'pin_10', name: '~D10', x: get(53).x, y: get(53).y, type: 'digital' },
      { id: 'pin_11', name: '~D11', x: get(54).x, y: get(54).y, type: 'digital' },
      { id: 'pin_12', name: 'D12', x: get(55).x, y: get(55).y, type: 'digital' },
      { id: 'pin_13', name: 'D13', x: get(56).x, y: get(56).y, type: 'digital' },
      { id: 'pin_gnd1', name: 'GND', x: get(57).x, y: get(57).y, type: 'ground' },
      { id: 'pin_aref', name: 'AREF', x: get(58).x, y: get(58).y, type: 'passive' },
      { id: 'pin_sda', name: 'SDA', x: get(59).x, y: get(59).y, type: 'passive' },
      { id: 'pin_scl', name: 'SCL', x: get(60).x, y: get(60).y, type: 'passive' },
      { id: 'pin_ioref', name: 'IOREF', x: get(91).x, y: get(91).y, type: 'power' },
      { id: 'pin_reset', name: 'RESET', x: get(84).x, y: get(84).y, type: 'passive' },
      { id: 'pin_3v3', name: '3.3V', x: get(85).x, y: get(85).y, type: 'power' },
      { id: 'pin_5v', name: '5V', x: get(86).x, y: get(86).y, type: 'power' },
      { id: 'pin_gnd2', name: 'GND', x: get(87).x, y: get(87).y, type: 'ground' },
      { id: 'pin_gnd3', name: 'GND', x: get(88).x, y: get(88).y, type: 'ground' },
      { id: 'pin_vin', name: 'VIN', x: get(89).x, y: get(89).y, type: 'power' },
      { id: 'pin_a0', name: 'A0', x: get(0).x, y: get(0).y, type: 'analog' },
      { id: 'pin_a1', name: 'A1', x: get(1).x, y: get(1).y, type: 'analog' },
      { id: 'pin_a2', name: 'A2', x: get(2).x, y: get(2).y, type: 'analog' },
      { id: 'pin_a3', name: 'A3', x: get(3).x, y: get(3).y, type: 'analog' },
      { id: 'pin_a4', name: 'A4', x: get(4).x, y: get(4).y, type: 'analog' },
      { id: 'pin_a5', name: 'A5', x: get(5).x, y: get(5).y, type: 'analog' },
    ],
  };
}

// --- Breadboard ---
{
  const content = readSvg('breadboard_small');
  const viewBox = parseViewBox(content);
  const holes = parseBreadboardHolePins(content);
  const display = { width: viewBox.width, height: viewBox.height, scale: 1 };
  const pins = [];

  const rowMap = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', h: 'h', i: 'i', j: 'j' };
  for (const hole of holes) {
    if (rowMap[hole.row]) {
      pins.push({
        id: `hole_${hole.row.toLowerCase()}_${hole.col}`,
        name: `Hole ${hole.row}${hole.col}`,
        x: hole.x,
        y: hole.y,
        type: 'passive',
      });
    } else if (hole.row === 'W') {
      pins.push({ id: `top_minus_${hole.col - 1}`, name: `Top - Rail ${hole.col}`, x: hole.x, y: hole.y, type: 'ground' });
    } else if (hole.row === 'X') {
      pins.push({ id: `top_plus_${hole.col - 1}`, name: `Top + Rail ${hole.col}`, x: hole.x, y: hole.y, type: 'power' });
    } else if (hole.row === 'Y') {
      pins.push({ id: `bottom_minus_${hole.col - 1}`, name: `Bottom - Rail ${hole.col}`, x: hole.x, y: hole.y, type: 'ground' });
    } else if (hole.row === 'Z') {
      pins.push({ id: `bottom_plus_${hole.col - 1}`, name: `Bottom + Rail ${hole.col}`, x: hole.x, y: hole.y, type: 'power' });
    }
  }

  calibrations.breadboard_small = { width: display.width, height: display.height, viewBox, pins };
}

function simpleTwoPin(type, file, pinA, pinB, maxW = 120) {
  const content = readSvg(file);
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, maxW, maxW);
  const scaled = scalePins(pins, viewBox, display);
  const get = (num) => scaled.find((item) => item.num === num);
  calibrations[type] = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { ...pinA, x: get(pinA.connector).x, y: get(pinA.connector).y },
      { ...pinB, x: get(pinB.connector).x, y: get(pinB.connector).y },
    ].map(({ connector, ...rest }) => rest),
  };
}

simpleTwoPin('resistor', 'resistor', { id: 'pin_1', name: 'Terminal 1', connector: 0, type: 'passive' }, { id: 'pin_2', name: 'Terminal 2', connector: 1, type: 'passive' }, 43);
simpleTwoPin('ldr', 'ldr', { id: 'pin_1', name: 'Terminal 1', connector: 0, type: 'passive' }, { id: 'pin_2', name: 'Terminal 2', connector: 1, type: 'passive' }, 24);

{
  const content = readSvg('led');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 22, 41);
  const scaled = scalePins(pins, viewBox, display);
  calibrations.led = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'cathode', name: 'Cathode (-)', x: scaled[0].x, y: scaled[0].y, type: 'passive' },
      { id: 'anode', name: 'Anode (+)', x: scaled[1].x, y: scaled[1].y, type: 'passive' },
    ],
  };
}

{
  const content = readSvg('push_button');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 25, 33);
  const scaled = scalePins(pins, viewBox, display);
  const get = (num) => scaled.find((item) => item.num === num);
  calibrations.push_button = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'terminal_1a', name: 'Terminal 1A', x: get(2).x, y: get(2).y },
      { id: 'terminal_1b', name: 'Terminal 1B', x: get(0).x, y: get(0).y },
      { id: 'terminal_2a', name: 'Terminal 2A', x: get(3).x, y: get(3).y },
      { id: 'terminal_2b', name: 'Terminal 2B', x: get(1).x, y: get(1).y },
    ],
  };
}

{
  const content = readSvg('buzzer');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 57, 57);
  const scaled = scalePins(pins, viewBox, display);
  const get = (num) => scaled.find((item) => item.num === num);
  calibrations.buzzer = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'positive', name: 'Positive (+)', x: get(2).x, y: get(2).y, type: 'passive' },
      { id: 'negative', name: 'Negative (-)', x: get(3).x, y: get(3).y, type: 'ground' },
    ],
  };
}

{
  const content = readSvg('potentiometer');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 41, 83);
  const scaled = scalePins(pins, viewBox, display);
  calibrations.potentiometer = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'pin_1', name: 'Terminal 1', x: scaled[0].x, y: scaled[0].y },
      { id: 'pin_wiper', name: 'Wiper', x: scaled[1].x, y: scaled[1].y },
      { id: 'pin_3', name: 'Terminal 2', x: scaled[2].x, y: scaled[2].y },
    ],
  };
}

{
  const content = readSvg('lcd_16x2');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 227, 103);
  const scaled = scalePins(pins, viewBox, display);
  const names = ['GND (Vss)', 'VCC (Vdd)', 'Contrast (Vo)', 'Register Select (RS)', 'Read/Write (RW)', 'Enable (E)', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'LED Anode (LED+)', 'LED Cathode (LED-)'];
  const ids = ['lcd_vss', 'lcd_vdd', 'lcd_vo', 'lcd_rs', 'lcd_rw', 'lcd_e', 'lcd_d0', 'lcd_d1', 'lcd_d2', 'lcd_d3', 'lcd_d4', 'lcd_d5', 'lcd_d6', 'lcd_d7', 'lcd_a', 'lcd_k'];
  const types = ['ground', 'power', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'power', 'ground'];
  calibrations.lcd_16x2 = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: scaled.map((pin, index) => ({
      id: ids[index],
      name: names[index],
      x: pin.x,
      y: pin.y,
      ...(types[index] ? { type: types[index] } : {}),
    })),
  };
}

{
  const content = readSvg('seven_segment');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 52, 80);
  const scaled = scalePins(pins, viewBox, display);
  const get = (num) => scaled.find((item) => item.num === num);
  calibrations.seven_segment = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'pin_e', name: 'E', x: get(0).x, y: get(0).y },
      { id: 'pin_d', name: 'D', x: get(1).x, y: get(1).y },
      { id: 'pin_c', name: 'C', x: get(2).x, y: get(2).y },
      { id: 'pin_dp', name: 'DP', x: get(3).x, y: get(3).y },
      { id: 'pin_b', name: 'B', x: get(4).x, y: get(4).y },
      { id: 'pin_a', name: 'A', x: get(5).x, y: get(5).y },
      { id: 'pin_com1', name: 'COM1', x: get(6).x, y: get(6).y, type: 'ground' },
      { id: 'pin_f', name: 'F', x: get(7).x, y: get(7).y },
      { id: 'pin_g', name: 'G', x: get(8).x, y: get(8).y },
      { id: 'pin_com2', name: 'COM2', x: get(9).x, y: get(9).y, type: 'ground' },
    ],
  };
}

{
  const content = readSvg('ultrasonic');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 90, 47);
  const scaled = scalePins(pins, viewBox, display);
  calibrations.ultrasonic = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'vcc', name: 'VCC', x: scaled[0].x, y: scaled[0].y, type: 'power' },
      { id: 'trig', name: 'Trig', x: scaled[1].x, y: scaled[1].y, type: 'digital' },
      { id: 'echo', name: 'Echo', x: scaled[2].x, y: scaled[2].y, type: 'digital' },
      { id: 'gnd', name: 'GND', x: scaled[3].x, y: scaled[3].y, type: 'ground' },
    ],
  };
}

{
  const content = readSvg('gas_sensor');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 48, 48);
  const scaled = scalePins(pins, viewBox, display);
  const get = (num) => scaled.find((item) => item.num === num);
  calibrations.gas_sensor = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'pin_a1', name: 'A1', x: get(0).x, y: get(0).y },
      { id: 'pin_a2', name: 'A2', x: get(1).x, y: get(1).y },
      { id: 'pin_b1', name: 'B1', x: get(2).x, y: get(2).y },
      { id: 'pin_b2', name: 'B2', x: get(3).x, y: get(3).y },
      { id: 'pin_a3', name: 'H1', x: get(4).x, y: get(4).y },
      { id: 'pin_b3', name: 'GND', x: get(5).x, y: get(5).y },
    ],
  };
}

{
  const content = readSvg('dht11');
  const viewBox = parseViewBox(content);
  const rawPins = parseDhtPins(content);
  const display = fitDisplaySize(viewBox, 35, 50);
  const scaled = scalePins(rawPins, viewBox, display);
  const ordered = scaled.slice(-4);
  if (ordered.length < 4) {
    throw new Error(`Expected 4 DHT pins, found ${ordered.length}`);
  }
  calibrations.dht11 = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'vcc', name: 'VCC', x: ordered[0].x, y: ordered[0].y, type: 'power' },
      { id: 'data', name: 'Data', x: ordered[1].x, y: ordered[1].y, type: 'digital' },
      { id: 'nc', name: 'NC', x: ordered[2].x, y: ordered[2].y },
      { id: 'gnd', name: 'GND', x: ordered[3].x, y: ordered[3].y, type: 'ground' },
    ],
  };
}

{
  const content = readSvg('dc_motor');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 120, 56);
  const scaled = scalePins(pins, viewBox, display);
  calibrations.dc_motor = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'pin_pos', name: 'Positive', x: scaled[0].x, y: scaled[0].y, type: 'passive' },
      { id: 'pin_neg', name: 'Negative', x: scaled[1].x, y: scaled[1].y, type: 'passive' },
    ],
  };
}

calibrations.servo = {
  width: 153,
  height: 45,
  viewBox: { width: 153, height: 45 },
  pins: [
    { id: 'gnd', name: 'GND (Brown)', x: 118, y: 41, type: 'ground' },
    { id: 'vcc', name: 'VCC (Red)', x: 128, y: 41, type: 'power' },
    { id: 'signal', name: 'Signal (Orange)', x: 138, y: 41, type: 'digital' },
  ],
};

{
  const content = readSvg('battery_9v');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 95, 152);
  const scaled = scalePins(pins, viewBox, display);
  calibrations.battery_9v = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'negative', name: 'Negative (-)', x: scaled[0].x, y: scaled[0].y, type: 'ground' },
      { id: 'positive', name: 'Positive (+)', x: scaled[1].x, y: scaled[1].y, type: 'power' },
    ],
  };
}

{
  const content = readSvg('battery_aa');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 154, 38);
  const scaled = scalePins(pins, viewBox, display);
  calibrations.battery_aa = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'negative', name: 'Negative (-)', x: scaled[0].x, y: scaled[0].y, type: 'ground' },
      { id: 'positive', name: 'Positive (+)', x: scaled[1].x, y: scaled[1].y, type: 'power' },
    ],
  };
}

{
  const content = readSvg('battery_coin');
  const viewBox = parseViewBox(content);
  const pins = parseConnectorPins(content);
  const display = fitDisplaySize(viewBox, 73, 82);
  const scaled = scalePins(pins, viewBox, display);
  const minus = scaled.find((pin) => pin.name === '-') || scaled[0];
  const plus = scaled.find((pin) => pin.name === '+') || scaled[1];
  calibrations.battery_coin = {
    width: display.width,
    height: display.height,
    viewBox,
    pins: [
      { id: 'negative', name: 'Negative (-)', x: minus.x, y: minus.y, type: 'ground' },
      { id: 'positive', name: 'Positive (+)', x: plus.x, y: plus.y, type: 'power' },
    ],
  };
}

const ts = `import { ComponentType, Pin } from '../types';

export interface FritzingCalibration {
  width: number;
  height: number;
  viewBox: { width: number; height: number };
  pins: Pin[];
}

/** Auto-generated from Fritzing SVG connector coordinates. Re-run scripts/generate-fritzing-calibration.mjs after asset changes. */
export const FRITZING_PIN_CALIBRATION: Record<ComponentType, FritzingCalibration> = ${JSON.stringify(calibrations, null, 2)} as Record<ComponentType, FritzingCalibration>;
`;

fs.writeFileSync(outFile, ts);
console.log(`Wrote ${outFile}`);
