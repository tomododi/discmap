interface MandatoryMarkerProps {
  direction: 'left' | 'right';
  selected?: boolean;
}

export function MandatoryMarker({ direction, selected }: MandatoryMarkerProps) {
  const isLeft = direction === 'left';

  return (
    <div
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        {/* Circle background */}
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="#8b5cf6"
          stroke={selected ? '#3b82f6' : '#6d28d9'}
          strokeWidth={selected ? 3 : 2}
        />
        {/* Arrow */}
        <path
          d={
            isLeft
              ? 'M20 16 L10 16 L10 12 L4 16 L10 20 L10 16'
              : 'M12 16 L22 16 L22 12 L28 16 L22 20 L22 16'
          }
          fill="#ffffff"
          stroke="#6d28d9"
          strokeWidth="1"
        />
      </svg>
      {/* Label */}
      <div className="text-[7px] font-bold text-center -mt-0.5 text-purple-800">
        MANDO
      </div>
    </div>
  );
}
