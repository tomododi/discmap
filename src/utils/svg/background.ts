import type { MapBackgroundConfig, BackgroundGradient } from '../../types/terrain';
import { uniqueId, seededRandom } from './patterns/index';

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
      <path d="M${x.toFixed(2)} ${(y + height).toFixed(2)}"
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
