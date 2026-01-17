// Tree SVG Generators - Top-down view crown patterns
import type { TreeType } from '../types/trees';
import { TREE_PATTERNS, getTreeColors } from '../types/trees';

interface TreeColors {
  primary: string;
  secondary: string;
  accent: string;
}

// Seeded random number generator for consistent patterns
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Generate Oak tree crown (large irregular blob with overlapping circles)
function generateOakSVG(
  x: number,
  y: number,
  size: number,
  rotation: number,
  colors: TreeColors,
  opacity: number,
  scale: number
): string {
  const s = size * scale;
  const random = seededRandom(Math.round(x * 1000 + y * 1000));

  // Shadow ellipse
  const shadow = `<ellipse cx="${x + 2 * scale}" cy="${y + 2 * scale}" rx="${s * 0.5}" ry="${s * 0.45}" fill="#000" opacity="0.2"/>`;

  // Main crown - 7 overlapping circles
  const circles: string[] = [];
  const basePositions = [
    { dx: 0, dy: 0, r: 0.4 },
    { dx: -0.25, dy: -0.15, r: 0.32 },
    { dx: 0.28, dy: -0.12, r: 0.3 },
    { dx: -0.18, dy: 0.22, r: 0.28 },
    { dx: 0.22, dy: 0.2, r: 0.26 },
    { dx: -0.1, dy: -0.28, r: 0.24 },
    { dx: 0.12, dy: 0.28, r: 0.22 },
  ];

  basePositions.forEach((pos, i) => {
    const jitter = (random() - 0.5) * 0.05;
    const cx = x + (pos.dx + jitter) * s;
    const cy = y + (pos.dy + jitter) * s;
    const r = pos.r * s;
    const color = i < 3 ? colors.primary : (i < 5 ? colors.secondary : colors.accent);
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`);
  });

  return `<g transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}">
    ${shadow}
    ${circles.join('\n    ')}
  </g>`;
}

// Generate Maple tree crown (round with 5 lobe accents)
function generateMapleSVG(
  x: number,
  y: number,
  size: number,
  rotation: number,
  colors: TreeColors,
  opacity: number,
  scale: number
): string {
  const s = size * scale;

  // Shadow
  const shadow = `<ellipse cx="${x + 2 * scale}" cy="${y + 2 * scale}" rx="${s * 0.45}" ry="${s * 0.42}" fill="#000" opacity="0.2"/>`;

  // Main crown circle
  const mainCrown = `<circle cx="${x}" cy="${y}" r="${s * 0.4}" fill="${colors.primary}"/>`;

  // 5 lobe accents around edge
  const lobes: string[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    const lobeCx = x + Math.cos(angle) * s * 0.32;
    const lobeCy = y + Math.sin(angle) * s * 0.32;
    lobes.push(`<circle cx="${lobeCx}" cy="${lobeCy}" r="${s * 0.18}" fill="${colors.accent}"/>`);
  }

  // Inner shadow detail
  const innerDetail = `<circle cx="${x}" cy="${y}" r="${s * 0.25}" fill="${colors.secondary}" opacity="0.5"/>`;

  return `<g transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}">
    ${shadow}
    ${mainCrown}
    ${lobes.join('\n    ')}
    ${innerDetail}
  </g>`;
}

// Generate Pine tree crown (8-pointed star pattern)
function generatePineSVG(
  x: number,
  y: number,
  size: number,
  rotation: number,
  colors: TreeColors,
  opacity: number,
  scale: number
): string {
  const s = size * scale;

  // Shadow
  const shadow = `<ellipse cx="${x + 2 * scale}" cy="${y + 2 * scale}" rx="${s * 0.4}" ry="${s * 0.38}" fill="#000" opacity="0.2"/>`;

  // Create 8-pointed star with triangular branches
  const branches: string[] = [];
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
    branches.push(`<polygon points="${tipX},${tipY} ${baseX1},${baseY1} ${baseX2},${baseY2}" fill="${color}"/>`);
  }

  // Center circle
  const center = `<circle cx="${x}" cy="${y}" r="${s * 0.12}" fill="${colors.accent}"/>`;

  return `<g transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}">
    ${shadow}
    ${branches.join('\n    ')}
    ${center}
  </g>`;
}

// Generate Spruce tree crown (concentric 6-pointed star layers)
function generateSpruceSVG(
  x: number,
  y: number,
  size: number,
  rotation: number,
  colors: TreeColors,
  opacity: number,
  scale: number
): string {
  const s = size * scale;

  // Shadow
  const shadow = `<ellipse cx="${x + 2 * scale}" cy="${y + 2 * scale}" rx="${s * 0.38}" ry="${s * 0.35}" fill="#000" opacity="0.2"/>`;

  // Create 3 concentric 6-pointed stars
  const stars: string[] = [];
  const layers = [
    { r: 0.45, color: colors.primary },
    { r: 0.32, color: colors.secondary },
    { r: 0.18, color: colors.accent },
  ];

  layers.forEach(layer => {
    const points: string[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const r = i % 2 === 0 ? layer.r * s : layer.r * s * 0.5;
      points.push(`${x + Math.cos(angle) * r},${y + Math.sin(angle) * r}`);
    }
    stars.push(`<polygon points="${points.join(' ')}" fill="${layer.color}"/>`);
  });

  return `<g transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}">
    ${shadow}
    ${stars.join('\n    ')}
  </g>`;
}

// Generate Birch tree crown (12 small scattered circles for airy crown)
function generateBirchSVG(
  x: number,
  y: number,
  size: number,
  rotation: number,
  colors: TreeColors,
  opacity: number,
  scale: number
): string {
  const s = size * scale;
  const random = seededRandom(Math.round(x * 1000 + y * 1000));

  // Shadow
  const shadow = `<ellipse cx="${x + 1.5 * scale}" cy="${y + 1.5 * scale}" rx="${s * 0.35}" ry="${s * 0.32}" fill="#000" opacity="0.15"/>`;

  // Create 12 small scattered circles
  const circles: string[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = random() * Math.PI * 2;
    const dist = random() * s * 0.35 + s * 0.05;
    const cx = x + Math.cos(angle) * dist;
    const cy = y + Math.sin(angle) * dist;
    const r = s * (0.08 + random() * 0.06);

    const colorChoice = random();
    const color = colorChoice < 0.4 ? colors.primary : (colorChoice < 0.7 ? colors.accent : colors.secondary);
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`);
  }

  return `<g transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}">
    ${shadow}
    ${circles.join('\n    ')}
  </g>`;
}

// Main function to generate tree SVG
export function generateTreeSVG(
  x: number,
  y: number,
  treeType: TreeType,
  size: number,
  rotation: number,
  customColors?: { primary?: string; secondary?: string; accent?: string },
  opacity: number = 1,
  scale: number = 1
): string {
  const colors = getTreeColors(treeType, customColors);
  // Fallback to oak if tree type is unknown
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.oak;
  const baseSize = pattern.defaultSize * size;

  switch (treeType) {
    case 'oak':
      return generateOakSVG(x, y, baseSize, rotation, colors, opacity, scale);
    case 'maple':
      return generateMapleSVG(x, y, baseSize, rotation, colors, opacity, scale);
    case 'pine':
      return generatePineSVG(x, y, baseSize, rotation, colors, opacity, scale);
    case 'spruce':
      return generateSpruceSVG(x, y, baseSize, rotation, colors, opacity, scale);
    case 'birch':
      return generateBirchSVG(x, y, baseSize, rotation, colors, opacity, scale);
    default:
      return generateOakSVG(x, y, baseSize, rotation, colors, opacity, scale);
  }
}

// Generate legend icon for tree type
export function generateTreeLegendIcon(
  treeType: TreeType,
  size: number = 24
): string {
  const colors = getTreeColors(treeType);
  return generateTreeSVG(size / 2, size / 2, treeType, 0.5, 0, colors, 1, 1);
}
