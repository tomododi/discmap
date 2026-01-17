interface MandatoryMarkerProps {
  rotation?: number; // Arrow rotation angle in degrees (0 = right, 90 = down)
  lineAngle?: number; // Boundary line angle in degrees (direction the boundary extends)
  selected?: boolean;
  color?: string; // Arrow color (purple default)
  lineColor?: string; // Boundary line color (red default)
  scale?: number;
  onRotate?: (newRotation: number) => void;
  onClick?: () => void; // Click handler for selection
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
  onClick,
  mapBearing = 0,
}: MandatoryMarkerProps) {
  const borderColor = darkenColor(color);
  // Scale only affects the purple arrow, not the boundary line
  const s = scale;

  // Fixed canvas size for boundary line
  const size = 64;
  const cx = 32; // Center
  const cy = 32;

  // Fixed boundary line length with arrowhead
  const boundaryLineLength = 24;
  const arrowheadSize = 6;

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
  // lineAngle is used directly (no offset) - 0=right, 90=down, 180=left, 270=up
  const lineRad = (effectiveLineAngle * Math.PI) / 180;
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
        transition-transform
        ${selected ? 'scale-125' : ''}
      `}
      style={{ pointerEvents: 'none' }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ overflow: 'visible' }}>
        {/* Red boundary line with arrowhead - NOT clickable, fixed size */}
        <line
          x1={cx}
          y1={cy}
          x2={lineEndX}
          y2={lineEndY}
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
        {/* Arrowhead - NOT clickable */}
        <path
          d={`M${lineEndX},${lineEndY} L${arrow1X},${arrow1Y} L${arrow2X},${arrow2Y} Z`}
          fill={lineColor}
          style={{ pointerEvents: 'none' }}
        />

        {/* Purple direction arrow - ONLY this is clickable, scales with zoom */}
        <g
          transform={`rotate(${effectiveRotation} ${cx} ${cy})`}
          onWheel={handleWheel}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          style={{ pointerEvents: 'auto' }}
        >
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
            className="cursor-pointer hover:opacity-80"
          />
        </g>
      </svg>
    </div>
  );
}
