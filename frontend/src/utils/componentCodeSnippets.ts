import { ComponentType } from '../types';
import { DEFAULT_SKETCH } from './boardCodes';

/** Tinkercad-style starter code when a component is used in a circuit */
export const COMPONENT_CODE_SNIPPETS: Partial<Record<ComponentType, string>> = {
  led: `// LED on pin 13
const int ledPin = 13;
void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}
void loop() {
  digitalWrite(ledPin, HIGH);
  delay(500);
  digitalWrite(ledPin, LOW);
  delay(500);
}`,

  gas_sensor: `// MQ-2 Gas Sensor on A0 — alarm on D8, LED on D13
const int gasPin = A0;
const int buzzerPin = 8;
const int ledPin = 13;
const int threshold = 400;

void setup() {
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("Gas sensor ready");
}

void loop() {
  int level = analogRead(gasPin);
  Serial.print("Gas: ");
  Serial.println(level);
  if (level > threshold) {
    digitalWrite(ledPin, HIGH);
    tone(buzzerPin, 1000);
    delay(200);
    noTone(buzzerPin);
    digitalWrite(ledPin, LOW);
  }
  delay(500);
}`,

  ldr: `// LDR light sensor on A1 — LED on pin 13 when dark
const int ldrPin = A1;
const int ledPin = 13;
const int darkThreshold = 300;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(ldrPin);
  Serial.print("Light: ");
  Serial.println(light);
  digitalWrite(ledPin, light < darkThreshold ? HIGH : LOW);
  delay(500);
}`,

  potentiometer: `// Potentiometer on A2 — PWM LED on pin 9
const int potPin = A2;
const int ledPin = 9;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int val = analogRead(potPin);
  int brightness = map(val, 0, 1023, 0, 255);
  analogWrite(ledPin, brightness);
  Serial.println(val);
  delay(100);
}`,

  buzzer: `// Buzzer on pin 8
const int buzzerPin = 8;

void setup() {
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  tone(buzzerPin, 440);
  delay(500);
  noTone(buzzerPin);
  delay(500);
}`,

  lcd_16x2: `// LCD 16x2 (simulated via Serial)
#include <LiquidCrystal.h>
// In simulation, text appears on the LCD component

void setup() {
  Serial.begin(9600);
  Serial.println("LCD: Hello World!");
}

void loop() {
  delay(1000);
}`,

  dht11: `// DHT11 temperature/humidity
const int dhtPin = 2;

void setup() {
  Serial.begin(9600);
  pinMode(dhtPin, INPUT);
}

void loop() {
  Serial.println("DHT11 reading...");
  delay(2000);
}`,

  ultrasonic: `// HC-SR04 Ultrasonic — Trig=7, Echo=8
const int trigPin = 7;
const int echoPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  int distance = duration * 0.034 / 2;
  Serial.print("Distance: ");
  Serial.println(distance);
  delay(500);
}`,

  servo: `// Servo on pin 9
#include <Servo.h>
Servo myServo;

void setup() {
  myServo.attach(9);
  Serial.begin(9600);
}

void loop() {
  myServo.write(0);
  delay(1000);
  myServo.write(90);
  delay(1000);
  myServo.write(180);
  delay(1000);
}`,
};

/** Build sketch from components wired to a specific board */
export const suggestCodeForBoard = (
  boardId: string,
  components: { id: string; type: ComponentType }[],
  wires: { fromComponentId: string; toComponentId: string }[],
): string => {
  const board = components.find((c) => c.id === boardId);
  if (board?.type === 'esp32') {
    return `// ESP32 + Blynk virtual pins (V0, V1…)
#define BLYNK_TEMPLATE_ID "TMPL0001"
#define BLYNK_AUTH_TOKEN "YOUR_AUTH_TOKEN"
const char* ssid = "YOUR_WIFI";
const char* pass = "YOUR_PASSWORD";

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);
}

void loop() {
  // Blynk.run();
  // Send sensor data: Blynk.virtualWrite(V0, analogRead(34));
  delay(1000);
}`;
  }

  const connectedTypes = new Set<ComponentType>();
  wires.forEach((w) => {
    if (w.fromComponentId === boardId) {
      const t = components.find((c) => c.id === w.toComponentId)?.type;
      if (t) connectedTypes.add(t);
    }
    if (w.toComponentId === boardId) {
      const t = components.find((c) => c.id === w.fromComponentId)?.type;
      if (t) connectedTypes.add(t);
    }
  });

  if (connectedTypes.has('gas_sensor')) return COMPONENT_CODE_SNIPPETS.gas_sensor!;
  if (connectedTypes.has('ldr')) return COMPONENT_CODE_SNIPPETS.ldr!;
  if (connectedTypes.has('potentiometer')) return COMPONENT_CODE_SNIPPETS.potentiometer!;
  if (connectedTypes.has('led')) return COMPONENT_CODE_SNIPPETS.led!;
  if (connectedTypes.has('buzzer')) return COMPONENT_CODE_SNIPPETS.buzzer!;
  if (connectedTypes.has('ultrasonic')) return COMPONENT_CODE_SNIPPETS.ultrasonic!;
  if (connectedTypes.has('servo')) return COMPONENT_CODE_SNIPPETS.servo!;
  if (connectedTypes.has('dht11')) return COMPONENT_CODE_SNIPPETS.dht11!;
  if (connectedTypes.has('lcd_16x2')) return COMPONENT_CODE_SNIPPETS.lcd_16x2!;

  return DEFAULT_SKETCH;
};
