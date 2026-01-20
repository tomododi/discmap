// Side-view tree SVG generators for tee sign perimeter decoration
// Creates organic, silhouette-style trees viewed from the side

import type { TreeType } from '../types/trees';
import { getTreeColors } from '../types/trees';

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

// Generate Oak tree - broad rounded crown, thick trunk
function generateOakSideViewSVG(
  x: number,
  y: number,
  height: number,
  colors: TreeColors,
  opacity: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const crownHeight = height * 0.75;
  const trunkHeight = height * 0.3;
  const crownWidth = height * 0.9;
  const trunkWidth = height * 0.12;

  // Crown base Y (bottom of crown)
  const crownBaseY = y - trunkHeight + crownHeight * 0.1;

  // Ground shadow
  const shadow = `<ellipse cx="${x}" cy="${y + 2}" rx="${crownWidth * 0.4}" ry="${height * 0.05}" fill="#000" opacity="0.12"/>`;

  // Trunk (tapered)
  const trunkTop = y - trunkHeight;
  const trunk = `<path d="M${x - trunkWidth * 0.4} ${y}
    Q${x - trunkWidth * 0.35} ${y - trunkHeight * 0.5} ${x - trunkWidth * 0.2} ${trunkTop}
    L${x + trunkWidth * 0.2} ${trunkTop}
    Q${x + trunkWidth * 0.35} ${y - trunkHeight * 0.5} ${x + trunkWidth * 0.4} ${y}
    Z" fill="#5D4037"/>`;

  // Crown - multiple overlapping circles for organic shape
  const crownCircles: string[] = [];
  const circleCount = 7 + Math.floor(random() * 3);

  for (let i = 0; i < circleCount; i++) {
    const angle = (i / circleCount) * Math.PI * 2 + random() * 0.4;
    const dist = crownWidth * 0.2 * random();
    const cx = x + Math.cos(angle) * dist;
    const cy = crownBaseY - crownHeight * 0.5 + Math.sin(angle) * dist * 0.6;
    const r = crownWidth * (0.25 + random() * 0.2);

    const colorChoice = random();
    const color = colorChoice < 0.4 ? colors.primary :
                  colorChoice < 0.7 ? colors.secondary : colors.accent;

    crownCircles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`);
  }

  // Inner shadow for depth
  const innerShadow = `<circle cx="${x + crownWidth * 0.05}" cy="${crownBaseY - crownHeight * 0.4}" r="${crownWidth * 0.35}" fill="${colors.secondary}" opacity="0.4"/>`;

  return `<g opacity="${opacity}">
    ${shadow}
    ${trunk}
    ${crownCircles.join('\n    ')}
    ${innerShadow}
  </g>`;
}

// Generate Maple tree - round crown, medium trunk
function generateMapleSideViewSVG(
  x: number,
  y: number,
  height: number,
  colors: TreeColors,
  opacity: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const crownHeight = height * 0.7;
  const trunkHeight = height * 0.35;
  const crownWidth = height * 0.7;
  const trunkWidth = height * 0.1;

  const crownBaseY = y - trunkHeight + crownHeight * 0.1;

  // Ground shadow
  const shadow = `<ellipse cx="${x}" cy="${y + 2}" rx="${crownWidth * 0.35}" ry="${height * 0.04}" fill="#000" opacity="0.12"/>`;

  // Trunk
  const trunkTop = y - trunkHeight;
  const trunk = `<path d="M${x - trunkWidth * 0.4} ${y}
    Q${x - trunkWidth * 0.3} ${y - trunkHeight * 0.5} ${x - trunkWidth * 0.15} ${trunkTop}
    L${x + trunkWidth * 0.15} ${trunkTop}
    Q${x + trunkWidth * 0.3} ${y - trunkHeight * 0.5} ${x + trunkWidth * 0.4} ${y}
    Z" fill="#5D4037"/>`;

  // Main crown circle
  const mainCrown = `<circle cx="${x}" cy="${crownBaseY - crownHeight * 0.45}" r="${crownWidth * 0.45}" fill="${colors.primary}"/>`;

  // 5 lobe accents
  const lobes: string[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180 + (random() - 0.5) * 0.2;
    const lobeCx = x + Math.cos(angle) * crownWidth * 0.35;
    const lobeCy = crownBaseY - crownHeight * 0.45 + Math.sin(angle) * crownHeight * 0.35;
    const lobeR = crownWidth * (0.15 + random() * 0.08);
    lobes.push(`<circle cx="${lobeCx}" cy="${lobeCy}" r="${lobeR}" fill="${colors.accent}"/>`);
  }

  // Inner shadow
  const innerShadow = `<circle cx="${x}" cy="${crownBaseY - crownHeight * 0.4}" r="${crownWidth * 0.28}" fill="${colors.secondary}" opacity="0.5"/>`;

  return `<g opacity="${opacity}">
    ${shadow}
    ${trunk}
    ${mainCrown}
    ${lobes.join('\n    ')}
    ${innerShadow}
  </g>`;
}

// Generate Pine tree - triangular conical crown, straight trunk
function generatePineSideViewSVG(
  x: number,
  y: number,
  height: number,
  colors: TreeColors,
  opacity: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const crownHeight = height * 0.8;
  const trunkHeight = height * 0.25;
  const crownWidth = height * 0.5;
  const trunkWidth = height * 0.08;

  // Ground shadow
  const shadow = `<ellipse cx="${x}" cy="${y + 2}" rx="${crownWidth * 0.35}" ry="${height * 0.04}" fill="#000" opacity="0.12"/>`;

  // Trunk
  const trunkTop = y - trunkHeight;
  const trunk = `<rect x="${x - trunkWidth / 2}" y="${trunkTop}" width="${trunkWidth}" height="${trunkHeight}" fill="#3E2723"/>`;

  // Layered triangle crown (3-4 layers)
  const layers: string[] = [];
  const layerCount = 3 + Math.floor(random() * 2);

  for (let i = 0; i < layerCount; i++) {
    const layerRatio = i / layerCount;
    const layerTopY = y - trunkHeight - crownHeight * (1 - layerRatio * 0.15);
    const layerBottomY = y - trunkHeight - crownHeight * layerRatio * 0.6;
    const layerWidth = crownWidth * (0.3 + (1 - layerRatio) * 0.7);

    const color = i % 2 === 0 ? colors.primary : colors.secondary;
    const jitter = (random() - 0.5) * crownWidth * 0.05;

    layers.push(`<polygon points="${x + jitter},${layerTopY} ${x - layerWidth / 2 + jitter},${layerBottomY} ${x + layerWidth / 2 + jitter},${layerBottomY}" fill="${color}"/>`);
  }

  return `<g opacity="${opacity}">
    ${shadow}
    ${trunk}
    ${layers.join('\n    ')}
  </g>`;
}

// Generate Spruce tree - narrow conical crown, thin trunk
function generateSpruceSideViewSVG(
  x: number,
  y: number,
  height: number,
  colors: TreeColors,
  opacity: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const crownHeight = height * 0.85;
  const trunkHeight = height * 0.2;
  const crownWidth = height * 0.35;
  const trunkWidth = height * 0.06;

  // Ground shadow
  const shadow = `<ellipse cx="${x}" cy="${y + 2}" rx="${crownWidth * 0.4}" ry="${height * 0.035}" fill="#000" opacity="0.12"/>`;

  // Trunk
  const trunkTop = y - trunkHeight;
  const trunk = `<rect x="${x - trunkWidth / 2}" y="${trunkTop}" width="${trunkWidth}" height="${trunkHeight}" fill="#3E2723"/>`;

  // Narrow triangular crown with drooping branches effect
  const crownTop = y - trunkHeight - crownHeight;
  const crownBottom = y - trunkHeight + crownHeight * 0.05;

  // Main silhouette
  const mainCrown = `<polygon points="${x},${crownTop} ${x - crownWidth / 2},${crownBottom} ${x + crownWidth / 2},${crownBottom}" fill="${colors.primary}"/>`;

  // Secondary darker layer
  const innerWidth = crownWidth * 0.7;
  const innerTop = crownTop + crownHeight * 0.1;
  const innerCrown = `<polygon points="${x},${innerTop} ${x - innerWidth / 2},${crownBottom} ${x + innerWidth / 2},${crownBottom}" fill="${colors.secondary}" opacity="0.6"/>`;

  // Branch texture lines
  const branches: string[] = [];
  const branchCount = 4 + Math.floor(random() * 3);
  for (let i = 0; i < branchCount; i++) {
    const by = crownTop + (crownHeight * 0.9) * ((i + 1) / (branchCount + 1));
    const bWidth = crownWidth * 0.3 * (1 - (i / branchCount) * 0.3);
    const side = random() > 0.5 ? 1 : -1;
    branches.push(`<line x1="${x}" y1="${by}" x2="${x + side * bWidth}" y2="${by + 3}" stroke="${colors.accent}" stroke-width="1.5" opacity="0.6"/>`);
  }

  return `<g opacity="${opacity}">
    ${shadow}
    ${trunk}
    ${mainCrown}
    ${innerCrown}
    ${branches.join('\n    ')}
  </g>`;
}

// Generate Birch tree - irregular airy crown, thin light trunk
function generateBirchSideViewSVG(
  x: number,
  y: number,
  height: number,
  colors: TreeColors,
  opacity: number,
  seed: number
): string {
  const random = seededRandom(seed);
  const crownHeight = height * 0.65;
  const trunkHeight = height * 0.4;
  const crownWidth = height * 0.5;
  const trunkWidth = height * 0.06;

  const crownBaseY = y - trunkHeight + crownHeight * 0.15;

  // Ground shadow
  const shadow = `<ellipse cx="${x}" cy="${y + 2}" rx="${crownWidth * 0.3}" ry="${height * 0.035}" fill="#000" opacity="0.1"/>`;

  // Birch trunk - light colored with dark marks
  const trunkTop = y - trunkHeight;
  const trunk = `<path d="M${x - trunkWidth * 0.35} ${y}
    Q${x - trunkWidth * 0.3} ${y - trunkHeight * 0.5} ${x - trunkWidth * 0.2} ${trunkTop}
    L${x + trunkWidth * 0.2} ${trunkTop}
    Q${x + trunkWidth * 0.3} ${y - trunkHeight * 0.5} ${x + trunkWidth * 0.35} ${y}
    Z" fill="#E8E4E1"/>`;

  // Trunk bark marks
  const barkMarks: string[] = [];
  for (let i = 0; i < 4; i++) {
    const markY = y - trunkHeight * (0.2 + i * 0.2) + random() * 5;
    const markWidth = trunkWidth * (0.3 + random() * 0.3);
    barkMarks.push(`<ellipse cx="${x}" cy="${markY}" rx="${markWidth}" ry="1.5" fill="#4A4A4A" opacity="0.5"/>`);
  }

  // Airy crown - scattered small circles
  const crownCircles: string[] = [];
  const circleCount = 10 + Math.floor(random() * 5);

  for (let i = 0; i < circleCount; i++) {
    const angle = random() * Math.PI * 2;
    const dist = crownWidth * 0.35 * random();
    const cx = x + Math.cos(angle) * dist;
    const cy = crownBaseY - crownHeight * 0.5 + Math.sin(angle) * dist * 0.7 + (random() - 0.5) * crownHeight * 0.3;
    const r = crownWidth * (0.08 + random() * 0.1);

    const colorChoice = random();
    const color = colorChoice < 0.4 ? colors.primary :
                  colorChoice < 0.7 ? colors.accent : colors.secondary;

    crownCircles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`);
  }

  return `<g opacity="${opacity}">
    ${shadow}
    ${trunk}
    ${barkMarks.join('\n    ')}
    ${crownCircles.join('\n    ')}
  </g>`;
}

// Main function to generate side-view tree SVG
export function generateSideViewTreeSVG(
  x: number,
  y: number,
  treeType: TreeType,
  height: number,
  opacity: number = 1,
  seed?: number,
  counterRotation: number = 0
): string {
  const colors = getTreeColors(treeType);
  const actualSeed = seed ?? Math.round(x * 1000 + y * 1000);

  let treeSvg: string;
  switch (treeType) {
    case 'oak':
      treeSvg = generateOakSideViewSVG(x, y, height, colors, opacity, actualSeed);
      break;
    case 'maple':
      treeSvg = generateMapleSideViewSVG(x, y, height, colors, opacity, actualSeed);
      break;
    case 'pine':
      treeSvg = generatePineSideViewSVG(x, y, height, colors, opacity, actualSeed);
      break;
    case 'spruce':
      treeSvg = generateSpruceSideViewSVG(x, y, height, colors, opacity, actualSeed);
      break;
    case 'birch':
      treeSvg = generateBirchSideViewSVG(x, y, height, colors, opacity, actualSeed);
      break;
    default:
      treeSvg = generateOakSideViewSVG(x, y, height, colors, opacity, actualSeed);
  }

  // Apply counter-rotation so trees always appear upright
  if (counterRotation !== 0) {
    return `<g transform="rotate(${counterRotation} ${x} ${y})">${treeSvg}</g>`;
  }
  return treeSvg;
}

// Tree placement info for forest generation
export interface TreePlacement {
  x: number;
  y: number;
  treeType: TreeType;
  height: number;
  opacity: number;
  seed: number;
}

// Check if a point is inside a polygon using ray casting algorithm
function pointInPolygon(x: number, y: number, polygon: Array<[number, number]>): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// Get bounding box of a polygon
function getPolygonBounds(polygon: Array<[number, number]>): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, maxX, minY, maxY };
}

// Generate tree placements to fill a polygon area (forest)
export function generateForestTreePlacements(
  polygon: Array<[number, number]>,
  options?: {
    density?: number;      // Trees per 10000 sq pixels, default 15
    sizeRange?: [number, number];  // Min/max tree height, default [35, 55]
    seed?: number;         // Random seed for consistency
  }
): TreePlacement[] {
  const {
    density = 15,
    sizeRange = [35, 55],
    seed = 42,
  } = options ?? {};

  const placements: TreePlacement[] = [];
  const random = seededRandom(seed);

  // Tree type distribution: favoring conifers for forest
  // 25% oak, 15% maple, 30% pine, 15% spruce, 15% birch
  const treeTypes: TreeType[] = ['oak', 'maple', 'pine', 'spruce', 'birch'];
  const treeWeights = [0.25, 0.15, 0.30, 0.15, 0.15];

  function pickTreeType(): TreeType {
    const r = random();
    let cumulative = 0;
    for (let i = 0; i < treeTypes.length; i++) {
      cumulative += treeWeights[i];
      if (r <= cumulative) return treeTypes[i];
    }
    return 'pine';
  }

  // Get polygon bounds
  const bounds = getPolygonBounds(polygon);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const area = width * height;

  // Calculate number of trees based on density
  const treeCount = Math.floor((area / 10000) * density);

  // Minimum spacing between trees
  const minSpacing = 25;

  // Generate candidate points and check if inside polygon
  let attempts = 0;
  const maxAttempts = treeCount * 10;

  while (placements.length < treeCount && attempts < maxAttempts) {
    attempts++;

    // Random point within bounding box
    const x = bounds.minX + random() * width;
    const y = bounds.minY + random() * height;

    // Check if inside polygon
    if (!pointInPolygon(x, y, polygon)) continue;

    // Check spacing from existing trees
    let tooClose = false;
    for (const existing of placements) {
      const dx = existing.x - x;
      const dy = existing.y - y;
      if (dx * dx + dy * dy < minSpacing * minSpacing) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    // Vary tree size
    const treeHeight = sizeRange[0] + random() * (sizeRange[1] - sizeRange[0]);

    // Slight opacity variation
    const opacity = 0.85 + random() * 0.15;

    placements.push({
      x,
      y,
      treeType: pickTreeType(),
      height: treeHeight,
      opacity,
      seed: Math.round(random() * 100000),
    });
  }

  // Sort by y-position so trees further back (higher y in SVG) are rendered first
  // This creates proper overlap for perspective
  placements.sort((a, b) => a.y - b.y);

  return placements;
}

// Render trees filling a forest polygon to SVG string
export function renderForestTrees(
  polygon: Array<[number, number]>,
  options?: {
    density?: number;
    sizeRange?: [number, number];
    seed?: number;
    counterRotation?: number;  // Counter-rotation to keep trees upright when map is rotated
  }
): string {
  const placements = generateForestTreePlacements(polygon, options);
  const counterRotation = options?.counterRotation ?? 0;

  return placements.map(p =>
    generateSideViewTreeSVG(p.x, p.y, p.treeType, p.height, p.opacity, p.seed, counterRotation)
  ).join('\n');
}
