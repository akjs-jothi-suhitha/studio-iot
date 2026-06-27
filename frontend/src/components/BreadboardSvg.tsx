import React from 'react';

interface BreadboardSvgProps {
  width: number;
  height: number;
}

/** Tinkercad-style half breadboard — white body, blue/red rails, round holes */
export const BreadboardSvg: React.FC<BreadboardSvgProps> = ({ width, height }) => {
  const colSpacing = 9.5;
  const startX = 20;
  const cols = 60;

  const holeY = (row: number, section: 'top' | 'bottom') =>
    section === 'top' ? 33 + row * 8.5 : 92 + row * 8.5;

  return (
    <g>
      {/* Plastic body shadow */}
      <rect x="1" y="2" width={width - 2} height={height - 1} rx="8" fill="#cbd5e1" />
      <rect width={width} height={height} rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
      <rect x="4" y="4" width={width - 8} height={height - 8} rx="6" fill="#fafafa" />

      {/* Center trench */}
      <rect x="14" y="73" width={width - 28} height="14" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />

      {/* Top blue (-) rail strip */}
      <rect x="14" y="6" width={width - 28} height="11" rx="2" fill="#1d4ed8" opacity="0.12" />
      {/* Top red (+) rail strip */}
      <rect x="14" y="19" width={width - 28} height="11" rx="2" fill="#dc2626" opacity="0.12" />
      {/* Bottom red (+) */}
      <rect x="14" y="130" width={width - 28} height="11" rx="2" fill="#dc2626" opacity="0.12" />
      {/* Bottom blue (-) */}
      <rect x="14" y="143" width={width - 28} height="11" rx="2" fill="#1d4ed8" opacity="0.12" />

      {Array.from({ length: cols }).map((_, col) => {
        const x = startX + col * colSpacing;
        return (
          <g key={col}>
            {/* Rail holes */}
            <circle cx={x} cy={10} r="2.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
            <circle cx={x} cy={10} r="1" fill="#64748b" opacity="0.5" />
            <circle cx={x} cy={19} r="2.8" fill="#fecaca" stroke="#f87171" strokeWidth="0.6" />
            <circle cx={x} cy={19} r="1" fill="#ef4444" opacity="0.4" />
            {/* Main grid A-E */}
            {[0, 1, 2, 3, 4].map((ri) => (
              <g key={`t${ri}`}>
                <circle cx={x} cy={holeY(ri, 'top')} r="2.8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                <circle cx={x} cy={holeY(ri, 'top')} r="0.9" fill="#94a3b8" opacity="0.6" />
              </g>
            ))}
            {/* Main grid F-J */}
            {[0, 1, 2, 3, 4].map((ri) => (
              <g key={`b${ri}`}>
                <circle cx={x} cy={holeY(ri, 'bottom')} r="2.8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                <circle cx={x} cy={holeY(ri, 'bottom')} r="0.9" fill="#94a3b8" opacity="0.6" />
              </g>
            ))}
            <circle cx={x} cy={140} r="2.8" fill="#fecaca" stroke="#f87171" strokeWidth="0.6" />
            <circle cx={x} cy={149} r="2.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
          </g>
        );
      })}

      {['a', 'b', 'c', 'd', 'e'].map((r, i) => (
        <text key={r} x="9" y={36 + i * 8.5} fontSize="7" fill="#64748b" fontFamily="monospace" fontWeight="600">{r}</text>
      ))}
      {['f', 'g', 'h', 'i', 'j'].map((r, i) => (
        <text key={r} x="9" y={95 + i * 8.5} fontSize="7" fill="#64748b" fontFamily="monospace" fontWeight="600">{r}</text>
      ))}

      {/* Rail markers */}
      <line x1="16" y1="10" x2={width - 16} y2="10" stroke="#2563eb" strokeWidth="2" opacity="0.7" />
      <text x="6" y="13" fill="#2563eb" fontSize="10" fontWeight="bold">−</text>
      <line x1="16" y1="19" x2={width - 16} y2="19" stroke="#dc2626" strokeWidth="2" opacity="0.7" />
      <text x="6" y="22" fill="#dc2626" fontSize="10" fontWeight="bold">+</text>
      <line x1="16" y1="140" x2={width - 16} y2="140" stroke="#dc2626" strokeWidth="2" opacity="0.7" />
      <text x="6" y="143" fill="#dc2626" fontSize="10" fontWeight="bold">+</text>
      <line x1="16" y1="149" x2={width - 16} y2="149" stroke="#2563eb" strokeWidth="2" opacity="0.7" />
      <text x="6" y="152" fill="#2563eb" fontSize="10" fontWeight="bold">−</text>
    </g>
  );
};
