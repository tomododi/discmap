interface DropzoneMarkerProps {
  selected?: boolean;
}

export function DropzoneMarker({ selected }: DropzoneMarkerProps) {
  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {/* Outer circle */}
        <circle
          cx="14"
          cy="14"
          r="12"
          fill="#fbbf24"
          stroke={selected ? '#3b82f6' : '#b45309'}
          strokeWidth={selected ? 3 : 2}
        />
        {/* Inner circle */}
        <circle cx="14" cy="14" r="6" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
        {/* DZ text */}
        <text
          x="14"
          y="18"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="9"
          fill="#b45309"
        >
          DZ
        </text>
      </svg>
    </div>
  );
}
