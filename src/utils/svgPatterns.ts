// ============ SVG PATTERN GENERATOR ============
// Beautiful, hand-illustrated cartographic terrain patterns
// Seamless, detailed, organic designs for disc golf course maps

import type { TerrainType, MapBackgroundConfig, BackgroundGradient } from '../types/terrain';

interface PatternColors {
  primary: string;
  secondary: string;
  accent: string;
}

// ============ PATTERN ID GENERATOR ============

let patternIdCounter = 0;
function uniqueId(base: string): string {
  return `${base}_${++patternIdCounter}`;
}

export function resetPatternIds(): void {
  patternIdCounter = 0;
}

// ============ SEEDED RANDOM FOR CONSISTENT PATTERNS ============

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ============ GRASS PATTERN - Lush Lawn ============

function generateGrassPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const size = 48 * s;
  const random = seededRandom(42);
  const elements: string[] = [];

  // Base gradient for depth
  elements.push(`
    <defs>
      <linearGradient id="${id}_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors.primary}" />
        <stop offset="50%" stop-color="${colors.secondary}" />
        <stop offset="100%" stop-color="${colors.primary}" />
      </linearGradient>
    </defs>
  `);

  // Dense grass blades in clusters
  const clusterCenters = [
    { x: 8, y: 12 }, { x: 24, y: 8 }, { x: 40, y: 16 },
    { x: 12, y: 32 }, { x: 32, y: 28 }, { x: 44, y: 40 },
    { x: 4, y: 44 }, { x: 20, y: 44 }, { x: 36, y: 4 },
  ];

  clusterCenters.forEach(center => {
    // Each cluster has 8-12 blades
    const bladeCount = Math.floor(random() * 5) + 8;
    for (let i = 0; i < bladeCount; i++) {
      const offsetX = (random() - 0.5) * 10 * s;
      const offsetY = (random() - 0.5) * 10 * s;
      const x = (center.x * s + offsetX + size) % size;
      const y = (center.y * s + offsetY + size) % size;
      const height = (random() * 6 + 4) * s;
      const lean = (random() - 0.5) * 4 * s;
      const curve = (random() - 0.5) * 2 * s;
      const thickness = (random() * 0.4 + 0.6) * s;

      const colorChoice = random();
      const bladeColor = colorChoice > 0.7 ? colors.accent :
                         colorChoice > 0.3 ? colors.primary : colors.secondary;

      elements.push(`
        <path d="M${x.toFixed(2)} ${(y + height).toFixed(2)}
                 Q${(x + lean * 0.3 + curve).toFixed(2)} ${(y + height * 0.6).toFixed(2)}
                  ${(x + lean * 0.6).toFixed(2)} ${(y + height * 0.3).toFixed(2)}
                 Q${(x + lean * 0.8 - curve * 0.5).toFixed(2)} ${(y + height * 0.1).toFixed(2)}
                  ${(x + lean).toFixed(2)} ${y.toFixed(2)}"
              stroke="${bladeColor}" stroke-width="${thickness.toFixed(2)}"
              fill="none" stroke-linecap="round" opacity="${(random() * 0.3 + 0.7).toFixed(2)}" />
      `);
    }
  });

  // Tiny detail dots for texture
  for (let i = 0; i < 30; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = random() * 0.5 + 0.2;
    elements.push(`
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(r * s).toFixed(2)}"
              fill="${colors.secondary}" opacity="${(random() * 0.2 + 0.1).toFixed(2)}" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      <rect width="100%" height="100%" fill="url(#${id}_grad)" opacity="0.3" />
      ${elements.join('')}
    </pattern>
  `;
}

// ============ ROUGH GRASS PATTERN - Wild Meadow ============

function generateRoughGrassPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const size = 64 * s;
  const random = seededRandom(123);
  const elements: string[] = [];

  // Taller, wilder grass with seed heads
  for (let i = 0; i < 60; i++) {
    const x = random() * size;
    const y = random() * size;
    const height = (random() * 16 + 10) * s;
    const lean = (random() - 0.5) * 12 * s;
    const waviness = random() * 4 * s;
    const thickness = (random() * 0.6 + 0.8) * s;

    const colorChoice = random();
    const bladeColor = colorChoice > 0.6 ? colors.accent :
                       colorChoice > 0.3 ? colors.secondary : colors.primary;

    // Wavy tall grass blade
    elements.push(`
      <path d="M${x.toFixed(2)} ${(y + height).toFixed(2)}
               C${(x + waviness).toFixed(2)} ${(y + height * 0.75).toFixed(2)}
                ${(x + lean * 0.4 - waviness).toFixed(2)} ${(y + height * 0.5).toFixed(2)}
                ${(x + lean * 0.5 + waviness * 0.5).toFixed(2)} ${(y + height * 0.35).toFixed(2)}
               C${(x + lean * 0.7).toFixed(2)} ${(y + height * 0.2).toFixed(2)}
                ${(x + lean * 0.9).toFixed(2)} ${(y + height * 0.1).toFixed(2)}
                ${(x + lean).toFixed(2)} ${y.toFixed(2)}"
            stroke="${bladeColor}" stroke-width="${thickness.toFixed(2)}"
            fill="none" stroke-linecap="round" opacity="${(random() * 0.25 + 0.75).toFixed(2)}" />
    `);

    // Add seed heads to some blades
    if (random() > 0.7) {
      const seedX = x + lean;
      const seedY = y;
      elements.push(`
        <ellipse cx="${seedX.toFixed(2)}" cy="${(seedY - 2 * s).toFixed(2)}"
                 rx="${(1.5 * s).toFixed(2)}" ry="${(4 * s).toFixed(2)}"
                 fill="${colors.accent}" opacity="0.8"
                 transform="rotate(${(lean > 0 ? 15 : -15)} ${seedX.toFixed(2)} ${seedY.toFixed(2)})" />
      `);
    }
  }

  // Ground texture - small tufts
  for (let i = 0; i < 20; i++) {
    const x = random() * size;
    const y = random() * size;
    elements.push(`
      <ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}"
               rx="${(2 * s).toFixed(2)}" ry="${(1 * s).toFixed(2)}"
               fill="${colors.secondary}" opacity="0.2" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

// ============ FOREST PATTERN - Tree Canopy From Above ============

function generateForestPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const size = 72 * s;
  const random = seededRandom(456);
  const elements: string[] = [];

  // Tree canopy circles with organic shapes
  const trees = [
    { x: 12, y: 14, r: 11 },
    { x: 36, y: 10, r: 9 },
    { x: 58, y: 18, r: 10 },
    { x: 8, y: 38, r: 8 },
    { x: 28, y: 32, r: 12 },
    { x: 52, y: 36, r: 9 },
    { x: 68, y: 48, r: 10 },
    { x: 18, y: 58, r: 9 },
    { x: 44, y: 56, r: 11 },
    { x: 64, y: 68, r: 8 },
    { x: 4, y: 66, r: 7 },
  ];

  trees.forEach((tree) => {
    const x = tree.x * s;
    const y = tree.y * s;
    const r = tree.r * s;

    // Shadow underneath
    elements.push(`
      <circle cx="${(x + 2 * s).toFixed(2)}" cy="${(y + 2 * s).toFixed(2)}" r="${r.toFixed(2)}"
              fill="${colors.secondary}" opacity="0.4" />
    `);

    // Main canopy - organic blob shape using multiple overlapping circles
    const blobCount = 5 + Math.floor(random() * 3);
    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2 + random() * 0.5;
      const dist = r * 0.3 * random();
      const blobX = x + Math.cos(angle) * dist;
      const blobY = y + Math.sin(angle) * dist;
      const blobR = r * (0.6 + random() * 0.5);

      const colorChoice = random();
      const treeColor = colorChoice > 0.6 ? colors.accent :
                        colorChoice > 0.3 ? colors.primary : colors.secondary;

      elements.push(`
        <circle cx="${blobX.toFixed(2)}" cy="${blobY.toFixed(2)}" r="${blobR.toFixed(2)}"
                fill="${treeColor}" opacity="${(0.7 + random() * 0.3).toFixed(2)}" />
      `);
    }

    // Highlight spots
    elements.push(`
      <circle cx="${(x - r * 0.25).toFixed(2)}" cy="${(y - r * 0.25).toFixed(2)}" r="${(r * 0.35).toFixed(2)}"
              fill="${colors.accent}" opacity="0.5" />
    `);

    // Dark center detail
    elements.push(`
      <circle cx="${(x + r * 0.1).toFixed(2)}" cy="${(y + r * 0.1).toFixed(2)}" r="${(r * 0.2).toFixed(2)}"
              fill="${colors.secondary}" opacity="0.3" />
    `);
  });

  // Small undergrowth dots
  for (let i = 0; i < 25; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = random() * 1.5 + 0.5;
    elements.push(`
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(r * s).toFixed(2)}"
              fill="${colors.secondary}" opacity="${(random() * 0.3 + 0.1).toFixed(2)}" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

// ============ WATER PATTERN - Serene Lake Surface ============

function generateWaterPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const size = 60 * s;
  const random = seededRandom(789);
  const elements: string[] = [];

  // Gradient for depth
  elements.push(`
    <defs>
      <linearGradient id="${id}_water_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors.secondary}" stop-opacity="0.3" />
        <stop offset="30%" stop-color="${colors.primary}" stop-opacity="0" />
        <stop offset="70%" stop-color="${colors.primary}" stop-opacity="0" />
        <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="0.3" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#${id}_water_grad)" />
  `);

  // Gentle wave ripples
  for (let row = 0; row < 6; row++) {
    const y = (row * 10 + 5) * s;
    const offset = (row % 2) * 15 * s;
    const amplitude = (1.5 + random() * 1) * s;

    elements.push(`
      <path d="M${(-10 + offset).toFixed(2)} ${y.toFixed(2)}
               Q${(5 + offset).toFixed(2)} ${(y - amplitude).toFixed(2)}
                ${(20 + offset).toFixed(2)} ${y.toFixed(2)}
               Q${(35 + offset).toFixed(2)} ${(y + amplitude).toFixed(2)}
                ${(50 + offset).toFixed(2)} ${y.toFixed(2)}
               Q${(65 + offset).toFixed(2)} ${(y - amplitude).toFixed(2)}
                ${(80 + offset).toFixed(2)} ${y.toFixed(2)}"
            stroke="${colors.accent}" stroke-width="${(0.8 * s).toFixed(2)}"
            fill="none" stroke-linecap="round" opacity="${(0.3 + random() * 0.2).toFixed(2)}" />
    `);
  }

  // Light reflections / sparkles
  for (let i = 0; i < 15; i++) {
    const x = random() * size;
    const y = random() * size;
    const sparkleSize = (random() * 1.5 + 0.5) * s;

    elements.push(`
      <ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}"
               rx="${sparkleSize.toFixed(2)}" ry="${(sparkleSize * 0.5).toFixed(2)}"
               fill="#ffffff" opacity="${(random() * 0.4 + 0.2).toFixed(2)}"
               transform="rotate(${(random() * 30 - 15).toFixed(0)} ${x.toFixed(2)} ${y.toFixed(2)})" />
    `);
  }

  // Subtle depth variation circles
  for (let i = 0; i < 8; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = (random() * 8 + 4) * s;

    elements.push(`
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}"
              fill="${colors.secondary}" opacity="${(random() * 0.1 + 0.05).toFixed(2)}" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

// ============ SAND PATTERN - Beach/Bunker ============

function generateSandPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const size = 50 * s;
  const random = seededRandom(234);
  const elements: string[] = [];

  // Dense stippled texture - many tiny grains
  for (let i = 0; i < 200; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = (random() * 0.6 + 0.2) * s;

    const colorChoice = random();
    const grainColor = colorChoice > 0.7 ? colors.accent :
                       colorChoice > 0.4 ? colors.primary : colors.secondary;

    elements.push(`
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}"
              fill="${grainColor}" opacity="${(random() * 0.5 + 0.3).toFixed(2)}" />
    `);
  }

  // Subtle wind ripple lines
  for (let i = 0; i < 5; i++) {
    const y = (i * 10 + 5 + random() * 5) * s;
    const startX = random() * 10 * s;
    const curve = (random() - 0.5) * 4 * s;

    elements.push(`
      <path d="M${startX.toFixed(2)} ${y.toFixed(2)}
               Q${(size * 0.5).toFixed(2)} ${(y + curve).toFixed(2)}
                ${(size - startX).toFixed(2)} ${y.toFixed(2)}"
            stroke="${colors.secondary}" stroke-width="${(0.5 * s).toFixed(2)}"
            fill="none" opacity="0.15" />
    `);
  }

  // Occasional larger grains / pebbles
  for (let i = 0; i < 10; i++) {
    const x = random() * size;
    const y = random() * size;
    const rx = (random() * 1.2 + 0.6) * s;
    const ry = (random() * 0.8 + 0.4) * s;
    const rotation = random() * 180;

    elements.push(`
      <ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}"
               rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}"
               fill="${colors.secondary}" opacity="${(random() * 0.3 + 0.2).toFixed(2)}"
               transform="rotate(${rotation.toFixed(0)} ${x.toFixed(2)} ${y.toFixed(2)})" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

// ============ CONCRETE PATTERN - Paved Surface ============

function generateConcretePattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const size = 80 * s;
  const random = seededRandom(567);
  const elements: string[] = [];

  // Expansion joint grid
  const jointWidth = 0.8 * s;
  elements.push(`
    <line x1="0" y1="${(size / 2).toFixed(2)}" x2="${size}" y2="${(size / 2).toFixed(2)}"
          stroke="${colors.secondary}" stroke-width="${jointWidth.toFixed(2)}" opacity="0.4" />
    <line x1="${(size / 2).toFixed(2)}" y1="0" x2="${(size / 2).toFixed(2)}" y2="${size}"
          stroke="${colors.secondary}" stroke-width="${jointWidth.toFixed(2)}" opacity="0.4" />
  `);

  // Surface texture - small imperfections
  for (let i = 0; i < 80; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = (random() * 1.2 + 0.3) * s;

    elements.push(`
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}"
              fill="${colors.secondary}" opacity="${(random() * 0.12 + 0.04).toFixed(2)}" />
    `);
  }

  // Aggregate specks
  for (let i = 0; i < 40; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = (random() * 0.8 + 0.2) * s;

    const colorChoice = random();
    const speckColor = colorChoice > 0.5 ? colors.accent : colors.secondary;

    elements.push(`
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}"
              fill="${speckColor}" opacity="${(random() * 0.2 + 0.1).toFixed(2)}" />
    `);
  }

  // Subtle hairline cracks (occasional)
  for (let i = 0; i < 3; i++) {
    const startX = random() * size;
    const startY = random() * size;
    const length = (random() * 15 + 5) * s;
    const angle = random() * Math.PI;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    const midX = (startX + endX) / 2 + (random() - 0.5) * 3 * s;
    const midY = (startY + endY) / 2 + (random() - 0.5) * 3 * s;

    elements.push(`
      <path d="M${startX.toFixed(2)} ${startY.toFixed(2)}
               Q${midX.toFixed(2)} ${midY.toFixed(2)}
                ${endX.toFixed(2)} ${endY.toFixed(2)}"
            stroke="${colors.secondary}" stroke-width="${(0.3 * s).toFixed(2)}"
            fill="none" opacity="0.2" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

// ============ MAIN PATTERN GENERATOR ============

export function generateTerrainPattern(
  terrainType: TerrainType,
  colors: PatternColors,
  scale: number = 1
): { id: string; svg: string } {
  const id = uniqueId(`terrain_${terrainType}`);

  const generators: Record<TerrainType, (id: string, colors: PatternColors, scale: number) => string> = {
    grass: generateGrassPattern,
    roughGrass: generateRoughGrassPattern,
    forest: generateForestPattern,
    water: generateWaterPattern,
    sand: generateSandPattern,
    concrete: generateConcretePattern,
  };

  const generator = generators[terrainType];
  return { id, svg: generator(id, colors, scale) };
}

// ============ GRASS BACKGROUND PATTERN ============

function generateGrassBackgroundPattern(
  id: string,
  colors: { primary: string; secondary: string; accent: string },
  scale: number = 1
): string {
  const s = scale;
  const size = 40 * s;
  const random = seededRandom(999);
  const elements: string[] = [];

  // Dense, uniform grass for background
  for (let i = 0; i < 50; i++) {
    const x = random() * size;
    const y = random() * size;
    const height = (random() * 5 + 3) * s;
    const lean = (random() - 0.5) * 4 * s;
    const thickness = (random() * 0.4 + 0.5) * s;

    const colorChoice = random();
    const bladeColor = colorChoice > 0.6 ? colors.accent :
                       colorChoice > 0.3 ? colors.secondary : colors.primary;

    elements.push(`
      <path d="M${x.toFixed(2)} ${(y + height).toFixed(2)}
               Q${(x + lean * 0.5).toFixed(2)} ${(y + height * 0.5).toFixed(2)}
                ${(x + lean).toFixed(2)} ${y.toFixed(2)}"
            stroke="${bladeColor}" stroke-width="${thickness.toFixed(2)}"
            fill="none" stroke-linecap="round" />
    `);
  }

  // Ground texture
  for (let i = 0; i < 15; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = random() * 0.6 + 0.2;
    elements.push(`
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(r * s).toFixed(2)}"
              fill="${colors.secondary}" opacity="0.2" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

// ============ BACKGROUND GENERATOR ============

export function generateBackgroundDefs(
  config: MapBackgroundConfig,
  width: number,
  height: number
): { defs: string; backgroundElements: string } {
  const defs: string[] = [];
  const elements: string[] = [];

  // Main background
  if (config.type === 'solid' && config.solidColor) {
    elements.push(`<rect width="${width}" height="${height}" fill="${config.solidColor}" />`);
  } else if (config.type === 'gradient' && config.gradient) {
    const gradId = uniqueId('bg_gradient');
    defs.push(generateGradientDef(gradId, config.gradient));
    elements.push(`<rect width="${width}" height="${height}" fill="url(#${gradId})" />`);
  } else if (config.type === 'terrain') {
    // Generate grass pattern as background
    const grassColors = {
      primary: config.terrainBaseColor || '#4ade80',
      secondary: '#22c55e',
      accent: '#86efac',
    };
    const scaleVal = Math.max(width, height) / 800;
    const grassPatternId = uniqueId('bg_grass');
    defs.push(generateGrassBackgroundPattern(grassPatternId, grassColors, scaleVal));
    elements.push(`<rect width="${width}" height="${height}" fill="url(#${grassPatternId})" />`);
  }

  // Noise texture overlay
  if (config.enableNoiseTexture && config.noiseOpacity) {
    const noiseId = uniqueId('noise');
    defs.push(generateGrainTexture(noiseId, Math.max(width, height) / 400));
    elements.push(`<rect width="${width}" height="${height}" fill="url(#${noiseId})" opacity="${config.noiseOpacity}" />`);
  }

  // Vignette effect
  if (config.enableVignette && config.vignetteColor) {
    const vignetteId = uniqueId('vignette');
    defs.push(`
      <radialGradient id="${vignetteId}" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="${config.vignetteColor}" stop-opacity="0" />
        <stop offset="70%" stop-color="${config.vignetteColor}" stop-opacity="0" />
        <stop offset="100%" stop-color="${config.vignetteColor}" stop-opacity="${config.vignetteOpacity ?? 0.2}" />
      </radialGradient>
    `);
    elements.push(`<rect width="${width}" height="${height}" fill="url(#${vignetteId})" />`);
  }

  // Frame/border
  if (config.enableFrame && config.frameColor && config.frameWidth) {
    const fw = config.frameWidth;
    elements.push(`
      <rect x="${fw / 2}" y="${fw / 2}" width="${width - fw}" height="${height - fw}"
            fill="none" stroke="${config.frameColor}" stroke-width="${fw}" rx="${fw * 2}" />
    `);
  }

  return {
    defs: defs.join('\n'),
    backgroundElements: elements.join('\n'),
  };
}

function generateGrainTexture(id: string, scale: number = 1): string {
  const random = seededRandom(777);
  const grains: string[] = [];

  for (let i = 0; i < 60; i++) {
    const x = random() * 40 * scale;
    const y = random() * 40 * scale;
    const r = random() * 0.8 + 0.2;
    const opacity = random() * 0.15 + 0.05;
    grains.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#000" opacity="${opacity.toFixed(2)}" />`);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${40 * scale}" height="${40 * scale}">
      <rect width="100%" height="100%" fill="transparent" />
      ${grains.join('')}
    </pattern>
  `;
}

function generateGradientDef(
  id: string,
  gradient: BackgroundGradient
): string {
  if (gradient.type === 'radial') {
    const stops = gradient.stops.map(s =>
      `<stop offset="${(s.offset * 100).toFixed(0)}%" stop-color="${s.color}" />`
    ).join('');
    return `<radialGradient id="${id}" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">${stops}</radialGradient>`;
  } else {
    const angle = gradient.angle ?? 0;
    const rad = (angle * Math.PI) / 180;
    const x2 = 50 + Math.sin(rad) * 50;
    const y2 = 50 - Math.cos(rad) * 50;
    const stops = gradient.stops.map(s =>
      `<stop offset="${(s.offset * 100).toFixed(0)}%" stop-color="${s.color}" />`
    ).join('');
    return `<linearGradient id="${id}" x1="50%" y1="0%" x2="${x2.toFixed(0)}%" y2="${y2.toFixed(0)}%">${stops}</linearGradient>`;
  }
}

// ============ DECORATIVE ELEMENTS ============

export function generateCompassRose(
  x: number,
  y: number,
  size: number,
  color: string = '#374151'
): string {
  const s = size / 60;
  const darkColor = color;
  const lightColor = '#ffffff';

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Outer ring -->
      <circle cx="0" cy="0" r="${30 * s}" fill="none" stroke="${darkColor}" stroke-width="${2 * s}" />
      <circle cx="0" cy="0" r="${28 * s}" fill="none" stroke="${darkColor}" stroke-width="${0.5 * s}" />

      <!-- Cardinal directions -->
      <polygon points="0,${-25 * s} ${4 * s},${-8 * s} 0,${-12 * s} ${-4 * s},${-8 * s}" fill="${darkColor}" />
      <polygon points="0,${25 * s} ${4 * s},${8 * s} 0,${12 * s} ${-4 * s},${8 * s}" fill="${lightColor}" stroke="${darkColor}" stroke-width="${0.5 * s}" />
      <polygon points="${25 * s},0 ${8 * s},${4 * s} ${12 * s},0 ${8 * s},${-4 * s}" fill="${lightColor}" stroke="${darkColor}" stroke-width="${0.5 * s}" />
      <polygon points="${-25 * s},0 ${-8 * s},${4 * s} ${-12 * s},0 ${-8 * s},${-4 * s}" fill="${lightColor}" stroke="${darkColor}" stroke-width="${0.5 * s}" />

      <!-- Intercardinal directions -->
      <polygon points="${17 * s},${-17 * s} ${6 * s},${-3 * s} ${8 * s},${-8 * s} ${3 * s},${-6 * s}" fill="${darkColor}" opacity="0.6" />
      <polygon points="${17 * s},${17 * s} ${6 * s},${3 * s} ${8 * s},${8 * s} ${3 * s},${6 * s}" fill="${darkColor}" opacity="0.6" />
      <polygon points="${-17 * s},${17 * s} ${-6 * s},${3 * s} ${-8 * s},${8 * s} ${-3 * s},${6 * s}" fill="${darkColor}" opacity="0.6" />
      <polygon points="${-17 * s},${-17 * s} ${-6 * s},${-3 * s} ${-8 * s},${-8 * s} ${-3 * s},${-6 * s}" fill="${darkColor}" opacity="0.6" />

      <!-- Center -->
      <circle cx="0" cy="0" r="${3 * s}" fill="${darkColor}" />

      <!-- N label -->
      <text x="0" y="${-32 * s}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="${8 * s}" fill="${darkColor}">N</text>
    </g>
  `;
}

export function generateScaleBar(
  x: number,
  y: number,
  metersPerPixel: number,
  width: number,
  color: string = '#374151'
): string {
  // Calculate nice round distance
  const maxMeters = width * metersPerPixel;
  const niceDistances = [10, 20, 50, 100, 200, 500, 1000];
  const targetDistance = niceDistances.find(d => d <= maxMeters * 0.8) ?? 50;
  const barWidth = targetDistance / metersPerPixel;

  const segments = 4;
  const segmentWidth = barWidth / segments;

  let bar = `<g transform="translate(${x}, ${y})">`;

  // Alternating segments
  for (let i = 0; i < segments; i++) {
    const fill = i % 2 === 0 ? color : '#ffffff';
    bar += `<rect x="${i * segmentWidth}" y="0" width="${segmentWidth}" height="6" fill="${fill}" stroke="${color}" stroke-width="0.5" />`;
  }

  // Labels
  bar += `<text x="0" y="16" font-family="Arial, sans-serif" font-size="9" fill="${color}">0</text>`;
  bar += `<text x="${barWidth}" y="16" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="${color}">${targetDistance}m</text>`;

  bar += '</g>';
  return bar;
}
