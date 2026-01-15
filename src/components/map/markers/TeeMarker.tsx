interface TeeMarkerProps {
  selected?: boolean;
  holeNumber?: number;
  color: string;
  name?: string;
  scale?: number;
  rotation?: number; // Tee pad rotation angle (0 = arrow points right, 90 = down, etc.)
  mapBearing?: number; // Current map bearing to counter-rotate
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

// Determine text color based on background brightness
function getTextColor(hex: string | undefined): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return '#ffffff';
  }
  const num = parseInt(hex.slice(1), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

export function TeeMarker({ selected, holeNumber, color, name, scale = 1, rotation = 0, mapBearing = 0 }: TeeMarkerProps) {
  const bgColor = color;
  const borderColor = darkenColor(bgColor);
  const textColor = getTextColor(bgColor);
  const s = scale;

  // Base dimensions
  const width = 36 * s;
  const height = 28 * s;

  // Counter-rotate against map bearing, then apply feature rotation
  const effectiveRotation = rotation - mapBearing;

  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
      style={{
        transform: `rotate(${effectiveRotation}deg)`,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        {/* Tee pad shape */}
        <rect
          x={2 * s}
          y={4 * s}
          width={32 * s}
          height={20 * s}
          rx={3 * s}
          fill={bgColor}
          stroke={selected ? '#3b82f6' : borderColor}
          strokeWidth={selected ? 3 * s : 2 * s}
        />
        {/* Inner texture */}
        <rect x={6 * s} y={8 * s} width={24 * s} height={12 * s} rx={2 * s} fill={borderColor} opacity="0.2" />

        {/* Direction arrow on right short side */}
        <polygon
          points={`${30 * s},${14 * s} ${26 * s},${11 * s} ${26 * s},${17 * s}`}
          fill={textColor}
          opacity="0.7"
        />

        {/* Hole number - positioned left of arrow */}
        {holeNumber && (
          <text
            x={15 * s}
            y={18 * s}
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize={12 * s}
            fill={textColor}
          >
            {holeNumber}
          </text>
        )}
      </svg>
      {/* Name label - counter-rotate to stay readable */}
      {name && (
        <div
          className="font-bold text-center -mt-1 uppercase"
          style={{
            color: borderColor,
            fontSize: `${8 * s}px`,
            transform: `rotate(${-rotation}deg)`,
          }}
        >
          {name.slice(0, 3)}
        </div>
      )}
    </div>
  );
}
