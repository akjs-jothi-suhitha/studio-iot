import { CodeTemplate } from '../types';

export const CODE_PRESETS: Record<string, CodeTemplate> = {
  blink: {
    name: 'LED Verification Circuit',
    description: 'Blink the onboard LED on pin 13, or run in Circuit Mode to test a hardwired LED.',
    code: `// Blink — onboard LED on pin 13 (Tinkercad-style)
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Blink started on pin 13");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(1000);
  digitalWrite(ledPin, LOW);
  delay(1000);
}
`,
    components: [
      { id: 'uno_1', type: 'arduino_uno', name: 'Arduino Uno R3', x: 100, y: 350, rotation: 0 },
      { id: 'led_1', type: 'led', name: 'Red LED', x: 500, y: 380, rotation: 0, color: '#ef4444' },
      { id: 'res_1', type: 'resistor', name: '220Ω Resistor', x: 500, y: 440, rotation: 90, value: 220 },
    ],
    wires: [
      // Arduino 5V to Resistor Terminal 1
      { id: 'w_1', fromComponentId: 'uno_1', fromPinId: 'pin_5v', toComponentId: 'res_1', toPinId: 'pin_1', color: '#ef4444' },
      // Resistor Terminal 2 to LED Anode
      { id: 'w_2', fromComponentId: 'res_1', fromPinId: 'pin_2', toComponentId: 'led_1', toPinId: 'anode', color: '#f59e0b' },
      // LED Cathode to Arduino GND
      { id: 'w_3', fromComponentId: 'led_1', fromPinId: 'cathode', toComponentId: 'uno_1', toPinId: 'pin_gnd1', color: '#1f2937' },
    ],
    widgets: []
  },

  gas_alarm: {
    name: 'Gas Detector Alarm',
    description: 'Monitors gas sensor output on Analog Pin A0. Triggers buzzer beep and Red LED flash if levels are high.',
    code: `// Smart IOT - Gas Detector Alarm System
// Uses MQ-2 Gas Sensor on A0, Piezo Buzzer on D8, Red LED on D13

const int gasPin = A0;
const int buzzerPin = 8;
const int ledPin = 13;
const int threshold = 400; // Alarm threshold

void setup() {
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Gas Alarm Active. Ready.");
}

void loop() {
  int gasValue = analogRead(gasPin);
  Serial.print("Current Gas Level: ");
  Serial.println(gasValue);

  if (gasValue > threshold) {
    Serial.println("[ALERT] Gas leak detected!");
    
    // Pulse buzzer and LED
    digitalWrite(ledPin, HIGH);
    tone(buzzerPin, 1000); // 1KHz sound
    delay(200);
    
    digitalWrite(ledPin, LOW);
    noTone(buzzerPin);
    delay(200);
  } else {
    digitalWrite(ledPin, LOW);
    noTone(buzzerPin);
    delay(1000);
  }
}
`,
    components: [
      { id: 'uno_1', type: 'arduino_uno', name: 'Arduino Uno R3', x: 100, y: 350, rotation: 0 },
      { id: 'bb_1', type: 'breadboard_small', name: 'Small Breadboard', x: 420, y: 350, rotation: 0 },
      { id: 'gas_1', type: 'gas_sensor', name: 'MQ Gas Sensor', x: 380, y: 150, rotation: 0, state: { sensorValue: 120 } },
      { id: 'buzzer_1', type: 'buzzer', name: 'Piezo Buzzer', x: 550, y: 200, rotation: 0 },
      { id: 'led_1', type: 'led', name: 'Alarm LED', x: 680, y: 380, rotation: 0, color: '#ef4444' },
      { id: 'res_1', type: 'resistor', name: '220Ω Resistor', x: 720, y: 420, rotation: 90, value: 220 },
    ],
    wires: [
      // Connections for Gas Sensor
      { id: 'wg_vcc', fromComponentId: 'uno_1', fromPinId: 'pin_5v', toComponentId: 'gas_1', toPinId: 'pin_a1', color: '#ef4444' },
      { id: 'wg_gnd', fromComponentId: 'uno_1', fromPinId: 'pin_gnd2', toComponentId: 'gas_1', toPinId: 'pin_b1', color: '#1f2937' },
      { id: 'wg_sig', fromComponentId: 'uno_1', fromPinId: 'pin_a0', toComponentId: 'gas_1', toPinId: 'pin_b2', color: '#f59e0b' },

      // Connections for Buzzer
      { id: 'wb_gnd', fromComponentId: 'uno_1', fromPinId: 'pin_gnd3', toComponentId: 'buzzer_1', toPinId: 'negative', color: '#1f2937' },
      { id: 'wb_sig', fromComponentId: 'uno_1', fromPinId: 'pin_8', toComponentId: 'buzzer_1', toPinId: 'positive', color: '#10b981' },

      // Connections for Red LED
      { id: 'wld_gnd', fromComponentId: 'uno_1', fromPinId: 'pin_gnd1', toComponentId: 'bb_1', toPinId: 'top_minus_20', color: '#1f2937' },
      { id: 'wld_sig', fromComponentId: 'uno_1', fromPinId: 'pin_13', toComponentId: 'bb_1', toPinId: 'hole_a_25', color: '#ef4444' },
      
      { id: 'wld_a', fromComponentId: 'led_1', fromPinId: 'anode', toComponentId: 'bb_1', toPinId: 'hole_j_25', color: '#ef4444' },
      { id: 'wld_k', fromComponentId: 'led_1', fromPinId: 'cathode', toComponentId: 'bb_1', toPinId: 'hole_j_26', color: '#1f2937' },

      { id: 'wld_res_1', fromComponentId: 'bb_1', fromPinId: 'hole_e_26', toComponentId: 'res_1', toPinId: 'pin_1', color: '#10b981' },
      { id: 'wld_res_2', fromComponentId: 'res_1', fromPinId: 'pin_2', toComponentId: 'bb_1', toPinId: 'top_minus_26', color: '#1f2937' },
    ],
    widgets: [
      { id: 'wd_gas', type: 'gauge', title: 'Gas Concentration', pin: 'A0', x: 20, y: 20, w: 120, h: 120 },
      { id: 'wd_led', type: 'led', title: 'Gas Warning', pin: '13', x: 150, y: 20, w: 100, h: 100 },
      { id: 'wd_term', type: 'terminal', title: 'Live Alarm Status', pin: 'serial', x: 20, y: 160, w: 360, h: 120 },
    ]
  },

  light_control: {
    name: 'Smart Street Light',
    description: 'Reads ambient light level from Photoresistor (LDR) on A1, and dims / brightens street LED via PWM on D9.',
    code: `// Smart IOT - Smart Street Light
// Reads Photoresistor (LDR) on pin A1, writes PWM intensity to LED on D9

const int ldrPin = A1;
const int ledPin = 9;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Smart Light Controller Active");
}

void loop() {
  int lightLevel = analogRead(ldrPin);
  Serial.print("LDR Level: ");
  Serial.println(lightLevel);

  // In darkness (low LDR level), we want high LED brightness
  // LDR yields 0-1023. Map darkness to high LED output (0-255)
  int ledBrightness = map(lightLevel, 0, 1023, 255, 0);
  
  // Constrain just in case
  ledBrightness = constrain(ledBrightness, 0, 255);
  
  analogWrite(ledPin, ledBrightness);
  Serial.print("LED Brightness: ");
  Serial.println(ledBrightness);
  
  delay(500);
}
`,
    components: [
      { id: 'uno_1', type: 'arduino_uno', name: 'Arduino Uno R3', x: 100, y: 350, rotation: 0 },
      { id: 'bb_1', type: 'breadboard_small', name: 'Small Breadboard', x: 420, y: 350, rotation: 0 },
      { id: 'ldr_1', type: 'ldr', name: 'Light Sensor (LDR)', x: 450, y: 180, rotation: 0, state: { sensorValue: 800 } },
      { id: 'led_1', type: 'led', name: 'Street LED', x: 620, y: 380, rotation: 0, color: '#f59e0b' },
      { id: 'res_1', type: 'resistor', name: '10kΩ Resistor', x: 480, y: 240, rotation: 90, value: 10000 },
      { id: 'res_2', type: 'resistor', name: '220Ω Resistor', x: 650, y: 420, rotation: 90, value: 220 },
    ],
    wires: [
      // Power rails mapping
      { id: 'w_pow_5v', fromComponentId: 'uno_1', fromPinId: 'pin_5v', toComponentId: 'bb_1', toPinId: 'top_plus_1', color: '#ef4444' },
      { id: 'w_pow_gnd', fromComponentId: 'uno_1', fromPinId: 'pin_gnd1', toComponentId: 'bb_1', toPinId: 'top_minus_1', color: '#1f2937' },

      // Photoresistor wiring: Divider configuration
      // 5V to LDR terminal 1
      { id: 'wl_vcc', fromComponentId: 'bb_1', fromPinId: 'top_plus_5', toComponentId: 'ldr_1', toPinId: 'pin_1', color: '#ef4444' },
      // LDR terminal 2 to A1 analog input
      { id: 'wl_sig', fromComponentId: 'ldr_1', fromPinId: 'pin_2', toComponentId: 'uno_1', toPinId: 'pin_a1', color: '#3b82f6' },
      // 10K pull-down resistor from LDR terminal 2 (analog read column) to GND
      { id: 'wl_res_1', fromComponentId: 'ldr_1', fromPinId: 'pin_2', toComponentId: 'res_1', toPinId: 'pin_1', color: '#3b82f6' },
      { id: 'wl_res_2', fromComponentId: 'res_1', fromPinId: 'pin_2', toComponentId: 'bb_1', toPinId: 'top_minus_5', color: '#1f2937' },

      // PWM LED wiring
      // Pin 9 to Breadboard column 20 (Anode)
      { id: 'wled_sig', fromComponentId: 'uno_1', fromPinId: 'pin_9', toComponentId: 'bb_1', toPinId: 'hole_a_20', color: '#f59e0b' },
      { id: 'wled_a', fromComponentId: 'led_1', fromPinId: 'anode', toComponentId: 'bb_1', toPinId: 'hole_j_20', color: '#f59e0b' },
      { id: 'wled_k', fromComponentId: 'led_1', fromPinId: 'cathode', toComponentId: 'bb_1', toPinId: 'hole_j_21', color: '#1f2937' },
      
      { id: 'wled_res1', fromComponentId: 'bb_1', fromPinId: 'hole_e_21', toComponentId: 'res_2', toPinId: 'pin_1', color: '#10b981' },
      { id: 'wled_res2', fromComponentId: 'res_2', fromPinId: 'pin_2', toComponentId: 'bb_1', toPinId: 'top_minus_21', color: '#1f2937' },
    ],
    widgets: [
      { id: 'wd_light', type: 'chart', title: 'Light Intensity (LDR)', pin: 'A1', x: 20, y: 20, w: 220, h: 120 },
      { id: 'wd_brightness', type: 'gauge', title: 'Street LED Brightness', pin: '9', x: 250, y: 20, w: 120, h: 120 },
    ]
  }
};
