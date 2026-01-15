interface BasketColors {
  top: string;
  body: string;
  chains: string;
  pole: string;
}

interface BasketMarkerProps {
  selected?: boolean;
  holeNumber?: number;
  colors?: BasketColors;
  highlighted?: boolean;
  scale?: number;
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

const defaultColors: BasketColors = {
  top: '#ef4444',
  body: '#fbbf24',
  chains: '#a1a1aa',
  pole: '#71717a',
};

export function BasketMarker({ selected, holeNumber, colors, highlighted, scale = 1 }: BasketMarkerProps) {
  // Merge with defaults to handle missing properties
  const mergedColors = {
    top: colors?.top || defaultColors.top,
    body: colors?.body || defaultColors.body,
    chains: colors?.chains || defaultColors.chains,
    pole: colors?.pole || defaultColors.pole,
  };
  const topBorder = darkenColor(mergedColors.top);
  const bodyBorder = darkenColor(mergedColors.body);
  const isHighlighted = selected || highlighted;
  const s = scale;

  // Base dimensions
  const width = 32 * s;
  const height = 44 * s;
  const cx = 16 * s;

  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
        ${highlighted && !selected ? 'animate-pulse scale-110' : ''}
      `}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        {/* Pole */}
        <rect x={15 * s} y={28 * s} width={2 * s} height={14 * s} fill={mergedColors.pole} />
        {/* Base */}
        <ellipse cx={cx} cy={42 * s} rx={6 * s} ry={2 * s} fill={mergedColors.pole} />
        {/* Basket body */}
        <path
          d={`M${6 * s} ${18 * s} L${26 * s} ${18 * s} L${24 * s} ${28 * s} L${8 * s} ${28 * s} Z`}
          fill={mergedColors.body}
          stroke={isHighlighted ? '#3b82f6' : bodyBorder}
          strokeWidth={isHighlighted ? 2.5 * s : 1.5 * s}
        />
        {/* Chains */}
        <path
          d={`M${8 * s} ${10 * s} L${8 * s} ${18 * s} M${12 * s} ${8 * s} L${12 * s} ${18 * s} M${16 * s} ${6 * s} L${16 * s} ${18 * s} M${20 * s} ${8 * s} L${20 * s} ${18 * s} M${24 * s} ${10 * s} L${24 * s} ${18 * s}`}
          stroke={mergedColors.chains}
          strokeWidth={1.5 * s}
          strokeLinecap="round"
        />
        {/* Top band (target) */}
        <ellipse
          cx={cx}
          cy={6 * s}
          rx={10 * s}
          ry={3 * s}
          fill={mergedColors.top}
          stroke={isHighlighted ? '#3b82f6' : topBorder}
          strokeWidth={isHighlighted ? 2.5 * s : 1.5 * s}
        />
        {/* Inner ring */}
        <ellipse cx={cx} cy={18 * s} rx={8 * s} ry={2 * s} fill="none" stroke={bodyBorder} strokeWidth={1 * s} />
        {/* Hole number in center */}
        {holeNumber && (
          <text
            x={cx}
            y={9 * s}
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize={8 * s}
            fill="#ffffff"
          >
            {holeNumber}
          </text>
        )}
      </svg>
    </div>
  );
}
