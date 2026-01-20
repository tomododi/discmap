import { useEffect, useRef } from 'react';
import type { TreeType } from '../../../types/trees';
import { TREE_PATTERNS, getTreeImagePath } from '../../../types/trees';

interface TreeMarkerProps {
  treeType: TreeType;
  size?: number;        // Scale multiplier (default 1)
  rotation?: number;    // Degrees (default 0)
  opacity?: number;     // 0-1 (default 1)
  selected?: boolean;
  mapBearing?: number;  // Current map bearing to counter-rotate
  onRotate?: (rotation: number) => void;
}

export function TreeMarker({
  treeType,
  size = 1,
  rotation = 0,
  opacity = 1,
  selected = false,
  mapBearing = 0,
  onRotate,
}: TreeMarkerProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.tree1;
  const baseSize = pattern.defaultSize * size;
  const imagePath = getTreeImagePath(treeType);

  // Counter-rotate against map bearing, then apply feature rotation
  const effectiveRotation = rotation - mapBearing;

  // Handle scroll wheel rotation when selected
  useEffect(() => {
    if (!selected || !onRotate || !markerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 15 : -15;
      const newRotation = ((rotation + delta) % 360 + 360) % 360;
      onRotate(newRotation);
    };

    const element = markerRef.current;
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [selected, rotation, onRotate]);

  // Calculate dimensions maintaining aspect ratio
  const width = baseSize * pattern.aspectRatio;
  const height = baseSize;

  // Canvas dimensions with padding for selection ring
  const canvasWidth = width + 16;
  const canvasHeight = height + 16;

  return (
    <div
      ref={markerRef}
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
      style={{
        transform: `rotate(${effectiveRotation}deg)`,
        width: canvasWidth,
        height: canvasHeight,
        position: 'relative',
      }}
    >
      {/* Selection ring */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: Math.max(width, height) + 8,
            height: Math.max(width, height) + 8,
            borderRadius: '50%',
            border: '2px dashed #3b82f6',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tree image */}
      <img
        src={imagePath}
        alt={pattern.name}
        draggable={false}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: width,
          height: height,
          opacity: opacity,
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
