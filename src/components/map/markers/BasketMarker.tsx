interface BasketMarkerProps {
  selected?: boolean;
  holeNumber?: number;
}

export function BasketMarker({ selected, holeNumber }: BasketMarkerProps) {
  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
    >
      <svg width="32" height="44" viewBox="0 0 32 44" fill="none">
        {/* Pole */}
        <rect x="15" y="28" width="2" height="14" fill="#71717a" />
        {/* Base */}
        <ellipse cx="16" cy="42" rx="6" ry="2" fill="#71717a" />
        {/* Basket body */}
        <path
          d="M6 18 L26 18 L24 28 L8 28 Z"
          fill="#fbbf24"
          stroke={selected ? '#3b82f6' : '#b45309'}
          strokeWidth={selected ? 2.5 : 1.5}
        />
        {/* Chains */}
        <path
          d="M8 10 L8 18 M12 8 L12 18 M16 6 L16 18 M20 8 L20 18 M24 10 L24 18"
          stroke="#a1a1aa"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Top band (target) */}
        <ellipse
          cx="16"
          cy="6"
          rx="10"
          ry="3"
          fill="#ef4444"
          stroke={selected ? '#3b82f6' : '#b91c1c'}
          strokeWidth={selected ? 2.5 : 1.5}
        />
        {/* Inner ring */}
        <ellipse cx="16" cy="18" rx="8" ry="2" fill="none" stroke="#b45309" strokeWidth="1" />
        {/* Hole number in center */}
        {holeNumber && (
          <text
            x="16"
            y="9"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize="8"
            fill="#ffffff"
          >
            {holeNumber}
          </text>
        )}
      </svg>
    </div>
  );
}
