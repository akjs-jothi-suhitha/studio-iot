import { ComponentInstance, ComponentType } from '../types';
import { COMPONENT_DEFINITIONS } from './componentDefinitions';

export interface PinHit {
  componentId: string;
  pinId: string;
  x: number;
  y: number;
  name: string;
}

/** Smaller hit targets on dense connectors (LCD, breadboard) for accurate wiring */
export const getPinHitRadius = (type: ComponentType, pinCount: number): number => {
  if (type === 'breadboard_small') return 4;
  if (pinCount >= 16) return 5;
  if (pinCount >= 10) return 6;
  if (type === 'arduino_uno' || type === 'esp32') return 7;
  return 8;
};

export const getPinSnapDistance = (type: ComponentType, pinCount: number): number => {
  if (type === 'breadboard_small') return 12;
  if (pinCount >= 16) return 14;
  if (pinCount >= 10) return 16;
  return 18;
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

      if (distance <= snapDistance && distance <= bestDistance) {
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
