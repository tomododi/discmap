import { useRef, useCallback, useState } from 'react';

interface RotationKnobProps {
  value: number; // Current angle 0-359
  onChange: (value: number) => void;
  size?: number; // Knob size in pixels
  color?: string; // Accent color
  label?: string; // Optional label
}

export function RotationKnob({
  value,
  onChange,
  size = 80,
  color = '#8b5cf6',
  label,
}: RotationKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!knobRef.current) return value;

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Calculate angle from center (0 = right, going clockwise)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Convert to 0-359 range
    angle = (angle + 360) % 360;

    // Snap to 5-degree increments
    angle = Math.round(angle / 5) * 5;
    angle = angle % 360;

    return angle;
  }, [value]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newAngle = calculateAngle(e.clientX, e.clientY);
    onChange(newAngle);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newAngle = calculateAngle(moveEvent.clientX, moveEvent.clientY);
      onChange(newAngle);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [calculateAngle, onChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    const newAngle = calculateAngle(touch.clientX, touch.clientY);
    onChange(newAngle);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0];
      const newAngle = calculateAngle(touch.clientX, touch.clientY);
      onChange(newAngle);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [calculateAngle, onChange]);

  // Calculate indicator position on the circle edge
  const indicatorAngle = (value * Math.PI) / 180;
  const indicatorRadius = (size / 2) - 8;
  const indicatorX = Math.cos(indicatorAngle) * indicatorRadius;
  const indicatorY = Math.sin(indicatorAngle) * indicatorRadius;

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs text-gray-500">{label}</span>
      )}
      <div
        ref={knobRef}
        className={`
          relative rounded-full cursor-pointer select-none
          transition-shadow
          ${isDragging ? 'shadow-lg' : 'shadow-md hover:shadow-lg'}
        `}
        style={{
          width: size,
          height: size,
          backgroundColor: '#f3f4f6',
          border: `3px solid ${isDragging ? color : '#d1d5db'}`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Direction markers */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Right arrow (0°) */}
          <span className="absolute text-[10px] text-gray-400" style={{ right: 4, top: '50%', transform: 'translateY(-50%)' }}>→</span>
          {/* Down arrow (90°) */}
          <span className="absolute text-[10px] text-gray-400" style={{ bottom: 2, left: '50%', transform: 'translateX(-50%)' }}>↓</span>
          {/* Left arrow (180°) */}
          <span className="absolute text-[10px] text-gray-400" style={{ left: 4, top: '50%', transform: 'translateY(-50%)' }}>←</span>
          {/* Up arrow (270°) */}
          <span className="absolute text-[10px] text-gray-400" style={{ top: 2, left: '50%', transform: 'translateX(-50%)' }}>↑</span>
        </div>

        {/* Center value display */}
        <div
          className="absolute inset-0 flex items-center justify-center font-bold text-sm"
          style={{ color }}
        >
          {value}°
        </div>

        {/* Rotating indicator dot */}
        <div
          className="absolute rounded-full transition-transform"
          style={{
            width: 12,
            height: 12,
            backgroundColor: color,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${indicatorX}px), calc(-50% + ${indicatorY}px))`,
          }}
        />
      </div>
    </div>
  );
}
