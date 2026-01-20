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
