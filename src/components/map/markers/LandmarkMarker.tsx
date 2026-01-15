import { LANDMARK_DEFINITIONS } from '../../../types/landmarks';
import type { LandmarkType } from '../../../types/landmarks';

interface LandmarkMarkerProps {
  landmarkType: LandmarkType;
  selected?: boolean;
  size?: number;
  color?: string;
  mapBearing?: number;
}

// Helper to darken color
function darkenColor(hex: string, amount: number = 0.2): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Helper to lighten color
function lightenColor(hex: string, amount: number = 0.2): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export function LandmarkMarker({
  landmarkType,
  selected = false,
  size = 1,
  color,
  mapBearing = 0,
}: LandmarkMarkerProps) {
  const def = LANDMARK_DEFINITIONS[landmarkType];
  const baseSize = def.defaultSize;
  const actualColor = color || def.defaultColor;
  const s = size;

  // Counter-rotate against map bearing to stay fixed
  const counterRotation = -mapBearing;

  // Generate SVG based on landmark type
  const renderLandmarkSVG = () => {
    const viewBoxSize = baseSize * 1.5;
    const cx = viewBoxSize / 2;
    const cy = viewBoxSize / 2;

    const renderContent = () => {
      switch (landmarkType) {
        case 'parking':
          return (
            <g>
              <rect x={cx - 12 * s} y={cy - 12 * s} width={24 * s} height={24 * s} rx={4 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1.5 * s} />
              <text x={cx} y={cy + 6 * s} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize={18 * s} fill="white">P</text>
            </g>
          );

        case 'restroom':
          return (
            <g>
              <rect x={cx - 14 * s} y={cy - 12 * s} width={28 * s} height={24 * s} rx={3 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1.5 * s} />
              <circle cx={cx - 5 * s} cy={cy - 5 * s} r={3 * s} fill="white" />
              <rect x={cx - 7 * s} y={cy - 1 * s} width={4 * s} height={8 * s} rx={1 * s} fill="white" />
              <rect x={cx - 8 * s} y={cy + 7 * s} width={2.5 * s} height={5 * s} rx={1 * s} fill="white" />
              <rect x={cx - 4.5 * s} y={cy + 7 * s} width={2.5 * s} height={5 * s} rx={1 * s} fill="white" />
              <circle cx={cx + 5 * s} cy={cy - 5 * s} r={3 * s} fill="white" />
              <path d={`M ${cx + 2 * s} ${cy - 1 * s} L ${cx + 8 * s} ${cy - 1 * s} L ${cx + 9 * s} ${cy + 7 * s} L ${cx + 6.5 * s} ${cy + 7 * s} L ${cx + 6.5 * s} ${cy + 12 * s} L ${cx + 3.5 * s} ${cy + 12 * s} L ${cx + 3.5 * s} ${cy + 7 * s} L ${cx + 1 * s} ${cy + 7 * s} Z`} fill="white" />
            </g>
          );

        case 'bench': {
          const wood = '#a16207';
          const woodDark = '#78350f';
          return (
            <g>
              <rect x={cx - 14 * s} y={cy - 6 * s} width={28 * s} height={4 * s} rx={1 * s} fill={wood} stroke={woodDark} strokeWidth={0.5 * s} />
              <rect x={cx - 14 * s} y={cy - 1 * s} width={28 * s} height={4 * s} rx={1 * s} fill={wood} stroke={woodDark} strokeWidth={0.5 * s} />
              <rect x={cx - 10 * s} y={cy + 4 * s} width={3 * s} height={6 * s} rx={0.5 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx + 7 * s} y={cy + 4 * s} width={3 * s} height={6 * s} rx={0.5 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
            </g>
          );
        }

        case 'picnicTable': {
          const woodDark = darkenColor(actualColor);
          return (
            <g>
              <rect x={cx - 16 * s} y={cy - 4 * s} width={32 * s} height={8 * s} rx={1 * s} fill={actualColor} stroke={woodDark} strokeWidth={1 * s} />
              <rect x={cx - 14 * s} y={cy - 10 * s} width={28 * s} height={4 * s} rx={1 * s} fill={lightenColor(actualColor, 0.1)} stroke={woodDark} strokeWidth={0.5 * s} />
              <rect x={cx - 14 * s} y={cy + 6 * s} width={28 * s} height={4 * s} rx={1 * s} fill={lightenColor(actualColor, 0.1)} stroke={woodDark} strokeWidth={0.5 * s} />
              <line x1={cx - 8 * s} y1={cy - 10 * s} x2={cx - 10 * s} y2={cy + 12 * s} stroke={woodDark} strokeWidth={2 * s} />
              <line x1={cx + 8 * s} y1={cy - 10 * s} x2={cx + 10 * s} y2={cy + 12 * s} stroke={woodDark} strokeWidth={2 * s} />
            </g>
          );
        }

        case 'trashCan':
          return (
            <g>
              <path d={`M ${cx - 8 * s} ${cy - 6 * s} L ${cx - 10 * s} ${cy + 10 * s} L ${cx + 10 * s} ${cy + 10 * s} L ${cx + 8 * s} ${cy - 6 * s} Z`} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
              <ellipse cx={cx} cy={cy - 6 * s} rx={10 * s} ry={3 * s} fill={lightenColor(actualColor, 0.1)} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
              <path d={`M ${cx - 3 * s} ${cy - 9 * s} Q ${cx} ${cy - 14 * s} ${cx + 3 * s} ${cy - 9 * s}`} fill="none" stroke={darkenColor(actualColor)} strokeWidth={1.5 * s} />
            </g>
          );

        case 'waterFountain': {
          const metal = '#94a3b8';
          return (
            <g>
              <rect x={cx - 6 * s} y={cy + 2 * s} width={12 * s} height={10 * s} rx={1 * s} fill={metal} stroke={darkenColor(metal)} strokeWidth={1 * s} />
              <ellipse cx={cx} cy={cy - 2 * s} rx={10 * s} ry={5 * s} fill={lightenColor(metal, 0.1)} stroke={darkenColor(metal)} strokeWidth={1 * s} />
              <path d={`M ${cx - 2 * s} ${cy - 4 * s} Q ${cx + 2 * s} ${cy - 10 * s} ${cx + 6 * s} ${cy - 4 * s}`} fill="none" stroke={actualColor} strokeWidth={2 * s} strokeLinecap="round" />
              <circle cx={cx + 4 * s} cy={cy - 6 * s} r={1 * s} fill={actualColor} opacity={0.7} />
            </g>
          );
        }

        case 'tree': {
          const trunk = '#78350f';
          return (
            <g>
              <rect x={cx - 3 * s} y={cy + 2 * s} width={6 * s} height={10 * s} rx={1 * s} fill={trunk} stroke={darkenColor(trunk)} strokeWidth={0.5 * s} />
              <circle cx={cx} cy={cy - 8 * s} r={12 * s} fill={actualColor} />
              <circle cx={cx - 6 * s} cy={cy - 4 * s} r={8 * s} fill={darkenColor(actualColor, 0.1)} />
              <circle cx={cx + 6 * s} cy={cy - 4 * s} r={8 * s} fill={darkenColor(actualColor, 0.1)} />
              <circle cx={cx} cy={cy - 12 * s} r={8 * s} fill={lightenColor(actualColor, 0.1)} />
              <circle cx={cx - 4 * s} cy={cy - 12 * s} r={4 * s} fill={lightenColor(actualColor, 0.2)} opacity={0.5} />
            </g>
          );
        }

        case 'treeGroup': {
          const trunk = '#78350f';
          const color2 = lightenColor(actualColor, 0.15);
          const color3 = darkenColor(actualColor, 0.1);
          return (
            <g>
              <rect x={cx - 12 * s} y={cy} width={4 * s} height={8 * s} fill={trunk} />
              <circle cx={cx - 10 * s} cy={cy - 6 * s} r={10 * s} fill={color3} />
              <rect x={cx + 6 * s} y={cy + 2 * s} width={4 * s} height={8 * s} fill={trunk} />
              <circle cx={cx + 8 * s} cy={cy - 4 * s} r={9 * s} fill={color2} />
              <rect x={cx - 3 * s} y={cy + 4 * s} width={5 * s} height={10 * s} fill={trunk} stroke={darkenColor(trunk)} strokeWidth={0.5 * s} />
              <circle cx={cx} cy={cy - 6 * s} r={12 * s} fill={actualColor} />
            </g>
          );
        }

        case 'bush':
          return (
            <g>
              <ellipse cx={cx} cy={cy + 2 * s} rx={12 * s} ry={8 * s} fill={actualColor} />
              <ellipse cx={cx - 6 * s} cy={cy} rx={7 * s} ry={6 * s} fill={darkenColor(actualColor, 0.1)} />
              <ellipse cx={cx + 6 * s} cy={cy} rx={7 * s} ry={6 * s} fill={darkenColor(actualColor, 0.1)} />
              <ellipse cx={cx} cy={cy - 3 * s} rx={8 * s} ry={5 * s} fill={lightenColor(actualColor, 0.1)} />
              <circle cx={cx - 4 * s} cy={cy - 4 * s} r={2 * s} fill={lightenColor(actualColor, 0.2)} opacity={0.5} />
            </g>
          );

        case 'flower': {
          const center = '#fbbf24';
          return (
            <g>
              <ellipse cx={cx} cy={cy - 6 * s} rx={3 * s} ry={5 * s} fill={actualColor} />
              <ellipse cx={cx + 5 * s} cy={cy - 3 * s} rx={3 * s} ry={5 * s} fill={lightenColor(actualColor, 0.1)} transform={`rotate(72 ${cx + 5 * s} ${cy - 3 * s})`} />
              <ellipse cx={cx + 4 * s} cy={cy + 4 * s} rx={3 * s} ry={5 * s} fill={actualColor} transform={`rotate(144 ${cx + 4 * s} ${cy + 4 * s})`} />
              <ellipse cx={cx - 4 * s} cy={cy + 4 * s} rx={3 * s} ry={5 * s} fill={lightenColor(actualColor, 0.1)} transform={`rotate(-144 ${cx - 4 * s} ${cy + 4 * s})`} />
              <ellipse cx={cx - 5 * s} cy={cy - 3 * s} rx={3 * s} ry={5 * s} fill={actualColor} transform={`rotate(-72 ${cx - 5 * s} ${cy - 3 * s})`} />
              <circle cx={cx} cy={cy} r={4 * s} fill={center} stroke={darkenColor(center)} strokeWidth={0.5 * s} />
            </g>
          );
        }

        case 'rock':
          return (
            <g>
              <path d={`M ${cx - 10 * s} ${cy + 4 * s} L ${cx - 8 * s} ${cy - 4 * s} L ${cx - 2 * s} ${cy - 8 * s} L ${cx + 6 * s} ${cy - 6 * s} L ${cx + 10 * s} ${cy - 2 * s} L ${cx + 8 * s} ${cy + 6 * s} L ${cx} ${cy + 8 * s} Z`}
                    fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
              <path d={`M ${cx - 6 * s} ${cy - 2 * s} L ${cx - 2 * s} ${cy - 6 * s} L ${cx + 4 * s} ${cy - 4 * s} L ${cx + 2 * s} ${cy} Z`}
                    fill={lightenColor(actualColor, 0.15)} opacity={0.6} />
            </g>
          );

        case 'stump':
          return (
            <g>
              <ellipse cx={cx} cy={cy + 6 * s} rx={10 * s} ry={4 * s} fill={darkenColor(actualColor)} />
              <rect x={cx - 10 * s} y={cy - 2 * s} width={20 * s} height={8 * s} fill={actualColor} />
              <ellipse cx={cx} cy={cy - 2 * s} rx={10 * s} ry={4 * s} fill={lightenColor(actualColor, 0.2)} stroke={actualColor} strokeWidth={1 * s} />
              <ellipse cx={cx} cy={cy - 2 * s} rx={7 * s} ry={2.8 * s} fill="none" stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} opacity={0.5} />
              <ellipse cx={cx} cy={cy - 2 * s} rx={4 * s} ry={1.6 * s} fill="none" stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} opacity={0.5} />
            </g>
          );

        case 'infoSign':
          return (
            <g>
              <rect x={cx - 1.5 * s} y={cy} width={3 * s} height={12 * s} fill="#78716c" stroke={darkenColor('#78716c')} strokeWidth={0.5 * s} />
              <rect x={cx - 10 * s} y={cy - 12 * s} width={20 * s} height={14 * s} rx={2 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
              <circle cx={cx} cy={cy - 8 * s} r={2 * s} fill="white" />
              <rect x={cx - 1.5 * s} y={cy - 5 * s} width={3 * s} height={6 * s} rx={1 * s} fill="white" />
            </g>
          );

        case 'holeSign':
          return (
            <g>
              <rect x={cx - 1 * s} y={cy + 2 * s} width={2 * s} height={10 * s} fill="#78716c" />
              <rect x={cx - 8 * s} y={cy - 10 * s} width={16 * s} height={14 * s} rx={2 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
              <text x={cx} y={cy} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize={12 * s} fill="white">#</text>
            </g>
          );

        case 'directionSign':
          return (
            <g>
              <rect x={cx - 1.5 * s} y={cy - 2 * s} width={3 * s} height={14 * s} fill="#78716c" stroke={darkenColor('#78716c')} strokeWidth={0.5 * s} />
              <path d={`M ${cx - 12 * s} ${cy - 10 * s} L ${cx + 8 * s} ${cy - 10 * s} L ${cx + 14 * s} ${cy - 5 * s} L ${cx + 8 * s} ${cy} L ${cx - 12 * s} ${cy} Z`}
                    fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
            </g>
          );

        case 'warningSign':
          return (
            <g>
              <rect x={cx - 1 * s} y={cy + 2 * s} width={2 * s} height={10 * s} fill="#78716c" />
              <path d={`M ${cx} ${cy - 14 * s} L ${cx + 12 * s} ${cy + 4 * s} L ${cx - 12 * s} ${cy + 4 * s} Z`}
                    fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1.5 * s} />
              <rect x={cx - 1.5 * s} y={cy - 8 * s} width={3 * s} height={7 * s} rx={1 * s} fill="#1f2937" />
              <circle cx={cx} cy={cy + 1 * s} r={1.5 * s} fill="#1f2937" />
            </g>
          );

        case 'fence':
          return (
            <g>
              <rect x={cx - 3 * s} y={cy - 10 * s} width={6 * s} height={20 * s} rx={1 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx - 4 * s} y={cy - 12 * s} width={8 * s} height={3 * s} rx={1 * s} fill={lightenColor(actualColor, 0.1)} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
            </g>
          );

        case 'post':
          return (
            <g>
              <rect x={cx - 2 * s} y={cy - 12 * s} width={4 * s} height={24 * s} rx={2 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <circle cx={cx} cy={cy - 12 * s} r={3 * s} fill={lightenColor(actualColor, 0.1)} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
            </g>
          );

        case 'electricBox':
          return (
            <g>
              <rect x={cx - 8 * s} y={cy - 10 * s} width={16 * s} height={20 * s} rx={2 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
              <line x1={cx} y1={cy - 8 * s} x2={cx} y2={cy + 8 * s} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx - 5 * s} y={cy - 6 * s} width={10 * s} height={8 * s} fill="#fbbf24" rx={1 * s} />
              <path d={`M ${cx - 1 * s} ${cy - 5 * s} L ${cx + 2 * s} ${cy - 2 * s} L ${cx} ${cy - 1 * s} L ${cx + 2 * s} ${cy + 1 * s} L ${cx - 1 * s} ${cy - 2 * s} L ${cx + 1 * s} ${cy - 3 * s} Z`} fill="#1f2937" />
            </g>
          );

        case 'shelter': {
          const roof = '#78350f';
          return (
            <g>
              <path d={`M ${cx - 18 * s} ${cy - 4 * s} L ${cx} ${cy - 16 * s} L ${cx + 18 * s} ${cy - 4 * s} Z`}
                    fill={roof} stroke={darkenColor(roof)} strokeWidth={1 * s} />
              <rect x={cx - 14 * s} y={cy - 4 * s} width={4 * s} height={16 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx + 10 * s} y={cy - 4 * s} width={4 * s} height={16 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx - 16 * s} y={cy + 10 * s} width={32 * s} height={4 * s} fill="#78716c" opacity={0.5} />
            </g>
          );
        }

        case 'bridge': {
          const wood = '#a16207';
          return (
            <g>
              <rect x={cx - 16 * s} y={cy - 2 * s} width={32 * s} height={6 * s} rx={1 * s} fill={wood} stroke={darkenColor(wood)} strokeWidth={1 * s} />
              <rect x={cx - 16 * s} y={cy - 10 * s} width={2 * s} height={8 * s} fill={actualColor} />
              <rect x={cx + 14 * s} y={cy - 10 * s} width={2 * s} height={8 * s} fill={actualColor} />
              <rect x={cx - 16 * s} y={cy - 10 * s} width={32 * s} height={2 * s} rx={1 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
            </g>
          );
        }

        case 'stairs':
          return (
            <g>
              <rect x={cx - 10 * s} y={cy + 6 * s} width={20 * s} height={4 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx - 8 * s} y={cy + 2 * s} width={16 * s} height={4 * s} fill={lightenColor(actualColor, 0.05)} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx - 6 * s} y={cy - 2 * s} width={12 * s} height={4 * s} fill={lightenColor(actualColor, 0.1)} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
              <rect x={cx - 4 * s} y={cy - 6 * s} width={8 * s} height={4 * s} fill={lightenColor(actualColor, 0.15)} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} />
            </g>
          );

        case 'path':
          return (
            <g>
              <ellipse cx={cx - 3 * s} cy={cy - 4 * s} rx={3 * s} ry={5 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} transform={`rotate(-15 ${cx - 3 * s} ${cy - 4 * s})`} />
              <ellipse cx={cx + 3 * s} cy={cy + 4 * s} rx={3 * s} ry={5 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={0.5 * s} transform={`rotate(15 ${cx + 3 * s} ${cy + 4 * s})`} />
              <circle cx={cx - 5 * s} cy={cy - 9 * s} r={1 * s} fill={actualColor} />
              <circle cx={cx - 3 * s} cy={cy - 10 * s} r={1 * s} fill={actualColor} />
              <circle cx={cx - 1 * s} cy={cy - 9.5 * s} r={1 * s} fill={actualColor} />
              <circle cx={cx + 1 * s} cy={cy - 0.5 * s} r={1 * s} fill={actualColor} />
              <circle cx={cx + 3 * s} cy={cy - 1 * s} r={1 * s} fill={actualColor} />
              <circle cx={cx + 5 * s} cy={cy - 0.5 * s} r={1 * s} fill={actualColor} />
            </g>
          );

        default:
          return (
            <circle cx={cx} cy={cy} r={10 * s} fill={actualColor} stroke={darkenColor(actualColor)} strokeWidth={1 * s} />
          );
      }
    };

    return (
      <svg
        width={viewBoxSize * s}
        height={viewBoxSize * s}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ cursor: 'pointer' }}
      >
        {renderContent()}
        {selected && (
          <circle
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
            r={viewBoxSize / 2 - 2}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        )}
      </svg>
    );
  };

  return (
    <div
      className={`
        relative flex items-center justify-center
        transition-transform hover:scale-110
        ${selected ? 'z-10' : ''}
      `}
      style={{
        transform: `rotate(${counterRotation}deg)`,
      }}
      title={def.name}
    >
      {renderLandmarkSVG()}
    </div>
  );
}
