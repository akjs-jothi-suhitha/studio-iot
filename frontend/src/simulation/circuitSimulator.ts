import { ComponentInstance, Wire } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';

export interface SimulationState {
  digitalPins: Record<string, number>;
  analogPins: Record<string, number>;
  pinModes: Record<string, 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP'>;
  ledStates: Record<string, boolean>;
  ledWarnings: Record<string, string>;
  buzzerStates: Record<string, boolean>;
  servoAngles: Record<string, number>;
  motorSpeeds: Record<string, number>;
  lcdLines: Record<string, [string, string]>;
  serialLogs: string[];
  validationErrors: string[];
}

class WebAudioBuzzer {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;

  start(freq: number) {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      this.stop();
      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sine';
      this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.osc.connect(this.ctx.destination);
      this.osc.start();
    } catch (e) {
      console.warn('Audio Context failed to start:', e);
    }
  }

  stop() {
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch (e) {}
      this.osc = null;
    }
  }
}

const buzzerAudio = new WebAudioBuzzer();

export class CircuitSimulator {
  private components: ComponentInstance[] = [];
  private wires: Wire[] = [];
  private state: SimulationState = this.getInitialState();
  private simulating = false;
  private mode: 'circuit' | 'code' = 'circuit';
  private timerIds: any[] = [];
  private onStateUpdate: (state: SimulationState) => void = () => {};

  constructor(onUpdate: (state: SimulationState) => void) {
    this.onStateUpdate = onUpdate;
  }

  private getInitialState(): SimulationState {
    return {
      digitalPins: {},
      analogPins: {},
      pinModes: {},
      ledStates: {},
      ledWarnings: {},
      buzzerStates: {},
      servoAngles: {},
      motorSpeeds: {},
      lcdLines: {},
      serialLogs: [],
      validationErrors: [],
    };
  }

  updateCircuit(components: ComponentInstance[], wires: Wire[]) {
    this.components = components;
    this.wires = wires;
    if (this.simulating) {
      this.evaluateElectricalNets();
    }
  }

  start(code: string, mode: 'circuit' | 'code' = 'circuit') {
    this.simulating = true;
    this.mode = mode;
    this.state = this.getInitialState();
    this.state.serialLogs = [`--- Simulation Started (${mode.toUpperCase()} MODE) ---`];
    
    // Validate circuit before running
    const validationErrors = this.validateCircuit();
    this.state.validationErrors = validationErrors;

    if (validationErrors.length > 0) {
      validationErrors.forEach(err => this.logSerial(`[Warning] ${err}`));
    } else {
      this.logSerial(`[Info] Circuit validation passed.`);
    }

    this.onStateUpdate({ ...this.state });
    this.evaluateElectricalNets();

    if (this.mode === 'code') {
      this.runArduinoCode(code);
      
      // Optionally run compile check
      fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeText: code, boardType: 'arduino_uno' })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          this.logSerial(`[CLI] Compilation successful. Flash: ${data.memory.flash.used} bytes (${data.memory.flash.percentage}%), SRAM: ${data.memory.sram.used} bytes (${data.memory.sram.percentage}%)`);
        } else {
          this.logSerial(`[CLI Error] ${data.error}`);
        }
      }).catch(err => {
        this.logSerial(`[CLI Info] Offline compilation skipped. Using browser simulation engine.`);
      });
    }
  }

  stop() {
    this.simulating = false;
    buzzerAudio.stop();
    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];
    
    // Reset outputs
    this.state.ledStates = {};
    this.state.ledWarnings = {};
    this.state.buzzerStates = {};
    this.state.motorSpeeds = {};
    this.state.lcdLines = {};
    this.state.validationErrors = [];
    this.state.serialLogs.push('--- Simulation Stopped ---');
    this.onStateUpdate({ ...this.state });
  }

  private buildNets() {
    const adj: Record<string, string[]> = {};
    const addConnection = (a: string, b: string) => {
      if (!adj[a]) adj[a] = [];
      if (!adj[b]) adj[b] = [];
      adj[a].push(b);
      adj[b].push(a);
    };

    const getPinKey = (compId: string, pinId: string) => `${compId}_${pinId}`;

    for (const w of this.wires) {
      addConnection(getPinKey(w.fromComponentId, w.fromPinId), getPinKey(w.toComponentId, w.toPinId));
    }

    for (const comp of this.components) {
      if (comp.type === 'breadboard_small') {
        const prefix = comp.id;
        const rowsTop = ['a', 'b', 'c', 'd', 'e'];
        const rowsBottom = ['f', 'g', 'h', 'i', 'j'];

        for (let col = 1; col <= 30; col++) {
          for (let r = 0; r < 4; r++) {
            addConnection(getPinKey(prefix, `hole_${rowsTop[r]}_${col}`), getPinKey(prefix, `hole_${rowsTop[r+1]}_${col}`));
          }
          for (let r = 0; r < 4; r++) {
            addConnection(getPinKey(prefix, `hole_${rowsBottom[r]}_${col}`), getPinKey(prefix, `hole_${rowsBottom[r+1]}_${col}`));
          }
        }

        for (let col = 0; col < 29; col++) {
          addConnection(getPinKey(prefix, `top_minus_${col}`), getPinKey(prefix, `top_minus_${col+1}`));
          addConnection(getPinKey(prefix, `top_plus_${col}`), getPinKey(prefix, `top_plus_${col+1}`));
          addConnection(getPinKey(prefix, `bottom_minus_${col}`), getPinKey(prefix, `bottom_minus_${col+1}`));
          addConnection(getPinKey(prefix, `bottom_plus_${col}`), getPinKey(prefix, `bottom_plus_${col+1}`));
        }
      }
    }

    const visited = new Set<string>();
    const nets: string[][] = [];
    const allPins: string[] = [];

    for (const comp of this.components) {
      const def = COMPONENT_DEFINITIONS[comp.type];
      if (def) {
        for (const pin of def.pins) {
          allPins.push(getPinKey(comp.id, pin.id));
        }
      }
    }

    for (const pin of allPins) {
      if (!visited.has(pin)) {
        const net: string[] = [];
        const queue = [pin];
        visited.add(pin);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          net.push(curr);
          const neighbors = adj[curr] || [];
          for (const next of neighbors) {
            if (!visited.has(next)) {
              visited.add(next);
              queue.push(next);
            }
          }
        }
        nets.push(net);
      }
    }

    return { nets, getPinKey };
  }

  private validateCircuit(): string[] {
    const errors: string[] = [];
    const { nets, getPinKey } = this.buildNets();

    // 1. Short Circuit Detection (Power to GND directly)
    // 2. Open Circuit / Floating pins
    // 3. Reverse LED polarity
    for (const net of nets) {
      let hasPower = false;
      let hasGnd = false;
      
      for (const pinKey of net) {
        const [compId, pinId] = pinKey.split('_');
        const comp = this.components.find(c => c.id === compId);
        if (!comp) continue;

        if (comp.type === 'arduino_uno') {
          if (pinId === 'pin_5v' || pinId === 'pin_3v3') hasPower = true;
          if (pinId.startsWith('pin_gnd')) hasGnd = true;
        } else if (comp.type.startsWith('battery_')) {
          if (pinId === 'positive') hasPower = true;
          if (pinId === 'negative') hasGnd = true;
        }
      }

      if (hasPower && hasGnd) {
        // Direct short without a resistor!
        // But wait, if they have an LED across the net? Still a short technically if no resistor.
        // We will just log a short circuit error.
        errors.push("Short Circuit Detected: Power is directly connected to Ground.");
      }
    }

    // Check LED specific rules
    for (const comp of this.components) {
      if (comp.type === 'led') {
        const anodeKey = getPinKey(comp.id, 'anode');
        const cathodeKey = getPinKey(comp.id, 'cathode');
        const anodeNet = nets.find(n => n.includes(anodeKey));
        const cathodeNet = nets.find(n => n.includes(cathodeKey));

        // Check reverse polarity
        let anodeIsGnd = false;
        let cathodeIsPower = false;

        anodeNet?.forEach(p => {
          if (p.includes('gnd') || p.includes('negative')) anodeIsGnd = true;
        });
        cathodeNet?.forEach(p => {
          if (p.includes('5v') || p.includes('3v3') || p.includes('positive')) cathodeIsPower = true;
        });

        if (anodeIsGnd && cathodeIsPower) {
          errors.push(`Reverse Polarity on LED (${comp.name}): Anode is connected to Ground and Cathode to Power.`);
        }

        // Check floating pins
        if (anodeNet?.length === 1 && cathodeNet?.length === 1) {
          errors.push(`Open Circuit: LED (${comp.name}) is floating and disconnected.`);
        } else if (anodeNet?.length === 1 || cathodeNet?.length === 1) {
          errors.push(`Open Circuit: LED (${comp.name}) has an unconnected pin.`);
        }
      }
    }

    return errors;
  }

  private evaluateElectricalNets() {
    if (!this.simulating) return;

    const { nets, getPinKey } = this.buildNets();
    const netState = new Map<string, { voltage: number; type: 'power' | 'gnd' | 'floating' | 'digital' }>();

    for (const net of nets) {
      let isGnd = false;
      let powerVal = 0;
      let isDigital = false;
      let activeDigitalValue = 0;

      for (const pinKey of net) {
        const [compId, pinId] = pinKey.split('_');
        const comp = this.components.find(c => c.id === compId);
        if (!comp) continue;

        if (comp.type === 'arduino_uno') {
          if (pinId === 'pin_gnd1' || pinId === 'pin_gnd2' || pinId === 'pin_gnd3') {
            isGnd = true;
          } else if (pinId === 'pin_5v') {
            powerVal = Math.max(powerVal, 5);
          } else if (pinId === 'pin_3v3') {
            powerVal = Math.max(powerVal, 3.3);
          } else if (pinId.startsWith('pin_') && !pinId.startsWith('pin_a')) {
            const digitalPinNum = pinId.replace('pin_', '');
            const mode = this.state.pinModes[digitalPinNum];
            // In Circuit Mode, maybe pins are floating, or we just rely on 5V and GND.
            // If Code mode is active, the transpiler controls digitalPins.
            if (mode === 'OUTPUT') {
              isDigital = true;
              const val = this.state.digitalPins[digitalPinNum] || 0;
              activeDigitalValue = Math.max(activeDigitalValue, val);
            }
          }
        }

        if (comp.type === 'battery_9v') {
          if (pinId === 'positive') powerVal = Math.max(powerVal, 9);
          if (pinId === 'negative') isGnd = true;
        }
        if (comp.type === 'battery_aa') {
          if (pinId === 'positive') powerVal = Math.max(powerVal, 1.5);
          if (pinId === 'negative') isGnd = true;
        }
        if (comp.type === 'battery_coin') {
          if (pinId === 'positive') powerVal = Math.max(powerVal, 3);
          if (pinId === 'negative') isGnd = true;
        }
      }

      const status = isGnd 
        ? { voltage: 0, type: 'gnd' as const }
        : isDigital 
          ? { voltage: activeDigitalValue > 0 ? 5 : 0, type: 'digital' as const }
          : powerVal > 0 
            ? { voltage: powerVal, type: 'power' as const }
            : { voltage: 0, type: 'floating' as const };

      for (const pinKey of net) {
        netState.set(pinKey, status);
      }
    }

    // Propagate GND and Power across Resistors
    let changed = true;
    let limit = 100;
    while(changed && limit-- > 0) {
      changed = false;
      for (const comp of this.components) {
        if (comp.type === 'resistor') {
          const p1 = getPinKey(comp.id, 'pin_1');
          const p2 = getPinKey(comp.id, 'pin_2');
          const n1 = nets.find(n => n.includes(p1));
          const n2 = nets.find(n => n.includes(p2));
          if (n1 && n2 && n1 !== n2) {
             const s1 = netState.get(p1);
             const s2 = netState.get(p2);
             if (s1 && s2) {
               if (s1.type === 'gnd' && s2.type === 'floating') {
                 n2.forEach(p => { const s = netState.get(p); if(s){ s.type = 'gnd'; s.voltage = 0; }});
                 changed = true;
               }
               else if (s2.type === 'gnd' && s1.type === 'floating') {
                 n1.forEach(p => { const s = netState.get(p); if(s){ s.type = 'gnd'; s.voltage = 0; }});
                 changed = true;
               }
               else if ((s1.type === 'power' || s1.type === 'digital') && s2.type === 'floating') {
                 n2.forEach(p => { const s = netState.get(p); if(s){ s.type = s1.type; s.voltage = s1.voltage; }});
                 changed = true;
               }
               else if ((s2.type === 'power' || s2.type === 'digital') && s1.type === 'floating') {
                 n1.forEach(p => { const s = netState.get(p); if(s){ s.type = s2.type; s.voltage = s2.voltage; }});
                 changed = true;
               }
             }
          }
        }
      }
    }

    const checkResistorInNet = (net: string[]): boolean => {
      return net.some(pinKey => pinKey.includes('res_') || pinKey.includes('resistor_'));
    };

    const nextLedStates: Record<string, boolean> = {};
    const nextLedWarnings: Record<string, string> = {};
    const nextBuzzerStates: Record<string, boolean> = {};
    const nextMotorSpeeds: Record<string, number> = {};

    for (const comp of this.components) {
      if (comp.type === 'led') {
        const anodeNet = netState.get(getPinKey(comp.id, 'anode'));
        const cathodeNet = netState.get(getPinKey(comp.id, 'cathode'));

        if (anodeNet && cathodeNet && cathodeNet.type === 'gnd' && (anodeNet.type === 'power' || (anodeNet.type === 'digital' && anodeNet.voltage > 0))) {
          nextLedStates[comp.id] = true;

          const currentNetPins = nets.find(n => n.includes(getPinKey(comp.id, 'anode'))) || [];
          const cathodeNetPins = nets.find(n => n.includes(getPinKey(comp.id, 'cathode'))) || [];
          const hasResistor = checkResistorInNet(currentNetPins) || checkResistorInNet(cathodeNetPins);
          
          if (!hasResistor && anodeNet.voltage >= 3) {
            nextLedWarnings[comp.id] = `Over-current! Add a 220Ω resistor.`;
          }
        } else {
          nextLedStates[comp.id] = false;
        }
      }

      if (comp.type === 'buzzer') {
        const posNet = netState.get(getPinKey(comp.id, 'positive'));
        const negNet = netState.get(getPinKey(comp.id, 'negative'));

        if (posNet && negNet && negNet.type === 'gnd' && (posNet.type === 'power' || (posNet.type === 'digital' && posNet.voltage > 0))) {
          nextBuzzerStates[comp.id] = true;
          buzzerAudio.start(1000);
        } else {
          nextBuzzerStates[comp.id] = false;
        }
      }

      if (comp.type === 'dc_motor') {
        const posNet = netState.get(getPinKey(comp.id, 'pin_pos'));
        const negNet = netState.get(getPinKey(comp.id, 'pin_neg'));

        if (posNet && negNet && negNet.type === 'gnd' && (posNet.type === 'power' || (posNet.type === 'digital' && posNet.voltage > 0))) {
          nextMotorSpeeds[comp.id] = 100;
        } else if (posNet && negNet && posNet.type === 'gnd' && (negNet.type === 'power' || (negNet.type === 'digital' && negNet.voltage > 0))) {
          nextMotorSpeeds[comp.id] = -100;
        } else {
          nextMotorSpeeds[comp.id] = 0;
        }
      }
    }

    if (!Object.values(nextBuzzerStates).some(b => b)) {
      buzzerAudio.stop();
    }

    this.state.ledStates = nextLedStates;
    this.state.ledWarnings = nextLedWarnings;
    this.state.buzzerStates = nextBuzzerStates;
    this.state.motorSpeeds = nextMotorSpeeds;
    
    // Also track active nets for wire flow animation
    // We can just trigger an update so Canvas can re-render
    this.onStateUpdate({ ...this.state });
  }

  private async runArduinoCode(rawCode: string) {
    let jsCode = rawCode;
    
    jsCode = jsCode.replace(/(?:const\s+)?int\s+(\w+)\s*=/g, 'let $1 =');
    jsCode = jsCode.replace(/(?:const\s+)?float\s+(\w+)\s*=/g, 'let $1 =');
    jsCode = jsCode.replace(/(?:const\s+)?bool\s+(\w+)\s*=/g, 'let $1 =');
    jsCode = jsCode.replace(/(?:const\s+)?boolean\s+(\w+)\s*=/g, 'let $1 =');
    jsCode = jsCode.replace(/(?:const\s+)?double\s+(\w+)\s*=/g, 'let $1 =');
    jsCode = jsCode.replace(/(?:const\s+)?char\s+(\w+)\s*=/g, 'let $1 =');

    jsCode = jsCode.replace(/void\s+setup\s*\(\s*\)/g, 'async function setup()');
    jsCode = jsCode.replace(/void\s+loop\s*\(\s*\)/g, 'async function loop()');
    jsCode = jsCode.replace(/void\s+(\w+)\s*\(/g, 'async function $1(');

    jsCode = jsCode.replace(/delay\s*\(\s*([^)]+)\s*\)/g, 'await sleep($1)');

    const self = this;
    const sleep = (ms: number) => new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      self.timerIds.push(id);
    });

    const pinMode = (pin: any, mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP') => {
      const pinStr = String(pin);
      self.state.pinModes[pinStr] = mode;
      self.evaluateElectricalNets();
    };

    const digitalWrite = (pin: any, value: number | boolean) => {
      const pinStr = String(pin);
      const valNum = (value === true || value === 1 || String(value).toUpperCase() === 'HIGH') ? 1 : 0;
      self.state.digitalPins[pinStr] = valNum;
      self.evaluateElectricalNets();
    };

    const analogWrite = (pin: any, val: number) => {
      const pinStr = String(pin);
      self.state.digitalPins[pinStr] = val;
      self.evaluateElectricalNets();
    };

    const digitalRead = (pin: any): number => {
      const pinStr = String(pin);
      const btn = self.components.find(c => c.type === 'push_button');
      if (btn && btn.state?.active) {
        return 1;
      }
      return self.state.digitalPins[pinStr] || 0;
    };

    const analogRead = (pin: any): number => {
      const pinStr = String(pin);
      if (pinStr.toUpperCase() === 'A0') {
        const gas = self.components.find(c => c.type === 'gas_sensor');
        return gas?.state?.sensorValue ?? 150;
      }
      if (pinStr.toUpperCase() === 'A1') {
        const ldr = self.components.find(c => c.type === 'ldr');
        return ldr?.state?.sensorValue ?? 500;
      }
      if (pinStr.toUpperCase() === 'A2' || pinStr === 'A2') {
        const pot = self.components.find(c => c.type === 'potentiometer');
        return pot?.state?.sensorValue ?? 0;
      }
      return self.state.analogPins[pinStr] || 0;
    };

    const tone = (pin: any, freq: number) => {
      const pinStr = String(pin);
      self.state.digitalPins[pinStr] = 1;
      self.evaluateElectricalNets();
    };

    const noTone = (pin: any) => {
      const pinStr = String(pin);
      self.state.digitalPins[pinStr] = 0;
      self.evaluateElectricalNets();
    };

    const Serial = {
      begin: (baud: number) => {
        self.logSerial(`[Serial] Baud rate configured to ${baud}`);
      },
      print: (msg: any) => {
        self.logSerial(String(msg), false);
      },
      println: (msg: any) => {
        self.logSerial(String(msg), true);
      }
    };

    const lcd = {
      begin: (cols: number, rows: number) => {
        self.logSerial(`[LCD] Initialized screen size ${cols}x${rows}`);
        self.updateLcd('', '');
      },
      clear: () => {
        self.updateLcd('', '');
      },
      setCursor: (col: number, row: number) => {},
      print: (text: string) => {
        self.updateLcd(String(text), '');
      }
    };

    const map = (val: number, in_min: number, in_max: number, out_min: number, out_max: number): number => {
      return Math.round(((val - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min);
    };

    const constrain = (x: number, a: number, b: number): number => {
      return Math.max(a, Math.min(x, b));
    };

    const HIGH = 1;
    const LOW = 0;
    const OUTPUT = 'OUTPUT';
    const INPUT = 'INPUT';
    const INPUT_PULLUP = 'INPUT_PULLUP';
    const A0 = 'A0';
    const A1 = 'A1';
    const A2 = 'A2';
    const A3 = 'A3';
    const A4 = 'A4';
    const A5 = 'A5';

    try {
      const sandboxFunc = new Function(
        'sleep', 'pinMode', 'digitalWrite', 'analogWrite', 'digitalRead', 'analogRead',
        'tone', 'noTone', 'Serial', 'lcd', 'map', 'constrain',
        'HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP',
        'A0', 'A1', 'A2', 'A3', 'A4', 'A5',
        `
        ${jsCode}
        return {
          setup: typeof setup !== 'undefined' ? setup : null,
          loop: typeof loop !== 'undefined' ? loop : null
        };
        `
      );

      const resolvedFunctions = sandboxFunc(
        sleep, pinMode, digitalWrite, analogWrite, digitalRead, analogRead,
        tone, noTone, Serial, lcd, map, constrain,
        HIGH, LOW, OUTPUT, INPUT, INPUT_PULLUP,
        A0, A1, A2, A3, A4, A5
      );

      if (resolvedFunctions.setup) {
        await resolvedFunctions.setup();
      }

      if (resolvedFunctions.loop) {
        while (this.simulating && this.mode === 'code') {
          await resolvedFunctions.loop();
          await sleep(20);
        }
      }
    } catch (e: any) {
      this.logSerial(`[COMPILER ERROR] ${e.message}`);
      this.stop();
    }
  }

  private logSerial(msg: string, newline = true) {
    const timestamp = new Date().toLocaleTimeString();
    if (newline) {
      this.state.serialLogs.push(`[${timestamp}] ${msg}`);
    } else {
      const logs = this.state.serialLogs;
      if (logs.length > 0) {
        logs[logs.length - 1] += msg;
      } else {
        logs.push(`[${timestamp}] ${msg}`);
      }
    }
    if (this.state.serialLogs.length > 200) {
      this.state.serialLogs.shift();
    }
    this.onStateUpdate({ ...this.state });
  }

  private updateLcd(line1: string, line2: string) {
    const lcd = this.components.find(c => c.type === 'lcd_16x2');
    if (lcd) {
      this.state.lcdLines[lcd.id] = [line1.substring(0, 16), line2.substring(0, 16)];
      this.onStateUpdate({ ...this.state });
    }
  }
}
