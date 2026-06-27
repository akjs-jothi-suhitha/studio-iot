import React from 'react';
import { ComponentType } from '../types';

interface ComponentThumbnailProps {
  type: ComponentType;
  size?: number;
}

/** Mini SVG previews for the parts library (Tinkercad-style) */
export const ComponentThumbnail: React.FC<ComponentThumbnailProps> = ({ type, size = 36 }) => {
  const s = size;
  const h = Math.round(s * 0.72);

  switch (type) {
    case 'arduino_uno':
      return (
        <svg width={s} height={h} viewBox="0 0 48 34" aria-hidden>
          <rect width="48" height="34" rx="3" fill="#1e40af" stroke="#1d4ed8" />
          <rect x="4" y="6" width="12" height="8" rx="1" fill="#9ca3af" />
          <rect x="18" y="12" width="22" height="10" rx="1" fill="#111827" />
          <circle cx="10" cy="22" r="2" fill="#22c55e" />
        </svg>
      );
    case 'arduino_nano':
      return (
        <svg width={s} height={h} viewBox="0 0 48 20" aria-hidden>
          <rect width="48" height="20" rx="2" fill="#065f46" stroke="#047857" />
          <rect x="16" y="6" width="16" height="8" rx="1" fill="#111827" />
        </svg>
      );
    case 'esp32':
      return (
        <svg width={s} height={h} viewBox="0 0 48 34" aria-hidden>
          <rect width="48" height="34" rx="3" fill="#334155" stroke="#475569" />
          <rect x="14" y="8" width="20" height="18" rx="1" fill="#0f172a" />
          <text x="24" y="20" fill="#94a3b8" fontSize="6" textAnchor="middle" fontWeight="bold">ESP32</text>
          <circle cx="24" cy="6" r="2" fill="#22c55e" />
        </svg>
      );
    case 'breadboard_small':
      return (
        <svg width={s} height={h} viewBox="0 0 48 28" aria-hidden>
          <rect width="48" height="28" rx="2" fill="#f8fafc" stroke="#94a3b8" />
          <rect x="4" y="3" width="40" height="3" fill="#dc2626" opacity="0.3" />
          <rect x="4" y="7" width="40" height="3" fill="#2563eb" opacity="0.3" />
          <rect x="4" y="13" width="40" height="2" fill="#cbd5e1" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={8 + i * 4.5} cy={11} r="0.8" fill="#64748b" />
          ))}
        </svg>
      );
    case 'led':
      return (
        <svg width={s} height={h} viewBox="0 0 24 32" aria-hidden>
          <circle cx="12" cy="10" r="7" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
          <line x1="8" y1="17" x2="8" y2="28" stroke="#64748b" strokeWidth="2" />
          <line x1="16" y1="17" x2="16" y2="28" stroke="#64748b" strokeWidth="2" />
        </svg>
      );
    case 'resistor':
      return (
        <svg width={s} height={h} viewBox="0 0 48 14" aria-hidden>
          <line x1="0" y1="7" x2="10" y2="7" stroke="#64748b" strokeWidth="2" />
          <rect x="10" y="3" width="28" height="8" rx="4" fill="#fef3c7" stroke="#d97706" />
          <line x1="38" y1="7" x2="48" y2="7" stroke="#64748b" strokeWidth="2" />
        </svg>
      );
    case 'gas_sensor':
      return (
        <svg width={s} height={h} viewBox="0 0 48 28" aria-hidden>
          <circle cx="24" cy="14" r="12" fill="#475569" stroke="#334155" />
          <circle cx="24" cy="14" r="6" fill="#64748b" />
          <circle cx="20" cy="6" r="3" fill="#94a3b8" opacity="0.5" />
        </svg>
      );
    case 'buzzer':
      return (
        <svg width={s} height={h} viewBox="0 0 28 36" aria-hidden>
          <circle cx="14" cy="14" r="12" fill="#1f2937" stroke="#374151" />
          <circle cx="14" cy="14" r="4" fill="#4b5563" />
          <line x1="10" y1="28" x2="10" y2="34" stroke="#64748b" strokeWidth="2" />
          <line x1="18" y1="28" x2="18" y2="34" stroke="#64748b" strokeWidth="2" />
        </svg>
      );
    case 'lcd_16x2':
      return (
        <svg width={s} height={h} viewBox="0 0 48 32" aria-hidden>
          <rect width="48" height="32" rx="2" fill="#166534" stroke="#14532d" />
          <rect x="4" y="6" width="40" height="14" rx="1" fill="#052e16" />
          <text x="24" y="16" fill="#4ade80" fontSize="5" textAnchor="middle" fontFamily="monospace">SAFE</text>
        </svg>
      );
    case 'dht11':
      return (
        <svg width={s} height={h} viewBox="0 0 20 36" aria-hidden>
          <rect x="4" y="4" width="12" height="24" rx="2" fill="#3b82f6" stroke="#1d4ed8" />
          <rect x="6" y="28" width="8" height="4" fill="#64748b" />
        </svg>
      );
    case 'ldr':
      return (
        <svg width={s} height={h} viewBox="0 0 48 28" aria-hidden>
          <rect width="48" height="28" rx="3" fill="#475569" />
          <circle cx="24" cy="14" r="8" fill="#fbbf24" opacity="0.8" />
        </svg>
      );
    case 'push_button':
      return (
        <svg width={s} height={h} viewBox="0 0 36 28" aria-hidden>
          <rect width="36" height="28" rx="2" fill="#374151" />
          <circle cx="18" cy="14" r="8" fill="#3b82f6" stroke="#1d4ed8" />
        </svg>
      );
    case 'potentiometer':
      return (
        <svg width={s} height={h} viewBox="0 0 28 32" aria-hidden>
          <rect x="6" y="8" width="16" height="16" rx="2" fill="#374151" />
          <circle cx="14" cy="16" r="5" fill="#6b7280" />
          <line x1="14" y1="16" x2="18" y2="12" stroke="#d1d5db" strokeWidth="1.5" />
        </svg>
      );
    case 'ultrasonic':
      return (
        <svg width={s} height={h} viewBox="0 0 48 32" aria-hidden>
          <rect width="48" height="32" rx="3" fill="#2563eb" />
          <circle cx="16" cy="16" r="8" fill="#93c5fd" />
          <circle cx="32" cy="16" r="8" fill="#93c5fd" />
        </svg>
      );
    case 'servo':
      return (
        <svg width={s} height={h} viewBox="0 0 48 28" aria-hidden>
          <rect width="40" height="22" rx="2" fill="#1f2937" />
          <polygon points="40,11 48,6 48,16" fill="#374151" />
        </svg>
      );
    case 'dc_motor':
      return (
        <svg width={s} height={h} viewBox="0 0 36 28" aria-hidden>
          <circle cx="18" cy="14" r="12" fill="#64748b" stroke="#475569" />
          <circle cx="18" cy="14" r="4" fill="#374151" />
        </svg>
      );
    case 'seven_segment':
      return (
        <svg width={s} height={h} viewBox="0 0 24 32" aria-hidden>
          <rect width="24" height="32" rx="2" fill="#111827" />
          <text x="12" y="20" fill="#ef4444" fontSize="14" textAnchor="middle" fontFamily="monospace">8</text>
        </svg>
      );
    case 'battery_9v':
    case 'battery_aa':
    case 'battery_coin':
      return (
        <svg width={s} height={h} viewBox="0 0 28 36" aria-hidden>
          <rect x="6" y="4" width="16" height="28" rx="2" fill="#374151" stroke="#1f2937" />
          <rect x="10" y="0" width="8" height="4" fill="#64748b" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={h} viewBox="0 0 32 32" aria-hidden>
          <rect width="32" height="32" rx="4" fill="#64748b" />
        </svg>
      );
  }
};
