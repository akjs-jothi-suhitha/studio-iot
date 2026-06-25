export const WIRE_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Black', hex: '#1f2937' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'White', hex: '#f8fafc' },
];

/** Auto-assign wire color from pin role (Tinkercad-style) */
export const suggestWireColor = (fromType?: string, toType?: string): string => {
  const types = [fromType, toType].filter(Boolean);
  if (types.includes('ground')) return '#1f2937';
  if (types.includes('power')) return '#ef4444';
  if (types.includes('analog')) return '#8b5cf6';
  if (types.includes('digital')) return '#10b981';
  return '#3b82f6';
};

/** Hash wire id → stable lane index so routes don't stack on one path */
export const wireLaneIndex = (wireId: string): number => {
  let hash = 0;
  for (let i = 0; i < wireId.length; i++) {
    hash = (hash * 31 + wireId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/**
 * Tinkercad-style wire: vertical stub from pin → horizontal bus → vertical to target.
 * Lane offset separates parallel wires so they don't draw on top of each other.
 */
export const buildWirePath = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  lane = 0,
): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 12) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const laneOffset = ((lane % 9) - 4) * 11;
  const stub = 26 + (lane % 5) * 5;

  const fromDown = dy >= 0;
  const y1 = from.y + (fromDown ? stub : -stub);
  const y2 = to.y + (fromDown ? -stub : stub);
  const busY = (y1 + y2) / 2 + laneOffset;
  const midX = (from.x + to.x) / 2 + laneOffset * 0.35;

  if (Math.abs(dx) > Math.abs(dy) * 1.2) {
    return [
      `M ${from.x} ${from.y}`,
      `L ${from.x} ${y1}`,
      `L ${midX} ${y1}`,
      `L ${midX} ${y2}`,
      `L ${to.x} ${y2}`,
      `L ${to.x} ${to.y}`,
    ].join(' ');
  }

  return [
    `M ${from.x} ${from.y}`,
    `L ${from.x} ${busY}`,
    `L ${to.x} ${busY}`,
    `L ${to.x} ${to.y}`,
  ].join(' ');
};

export const getPinHighlightColor = (
  pinType?: string,
  role: 'source' | 'target' | 'hover' = 'hover',
): string => {
  if (role === 'source') return '#22c55e';
  if (role === 'target') return '#f59e0b';
  if (pinType === 'power') return '#ef4444';
  if (pinType === 'ground') return '#3b82f6';
  if (pinType === 'analog') return '#a855f7';
  return '#06b6d4';
};
