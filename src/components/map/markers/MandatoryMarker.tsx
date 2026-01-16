interface MandatoryMarkerProps {
  rotation?: number; // Arrow rotation angle in degrees (0 = right, 90 = down)
  lineAngle?: number; // Boundary line angle in degrees (direction the boundary extends)
  selected?: boolean;
  color?: string; // Arrow color (purple default)
  lineColor?: string; // Boundary line color (red default)
  scale?: number;
  onRotate?: (newRotation: number) => void;
  mapBearing?: number;
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
  selected,
  color = defaultArrowColor,
  lineColor = defaultLineColor,
  scale = 1,
  onRotate,
  mapBearing = 0,
}: MandatoryMarkerProps) {
  const borderColor = darkenColor(color);
  const s = scale;

  // Base dimensions - slightly larger canvas for boundary line
  const size = 48 * s;
  const cx = 24 * s; // Center
  const cy = 24 * s;

  // Fixed boundary line length (does not scale with zoom)
  const boundaryLineLength = 20 * s;
  const arrowheadSize = 6 * s;

  // Counter-rotate against map bearing
  const effectiveRotation = rotation - mapBearing;
  const effectiveLineAngle = lineAngle - mapBearing;

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

  // Calculate arrowhead points for boundary line
  // Line goes from center outward in lineAngle direction
  const lineRad = ((effectiveLineAngle + 90) * Math.PI) / 180;
  const lineEndX = cx + Math.cos(lineRad) * boundaryLineLength;
  const lineEndY = cy + Math.sin(lineRad) * boundaryLineLength;

  // Arrowhead at the end of boundary line
  const arrowAngle1 = lineRad + Math.PI * 0.8;
  const arrowAngle2 = lineRad - Math.PI * 0.8;
  const arrow1X = lineEndX + Math.cos(arrowAngle1) * arrowheadSize;
  const arrow1Y = lineEndY + Math.sin(arrowAngle1) * arrowheadSize;
  const arrow2X = lineEndX + Math.cos(arrowAngle2) * arrowheadSize;
  const arrow2Y = lineEndY + Math.sin(arrowAngle2) * arrowheadSize;

  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
      onWheel={handleWheel}
      title={selected ? 'Scroll to rotate arrow' : undefined}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        {/* Red boundary line with arrowhead - fixed length, points in boundary direction */}
        <line
          x1={cx}
          y1={cy}
          x2={lineEndX}
          y2={lineEndY}
          stroke={lineColor}
          strokeWidth={2.5 * s}
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <path
          d={`M${lineEndX},${lineEndY} L${arrow1X},${arrow1Y} L${arrow2X},${arrow2Y} Z`}
          fill={lineColor}
        />

        {/* Purple direction arrow - shows which way to pass */}
        <g transform={`rotate(${effectiveRotation} ${cx} ${cy})`}>
          <path
            d={`
              M${cx - 10 * s} ${cy - 2 * s}
              L${cx + 2 * s} ${cy - 2 * s}
              L${cx + 2 * s} ${cy - 6 * s}
              L${cx + 12 * s} ${cy}
              L${cx + 2 * s} ${cy + 6 * s}
              L${cx + 2 * s} ${cy + 2 * s}
              L${cx - 10 * s} ${cy + 2 * s}
              Z
            `}
            fill={color}
            stroke={selected ? '#3b82f6' : borderColor}
            strokeWidth={selected ? 2 * s : 1.5 * s}
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
