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

export const PROGRAMMABLE_BOARD_TYPES: ComponentType[] = ['arduino_uno', 'esp32'];

export const DEFAULT_SKETCH = `void setup() {
  Serial.begin(9600);
}

void loop() {
  // Your code here
}
`;

export const ESP32_BLYNK_SKETCH = `// ESP32 + Blynk-style virtual pins
#define BLYNK_TEMPLATE_ID "TMPL0001"
#define BLYNK_AUTH_TOKEN "YOUR_AUTH_TOKEN"

const char* ssid = "YOUR_WIFI";
const char* pass = "YOUR_PASSWORD";

void setup() {
  Serial.begin(115200);
  // WiFi + cloud connect here
  Serial.println("ESP32 ready");
}

void loop() {
  // Read sensors, write to virtual pins V0, V1...
  delay(1000);
}
`;

export const getProgrammableBoardIds = (components: { id: string; type: string }[]): string[] =>
  components.filter((c) => PROGRAMMABLE_BOARD_TYPES.includes(c.type as ComponentType)).map((c) => c.id);

/** @deprecated use getProgrammableBoardIds */
export const getArduinoIds = getProgrammableBoardIds;

export const getBoardLabel = (comp?: ComponentInstance): string => {
  if (!comp) return 'board';
  if (comp.type === 'esp32') return 'esp32';
  const match = comp.name.match(/(\d+)/);
  return match ? `arduino_${match[1]}` : 'arduino_1';
};

export const defaultSketchForBoard = (type: ComponentType): string =>
  type === 'esp32' ? ESP32_BLYNK_SKETCH : DEFAULT_SKETCH;

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
  return 'arduino:avr:uno';
};
