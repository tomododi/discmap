// ============ SVG PATTERN GENERATOR ============
// Beautiful, organic terrain patterns for disc golf course maps

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

// ============ NOISE & TEXTURE GENERATORS ============

function generateGrainTexture(id: string, scale: number = 1): string {
  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${40 * scale}" height="${40 * scale}">
      <rect width="100%" height="100%" fill="transparent" />
      ${Array.from({ length: 60 }, () => {
        const x = Math.random() * 40 * scale;
        const y = Math.random() * 40 * scale;
        const r = Math.random() * 0.8 + 0.2;
        const opacity = Math.random() * 0.15 + 0.05;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#000" opacity="${opacity.toFixed(2)}" />`;
      }).join('')}
    </pattern>
  `;
}

// ============ TERRAIN PATTERN GENERATORS ============

function generateGrassPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const blades: string[] = [];

  // Generate organic grass blade clusters
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * 24 * s;
    const y = Math.random() * 24 * s;
    const height = (Math.random() * 4 + 2) * s;
    const lean = (Math.random() - 0.5) * 3 * s;
    const color = Math.random() > 0.6 ? colors.accent : (Math.random() > 0.5 ? colors.secondary : colors.primary);

    blades.push(`
      <path d="M${x.toFixed(1)} ${(y + height).toFixed(1)} Q${(x + lean * 0.5).toFixed(1)} ${(y + height * 0.5).toFixed(1)} ${(x + lean).toFixed(1)} ${y.toFixed(1)}"
            stroke="${color}" stroke-width="${(0.8 * s).toFixed(1)}" fill="none" stroke-linecap="round" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${24 * s}" height="${24 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${blades.join('')}
    </pattern>
  `;
}

function generateRoughGrassPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const elements: string[] = [];

  // Taller, more chaotic grass
  for (let i = 0; i < 35; i++) {
    const x = Math.random() * 32 * s;
    const y = Math.random() * 32 * s;
    const height = (Math.random() * 8 + 4) * s;
    const lean = (Math.random() - 0.5) * 6 * s;
    const curve = (Math.random() - 0.5) * 4 * s;
    const color = Math.random() > 0.5 ? colors.secondary : colors.primary;

    elements.push(`
      <path d="M${x.toFixed(1)} ${(y + height).toFixed(1)}
               C${(x + lean * 0.3).toFixed(1)} ${(y + height * 0.7).toFixed(1)}
                 ${(x + lean * 0.6 + curve).toFixed(1)} ${(y + height * 0.3).toFixed(1)}
                 ${(x + lean).toFixed(1)} ${y.toFixed(1)}"
            stroke="${color}" stroke-width="${(1.2 * s).toFixed(1)}" fill="none" stroke-linecap="round" />
    `);
  }

  // Add some seed heads
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 32 * s;
    const y = Math.random() * 8 * s;
    elements.push(`
      <ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(1.5 * s).toFixed(1)}" ry="${(3 * s).toFixed(1)}"
               fill="${colors.accent}" opacity="0.7" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${32 * s}" height="${32 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

function generateForestPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const trees: string[] = [];

  // Generate stylized tree canopy circles
  const treePositions = [
    { x: 8, y: 10, r: 8 },
    { x: 24, y: 8, r: 6 },
    { x: 16, y: 22, r: 7 },
    { x: 32, y: 20, r: 5 },
    { x: 4, y: 28, r: 6 },
    { x: 28, y: 30, r: 7 },
  ];

  treePositions.forEach((t, i) => {
    const color = i % 3 === 0 ? colors.accent : (i % 2 === 0 ? colors.secondary : colors.primary);
    const shadowColor = colors.secondary;

    // Tree shadow
    trees.push(`
      <circle cx="${(t.x * s + 1.5 * s).toFixed(1)}" cy="${(t.y * s + 1.5 * s).toFixed(1)}" r="${(t.r * s).toFixed(1)}"
              fill="${shadowColor}" opacity="0.3" />
    `);

    // Main canopy
    trees.push(`
      <circle cx="${(t.x * s).toFixed(1)}" cy="${(t.y * s).toFixed(1)}" r="${(t.r * s).toFixed(1)}"
              fill="${color}" />
    `);

    // Highlight
    trees.push(`
      <circle cx="${(t.x * s - t.r * 0.3 * s).toFixed(1)}" cy="${(t.y * s - t.r * 0.3 * s).toFixed(1)}" r="${(t.r * 0.4 * s).toFixed(1)}"
              fill="${colors.accent}" opacity="0.4" />
    `);
  });

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${36 * s}" height="${36 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${trees.join('')}
    </pattern>
  `;
}

function generateWaterPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const waves: string[] = [];

  // Create gentle wave ripples
  for (let row = 0; row < 4; row++) {
    const y = (row * 10 + 5) * s;
    const offset = row % 2 === 0 ? 0 : 10 * s;

    waves.push(`
      <path d="M${(-5 + offset).toFixed(1)} ${y.toFixed(1)}
               Q${(5 + offset).toFixed(1)} ${(y - 2 * s).toFixed(1)} ${(15 + offset).toFixed(1)} ${y.toFixed(1)}
               Q${(25 + offset).toFixed(1)} ${(y + 2 * s).toFixed(1)} ${(35 + offset).toFixed(1)} ${y.toFixed(1)}
               Q${(45 + offset).toFixed(1)} ${(y - 2 * s).toFixed(1)} ${(55 + offset).toFixed(1)} ${y.toFixed(1)}"
            stroke="${colors.accent}" stroke-width="${(1 * s).toFixed(1)}" fill="none" stroke-linecap="round" opacity="0.5" />
    `);
  }

  // Add some sparkle points
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 40 * s;
    const y = Math.random() * 40 * s;
    waves.push(`
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5 * s).toFixed(1)}" fill="#fff" opacity="${(Math.random() * 0.3 + 0.2).toFixed(2)}" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${40 * s}" height="${40 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      <rect width="100%" height="100%" fill="url(#${id}_grad)" />
      ${waves.join('')}
    </pattern>
    <linearGradient id="${id}_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.secondary}" stop-opacity="0.3" />
      <stop offset="50%" stop-color="${colors.primary}" stop-opacity="0" />
      <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="0.3" />
    </linearGradient>
  `;
}

function generateSandPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const grains: string[] = [];

  // Create stippled sand texture
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 30 * s;
    const y = Math.random() * 30 * s;
    const r = Math.random() * 0.6 + 0.3;
    const color = Math.random() > 0.7 ? colors.secondary : (Math.random() > 0.5 ? colors.accent : colors.primary);
    const opacity = Math.random() * 0.4 + 0.3;

    grains.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * s).toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}" />`);
  }

  // Add some subtle dune lines
  for (let i = 0; i < 3; i++) {
    const y = (i * 12 + 6) * s;
    const curve = Math.random() * 4 - 2;
    grains.push(`
      <path d="M0 ${y.toFixed(1)} Q${(15 * s).toFixed(1)} ${(y + curve * s).toFixed(1)} ${(30 * s).toFixed(1)} ${y.toFixed(1)}"
            stroke="${colors.secondary}" stroke-width="${(0.5 * s).toFixed(1)}" fill="none" opacity="0.2" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${30 * s}" height="${30 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${grains.join('')}
    </pattern>
  `;
}

function generateConcretePattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;

  // Concrete with subtle cracks and texture
  const cracks: string[] = [];

  // Grid lines (expansion joints)
  cracks.push(`
    <line x1="0" y1="${(40 * s).toFixed(1)}" x2="${(80 * s).toFixed(1)}" y2="${(40 * s).toFixed(1)}" stroke="${colors.secondary}" stroke-width="${(0.5 * s).toFixed(1)}" opacity="0.3" />
    <line x1="${(40 * s).toFixed(1)}" y1="0" x2="${(40 * s).toFixed(1)}" y2="${(80 * s).toFixed(1)}" stroke="${colors.secondary}" stroke-width="${(0.5 * s).toFixed(1)}" opacity="0.3" />
  `);

  // Subtle texture
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 80 * s;
    const y = Math.random() * 80 * s;
    const r = Math.random() * 1 + 0.5;
    cracks.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * s).toFixed(1)}" fill="${colors.secondary}" opacity="${(Math.random() * 0.15 + 0.05).toFixed(2)}" />`);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${80 * s}" height="${80 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${cracks.join('')}
    </pattern>
  `;
}

function generateGravelPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const stones: string[] = [];

  // Various sized stones
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 25 * s;
    const y = Math.random() * 25 * s;
    const w = (Math.random() * 3 + 1.5) * s;
    const h = (Math.random() * 2 + 1) * s;
    const rotation = Math.random() * 180;
    const colorChoice = Math.random();
    const color = colorChoice > 0.7 ? colors.accent : (colorChoice > 0.4 ? colors.secondary : colors.primary);

    stones.push(`
      <ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${w.toFixed(1)}" ry="${h.toFixed(1)}"
               fill="${color}" transform="rotate(${rotation.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${25 * s}" height="${25 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${stones.join('')}
    </pattern>
  `;
}

function generateMarshPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const elements: string[] = [];

  // Water base with reeds
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 36 * s;
    const y = Math.random() * 36 * s;
    const height = (Math.random() * 10 + 6) * s;
    const lean = (Math.random() - 0.5) * 3 * s;

    // Reed stem
    elements.push(`
      <path d="M${x.toFixed(1)} ${(y + height).toFixed(1)} L${(x + lean).toFixed(1)} ${y.toFixed(1)}"
            stroke="${colors.secondary}" stroke-width="${(1 * s).toFixed(1)}" fill="none" stroke-linecap="round" />
    `);

    // Reed top
    if (Math.random() > 0.5) {
      elements.push(`
        <ellipse cx="${(x + lean).toFixed(1)}" cy="${(y - 1.5 * s).toFixed(1)}" rx="${(1.5 * s).toFixed(1)}" ry="${(3 * s).toFixed(1)}"
                 fill="${colors.accent}" opacity="0.8" />
      `);
    }
  }

  // Water ripples
  for (let i = 0; i < 4; i++) {
    const cx = Math.random() * 36 * s;
    const cy = Math.random() * 36 * s;
    elements.push(`
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(3 * s).toFixed(1)}" fill="none" stroke="${colors.primary}" stroke-width="${(0.5 * s).toFixed(1)}" opacity="0.3" />
    `);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${36 * s}" height="${36 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${elements.join('')}
    </pattern>
  `;
}

function generateRocksPattern(id: string, colors: PatternColors, scale: number = 1): string {
  const s = scale;
  const rocks: string[] = [];

  // Generate irregular rock shapes
  const rockShapes = [
    { x: 6, y: 8, points: '0,3 2,-1 6,0 7,4 5,6 1,5' },
    { x: 18, y: 5, points: '0,2 3,-1 5,1 4,4 1,5' },
    { x: 12, y: 18, points: '0,2 2,0 5,1 6,4 4,6 1,5' },
    { x: 24, y: 15, points: '0,1 2,-1 4,0 5,3 3,5 0,4' },
    { x: 4, y: 22, points: '0,2 2,0 4,1 3,4 0,3' },
    { x: 20, y: 24, points: '0,2 3,0 5,2 4,5 1,4' },
  ];

  rockShapes.forEach((rock, i) => {
    const color = i % 3 === 0 ? colors.accent : (i % 2 === 0 ? colors.secondary : colors.primary);
    const shadowColor = colors.secondary;

    // Transform points
    const transformedPoints = rock.points.split(' ').map(p => {
      const [px, py] = p.split(',').map(Number);
      return `${((rock.x + px) * s).toFixed(1)},${((rock.y + py) * s).toFixed(1)}`;
    }).join(' ');

    const shadowPoints = rock.points.split(' ').map(p => {
      const [px, py] = p.split(',').map(Number);
      return `${((rock.x + px + 1) * s).toFixed(1)},${((rock.y + py + 1) * s).toFixed(1)}`;
    }).join(' ');

    // Shadow
    rocks.push(`<polygon points="${shadowPoints}" fill="${shadowColor}" opacity="0.3" />`);
    // Rock
    rocks.push(`<polygon points="${transformedPoints}" fill="${color}" />`);
  });

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${28 * s}" height="${28 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" opacity="0.5" />
      ${rocks.join('')}
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
    gravel: generateGravelPattern,
    marsh: generateMarshPattern,
    rocks: generateRocksPattern,
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
  const blades: string[] = [];

  // Dense grass pattern for background
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 30 * s;
    const y = Math.random() * 30 * s;
    const height = (Math.random() * 5 + 3) * s;
    const lean = (Math.random() - 0.5) * 4 * s;
    const colorChoice = Math.random();
    const color = colorChoice > 0.7 ? colors.accent : (colorChoice > 0.4 ? colors.secondary : colors.primary);

    blades.push(`
      <path d="M${x.toFixed(1)} ${(y + height).toFixed(1)} Q${(x + lean * 0.5).toFixed(1)} ${(y + height * 0.5).toFixed(1)} ${(x + lean).toFixed(1)} ${y.toFixed(1)}"
            stroke="${color}" stroke-width="${(0.9 * s).toFixed(1)}" fill="none" stroke-linecap="round" />
    `);
  }

  // Add subtle variation dots
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 30 * s;
    const y = Math.random() * 30 * s;
    const r = Math.random() * 0.8 + 0.3;
    blades.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * s).toFixed(1)}" fill="${colors.secondary}" opacity="0.3" />`);
  }

  return `
    <pattern id="${id}" patternUnits="userSpaceOnUse" width="${30 * s}" height="${30 * s}">
      <rect width="100%" height="100%" fill="${colors.primary}" />
      ${blades.join('')}
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
    const scale = Math.max(width, height) / 800; // Scale pattern based on canvas size
    const grassPatternId = uniqueId('bg_grass');
    defs.push(generateGrassBackgroundPattern(grassPatternId, grassColors, scale));
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
