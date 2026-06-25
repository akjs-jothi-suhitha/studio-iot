import React from 'react';

const DIGIT_MAP: Record<string, Record<string, boolean>> = {
  '0': { a: true, b: true, c: true, d: true, e: true, f: true, g: false },
  '1': { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
  '2': { a: true, b: true, c: false, d: true, e: true, f: false, g: true },
  '3': { a: true, b: true, c: true, d: true, e: false, f: false, g: true },
  '4': { a: false, b: true, c: true, d: false, e: false, f: true, g: true },
  '5': { a: true, b: false, c: true, d: true, e: false, f: true, g: true },
  '6': { a: true, b: false, c: true, d: true, e: true, f: true, g: true },
  '7': { a: true, b: true, c: true, d: false, e: false, f: false, g: false },
  '8': { a: true, b: true, c: true, d: true, e: true, f: true, g: true },
  '9': { a: true, b: true, c: true, d: true, e: false, f: true, g: true },
  ' ': { a: false, b: false, c: false, d: false, e: false, f: false, g: false },
};

interface SevenSegmentSvgProps {
  width: number;
  height: number;
  value?: string;
  glowing?: boolean;
}

export const SevenSegmentSvg: React.FC<SevenSegmentSvgProps> = ({
  width,
  height,
  value = '8',
  glowing = false,
}) => {
  const digit = value.slice(-1);
  const segs = DIGIT_MAP[digit] || DIGIT_MAP[' '];
  const on = (lit: boolean) => (lit && glowing ? '#ff3333' : lit ? '#661111' : '#1a1a1a');
  const glow = (lit: boolean) => (lit && glowing ? 'drop-shadow(0 0 4px #ff4444)' : 'none');

  const cx = width / 2;
  const displayTop = 14;
  const displayH = height - 28;

  return (
    <g>
      {/* PCB package */}
      <rect width={width} height={height} rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
      {/* Pin legs top */}
      {[6, 13, 20, 27, 34].map((px, i) => (
        <rect key={`t${i}`} x={px - 2} y={0} width="4" height="8" rx="1" fill="#b45309" />
      ))}
      {/* Pin legs bottom */}
      {[6, 13, 20, 27, 34].map((px, i) => (
        <rect key={`b${i}`} x={px - 2} y={height - 8} width="4" height="8" rx="1" fill="#b45309" />
      ))}

      {/* Display window */}
      <rect x="4" y={displayTop} width={width - 8} height={displayH} rx="2" fill="#0a0a0a" stroke="#333" strokeWidth="1" />

      {/* Segments — classic 7-seg layout */}
      <g transform={`translate(${cx - 14}, ${displayTop + 4})`}>
        {/* A top */}
        <polygon points="4,2 24,2 22,7 6,7" fill={on(segs.a)} style={{ filter: glow(segs.a) }} />
        {/* B upper-right */}
        <polygon points="24,4 28,8 28,22 23,20 23,10" fill={on(segs.b)} style={{ filter: glow(segs.b) }} />
        {/* C lower-right */}
        <polygon points="24,26 28,30 28,44 23,42 23,32" fill={on(segs.c)} style={{ filter: glow(segs.c) }} />
        {/* D bottom */}
        <polygon points="4,42 24,42 22,37 6,37" fill={on(segs.d)} style={{ filter: glow(segs.d) }} />
        {/* E lower-left */}
        <polygon points="0,30 4,32 4,42 0,44" fill={on(segs.e)} style={{ filter: glow(segs.e) }} />
        {/* F upper-left */}
        <polygon points="0,8 4,10 4,20 0,22" fill={on(segs.f)} style={{ filter: glow(segs.f) }} />
        {/* G middle */}
        <polygon points="6,21 22,21 20,26 8,26" fill={on(segs.g)} style={{ filter: glow(segs.g) }} />
        {/* Decimal point */}
        <circle cx="27" cy="40" r="2.5" fill="#331111" />
      </g>
    </g>
  );
};
