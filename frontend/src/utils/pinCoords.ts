import { ComponentInstance } from '../types';
import { COMPONENT_DEFINITIONS } from './componentDefinitions';

export interface PinHit {
  componentId: string;
  pinId: string;
  x: number;
  y: number;
  name: string;
}

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
  maxDistance = 14,
  exclude?: { componentId: string; pinId: string },
): PinHit | null => {
  let best: PinHit | null = null;
  let bestDistance = maxDistance;

  for (const hit of collectPinHits(components)) {
    if (exclude && hit.componentId === exclude.componentId && hit.pinId === exclude.pinId) {
      continue;
    }

    const dx = hit.x - point.x;
    const dy = hit.y - point.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= bestDistance) {
      best = hit;
      bestDistance = distance;
    }
  }

  return best;
};
