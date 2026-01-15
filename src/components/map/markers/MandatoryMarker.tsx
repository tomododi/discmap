interface MandatoryMarkerProps {
  rotation?: number; // Arrow rotation angle in degrees (0 = right, 90 = down)
  lineAngle?: number; // Line rotation angle in degrees (absolute, 0-360)
  lineLength?: number; // Line length in pixels for display
  selected?: boolean;
  color?: string; // Arrow color (purple default)
  lineColor?: string; // Line color (red default)
  scale?: number;
  onRotate?: (newRotation: number) => void;
  onLineAngleChange?: (newAngle: number) => void;
}

// Derive border color from main color (darker version)
function darkenColor(hex: string | undefined): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return '#666666';
  }
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - 40);
  const b = Math.max(0, (num & 0x0000ff) - 40);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

const defaultArrowColor = '#8b5cf6'; // Purple
const defaultLineColor = '#dc2626'; // Red

export function MandatoryMarker({
  rotation = 0,
  lineAngle = 270,
  lineLength = 60,
  selected,
  color = defaultArrowColor,
  lineColor = defaultLineColor,
  scale = 1,
  onRotate,
}: MandatoryMarkerProps) {
  const borderColor = darkenColor(color);
  const s = scale;

  // Base dimensions
  const size = 32 * s;
  const cx = 16 * s;
  const cy = 16 * s;

  // Line length for display (scaled)
  const displayLineLength = lineLength * s;

  // Handle rotation via mouse wheel when selected
  const handleWheel = (e: React.WheelEvent) => {
    if (selected && onRotate) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 15 : -15; // 15 degree increments
      const newRotation = (rotation + delta + 360) % 360;
      onRotate(newRotation);
    }
  };

  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
      onWheel={handleWheel}
      title={selected ? 'Scroll to rotate arrow' : undefined}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ overflow: 'visible' }}>
        {/* Red boundary line - rotates independently */}
        <g transform={`rotate(${lineAngle} ${cx} ${cy})`}>
          {/* Main line extending upward from center */}
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - displayLineLength}
            stroke={lineColor}
            strokeWidth={3 * s}
            strokeLinecap="round"
          />
          {/* Cross bar at the end */}
          <line
            x1={cx - 8 * s}
            y1={cy - displayLineLength}
            x2={cx + 8 * s}
            y2={cy - displayLineLength}
            stroke={lineColor}
            strokeWidth={3 * s}
            strokeLinecap="round"
          />
        </g>

        {/* Purple arrow - no circle, just arrow shape */}
        <g transform={`rotate(${rotation} ${cx} ${cy})`}>
          {/* Arrow body */}
          <path
            d={`
              M${6 * s} ${14 * s}
              L${18 * s} ${14 * s}
              L${18 * s} ${10 * s}
              L${28 * s} ${16 * s}
              L${18 * s} ${22 * s}
              L${18 * s} ${18 * s}
              L${6 * s} ${18 * s}
              Z
            `}
            fill={color}
            stroke={selected ? '#3b82f6' : borderColor}
            strokeWidth={selected ? 2.5 * s : 1.5 * s}
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
