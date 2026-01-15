interface DropzoneMarkerProps {
  selected?: boolean;
  color?: string;
  rotation?: number;
  scale?: number;
  onRotate?: (newRotation: number) => void;
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

// Get contrasting text color
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

const defaultColor = '#f59e0b';

export function DropzoneMarker({ selected, color = defaultColor, rotation = 0, scale = 1, onRotate }: DropzoneMarkerProps) {
  const borderColor = darkenColor(color);
  const textColor = getTextColor(color);
  const s = scale;

  // Base dimensions
  const width = 36 * s;
  const height = 24 * s;
  const cx = 18 * s;
  const cy = 12 * s;

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
      title={selected ? 'Scroll to rotate' : undefined}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ overflow: 'visible' }}>
        {/* Rotated group for dropzone shape */}
        <g transform={`rotate(${rotation} ${cx} ${cy})`}>
          {/* Rectangle background */}
          <rect
            x={2 * s}
            y={2 * s}
            width={32 * s}
            height={20 * s}
            rx={4 * s}
            fill={color}
            stroke={selected ? '#3b82f6' : borderColor}
            strokeWidth={selected ? 3 * s : 2 * s}
          />
          {/* Inner rectangle pattern */}
          <rect
            x={6 * s}
            y={6 * s}
            width={24 * s}
            height={12 * s}
            rx={2 * s}
            fill="none"
            stroke={borderColor}
            strokeWidth={1 * s}
            opacity="0.4"
          />
          {/* Direction indicator arrow */}
          <polygon
            points={`${30 * s},${12 * s} ${26 * s},${9 * s} ${26 * s},${15 * s}`}
            fill={textColor}
            opacity="0.6"
          />
        </g>
        {/* DZ text - not rotated, always readable */}
        <text
          x={cx}
          y={16 * s}
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize={10 * s}
          fill={textColor}
        >
          DZ
        </text>
      </svg>
    </div>
  );
}
