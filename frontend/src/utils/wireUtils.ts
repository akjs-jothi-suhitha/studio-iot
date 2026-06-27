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

export interface Point {
  x: number;
  y: number;
}

export interface ObstacleRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SmartWireOptions {
  lane?: number;
  obstacles?: ObstacleRect[];
  /** Other wire paths for jump-over rendering */
  crossingPaths?: string[];
}

const STUB = 22;
const LANE_SPACING = 12;
const CORNER_RADIUS = 8;
const OBSTACLE_PAD = 10;

const pointInRect = (p: Point, r: ObstacleRect): boolean =>
  p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;

const segmentIntersectsRect = (a: Point, b: Point, r: ObstacleRect): boolean => {
  const pad = OBSTACLE_PAD;
  const rect = { x: r.x - pad, y: r.y - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
  if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
  if (a.x === b.x) {
    const x = a.x;
    return x >= rect.x && x <= rect.x + rect.width &&
      Math.min(a.y, b.y) <= rect.y + rect.height && Math.max(a.y, b.y) >= rect.y;
  }
  if (a.y === b.y) {
    const y = a.y;
    return y >= rect.y && y <= rect.y + rect.height &&
      Math.min(a.x, b.x) <= rect.x + rect.width && Math.max(a.x, b.x) >= rect.x;
  }
  return false;
};

/** Manhattan path as orthogonal waypoints */
const manhattanWaypoints = (from: Point, to: Point, lane: number, obstacles: ObstacleRect[]): Point[] => {
  const laneOffset = ((lane % 9) - 4) * LANE_SPACING;
  const exitY = from.y + (to.y >= from.y ? STUB : -STUB);
  const entryY = to.y + (to.y >= from.y ? -STUB : STUB);

  const candidates: Point[][] = [
    [from, { x: from.x, y: exitY }, { x: to.x, y: exitY }, { x: to.x, y: entryY }, to],
    [from, { x: from.x, y: exitY }, { x: from.x + laneOffset, y: exitY }, { x: from.x + laneOffset, y: entryY }, { x: to.x, y: entryY }, to],
    [from, { x: from.x, y: from.y + laneOffset }, { x: to.x, y: from.y + laneOffset }, to],
    [from, { x: from.x, y: exitY }, { x: (from.x + to.x) / 2 + laneOffset, y: exitY }, { x: (from.x + to.x) / 2 + laneOffset, y: entryY }, { x: to.x, y: entryY }, to],
  ];

  const scorePath = (pts: Point[]): number => {
    let score = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      score += Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      for (const obs of obstacles) {
        if (segmentIntersectsRect(a, b, obs)) score += 500;
      }
    }
    return score;
  };

  let best = candidates[0];
  let bestScore = scorePath(best);
  for (const c of candidates.slice(1)) {
    const s = scorePath(c);
    if (s < bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
};

/** Rounded Manhattan SVG path (JointJS-style flow) */
const waypointsToRoundedPath = (pts: Point[]): string => {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  const parts: string[] = [`M ${pts[0].x} ${pts[0].y}`];

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    const r = Math.min(CORNER_RADIUS, len1 / 2, len2 / 2);

    if (r < 2 || (dx1 === 0 && dx2 === 0) || (dy1 === 0 && dy2 === 0)) {
      parts.push(`L ${curr.x} ${curr.y}`);
      continue;
    }

    const nx1 = curr.x - (dx1 / len1) * r;
    const ny1 = curr.y - (dy1 / len1) * r;
    const nx2 = curr.x + (dx2 / len2) * r;
    const ny2 = curr.y + (dy2 / len2) * r;

    parts.push(`L ${nx1} ${ny1}`);
    parts.push(`Q ${curr.x} ${curr.y} ${nx2} ${ny2}`);
  }

  const last = pts[pts.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(' ');
};

/**
 * Smart wire routing: Manhattan paths with rounded corners and obstacle avoidance.
 * Mimics JointJS Smart Routing / GoJS AvoidsNodes behavior.
 */
export const buildWirePath = (
  from: Point,
  to: Point,
  lane = 0,
  options: SmartWireOptions = {},
): string => {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 12) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const obstacles = options.obstacles || [];
  const waypoints = manhattanWaypoints(from, to, lane, obstacles);
  return waypointsToRoundedPath(waypoints);
};

/** @deprecated use buildWirePath with options */
export const buildLegacyWirePath = buildWirePath;

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

/** Build obstacle rects from component instances for wire routing */
export const buildObstaclesFromComponents = (
  components: Array<{ id: string; type: string; x: number; y: number; rotation?: number }>,
  getBounds: (type: string) => { ox: number; oy: number; width: number; height: number },
  excludeIds: string[] = [],
): ObstacleRect[] =>
  components
    .filter((c) => !excludeIds.includes(c.id))
    .map((c) => {
      const b = getBounds(c.type);
      return {
        x: c.x + b.ox - 4,
        y: c.y + b.oy - 4,
        width: b.width + 8,
        height: b.height + 8,
      };
    });
