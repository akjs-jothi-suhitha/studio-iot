import { ComponentInstance, ComponentType } from '../types';
import { COMPONENT_DEFINITIONS } from './componentDefinitions';

export interface SelectionBounds {
  /** Offset from component.x */
  ox: number;
  /** Offset from component.y */
  oy: number;
  width: number;
  height: number;
  /** Center for rotation, relative to component origin */
  cx: number;
  cy: number;
}

/** Selection / hit bounds that include pins and visual overflow */
export const getSelectionBounds = (type: ComponentType): SelectionBounds => {
  const def = COMPONENT_DEFINITIONS[type];
  if (!def) {
    return { ox: 0, oy: 0, width: 40, height: 40, cx: 20, cy: 20 };
  }

  const pad = 8;
  let minX = 0;
  let minY = 0;
  let maxX = def.width;
  let maxY = def.height;

  for (const pin of def.pins) {
    minX = Math.min(minX, pin.x - pad);
    minY = Math.min(minY, pin.y - pad);
    maxX = Math.max(maxX, pin.x + pad);
    maxY = Math.max(maxY, pin.y + pad);
  }

  const width = Math.max(def.width, maxX - minX);
  const height = Math.max(def.height, maxY - minY);
  const ox = Math.min(0, minX);
  const oy = Math.min(0, minY);

  return {
    ox,
    oy,
    width: Math.max(width, maxX - ox),
    height: Math.max(height, maxY - oy),
    cx: ox + Math.max(width, maxX - ox) / 2,
    cy: oy + Math.max(height, maxY - oy) / 2,
  };
};

export const getSelectionBoundsForInstance = (instance: ComponentInstance): SelectionBounds =>
  getSelectionBounds(instance.type);
