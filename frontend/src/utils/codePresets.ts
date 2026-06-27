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
    name: 'Gas Detector Alarm (Tinkercad)',
    description: 'MQ-2 gas sensor, 16×2 LCD, piezo buzzer, red/green status LEDs — matches classic Tinkercad layout.',
    code: `// Gas Detecting Alarm System (Tinkercad-style)
#include <LiquidCrystal.h>

// LCD 4-bit mode: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

const int gasPin = A0;
const int buzzerPin = 6;
const int redLedPin = 7;
const int greenLedPin = 8;
const int threshold = 400;

void setup() {
  pinMode(buzzerPin, OUTPUT);
  pinMode(redLedPin, OUTPUT);
  pinMode(greenLedPin, OUTPUT);
  lcd.begin(16, 2);
  Serial.begin(9600);
  lcd.print("SAFE");
  digitalWrite(greenLedPin, HIGH);
  Serial.println("Gas alarm ready");
}

void loop() {
  int gasValue = analogRead(gasPin);
  Serial.print("Gas: ");
  Serial.println(gasValue);

  if (gasValue > threshold) {
    lcd.setCursor(0, 0);
    lcd.print("GAS LEAK!     ");
    digitalWrite(redLedPin, HIGH);
    digitalWrite(greenLedPin, LOW);
    tone(buzzerPin, 1000);
    delay(200);
    noTone(buzzerPin);
    delay(200);
  } else {
    lcd.setCursor(0, 0);
    lcd.print("SAFE          ");
    digitalWrite(redLedPin, LOW);
    digitalWrite(greenLedPin, HIGH);
    noTone(buzzerPin);
    delay(500);
  }
}
`,
    components: [
      { id: 'uno_1', type: 'arduino_uno', name: 'Arduino Uno R3', x: 60, y: 320, rotation: 0 },
      { id: 'lcd_1', type: 'lcd_16x2', name: 'LCD 16x2', x: 320, y: 40, rotation: 0 },
      { id: 'gas_1', type: 'gas_sensor', name: 'MQ Gas Sensor', x: 420, y: 180, rotation: 0, state: { sensorValue: 120 } },
      { id: 'buzzer_1', type: 'buzzer', name: 'Piezo Buzzer', x: 580, y: 160, rotation: 0 },
      { id: 'bb_1', type: 'breadboard_small', name: 'Small Breadboard', x: 380, y: 340, rotation: 0 },
      { id: 'led_red', type: 'led', name: 'Red LED', x: 720, y: 360, rotation: 0, color: '#ef4444' },
      { id: 'led_green', type: 'led', name: 'Green LED', x: 720, y: 420, rotation: 0, color: '#22c55e' },
      { id: 'res_red', type: 'resistor', name: '220Ω', x: 760, y: 380, rotation: 90, value: 220 },
      { id: 'res_green', type: 'resistor', name: '220Ω', x: 760, y: 440, rotation: 90, value: 220 },
    ],
    wires: [
      // Power rails
      { id: 'wp_5v', fromComponentId: 'uno_1', fromPinId: 'pin_5v', toComponentId: 'bb_1', toPinId: 'top_plus_1', color: '#ef4444' },
      { id: 'wp_gnd', fromComponentId: 'uno_1', fromPinId: 'pin_gnd1', toComponentId: 'bb_1', toPinId: 'top_minus_1', color: '#1f2937' },

      // Gas sensor
      { id: 'wg_vcc', fromComponentId: 'bb_1', fromPinId: 'top_plus_10', toComponentId: 'gas_1', toPinId: 'pin_vcc', color: '#ef4444' },
      { id: 'wg_gnd', fromComponentId: 'bb_1', fromPinId: 'top_minus_10', toComponentId: 'gas_1', toPinId: 'pin_gnd', color: '#1f2937' },
      { id: 'wg_sig', fromComponentId: 'uno_1', fromPinId: 'pin_a0', toComponentId: 'gas_1', toPinId: 'pin_a1', color: '#8b5cf6' },

      // Buzzer
      { id: 'wb_sig', fromComponentId: 'uno_1', fromPinId: 'pin_6', toComponentId: 'buzzer_1', toPinId: 'positive', color: '#10b981' },
      { id: 'wb_gnd', fromComponentId: 'bb_1', fromPinId: 'top_minus_15', toComponentId: 'buzzer_1', toPinId: 'negative', color: '#1f2937' },

      // LCD
      { id: 'wl_vss', fromComponentId: 'bb_1', fromPinId: 'top_minus_5', toComponentId: 'lcd_1', toPinId: 'lcd_vss', color: '#1f2937' },
      { id: 'wl_vdd', fromComponentId: 'bb_1', fromPinId: 'top_plus_5', toComponentId: 'lcd_1', toPinId: 'lcd_vdd', color: '#ef4444' },
      { id: 'wl_a', fromComponentId: 'bb_1', fromPinId: 'top_plus_6', toComponentId: 'lcd_1', toPinId: 'lcd_a', color: '#ef4444' },
      { id: 'wl_k', fromComponentId: 'bb_1', fromPinId: 'top_minus_6', toComponentId: 'lcd_1', toPinId: 'lcd_k', color: '#1f2937' },
      { id: 'wl_rs', fromComponentId: 'uno_1', fromPinId: 'pin_12', toComponentId: 'lcd_1', toPinId: 'lcd_rs', color: '#10b981' },
      { id: 'wl_e', fromComponentId: 'uno_1', fromPinId: 'pin_11', toComponentId: 'lcd_1', toPinId: 'lcd_e', color: '#10b981' },
      { id: 'wl_d4', fromComponentId: 'uno_1', fromPinId: 'pin_5', toComponentId: 'lcd_1', toPinId: 'lcd_d4', color: '#10b981' },
      { id: 'wl_d5', fromComponentId: 'uno_1', fromPinId: 'pin_4', toComponentId: 'lcd_1', toPinId: 'lcd_d5', color: '#10b981' },
      { id: 'wl_d6', fromComponentId: 'uno_1', fromPinId: 'pin_3', toComponentId: 'lcd_1', toPinId: 'lcd_d6', color: '#10b981' },
      { id: 'wl_d7', fromComponentId: 'uno_1', fromPinId: 'pin_2', toComponentId: 'lcd_1', toPinId: 'lcd_d7', color: '#10b981' },

      // Red LED (D7) via breadboard
      { id: 'wr_sig', fromComponentId: 'uno_1', fromPinId: 'pin_7', toComponentId: 'bb_1', toPinId: 'hole_a_20', color: '#ef4444' },
      { id: 'wr_a', fromComponentId: 'led_red', fromPinId: 'anode', toComponentId: 'bb_1', toPinId: 'hole_j_20', color: '#ef4444' },
      { id: 'wr_k', fromComponentId: 'led_red', fromPinId: 'cathode', toComponentId: 'bb_1', toPinId: 'hole_j_21', color: '#1f2937' },
      { id: 'wr_r1', fromComponentId: 'bb_1', fromPinId: 'hole_e_21', toComponentId: 'res_red', toPinId: 'pin_1', color: '#10b981' },
      { id: 'wr_r2', fromComponentId: 'res_red', fromPinId: 'pin_2', toComponentId: 'bb_1', toPinId: 'top_minus_20', color: '#1f2937' },

      // Green LED (D8) via breadboard
      { id: 'wg_sig2', fromComponentId: 'uno_1', fromPinId: 'pin_8', toComponentId: 'bb_1', toPinId: 'hole_a_22', color: '#22c55e' },
      { id: 'wg_a', fromComponentId: 'led_green', fromPinId: 'anode', toComponentId: 'bb_1', toPinId: 'hole_j_22', color: '#22c55e' },
      { id: 'wg_k', fromComponentId: 'led_green', fromPinId: 'cathode', toComponentId: 'bb_1', toPinId: 'hole_j_23', color: '#1f2937' },
      { id: 'wg_r1', fromComponentId: 'bb_1', fromPinId: 'hole_e_23', toComponentId: 'res_green', toPinId: 'pin_1', color: '#10b981' },
      { id: 'wg_r2', fromComponentId: 'res_green', fromPinId: 'pin_2', toComponentId: 'bb_1', toPinId: 'top_minus_22', color: '#1f2937' },
    ],
    widgets: [
      { id: 'wd_gas', type: 'gauge', title: 'Gas Level', pin: 'A0', virtualPin: 'V0', x: 20, y: 20, w: 120, h: 120 },
      { id: 'wd_status', type: 'value_card', title: 'Alarm Status', pin: 'serial', virtualPin: 'V3', x: 150, y: 20, w: 120, h: 80 },
      { id: 'wd_red', type: 'led', title: 'Red Alarm', pin: '7', virtualPin: 'V4', x: 280, y: 20, w: 80, h: 80 },
      { id: 'wd_green', type: 'led', title: 'Green Safe', pin: '8', virtualPin: 'V5', x: 370, y: 20, w: 80, h: 80 },
      { id: 'wd_chart', type: 'chart', title: 'Gas History', pin: 'A0', virtualPin: 'V0', x: 20, y: 150, w: 280, h: 120 },
      { id: 'wd_term', type: 'terminal', title: 'Serial Monitor', pin: 'serial', x: 310, y: 150, w: 360, h: 120 },
    ],
  },

  gas_alarm_iot: {
    name: 'Gas Alarm + HiveMQ Cloud (ESP32)',
    description: 'ESP32 gas detector with LCD, buzzer, LEDs, and HiveMQ MQTT cloud dashboard.',
    code: '', // filled from ESP32_HIVEMQ_SKETCH via boardCodes when loaded
    components: [
      { id: 'esp_1', type: 'esp32', name: 'ESP32 DevKit', x: 60, y: 300, rotation: 0 },
      { id: 'lcd_1', type: 'lcd_16x2', name: 'LCD 16x2', x: 300, y: 40, rotation: 0 },
      { id: 'gas_1', type: 'gas_sensor', name: 'MQ Gas Sensor', x: 400, y: 170, rotation: 0, state: { sensorValue: 120 } },
      { id: 'buzzer_1', type: 'buzzer', name: 'Piezo Buzzer', x: 560, y: 150, rotation: 0 },
      { id: 'bb_1', type: 'breadboard_small', name: 'Small Breadboard', x: 360, y: 330, rotation: 0 },
      { id: 'led_red', type: 'led', name: 'Red LED', x: 700, y: 350, rotation: 0, color: '#ef4444' },
      { id: 'led_green', type: 'led', name: 'Green LED', x: 700, y: 410, rotation: 0, color: '#22c55e' },
      { id: 'res_red', type: 'resistor', name: '220Ω', x: 740, y: 370, rotation: 90, value: 220 },
      { id: 'res_green', type: 'resistor', name: '220Ω', x: 740, y: 430, rotation: 90, value: 220 },
    ],
    wires: [
      { id: 'wp_3v3', fromComponentId: 'esp_1', fromPinId: 'pin_3v3', toComponentId: 'bb_1', toPinId: 'top_plus_1', color: '#ef4444' },
      { id: 'wp_gnd', fromComponentId: 'esp_1', fromPinId: 'pin_gnd1', toComponentId: 'bb_1', toPinId: 'top_minus_1', color: '#1f2937' },
      { id: 'wg_vcc', fromComponentId: 'bb_1', fromPinId: 'top_plus_10', toComponentId: 'gas_1', toPinId: 'pin_vcc', color: '#ef4444' },
      { id: 'wg_gnd', fromComponentId: 'bb_1', fromPinId: 'top_minus_10', toComponentId: 'gas_1', toPinId: 'pin_gnd', color: '#1f2937' },
      { id: 'wg_sig', fromComponentId: 'esp_1', fromPinId: 'pin_36', toComponentId: 'gas_1', toPinId: 'pin_a1', color: '#8b5cf6' },
      { id: 'wb_sig', fromComponentId: 'esp_1', fromPinId: 'pin_18', toComponentId: 'buzzer_1', toPinId: 'positive', color: '#10b981' },
      { id: 'wb_gnd', fromComponentId: 'bb_1', fromPinId: 'top_minus_15', toComponentId: 'buzzer_1', toPinId: 'negative', color: '#1f2937' },
      { id: 'wl_vss', fromComponentId: 'bb_1', fromPinId: 'top_minus_5', toComponentId: 'lcd_1', toPinId: 'lcd_vss', color: '#1f2937' },
      { id: 'wl_vdd', fromComponentId: 'bb_1', fromPinId: 'top_plus_5', toComponentId: 'lcd_1', toPinId: 'lcd_vdd', color: '#ef4444' },
      { id: 'wl_a', fromComponentId: 'bb_1', fromPinId: 'top_plus_6', toComponentId: 'lcd_1', toPinId: 'lcd_a', color: '#ef4444' },
      { id: 'wl_k', fromComponentId: 'bb_1', fromPinId: 'top_minus_6', toComponentId: 'lcd_1', toPinId: 'lcd_k', color: '#1f2937' },
      { id: 'wl_rs', fromComponentId: 'esp_1', fromPinId: 'pin_13', toComponentId: 'lcd_1', toPinId: 'lcd_rs', color: '#10b981' },
      { id: 'wl_e', fromComponentId: 'esp_1', fromPinId: 'pin_12', toComponentId: 'lcd_1', toPinId: 'lcd_e', color: '#10b981' },
      { id: 'wl_d4', fromComponentId: 'esp_1', fromPinId: 'pin_5', toComponentId: 'lcd_1', toPinId: 'lcd_d4', color: '#10b981' },
      { id: 'wl_d5', fromComponentId: 'esp_1', fromPinId: 'pin_4', toComponentId: 'lcd_1', toPinId: 'lcd_d5', color: '#10b981' },
      { id: 'wl_d6', fromComponentId: 'esp_1', fromPinId: 'pin_3', toComponentId: 'lcd_1', toPinId: 'lcd_d6', color: '#10b981' },
      { id: 'wl_d7', fromComponentId: 'esp_1', fromPinId: 'pin_2', toComponentId: 'lcd_1', toPinId: 'lcd_d7', color: '#10b981' },
      { id: 'wr_sig', fromComponentId: 'esp_1', fromPinId: 'pin_19', toComponentId: 'bb_1', toPinId: 'hole_a_20', color: '#ef4444' },
      { id: 'wr_a', fromComponentId: 'led_red', fromPinId: 'anode', toComponentId: 'bb_1', toPinId: 'hole_j_20', color: '#ef4444' },
      { id: 'wr_k', fromComponentId: 'led_red', fromPinId: 'cathode', toComponentId: 'bb_1', toPinId: 'hole_j_21', color: '#1f2937' },
      { id: 'wr_r1', fromComponentId: 'bb_1', fromPinId: 'hole_e_21', toComponentId: 'res_red', toPinId: 'pin_1', color: '#10b981' },
      { id: 'wr_r2', fromComponentId: 'res_red', fromPinId: 'pin_2', toComponentId: 'bb_1', toPinId: 'top_minus_20', color: '#1f2937' },
      { id: 'wg_sig2', fromComponentId: 'esp_1', fromPinId: 'pin_21', toComponentId: 'bb_1', toPinId: 'hole_a_22', color: '#22c55e' },
      { id: 'wg_a', fromComponentId: 'led_green', fromPinId: 'anode', toComponentId: 'bb_1', toPinId: 'hole_j_22', color: '#22c55e' },
      { id: 'wg_k', fromComponentId: 'led_green', fromPinId: 'cathode', toComponentId: 'bb_1', toPinId: 'hole_j_23', color: '#1f2937' },
      { id: 'wg_r1', fromComponentId: 'bb_1', fromPinId: 'hole_e_23', toComponentId: 'res_green', toPinId: 'pin_1', color: '#10b981' },
      { id: 'wg_r2', fromComponentId: 'res_green', fromPinId: 'pin_2', toComponentId: 'bb_1', toPinId: 'top_minus_22', color: '#1f2937' },
    ],
    widgets: [
      { id: 'wd_gas', type: 'gauge', title: 'Gas Level (V0)', pin: 'V0', virtualPin: 'V0', x: 0, y: 0, w: 1, h: 1 },
      { id: 'wd_chart', type: 'chart', title: 'Gas Trend', pin: 'V0', virtualPin: 'V0', x: 0, y: 0, w: 2, h: 1 },
      { id: 'wd_online', type: 'value_card', title: 'Device Online', pin: 'V6', virtualPin: 'V6', x: 0, y: 0, w: 1, h: 1 },
      { id: 'wd_switch', type: 'switch', title: 'Green LED', pin: 'V2', virtualPin: 'V2', x: 0, y: 0, w: 1, h: 1 },
      { id: 'wd_alarm', type: 'led', title: 'Alarm Active', pin: 'V4', virtualPin: 'V4', x: 0, y: 0, w: 1, h: 1 },
      { id: 'wd_term', type: 'terminal', title: 'MQTT Log', pin: 'serial', x: 0, y: 0, w: 2, h: 1 },
    ],
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
