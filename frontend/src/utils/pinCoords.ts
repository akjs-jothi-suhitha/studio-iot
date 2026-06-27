import { ComponentInstance, ComponentType } from '../types';
import { COMPONENT_DEFINITIONS } from './componentDefinitions';

export interface PinHit {
  componentId: string;
  pinId: string;
  x: number;
  y: number;
  name: string;
}

export interface StubVector {
  dx: number;
  dy: number;
}

/** Smaller hit targets on dense connectors (LCD, breadboard) for accurate wiring */
export const getPinHitRadius = (type: ComponentType, pinCount: number): number => {
  if (type === 'breadboard_small') return 3;
  if (pinCount >= 16) return 4;
  if (pinCount >= 10) return 5;
  if (type === 'arduino_uno' || type === 'esp32' || type === 'arduino_nano') return 6;
  return 7;
};

export const getPinSnapDistance = (type: ComponentType, pinCount: number): number => {
  if (type === 'breadboard_small') return 8;
  if (pinCount >= 16) return 10;
  if (pinCount >= 10) return 12;
  return 14;
};

export const getPinAbsoluteCoords = (
  instance: ComponentInstance,
  pinId: string,
): { x: number; y: number } => {
  const def = COMPONENT_DEFINITIONS[instance.type];
  if (!def) {
    return { x: 0, y: 0 };
  }

  const pin = def.pins.find((item) => item.id === pinId);
  if (!pin) {
    return { x: 0, y: 0 };
  }

  const rot = ((instance.rotation || 0) * Math.PI) / 180;
  const cx = def.width / 2;
  const cy = def.height / 2;
  const rx = pin.x - cx;
  const ry = pin.y - cy;

  return {
    x: instance.x + cx + rx * Math.cos(rot) - ry * Math.sin(rot),
    y: instance.y + cy + rx * Math.sin(rot) + ry * Math.cos(rot),
  };
};

/** Exit direction so wires leave from the pin, not across the whole header row */
export const getPinStubVector = (instance: ComponentInstance, pinId: string): StubVector => {
  const def = COMPONENT_DEFINITIONS[instance.type];
  if (!def) return { dx: 0, dy: 1 };

  const pin = def.pins.find((p) => p.id === pinId);
  if (!pin) return { dx: 0, dy: 1 };

  const rot = ((instance.rotation || 0) * Math.PI) / 180;
  const margin = 6;
  const nearLeft = pin.x < def.width * 0.2;
  const nearRight = pin.x > def.width * 0.8;
  const nearTop = pin.y < def.height * 0.2;
  const nearBottom = pin.y > def.height * 0.8;

  let lx = 0;
  let ly = 0;
  if (nearTop && !nearLeft && !nearRight) ly = -1;
  else if (nearBottom && !nearLeft && !nearRight) ly = 1;
  else if (nearLeft && !nearTop && !nearBottom) lx = -1;
  else if (nearRight && !nearTop && !nearBottom) lx = 1;
  else if (nearTop) ly = -1;
  else if (nearBottom) ly = 1;
  else if (nearLeft) lx = -1;
  else if (nearRight) lx = 1;
  else {
    const cx = def.width / 2;
    const cy = def.height / 2;
    const dx = pin.x - cx;
    const dy = pin.y - cy;
    if (Math.abs(dx) > Math.abs(dy)) lx = dx > 0 ? 1 : -1;
    else ly = dy > 0 ? 1 : -1;
  }

  const rx = lx * Math.cos(rot) - ly * Math.sin(rot);
  const ry = lx * Math.sin(rot) + ly * Math.cos(rot);
  const len = Math.hypot(rx, ry) || 1;
  return { dx: (rx / len) * margin, dy: (ry / len) * margin };
};

export const collectPinHits = (components: ComponentInstance[]): PinHit[] => {
  const hits: PinHit[] = [];

  for (const component of components) {
    const def = COMPONENT_DEFINITIONS[component.type];
    if (!def) {
      continue;
    }

    for (const pin of def.pins) {
      const coords = getPinAbsoluteCoords(component, pin.id);
      hits.push({
        componentId: component.id,
        pinId: pin.id,
        x: coords.x,
        y: coords.y,
        name: pin.name,
      });
    }
  }

  return hits;
};

export const findNearestPin = (
  components: ComponentInstance[],
  point: { x: number; y: number },
  maxDistance = 16,
  exclude?: { componentId: string; pinId: string },
): PinHit | null => {
  let best: PinHit | null = null;
  let bestDistance = maxDistance;

  for (const component of components) {
    const def = COMPONENT_DEFINITIONS[component.type];
    if (!def) continue;

    const snapDistance = Math.min(maxDistance, getPinSnapDistance(component.type, def.pins.length));

    for (const pin of def.pins) {
      if (exclude && component.id === exclude.componentId && pin.id === exclude.pinId) {
        continue;
      }

      const coords = getPinAbsoluteCoords(component, pin.id);
      const dx = coords.x - point.x;
      const dy = coords.y - point.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= snapDistance && distance < bestDistance) {
        best = {
          componentId: component.id,
          pinId: pin.id,
          x: coords.x,
          y: coords.y,
          name: pin.name,
        };
        bestDistance = distance;
      }
    }
  }

  return best;
};

export const findPinDefinition = (component: ComponentInstance, pinId: string) =>
  COMPONENT_DEFINITIONS[component.type]?.pins.find((pin) => pin.id === pinId);
