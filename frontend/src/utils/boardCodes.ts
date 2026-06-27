/** Per-board sketch storage — Arduino Uno, ESP32, etc. */

import { ComponentInstance, ComponentType } from '../types';

export interface BoardCodeFiles {
  activeBoardId: string | null;
  files: Record<string, string>;
  /** Extra sketch tabs per board (filename → code) */
  extraFiles?: Record<string, Record<string, string>>;
  /** Active tab filename per board */
  activeTab?: Record<string, string>;
}

export const PROGRAMMABLE_BOARD_TYPES: ComponentType[] = ['arduino_uno', 'arduino_nano', 'esp32'];

export const DEFAULT_SKETCH = `void setup() {
  Serial.begin(9600);
}

void loop() {
  // Your code here
}
`;

export const ESP32_HIVEMQ_SKETCH = `// ESP32 Gas Alarm + HiveMQ Cloud MQTT
// Install: PubSubClient library (Sketch → Include Library → Manage Libraries)

#include <WiFi.h>
#include <PubSubClient.h>
#include <LiquidCrystal.h>

// ── WiFi (change these) ──
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── HiveMQ Cloud (from console.hivemq.cloud → Cluster → Access) ──
const char* MQTT_BROKER   = "YOUR_CLUSTER.s1.eu.hivemq.cloud";  // e.g. abc123.s1.eu.hivemq.cloud
const int   MQTT_PORT     = 8883;
const char* MQTT_USER     = "YOUR_HIVEMQ_USERNAME";
const char* MQTT_PASS     = "YOUR_HIVEMQ_PASSWORD";

// ── Topics (match your project Auth Token / device ID) ──
const char* DEVICE_ID     = "YOUR_DEVICE_ID";  // use project Auth Token from dashboard
const char* TOPIC_TELEM   = "device/YOUR_DEVICE_ID/telemetry";
const char* TOPIC_STATUS  = "device/YOUR_DEVICE_ID/status";
const char* TOPIC_CMD     = "device/YOUR_DEVICE_ID/commands";

// ── Pins (match circuit) ──
const int GAS_PIN    = 36;   // VP / A0
const int BUZZER_PIN = 18;
const int RED_LED    = 19;
const int GREEN_LED  = 21;
const int THRESHOLD  = 400;

// LCD 4-bit: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

WiFiClientSecure wifiClient;
PubSubClient mqtt(wifiClient);

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");
}

void connectMQTT() {
  wifiClient.setInsecure(); // Skip certificate verification for easy connection
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback([](char* topic, byte* payload, unsigned int len) {
    String msg;
    for (unsigned int i = 0; i < len; i++) msg += (char)payload[i];
    if (msg.indexOf("\\"led\\":true") >= 0 || msg.indexOf("\\"led\\":1") >= 0)
      digitalWrite(GREEN_LED, HIGH);
    if (msg.indexOf("\\"led\\":false") >= 0 || msg.indexOf("\\"led\\":0") >= 0)
      digitalWrite(GREEN_LED, LOW);
  });
  while (!mqtt.connected()) {
    if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
      mqtt.publish(TOPIC_STATUS, "{\\"online\\":true}");
      mqtt.subscribe(TOPIC_CMD);
      Serial.println("MQTT connected");
    } else {
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  lcd.begin(16, 2);
  lcd.print("Connecting...");
  connectWiFi();
  connectMQTT();
  lcd.clear();
  lcd.print("SAFE");
}

void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  int gas = analogRead(GAS_PIN);
  bool alarm = gas > THRESHOLD;

  if (alarm) {
    lcd.setCursor(0, 0);
    lcd.print("GAS LEAK!     ");
    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    tone(BUZZER_PIN, 1000);
    delay(200);
    noTone(BUZZER_PIN);
  } else {
    lcd.setCursor(0, 0);
    lcd.print("SAFE          ");
    digitalWrite(RED_LED, LOW);
    noTone(BUZZER_PIN);
  }

  char payload[128];
  snprintf(payload, sizeof(payload),
    "{\\"gas\\":%d,\\"alarm\\":%s,\\"V0\\":%d,\\"timestamp\\":%lu}",
    gas, alarm ? "true" : "false", gas, millis() / 1000);
  mqtt.publish(TOPIC_TELEM, payload);

  delay(2000);
}
`;

export const getProgrammableBoardIds = (components: { id: string; type: string }[]): string[] =>
  components.filter((c) => PROGRAMMABLE_BOARD_TYPES.includes(c.type as ComponentType)).map((c) => c.id);

/** @deprecated use getProgrammableBoardIds */
export const getArduinoIds = getProgrammableBoardIds;

export const getBoardLabel = (comp?: ComponentInstance): string => {
  if (!comp) return 'board';
  if (comp.type === 'esp32') return 'esp32';
  if (comp.type === 'arduino_nano') return 'nano';
  const match = comp.name.match(/(\d+)/);
  return match ? `arduino_${match[1]}` : 'arduino_1';
};

export const defaultSketchForBoard = (type: ComponentType): string => {
  if (type === 'esp32') return ESP32_HIVEMQ_SKETCH;
  return DEFAULT_SKETCH;
};

export const boardTypeFromComponent = (type?: ComponentType): string => {
  if (type === 'esp32') return 'esp32';
  if (type === 'arduino_nano') return 'arduino_nano';
  return 'arduino_uno';
};

export const parseBoardCodes = (codeText: string, boardIds: string[], components?: ComponentInstance[]): BoardCodeFiles => {
  const compMap = new Map(components?.map((c) => [c.id, c]) || []);

  if (!codeText.trim()) {
    const files: Record<string, string> = {};
    boardIds.forEach((id) => {
      const type = compMap.get(id)?.type as ComponentType;
      files[id] = defaultSketchForBoard(type || 'arduino_uno');
    });
    return { activeBoardId: boardIds[0] || null, files };
  }

  try {
    const parsed = JSON.parse(codeText);
    if (parsed?.files) {
      const files = { ...parsed.files };
      boardIds.forEach((id) => {
        if (!files[id]) {
          const type = compMap.get(id)?.type as ComponentType;
          files[id] = defaultSketchForBoard(type || 'arduino_uno');
        }
      });
      return {
        activeBoardId: parsed.activeBoardId || boardIds[0] || null,
        files,
        extraFiles: parsed.extraFiles || {},
        activeTab: parsed.activeTab || {},
      };
    }
  } catch {
    /* legacy plain text */
  }

  const files: Record<string, string> = {};
  boardIds.forEach((id, i) => {
    files[id] = i === 0 ? codeText : defaultSketchForBoard(compMap.get(id)?.type as ComponentType || 'arduino_uno');
  });
  return { activeBoardId: boardIds[0] || null, files };
};

export const serializeBoardCodes = (data: BoardCodeFiles): string => JSON.stringify(data, null, 2);

export const mainTabName = (comp?: ComponentInstance): string => {
  const label = getBoardLabel(comp);
  return `${label}.ino`;
};

export const getSketchTabs = (boardId: string, comp: ComponentInstance | undefined, data: BoardCodeFiles): string[] => {
  const main = mainTabName(comp);
  const extras = Object.keys(data.extraFiles?.[boardId] || {});
  return [main, ...extras.filter((f) => f !== main)];
};

export const getActiveTabName = (boardId: string, comp: ComponentInstance | undefined, data: BoardCodeFiles): string =>
  data.activeTab?.[boardId] || mainTabName(comp);

export const getSketchContent = (boardId: string, tab: string, comp: ComponentInstance | undefined, data: BoardCodeFiles): string => {
  const main = mainTabName(comp);
  if (tab === main) return data.files[boardId] || '';
  return data.extraFiles?.[boardId]?.[tab] || '';
};

export const setSketchContent = (data: BoardCodeFiles, boardId: string, tab: string, code: string, comp?: ComponentInstance): BoardCodeFiles => {
  const main = mainTabName(comp);
  if (tab === main) {
    return { ...data, files: { ...data.files, [boardId]: code } };
  }
  const extraFiles = { ...(data.extraFiles || {}) };
  extraFiles[boardId] = { ...(extraFiles[boardId] || {}), [tab]: code };
  return { ...data, extraFiles };
};

export const addSketchTab = (data: BoardCodeFiles, boardId: string, name: string): BoardCodeFiles => {
  const extraFiles = { ...(data.extraFiles || {}) };
  extraFiles[boardId] = { ...(extraFiles[boardId] || {}), [name]: '// New tab\n' };
  return { ...data, extraFiles, activeTab: { ...(data.activeTab || {}), [boardId]: name } };
};

export const removeSketchTab = (data: BoardCodeFiles, boardId: string, tab: string, comp?: ComponentInstance): BoardCodeFiles => {
  const main = mainTabName(comp);
  if (tab === main) return data;
  const extraFiles = { ...(data.extraFiles || {}) };
  const boardExtras = { ...(extraFiles[boardId] || {}) };
  delete boardExtras[tab];
  extraFiles[boardId] = boardExtras;
  const activeTab = { ...(data.activeTab || {}) };
  if (activeTab[boardId] === tab) activeTab[boardId] = main;
  return { ...data, extraFiles, activeTab };
};

export const fqbnForComponent = (type?: ComponentType): string => {
  if (type === 'esp32') return 'esp32:esp32:esp32';
  if (type === 'arduino_nano') return 'arduino:avr:nano:cpu=atmega328old';
  return 'arduino:avr:uno';
};
