import React from 'react';
import { ComponentInstance, Pin } from '../types';
import { COMPONENT_DEFINITIONS } from '../utils/componentDefinitions';

interface RealisticComponentProps {
  instance: ComponentInstance;
  activeDigitalPins?: Record<string, number>;
  ledState?: boolean;
  ledWarning?: string;
  onboardLed13?: boolean;
  buzzerState?: boolean;
  servoAngle?: number;
  motorSpeed?: number;
  lcdText?: [string, string];
  onValueChange?: (id: string, val: any) => void;
  onComponentStateChange?: (id: string, partialState: ComponentInstance['state']) => void;
  isSimulating: boolean;
}

export const RealisticComponent: React.FC<RealisticComponentProps> = ({
  instance,
  onboardLed13 = false,
  ledState = false,
  ledWarning = '',
  buzzerState = false,
  servoAngle = 0,
  motorSpeed = 0,
  lcdText = ['', ''],
  onValueChange,
  onComponentStateChange,
  isSimulating,
}) => {
  const def = COMPONENT_DEFINITIONS[instance.type];
  if (!def) return null;

  const width = def.width;
  const height = def.height;

  // Render component based on type
  const renderSVG = () => {
    switch (instance.type) {
      case 'arduino_uno':
        return (
          <g>
            {/* Board Background */}
            <rect width={width} height={height} rx="8" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="2" />
            
            {/* PCB silk print lines */}
            <rect x="8" y="8" width={width - 16} height={height - 16} rx="6" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="4 4" />
            <text x="75" y="85" fill="#3b82f6" fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="2">SMART IOT</text>
            <text x="75" y="100" fill="#3b82f6" fontSize="10" fontFamily="sans-serif">UNO R3 SIMULATOR</text>

            {/* USB Connector */}
            <rect x="-5" y="20" width="40" height="35" rx="3" fill="#9ca3af" stroke="#4b5563" strokeWidth="1.5" />
            <line x1="0" y1="28" x2="30" y2="28" stroke="#d1d5db" strokeWidth="1" />
            <line x1="0" y1="47" x2="30" y2="47" stroke="#d1d5db" strokeWidth="1" />

            {/* Power Jack */}
            <rect x="-5" y="95" width="45" height="40" rx="3" fill="#111827" stroke="#1f2937" strokeWidth="2" />
            <circle cx="20" cy="115" r="8" fill="#374151" />

            {/* Main Chip ATmega328P */}
            <rect x="140" y="70" width="80" height="22" rx="2" fill="#1f2937" stroke="#030712" strokeWidth="1" />
            <circle cx="145" cy="81" r="3" fill="#111827" /> {/* Pin 1 notch */}
            {/* Chip pins */}
            {Array.from({ length: 14 }).map((_, i) => (
              <g key={i}>
                <rect x={145 + i * 5} y="67" width="2" height="3" fill="#d1d5db" />
                <rect x={145 + i * 5} y="92" width="2" height="3" fill="#d1d5db" />
              </g>
            ))}

            {/* Header Pins Top */}
            <rect x="50" y="3" width="175" height="10" fill="#111827" rx="1" />
            {/* Pins Label Top */}
            <text x="140" y="22" fill="#ffffff" fontSize="6.5" fontFamily="monospace" textAnchor="middle">DIGITAL (PWM~)</text>
            
            {/* Header Pins Bottom */}
            <rect x="62" y="147" width="132" height="10" fill="#111827" rx="1" />
            {/* Pins Label Bottom */}
            <text x="95" y="142" fill="#ffffff" fontSize="6" fontFamily="monospace">POWER</text>
            <text x="165" y="142" fill="#ffffff" fontSize="6" fontFamily="monospace">ANALOG IN</text>

            {/* Onboard LEDs */}
            <circle cx="65" cy="40" r="3" fill={isSimulating ? '#22c55e' : '#15803d'} stroke="#166534" strokeWidth="0.5" />
            <text x="65" y="50" fill="#ffffff" fontSize="6" fontFamily="sans-serif" textAnchor="middle">ON</text>
            <circle cx="100" cy="40" r="3" fill={onboardLed13 ? '#fde047' : '#15803d'} stroke={onboardLed13 ? '#ca8a04' : '#166534'} strokeWidth="0.5" />
            {onboardLed13 && <circle cx="100" cy="40" r="7" fill="#fde047" opacity="0.35" />}
            <text x="100" y="50" fill="#ffffff" fontSize="6" fontFamily="sans-serif" textAnchor="middle">L</text>
          </g>
        );

      case 'breadboard_small':
        return (
          <g>
            {/* Breadboard Plate */}
            <rect width={width} height={height} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Center Splitter Trench */}
            <rect x="10" y="76" width={width - 20} height={10} fill="#e2e8f0" />
            
            {/* Labels columns */}
            {Array.from({ length: 6 }).map((_, idx) => {
              const col = idx * 5 + 1;
              const x = 20 + idx * 5 * 9.5;
              return (
                <g key={col} fontSize="6" fill="#94a3b8" fontFamily="monospace" textAnchor="middle">
                  <text x={x} y={28}>{col}</text>
                  <text x={x} y={135}>{col}</text>
                </g>
              );
            })}

            {/* Labels rows */}
            {['e', 'd', 'c', 'b', 'a'].map((r, i) => (
              <text key={r} x="8" y={35.5 + i * 8.5} fontSize="6.5" fill="#94a3b8" fontFamily="monospace">{r}</text>
            ))}
            {['f', 'g', 'h', 'i', 'j'].map((r, i) => (
              <text key={r} x="8" y={94.5 + i * 8.5} fontSize="6.5" fill="#94a3b8" fontFamily="monospace">{r}</text>
            ))}

            {/* Power Rails Indicator lines */}
            {/* Top plus/minus line */}
            <line x1="20" y1="6" x2={width - 20} y2="6" stroke="#3b82f6" strokeWidth="1" />
            <text x="12" y="12" fill="#3b82f6" fontSize="9" fontWeight="bold">-</text>
            <line x1="20" y1="25" x2={width - 20} y2="25" stroke="#ef4444" strokeWidth="1" />
            <text x="12" y="22" fill="#ef4444" fontSize="9" fontWeight="bold">+</text>

            {/* Bottom plus/minus line */}
            <line x1="20" y1="155" x2={width - 20} y2="155" stroke="#ef4444" strokeWidth="1" />
            <text x="12" y="152" fill="#ef4444" fontSize="9" fontWeight="bold">+</text>
            <line x1="20" y1="137" x2={width - 20} y2="137" stroke="#3b82f6" strokeWidth="1" />
            <text x="12" y="142" fill="#3b82f6" fontSize="9" fontWeight="bold">-</text>
          </g>
        );

      case 'resistor':
        // Determine band colors based on resistance value
        // 220 -> Red, Red, Brown, Gold
        // 10000 (10k) -> Brown, Black, Orange, Gold
        const is220 = instance.value === 220 || String(instance.value).includes('220');
        const band1 = is220 ? '#ef4444' : '#78350f'; // Red or Brown
        const band2 = is220 ? '#ef4444' : '#000000'; // Red or Black
        const band3 = is220 ? '#78350f' : '#f59e0b'; // Brown or Orange
        return (
          <g>
            {/* Metal wires */}
            <line x1="0" y1="10" x2="25" y2="10" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="55" y1="10" x2="80" y2="10" stroke="#94a3b8" strokeWidth="2.5" />
            
            {/* Body */}
            <rect x="23" y="3" width="34" height="14" rx="4" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
            
            {/* Bands */}
            <rect x="29" y="3" width="3" height="14" fill={band1} />
            <rect x="35" y="3" width="3" height="14" fill={band2} />
            <rect x="41" y="3" width="3" height="14" fill={band3} />
            <rect x="49" y="3" width="3" height="14" fill="#fbbf24" /> {/* Gold tolerance */}
          </g>
        );

      case 'led':
        const color = instance.color || '#ef4444';
        const isGlowing = ledState;
        
        return (
          <g>
            {/* Pins legs */}
            <line x1="10" y1="20" x2="10" y2="35" stroke="#94a3b8" strokeWidth="2.5" />
            {/* Anode bent pin leg */}
            <path d="M 20 20 L 20 26 L 24 30 L 20 35" stroke="#94a3b8" strokeWidth="2.5" fill="none" />

            {/* LED Bulb base rim */}
            <rect x="5" y="17" width="20" height="4" fill="#b91c1c" opacity="0.3" />

            {/* LED Glow Overlay */}
            {isGlowing && (
              <circle cx="15" cy="12" r="14" fill={color} opacity="0.45" filter="drop-shadow(0px 0px 8px color)" />
            )}

            {/* Main Bulb */}
            <path
              d="M 5 18 L 5 10 A 10 10 0 0 1 25 10 L 25 18 Z"
              fill={color}
              stroke={isGlowing ? '#ffffff' : '#6b7280'}
              strokeWidth="1"
              opacity={isGlowing ? 0.95 : 0.75}
            />

            {/* Inner cathode reflection */}
            <path d="M 9 10 L 13 16 L 15 16 Z" fill="#ffffff" opacity="0.4" />

            {/* Warning visual */}
            {ledWarning && (
              <g transform="translate(2, -18)">
                <circle cx="13" cy="13" r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <text x="13" y="16" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">!</text>
                <title>{ledWarning}</title>
              </g>
            )}
          </g>
        );

      case 'push_button':
        const isActive = instance.state?.active;
        return (
          <g>
            {/* Pins corner legs */}
            <rect x="3" y="4" width="4.5" height="5" fill="#94a3b8" />
            <rect x="22.5" y="4" width="4.5" height="5" fill="#94a3b8" />
            <rect x="3" y="21" width="4.5" height="5" fill="#94a3b8" />
            <rect x="22.5" y="21" width="4.5" height="5" fill="#94a3b8" />
            
            {/* Plastic Base */}
            <rect x="5" y="5" width="20" height="20" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
            
            {/* Metal Ring */}
            <circle cx="15" cy="15" r="7" fill="#64748b" stroke="#475569" strokeWidth="1" />
            
            {/* Button Plunger */}
            <circle
              cx="15"
              cy="15"
              r={isActive ? 4.5 : 5.5}
              fill={isActive ? '#1d4ed8' : '#3b82f6'}
              stroke="#1e40af"
              strokeWidth="0.5"
              style={{ cursor: 'pointer' }}
              onMouseDown={(event) => {
                event.stopPropagation();
                onComponentStateChange?.(instance.id, { active: true });
              }}
            />
          </g>
        );

      case 'buzzer':
        return (
          <g>
            {/* Pins legs */}
            <line x1="15" y1="25" x2="15" y2="40" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="35" y1="25" x2="35" y2="40" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Black Casing */}
            <circle cx="25" cy="25" r="23" fill="#1f2937" stroke="#111827" strokeWidth="2" />
            
            {/* Inner Details */}
            <circle cx="25" cy="25" r="16" fill="#111827" />
            <circle cx="25" cy="25" r="4" fill="#b45309" /> {/* Center brass hole */}
            
            {/* Labels */}
            <text x="13" y="16" fill="#ef4444" fontSize="8" fontWeight="bold">+</text>
            <text x="33" y="16" fill="#94a3b8" fontSize="8" fontWeight="bold">-</text>

            {/* Interactive sound ripples */}
            {buzzerState && (
              <g stroke="#3b82f6" strokeWidth="1.5" fill="none">
                <circle cx="25" cy="25" r="28" opacity="0.6">
                  <animate attributeName="r" values="24;36;42" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.3;0" dur="0.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="25" cy="25" r="34" opacity="0.4">
                  <animate attributeName="r" values="28;44;52" dur="1s" begin="0.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.3;0" dur="1s" begin="0.2s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
          </g>
        );

      case 'lcd_16x2':
        const displayL1 = lcdText[0] || 'Smart IOT 16x2';
        const displayL2 = lcdText[1] || 'Offline';
        const isLcdPowered = isSimulating; // simplified power logic
        
        return (
          <g>
            {/* PCB Board */}
            <rect width={width} height={height} rx="4" fill="#065f46" stroke="#064e3b" strokeWidth="2" />

            {/* Metal Bezels Screen Border */}
            <rect x="10" y="15" width="160" height="50" fill="#334155" rx="2" />

            {/* LCD Screen Display Glass */}
            <rect
              x="13"
              y="18"
              width="154"
              height="44"
              fill={isLcdPowered ? '#1e3a8a' : '#1e293b'}
              stroke="#0f172a"
              strokeWidth="1"
            />

            {/* Text Overlay */}
            {isLcdPowered ? (
              <g fill="#60a5fa" fontFamily="monospace" fontSize="9.5" fontWeight="bold" letterSpacing="1">
                <text x="20" y="32">{displayL1.padEnd(16, ' ')}</text>
                <text x="20" y="52">{displayL2.padEnd(16, ' ')}</text>
              </g>
            ) : (
              <g fill="#475569" fontFamily="monospace" fontSize="9.5" letterSpacing="1">
                <text x="20" y="32">================</text>
                <text x="20" y="52">================</text>
              </g>
            )}

            {/* Pins Label print */}
            <line x1="12" y1="73" x2="168" y2="73" stroke="#fef08a" strokeWidth="1" strokeDasharray="3 3" />
          </g>
        );

      case 'gas_sensor':
        // Gas slider component
        const gasVal = instance.state?.sensorValue ?? 120;
        return (
          <g>
            {/* Outer Pin legs */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * Math.PI) / 3;
              const px = 30 + 20 * Math.cos(angle);
              const py = 30 + 20 * Math.sin(angle);
              return <circle key={i} cx={px} cy={py} r="2.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.5" />;
            })}

            {/* Outer ceramic circle */}
            <circle cx="30" cy="30" r="23" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Metal mesh */}
            <circle cx="30" cy="30" r="18" fill="#475569" stroke="#334155" strokeWidth="1.5" />
            <circle cx="30" cy="30" r="14" fill="#64748b" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="30" cy="30" r="8" fill="#334155" opacity="0.8" />
            
            {/* MQ-2 Label */}
            <text x="30" y="33" fill="#cbd5e1" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MQ-2</text>

            {/* Visual gas cloud during simulation */}
            {isSimulating && gasVal > 200 && (
              <circle cx="30" cy="30" r={18 + (gasVal - 200) / 30} fill="#f59e0b" opacity="0.18" style={{ pointerEvents: 'none' }}>
                <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Slider setting overlay if selected/active */}
            <foreignObject x="-20" y="62" width="100" height="25">
              <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={gasVal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (onValueChange) onValueChange(instance.id, val);
                  }}
                  className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[7.5px] bg-slate-100 text-slate-700 px-1 rounded font-mono mt-0.5">
                  Gas: {gasVal}
                </span>
              </div>
            </foreignObject>
          </g>
        );

      case 'ldr':
        const ldrVal = instance.state?.sensorValue ?? 500;
        return (
          <g>
            {/* Pins */}
            <line x1="5" y1="7" x2="5" y2="15" stroke="#94a3b8" strokeWidth="2" />
            <line x1="25" y1="7" x2="25" y2="15" stroke="#94a3b8" strokeWidth="2" />

            {/* Ceramic Plate */}
            <rect x="2" y="2" width="26" height="10" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="3" y="3" width="24" height="8" rx="1" fill="#ea580c" />

            {/* Squiggly line photo-conductive track */}
            <path
              d="M 6 5 L 10 5 L 10 9 L 14 9 L 14 5 L 18 5 L 18 9 L 22 9 L 22 5"
              fill="none"
              stroke="#fef08a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Slider Control */}
            <foreignObject x="-10" y="17" width="50" height="25">
              <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="range"
                  min="0"
                  max="1023"
                  value={ldrVal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (onValueChange) onValueChange(instance.id, val);
                  }}
                  className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[7px] bg-slate-100 px-1 rounded font-mono">
                  Lux: {ldrVal}
                </span>
              </div>
            </foreignObject>
          </g>
        );

      case 'potentiometer':
        const potPos = instance.state?.sensorValue ?? 512; // 0-1023
        const rotAngle = (potPos / 1023) * 270 - 135; // Map to -135 to 135 deg
        
        return (
          <g>
            {/* Wire terminals */}
            <line x1="8" y1="28" x2="8" y2="38" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="20" y1="28" x2="20" y2="38" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="32" y1="28" x2="32" y2="38" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Case Body */}
            <circle cx="20" cy="18" r="18" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5" />
            <circle cx="20" cy="18" r="14" fill="#cbd5e1" />

            {/* Rotating dial */}
            <g transform={`rotate(${rotAngle}, 20, 18)`}>
              <circle cx="20" cy="18" r="10" fill="#475569" />
              {/* Pointer line */}
              <line x1="20" y1="18" x2="20" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Slider Knob Control */}
            <foreignObject x="-10" y="40" width="60" height="25">
              <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="range"
                  min="0"
                  max="1023"
                  value={potPos}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (onValueChange) onValueChange(instance.id, val);
                  }}
                  className="w-14 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[7px] bg-slate-100 px-0.5 rounded font-mono">
                  Pot: {potPos}
                </span>
              </div>
            </foreignObject>
          </g>
        );

      case 'dc_motor':
        const speed = motorSpeed; // -100 to 100
        const isSpinning = speed !== 0;
        
        return (
          <g>
            {/* Terminals */}
            <circle cx="15" cy="50" r="3" fill="#b45309" />
            <circle cx="45" cy="50" r="3" fill="#b45309" />

            {/* Round Motor Body */}
            <circle cx="30" cy="30" r="24" fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
            {/* Shaft Base */}
            <circle cx="30" cy="30" r="6" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

            {/* Spinning Propeller blades */}
            <g transform={`translate(30, 30)`}>
              <g>
                {isSpinning && (
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to={speed > 0 ? "360" : "-360"}
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                )}
                
                {/* Propeller shaft central dot */}
                <circle cx="0" cy="0" r="3" fill="#f59e0b" />
                
                {/* Blade 1 */}
                <path d="M -3 -3 L -6 -20 A 8 8 0 0 1 6 -20 L 3 -3 Z" fill="#dc2626" opacity="0.85" />
                {/* Blade 2 */}
                <path d="M -3 3 L -6 20 A 8 8 0 0 0 6 20 L 3 3 Z" fill="#dc2626" opacity="0.85" />
                {/* Blade 3 */}
                <path d="M 3 -3 L 20 -6 A 8 8 0 0 1 20 6 L 3 3 Z" fill="#dc2626" opacity="0.85" />
                {/* Blade 4 */}
                <path d="M -3 -3 L -20 -6 A 8 8 0 0 0 -20 6 L -3 3 Z" fill="#dc2626" opacity="0.85" />
              </g>
            </g>

            <text x="30" y="16" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle">DC MOTOR</text>
          </g>
        );

      case 'servo':
        const targetAngle = servoAngle; // 0 to 180
        return (
          <g>
            {/* Micro Servo Casing */}
            <rect width={width} height="32" rx="3" fill="#1e40af" stroke="#1d4ed8" strokeWidth="1.5" />
            
            {/* Flanges side wings */}
            <rect x="-8" y="10" width="8" height="12" fill="#1e3a8a" />
            <circle cx="-4" cy="16" r="1.5" fill="#f8fafc" />
            <rect x={width} y="10" width="8" height="12" fill="#1e3a8a" />
            <circle cx={width + 4} cy="16" r="1.5" fill="#f8fafc" />

            {/* Gear shaft cylinder */}
            <circle cx="45" cy="16" r="10" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="1" />
            <circle cx="45" cy="16" r="4" fill="#f8fafc" />

            {/* Servo Horn arm rotating arm */}
            <g transform={`rotate(${targetAngle - 90}, 45, 16)`}>
              {/* White plastic horn */}
              <path d="M 41 16 L 41 -15 A 4 4 0 0 1 49 -15 L 49 16 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
              <path d="M 41 16 L 41 35 A 4 4 0 0 0 49 35 L 49 16 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="45" cy="16" r="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              
              {/* Pin holes in horn */}
              <circle cx="45" cy="-12" r="1" fill="#475569" />
              <circle cx="45" cy="-5" r="1" fill="#475569" />
              <circle cx="45" cy="12" r="1" fill="#475569" />
              <circle cx="45" cy="28" r="1" fill="#475569" />
            </g>

            {/* Cable wires extending from bottom */}
            <path d="M 30 32 L 30 42" stroke="#78350f" strokeWidth="1.5" /> {/* GND Brown */}
            <path d="M 32 32 L 32 42" stroke="#ef4444" strokeWidth="1.5" /> {/* VCC Red */}
            <path d="M 34 32 L 34 42" stroke="#f59e0b" strokeWidth="1.5" /> {/* Signal Orange */}

            <text x="18" y="16" fill="#93c5fd" fontSize="6.5" fontWeight="bold">SERVO</text>
          </g>
        );

      case 'seven_segment':
        const displayVal = instance.state?.displayVal || '0';
        
        // Helper to check segment state based on standard common-cathode character hex representations
        // Standard digit mapping: '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        const digitSegments: Record<string, Record<string, boolean>> = {
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
          ' ': { a: false, b: false, c: false, d: false, e: false, f: false, g: false }
        };
        const currentSegs = digitSegments[displayVal] || digitSegments[' '];

        const segColor = (lit: boolean) => lit ? '#ef4444' : '#374151';
        const segGlow = (lit: boolean) => lit ? 'drop-shadow(0px 0px 3px #ef4444)' : 'none';

        return (
          <g>
            {/* Casing package */}
            <rect width={width} height={height} rx="2" fill="#111827" stroke="#1f2937" strokeWidth="2.5" />

            {/* Inner display bezel */}
            <rect x="5" y="10" width="30" height="40" rx="1" fill="#1e293b" />

            {/* Segment A */}
            <rect x="10" y="12" width="20" height="3.5" rx="1" fill={segColor(currentSegs.a)} style={{ filter: segGlow(currentSegs.a) }} />
            {/* Segment B */}
            <rect x="27.5" y="14" width="3.5" height="15" rx="1" fill={segColor(currentSegs.b)} style={{ filter: segGlow(currentSegs.b) }} />
            {/* Segment C */}
            <rect x="27.5" y="31" width="3.5" height="15" rx="1" fill={segColor(currentSegs.c)} style={{ filter: segGlow(currentSegs.c) }} />
            {/* Segment D */}
            <rect x="10" y="44.5" width="20" height="3.5" rx="1" fill={segColor(currentSegs.d)} style={{ filter: segGlow(currentSegs.d) }} />
            {/* Segment E */}
            <rect x="9" y="31" width="3.5" height="15" rx="1" fill={segColor(currentSegs.e)} style={{ filter: segGlow(currentSegs.e) }} />
            {/* Segment F */}
            <rect x="9" y="14" width="3.5" height="15" rx="1" fill={segColor(currentSegs.f)} style={{ filter: segGlow(currentSegs.f) }} />
            {/* Segment G */}
            <rect x="10" y="28.25" width="20" height="3.5" rx="1" fill={segColor(currentSegs.g)} style={{ filter: segGlow(currentSegs.g) }} />

            {/* Decimal Point */}
            <circle cx="32" cy="46" r="2" fill={segColor(false)} />
          </g>
        );

      case 'battery_9v':
        return (
          <g>
            {/* Rectangular plastic frame */}
            <rect width={width} height={height} rx="6" fill="#111827" stroke="#1f2937" strokeWidth="2" />
            
            {/* Top Terminals snap connectors */}
            {/* Male connector circular rim */}
            <circle cx="18" cy="12" r="7.5" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="18" cy="12" r="3.5" fill="#475569" />
            
            {/* Female connector hexagonal rim */}
            <polygon points="42,4.5 48.5,8.25 48.5,15.75 42,19.5 35.5,15.75 35.5,8.25" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="42" cy="12" r="3" fill="#475569" />

            {/* Battery Cover Label */}
            <rect x="5" y="26" width={width - 10} height="40" fill="#f59e0b" rx="2" />
            <text x="30" y="42" fill="#111827" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">9V</text>
            <text x="30" y="52" fill="#111827" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">POWERCELL</text>

            {/* Polarity markers */}
            <text x="18" y="22" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">+</text>
            <text x="42" y="22" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">-</text>
          </g>
        );

      case 'battery_aa':
        return (
          <g>
            {/* Main AA body */}
            <rect width={width - 4} height={height} rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            
            {/* Positive contact nipple */}
            <rect x={width - 4} y="7.5" width="4" height="15" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />

            {/* Copper/Gold band */}
            <rect x={width - 30} y="1" width="25" height={height - 2} fill="#ea580c" />
            
            <text x="35" y="18" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">1.5V AA</text>
            
            {/* Polarities */}
            <text x="8" y="19" fill="#94a3b8" fontSize="8" fontWeight="bold">-</text>
            <text x="82" y="19" fill="#ef4444" fontSize="8" fontWeight="bold">+</text>
          </g>
        );

      case 'battery_coin':
        return (
          <g>
            {/* Metallic circular battery cell */}
            <circle cx="22.5" cy="22.5" r="21" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="22.5" cy="22.5" r="16" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
            
            {/* Engraving */}
            <text x="22.5" y="19" fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">CR2032</text>
            <text x="22.5" y="28" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">3V</text>
            <text x="22.5" y="38" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
          </g>
        );

      default:
        return (
          <g>
            <rect width={width} height={height} rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <text x={width / 2} y={height / 2} fill="#374151" fontSize="9" textAnchor="middle" alignmentBaseline="middle">
              {instance.name}
            </text>
          </g>
        );
    }
  };

  return (
    <g transform={`translate(${instance.x}, ${instance.y}) rotate(${instance.rotation || 0}, ${width / 2}, ${height / 2})`}>
      {/* Component Core Visuals */}
      {renderSVG()}

      {/* Invisible pin hit targets for wiring — no visible circles */}
      {def.pins.map((pin: Pin) => (
        <circle
          key={pin.id}
          cx={pin.x}
          cy={pin.y}
          r="9"
          fill="transparent"
          stroke="transparent"
          pointerEvents="all"
          data-pin-id={pin.id}
          data-component-id={instance.id}
          style={{ cursor: 'crosshair' }}
        >
          <title>{pin.name}</title>
        </circle>
      ))}
    </g>
  );
};
