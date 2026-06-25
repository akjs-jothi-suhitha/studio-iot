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

/** Smooth Tinkercad-style wire path with horizontal exit/entry */
export const buildWirePath = (
  from: { x: number; y: number },
  to: { x: number; y: number },
): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 20) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const sag = Math.min(60, Math.max(24, dist * 0.15));
  const exitY = from.y + (dy >= 0 ? sag * 0.4 : -sag * 0.2);
  const entryY = to.y + (dy >= 0 ? -sag * 0.2 : sag * 0.4);
  const midX = (from.x + to.x) / 2;

  return `M ${from.x} ${from.y} C ${from.x} ${exitY}, ${midX} ${Math.max(from.y, to.y) + sag}, ${midX} ${Math.max(from.y, to.y) + sag} C ${midX} ${Math.max(from.y, to.y) + sag}, ${to.x} ${entryY}, ${to.x} ${to.y}`;
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
