import { useEffect, useRef } from 'react';
import type { TreeType } from '../../../types/trees';
import { TREE_PATTERNS, getTreeColors } from '../../../types/trees';

interface TreeMarkerProps {
  treeType: TreeType;
  size?: number;        // Scale multiplier (default 1)
  rotation?: number;    // Degrees (default 0)
  opacity?: number;     // 0-1 (default 1)
  selected?: boolean;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  mapBearing?: number;  // Current map bearing to counter-rotate
  onRotate?: (rotation: number) => void;
}

// Seeded random for consistent patterns
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function TreeMarker({
  treeType,
  size = 1,
  rotation = 0,
  opacity = 1,
  selected = false,
  customColors,
  mapBearing = 0,
  onRotate,
}: TreeMarkerProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const colors = getTreeColors(treeType, customColors);
  // Fallback to oak if tree type is unknown (e.g., removed palm)
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.oak;
  const baseSize = pattern.defaultSize * size;

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

  // Canvas dimensions with padding for selection ring
  const canvasSize = baseSize + 16;
  const center = canvasSize / 2;

  const renderTreeSVG = () => {
    switch (treeType) {
      case 'oak':
        return renderOak(center, center, baseSize, colors);
      case 'maple':
        return renderMaple(center, center, baseSize, colors);
      case 'pine':
        return renderPine(center, center, baseSize, colors);
      case 'spruce':
        return renderSpruce(center, center, baseSize, colors);
      case 'birch':
        return renderBirch(center, center, baseSize, colors);
      default:
        return renderOak(center, center, baseSize, colors);
    }
  };

  return (
    <div
      ref={markerRef}
      className={`
        cursor-pointer transition-transform hover:scale-110
        ${selected ? 'scale-125' : ''}
      `}
      style={{
        transform: `rotate(${effectiveRotation}deg)`,
      }}
    >
      <svg
        width={canvasSize}
        height={canvasSize}
        viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        style={{ opacity }}
      >
        {/* Selection ring */}
        {selected && (
          <circle
            cx={center}
            cy={center}
            r={baseSize / 2 + 4}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        )}

        {/* Tree crown */}
        {renderTreeSVG()}
      </svg>
    </div>
  );
}

// Render functions for each tree type (React SVG elements)

function renderOak(
  x: number,
  y: number,
  size: number,
  colors: { primary: string; secondary: string; accent: string }
) {
  const s = size;
  const random = seededRandom(12345);

  const basePositions = [
    { dx: 0, dy: 0, r: 0.4 },
    { dx: -0.25, dy: -0.15, r: 0.32 },
    { dx: 0.28, dy: -0.12, r: 0.3 },
    { dx: -0.18, dy: 0.22, r: 0.28 },
    { dx: 0.22, dy: 0.2, r: 0.26 },
    { dx: -0.1, dy: -0.28, r: 0.24 },
    { dx: 0.12, dy: 0.28, r: 0.22 },
  ];

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={x + 2} cy={y + 2} rx={s * 0.5} ry={s * 0.45} fill="#000" opacity={0.2} />

      {/* Crown circles */}
      {basePositions.map((pos, i) => {
        const jitter = (random() - 0.5) * 0.05;
        const cx = x + (pos.dx + jitter) * s;
        const cy = y + (pos.dy + jitter) * s;
        const r = pos.r * s;
        const color = i < 3 ? colors.primary : (i < 5 ? colors.secondary : colors.accent);
        return <circle key={i} cx={cx} cy={cy} r={r} fill={color} />;
      })}
    </g>
  );
}

function renderMaple(
  x: number,
  y: number,
  size: number,
  colors: { primary: string; secondary: string; accent: string }
) {
  const s = size;

  const lobes = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    const lobeCx = x + Math.cos(angle) * s * 0.32;
    const lobeCy = y + Math.sin(angle) * s * 0.32;
    lobes.push(<circle key={i} cx={lobeCx} cy={lobeCy} r={s * 0.18} fill={colors.accent} />);
  }

  return (
    <g>
      <ellipse cx={x + 2} cy={y + 2} rx={s * 0.45} ry={s * 0.42} fill="#000" opacity={0.2} />
      <circle cx={x} cy={y} r={s * 0.4} fill={colors.primary} />
      {lobes}
      <circle cx={x} cy={y} r={s * 0.25} fill={colors.secondary} opacity={0.5} />
    </g>
  );
}

function renderPine(
  x: number,
  y: number,
  size: number,
  colors: { primary: string; secondary: string; accent: string }
) {
  const s = size;

  const branches = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * Math.PI / 180;
    const tipX = x + Math.cos(angle) * s * 0.45;
    const tipY = y + Math.sin(angle) * s * 0.45;
    const leftAngle = angle - 0.4;
    const rightAngle = angle + 0.4;
    const baseX1 = x + Math.cos(leftAngle) * s * 0.15;
    const baseY1 = y + Math.sin(leftAngle) * s * 0.15;
    const baseX2 = x + Math.cos(rightAngle) * s * 0.15;
    const baseY2 = y + Math.sin(rightAngle) * s * 0.15;

    const color = i % 2 === 0 ? colors.primary : colors.secondary;
    branches.push(
      <polygon key={i} points={`${tipX},${tipY} ${baseX1},${baseY1} ${baseX2},${baseY2}`} fill={color} />
    );
  }

  return (
    <g>
      <ellipse cx={x + 2} cy={y + 2} rx={s * 0.4} ry={s * 0.38} fill="#000" opacity={0.2} />
      {branches}
      <circle cx={x} cy={y} r={s * 0.12} fill={colors.accent} />
    </g>
  );
}

function renderSpruce(
  x: number,
  y: number,
  size: number,
  colors: { primary: string; secondary: string; accent: string }
) {
  const s = size;

  const layers = [
    { r: 0.45, color: colors.primary },
    { r: 0.32, color: colors.secondary },
    { r: 0.18, color: colors.accent },
  ];

  const stars = layers.map((layer, idx) => {
    const points: string[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const r = i % 2 === 0 ? layer.r * s : layer.r * s * 0.5;
      points.push(`${x + Math.cos(angle) * r},${y + Math.sin(angle) * r}`);
    }
    return <polygon key={idx} points={points.join(' ')} fill={layer.color} />;
  });

  return (
    <g>
      <ellipse cx={x + 2} cy={y + 2} rx={s * 0.38} ry={s * 0.35} fill="#000" opacity={0.2} />
      {stars}
    </g>
  );
}

function renderBirch(
  x: number,
  y: number,
  size: number,
  colors: { primary: string; secondary: string; accent: string }
) {
  const s = size;
  const random = seededRandom(54321);

  const circles = [];
  for (let i = 0; i < 12; i++) {
    const angle = random() * Math.PI * 2;
    const dist = random() * s * 0.35 + s * 0.05;
    const cx = x + Math.cos(angle) * dist;
    const cy = y + Math.sin(angle) * dist;
    const r = s * (0.08 + random() * 0.06);

    const colorChoice = random();
    const color = colorChoice < 0.4 ? colors.primary : (colorChoice < 0.7 ? colors.accent : colors.secondary);
    circles.push(<circle key={i} cx={cx} cy={cy} r={r} fill={color} />);
  }

  return (
    <g>
      <ellipse cx={x + 1.5} cy={y + 1.5} rx={s * 0.35} ry={s * 0.32} fill="#000" opacity={0.15} />
      {circles}
    </g>
  );
}
