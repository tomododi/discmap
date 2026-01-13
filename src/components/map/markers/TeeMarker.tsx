import type { TeePosition } from '../../../types/course';

interface TeeMarkerProps {
  position: TeePosition;
  selected?: boolean;
  holeNumber?: number;
}

const positionColors: Record<TeePosition, { bg: string; border: string; text: string }> = {
  pro: { bg: '#dc2626', border: '#991b1b', text: '#ffffff' },
  amateur: { bg: '#f59e0b', border: '#b45309', text: '#000000' },
  recreational: { bg: '#22c55e', border: '#166534', text: '#ffffff' },
};

export function TeeMarker({ position, selected, holeNumber }: TeeMarkerProps) {
  const colors = positionColors[position];

  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
    >
      <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
        {/* Tee pad shape */}
        <rect
          x="2"
          y="4"
          width="32"
          height="20"
          rx="3"
          fill={colors.bg}
          stroke={selected ? '#3b82f6' : colors.border}
          strokeWidth={selected ? 3 : 2}
        />
        {/* Inner texture */}
        <rect x="6" y="8" width="24" height="12" rx="2" fill={colors.border} opacity="0.2" />
        {/* Hole number */}
        {holeNumber && (
          <text
            x="18"
            y="18"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize="12"
            fill={colors.text}
          >
            {holeNumber}
          </text>
        )}
      </svg>
      {/* Position label */}
      <div
        className="text-[8px] font-bold text-center -mt-1 uppercase"
        style={{ color: colors.border }}
      >
        {position.slice(0, 3)}
      </div>
    </div>
  );
}
