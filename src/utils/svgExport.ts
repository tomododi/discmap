import { bbox } from '@turf/turf';
import type { Course, Hole, DiscGolfFeature, CourseStyle, TeeProperties, FlightLineProperties, DropzoneProperties, InfrastructureProperties, LandmarkProperties, OBLineProperties, DropzoneAreaProperties } from '../types/course';
import type { ExportConfig } from '../types/export';
import { TERRAIN_PATTERNS, getTerrainColors } from '../types/terrain';
import { generateTerrainPattern, generateCompassRose, generateScaleBar, resetPatternIds } from './svgPatterns';
import { generateLandmarkSVG } from './landmarkSvg';

// ============ COORDINATE TRANSFORMATION ============

interface SVGViewport {
  width: number;
  height: number;
  padding: number;
  bounds: {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  };
}

function calculateBounds(features: DiscGolfFeature[]): SVGViewport['bounds'] | null {
  if (features.length === 0) return null;

  const featureCollection = {
    type: 'FeatureCollection' as const,
    features,
  };

  const [minLng, minLat, maxLng, maxLat] = bbox(featureCollection);
  return { minLng, minLat, maxLng, maxLat };
}

function geoToSVG(
  coord: [number, number],
  viewport: SVGViewport
): [number, number] {
  const { bounds, width, height, padding } = viewport;
  const contentWidth = width - 2 * padding;
  const contentHeight = height - 2 * padding;

  const lngRange = bounds.maxLng - bounds.minLng;
  const latRange = bounds.maxLat - bounds.minLat;

  // Maintain aspect ratio
  const scaleX = contentWidth / lngRange;
  const scaleY = contentHeight / latRange;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = lngRange * scale;
  const scaledHeight = latRange * scale;

  const offsetX = padding + (contentWidth - scaledWidth) / 2;
  const offsetY = padding + (contentHeight - scaledHeight) / 2;

  const x = offsetX + (coord[0] - bounds.minLng) * scale;
  // Flip Y axis (SVG Y grows downward, lat grows upward)
  const y = offsetY + (bounds.maxLat - coord[1]) * scale;

  return [x, y];
}

function polygonCoordsToSVG(
  coords: number[][],
  viewport: SVGViewport
): string {
  return coords
    .map((coord) => {
      const [x, y] = geoToSVG(coord as [number, number], viewport);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function lineStringToSVG(
  coords: number[][],
  viewport: SVGViewport
): string {
  const points = coords.map((coord) => {
    const [x, y] = geoToSVG(coord as [number, number], viewport);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return `M ${points.join(' L ')}`;
}

// Convert polygon coordinates to SVG path with optional rounded corners
function polygonToPath(
  coords: number[][],
  viewport: SVGViewport,
  cornerRadius: number = 0
): string {
  const points = coords.map((coord) => {
    const [x, y] = geoToSVG(coord as [number, number], viewport);
    return { x, y };
  });

  // Remove last point if it's the same as first (closed polygon)
  if (points.length > 1 &&
      Math.abs(points[0].x - points[points.length - 1].x) < 0.01 &&
      Math.abs(points[0].y - points[points.length - 1].y) < 0.01) {
    points.pop();
  }

  if (points.length < 3) return '';

  // If no corner radius, return simple polygon path
  if (cornerRadius <= 0) {
    const pathPoints = points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ');
    return `M ${pathPoints} Z`;
  }

  // Build path with rounded corners
  let path = '';
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    // Calculate vectors
    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    // Normalize vectors
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Calculate offset distance (limited by half the edge length)
    const maxOffset = Math.min(len1, len2) * 0.45;
    const offset = Math.min(cornerRadius, maxOffset);

    // Calculate start and end points of the arc
    const start = {
      x: curr.x + (v1.x / len1) * offset,
      y: curr.y + (v1.y / len1) * offset,
    };
    const end = {
      x: curr.x + (v2.x / len2) * offset,
      y: curr.y + (v2.y / len2) * offset,
    };

    if (i === 0) {
      path = `M ${start.x.toFixed(2)},${start.y.toFixed(2)}`;
    } else {
      path += ` L ${start.x.toFixed(2)},${start.y.toFixed(2)}`;
    }

    // Add quadratic bezier for the corner
    path += ` Q ${curr.x.toFixed(2)},${curr.y.toFixed(2)} ${end.x.toFixed(2)},${end.y.toFixed(2)}`;
  }

  // Close path by connecting to start
  path += ' Z';

  return path;
}

// ============ SVG MARKER GENERATORS ============

function darkenColor(hex: string): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - 40);
  const b = Math.max(0, (num & 0x0000ff) - 40);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function getTextColor(hex: string): string {
  const num = parseInt(hex.slice(1), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

function generateTeeSVG(
  x: number,
  y: number,
  color: string,
  holeNumber: number | undefined,
  teeName: string | undefined,
  scale: number = 1,
  rotation: number = 0
): string {
  const bgColor = color;
  const borderColor = darkenColor(bgColor);
  const textColor = getTextColor(bgColor);

  const w = 32 * scale;
  const h = 20 * scale;
  const rx = 3 * scale;

  const displayText = holeNumber ?? teeName ?? '';

  // The tee pad shape rotates, but the text stays upright
  return `
    <g transform="translate(${x}, ${y})">
      <!-- Rotated tee pad shape -->
      <g transform="rotate(${rotation})">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${2 * scale}" />
        <rect x="${-w / 2 + 4 * scale}" y="${-h / 2 + 4 * scale}" width="${24 * scale}" height="${12 * scale}" rx="${2 * scale}" fill="${borderColor}" opacity="0.2" />
        <!-- Direction arrow -->
        <polygon points="${w / 2 - 6 * scale},0 ${w / 2 - 10 * scale},${-3 * scale} ${w / 2 - 10 * scale},${3 * scale}" fill="${textColor}" opacity="0.6" />
      </g>
      <!-- Text stays upright -->
      ${displayText ? `<text x="0" y="${4 * scale}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${12 * scale}" fill="${textColor}">${displayText}</text>` : ''}
    </g>
  `;
}

function generateBasketSVG(
  x: number,
  y: number,
  holeNumber: number | undefined,
  style: CourseStyle,
  scale: number = 1
): string {
  const topColor = style.basketTopColor;
  const bodyColor = style.basketBodyColor;
  const chainColor = style.basketChainColor;
  const poleColor = style.basketPoleColor;
  const topBorder = darkenColor(topColor);
  const bodyBorder = darkenColor(bodyColor);

  // Offset to center from bottom anchor point
  const offsetY = -44 * scale;

  return `
    <g transform="translate(${x - 16 * scale}, ${y + offsetY})">
      <!-- Pole -->
      <rect x="${15 * scale}" y="${28 * scale}" width="${2 * scale}" height="${14 * scale}" fill="${poleColor}" />
      <!-- Base -->
      <ellipse cx="${16 * scale}" cy="${42 * scale}" rx="${6 * scale}" ry="${2 * scale}" fill="${poleColor}" />
      <!-- Basket body -->
      <path d="M${6 * scale} ${18 * scale} L${26 * scale} ${18 * scale} L${24 * scale} ${28 * scale} L${8 * scale} ${28 * scale} Z" fill="${bodyColor}" stroke="${bodyBorder}" stroke-width="${1.5 * scale}" />
      <!-- Chains -->
      <path d="M${8 * scale} ${10 * scale} L${8 * scale} ${18 * scale} M${12 * scale} ${8 * scale} L${12 * scale} ${18 * scale} M${16 * scale} ${6 * scale} L${16 * scale} ${18 * scale} M${20 * scale} ${8 * scale} L${20 * scale} ${18 * scale} M${24 * scale} ${10 * scale} L${24 * scale} ${18 * scale}" stroke="${chainColor}" stroke-width="${1.5 * scale}" stroke-linecap="round" />
      <!-- Top band -->
      <ellipse cx="${16 * scale}" cy="${6 * scale}" rx="${10 * scale}" ry="${3 * scale}" fill="${topColor}" stroke="${topBorder}" stroke-width="${1.5 * scale}" />
      <!-- Inner ring -->
      <ellipse cx="${16 * scale}" cy="${18 * scale}" rx="${8 * scale}" ry="${2 * scale}" fill="none" stroke="${bodyBorder}" stroke-width="${scale}" />
      ${holeNumber ? `<text x="${16 * scale}" y="${9 * scale}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${8 * scale}" fill="#ffffff">${holeNumber}</text>` : ''}
    </g>
  `;
}

function generateDropzoneSVG(
  x: number,
  y: number,
  color: string,
  scale: number = 1,
  rotation: number = 0
): string {
  const borderColor = darkenColor(color);
  const textColor = getTextColor(color);

  const w = 32 * scale;
  const h = 20 * scale;
  const rx = 4 * scale;

  // The dropzone shape rotates, but the text stays upright
  return `
    <g transform="translate(${x}, ${y})">
      <!-- Rotated dropzone shape -->
      <g transform="rotate(${rotation})">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="${color}" stroke="${borderColor}" stroke-width="${2 * scale}" />
        <rect x="${-w / 2 + 4 * scale}" y="${-h / 2 + 4 * scale}" width="${24 * scale}" height="${12 * scale}" rx="${2 * scale}" fill="none" stroke="${borderColor}" stroke-width="${scale}" opacity="0.4" />
        <!-- Direction arrow -->
        <polygon points="${w / 2 - 6 * scale},0 ${w / 2 - 10 * scale},${-3 * scale} ${w / 2 - 10 * scale},${3 * scale}" fill="${textColor}" opacity="0.6" />
      </g>
      <!-- Text stays upright -->
      <text x="0" y="${4 * scale}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${10 * scale}" fill="${textColor}">DZ</text>
    </g>
  `;
}

function generateMandatorySVG(
  x: number,
  y: number,
  rotation: number,
  color: string,
  scale: number = 1,
  lineAngle: number = 270,
  lineLength: number = 60,
  lineColor: string = '#dc2626'
): string {
  const borderColor = darkenColor(color);
  const s = scale;
  const cx = 16 * s;
  const cy = 16 * s;
  const displayLineLength = lineLength * s;

  // Arrow body path (pointing right at 0 degrees)
  const arrowPath = `
    M${6 * s} ${14 * s}
    L${18 * s} ${14 * s}
    L${18 * s} ${10 * s}
    L${28 * s} ${16 * s}
    L${18 * s} ${22 * s}
    L${18 * s} ${18 * s}
    L${6 * s} ${18 * s}
    Z
  `;

  return `
    <g transform="translate(${x - cx}, ${y - cy})">
      <!-- Red boundary line (dashed) -->
      <g transform="rotate(${lineAngle + 90} ${cx} ${cy})">
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - displayLineLength}" stroke="${lineColor}" stroke-width="${3 * s}" stroke-dasharray="${6 * s} ${3 * s}" stroke-linecap="round" />
      </g>
      <!-- Arrow shape -->
      <g transform="rotate(${rotation} ${cx} ${cy})">
        <path d="${arrowPath}" fill="${color}" stroke="${borderColor}" stroke-width="${1.5 * s}" stroke-linejoin="round" />
      </g>
    </g>
  `;
}

function generateAnnotationSVG(
  x: number,
  y: number,
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
  textColor: string,
  backgroundColor: string,
  borderColor: string,
  scale: number = 1
): string {
  const scaledFontSize = fontSize * scale;
  const padding = 8 * scale;
  // Approximate text width (rough estimate)
  const textWidth = text.length * scaledFontSize * 0.6;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = scaledFontSize + padding * 2;

  return `
    <g transform="translate(${x - boxWidth / 2}, ${y - boxHeight / 2})">
      <rect width="${boxWidth}" height="${boxHeight}" rx="${4 * scale}" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="${scale}" />
      <text x="${boxWidth / 2}" y="${boxHeight / 2 + scaledFontSize / 3}" text-anchor="middle" font-family="${fontFamily}" font-weight="${fontWeight}" font-size="${scaledFontSize}" fill="${textColor}">${text}</text>
    </g>
  `;
}

// ============ LEGEND GENERATOR ============

function generateLegendIconTee(x: number, y: number, color: string, s: number): string {
  const borderColor = darkenColor(color);
  const w = 16 * s, h = 10 * s, rx = 2 * s;
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${color}" stroke="${borderColor}" stroke-width="${s}" />
      <rect x="${2 * s}" y="${2 * s}" width="${12 * s}" height="${6 * s}" rx="${s}" fill="${borderColor}" opacity="0.2" />
    </g>
  `;
}

function generateLegendIconBasket(x: number, y: number, style: CourseStyle, s: number): string {
  const h = 14 * s;
  return `
    <g transform="translate(${x}, ${y - h + 10 * s})">
      <rect x="${5 * s}" y="${9 * s}" width="${s}" height="${5 * s}" fill="${style.basketPoleColor}" />
      <path d="M${2 * s} ${6 * s} L${10 * s} ${6 * s} L${9 * s} ${9 * s} L${3 * s} ${9 * s} Z" fill="${style.basketBodyColor}" stroke="${darkenColor(style.basketBodyColor)}" stroke-width="${0.5 * s}" />
      <path d="M${3 * s} ${3 * s} L${3 * s} ${6 * s} M${5.5 * s} ${2 * s} L${5.5 * s} ${6 * s} M${8 * s} ${3 * s} L${8 * s} ${6 * s}" stroke="${style.basketChainColor}" stroke-width="${0.8 * s}" />
      <ellipse cx="${5.5 * s}" cy="${2 * s}" rx="${4 * s}" ry="${1.2 * s}" fill="${style.basketTopColor}" stroke="${darkenColor(style.basketTopColor)}" stroke-width="${0.5 * s}" />
    </g>
  `;
}

function generateLegendIconDropzone(x: number, y: number, color: string, s: number): string {
  const borderColor = darkenColor(color);
  const w = 16 * s, h = 10 * s, rx = 2 * s;
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${color}" stroke="${borderColor}" stroke-width="${s}" />
      <rect x="${2 * s}" y="${2 * s}" width="${12 * s}" height="${6 * s}" rx="${s}" fill="none" stroke="${borderColor}" stroke-width="${0.5 * s}" opacity="0.4" />
    </g>
  `;
}

function generateLegendIconMandatory(x: number, y: number, color: string, s: number): string {
  const borderColor = darkenColor(color);
  // Arrow shape pointing right
  return `
    <g transform="translate(${x}, ${y})">
      <path d="M0 ${3 * s} L${8 * s} ${3 * s} L${8 * s} ${1 * s} L${12 * s} ${5 * s} L${8 * s} ${9 * s} L${8 * s} ${7 * s} L0 ${7 * s} Z" fill="${color}" stroke="${borderColor}" stroke-width="${0.8 * s}" stroke-linejoin="round" />
    </g>
  `;
}

function generateLegendSVG(
  x: number,
  y: number,
  style: CourseStyle,
  _config: ExportConfig,
  scale: number = 1
): string {
  const itemHeight = 24 * scale;
  const iconSize = 16 * scale;
  const padding = 12 * scale;
  const width = 140 * scale;
  const itemCount = 7;
  const height = itemCount * itemHeight + 2 * padding + 24 * scale;

  let legendSVG = `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="${4 * scale}" fill="white" stroke="#e5e7eb" stroke-width="${scale}" />
      <text x="${padding}" y="${padding + 14 * scale}" font-family="Arial, sans-serif" font-weight="bold" font-size="${12 * scale}" fill="#374151">Legend</text>
  `;

  const items: { label: string; icon: string }[] = [
    { label: 'Tee', icon: generateLegendIconTee(padding, padding + 24 * scale + 0 * itemHeight, style.defaultTeeColor, scale) },
    { label: 'Basket', icon: generateLegendIconBasket(padding, padding + 24 * scale + 1 * itemHeight, style, scale) },
    { label: 'Flight Line', icon: `<line x1="${padding}" y1="${padding + 24 * scale + 2 * itemHeight + iconSize / 3}" x2="${padding + iconSize}" y2="${padding + 24 * scale + 2 * itemHeight + iconSize / 3}" stroke="${style.defaultFlightLineColor}" stroke-width="${2 * scale}" stroke-dasharray="${4 * scale} ${2 * scale}" />` },
    { label: 'OB Zone', icon: `<rect x="${padding}" y="${padding + 24 * scale + 3 * itemHeight}" width="${iconSize}" height="${iconSize * 0.6}" rx="${2 * scale}" fill="${style.obZoneColor}" fill-opacity="0.5" stroke="${style.obZoneColor}" stroke-width="${scale}" stroke-dasharray="${3 * scale} ${1.5 * scale}" />` },
    { label: 'Fairway', icon: `<rect x="${padding}" y="${padding + 24 * scale + 4 * itemHeight}" width="${iconSize}" height="${iconSize * 0.6}" rx="${2 * scale}" fill="${style.fairwayColor}" fill-opacity="0.7" />` },
    { label: 'Dropzone', icon: generateLegendIconDropzone(padding, padding + 24 * scale + 5 * itemHeight, style.dropzoneColor, scale) },
    { label: 'Mandatory', icon: generateLegendIconMandatory(padding, padding + 24 * scale + 6 * itemHeight, style.mandatoryColor, scale) },
  ];

  items.forEach((item, index) => {
    const itemY = padding + 24 * scale + index * itemHeight;
    const labelX = padding + iconSize + 8 * scale;

    legendSVG += `
      ${item.icon}
      <text x="${labelX}" y="${itemY + iconSize / 2}" font-family="Arial, sans-serif" font-size="${10 * scale}" fill="#374151">${item.label}</text>
    `;
  });

  legendSVG += '</g>';
  return legendSVG;
}

// ============ MAIN EXPORT FUNCTION ============

export interface SVGExportOptions extends ExportConfig {
  course: Course;
  selectedHoleIds?: string[];
}

export function generateCourseSVG(options: SVGExportOptions): string {
  const { course, width, height, includeLegend, includeTitle, includeHoleNumbers } = options;
  const includeTerrain = options.includeTerrain ?? true;
  const includeCompass = options.includeCompass ?? true;
  const includeScaleBar = options.includeScaleBar ?? true;
  const includeInfrastructure = options.includeInfrastructure ?? true;
  const padding = 50;

  // Reset pattern IDs for consistent generation
  resetPatternIds();

  // Get holes to export
  let holesToExport: Hole[];
  if (options.holes === 'all') {
    holesToExport = course.holes;
  } else if (options.holes === 'current' && options.selectedHoleIds?.length) {
    holesToExport = course.holes.filter((h) => options.selectedHoleIds?.includes(h.id));
  } else if (Array.isArray(options.holes)) {
    holesToExport = course.holes.filter((_, i) => (options.holes as number[]).includes(i));
  } else {
    holesToExport = course.holes;
  }

  // Get all features
  const allFeatures = holesToExport.flatMap((h) => h.features);

  // Calculate bounds with padding
  const bounds = calculateBounds(allFeatures);
  if (!bounds) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="50%" y="50%" text-anchor="middle">No features to export</text></svg>`;
  }

  // Add 10% padding to bounds
  const lngPadding = (bounds.maxLng - bounds.minLng) * 0.1;
  const latPadding = (bounds.maxLat - bounds.minLat) * 0.1;
  bounds.minLng -= lngPadding;
  bounds.maxLng += lngPadding;
  bounds.minLat -= latPadding;
  bounds.maxLat += latPadding;

  const viewport: SVGViewport = { width, height, padding, bounds };
  const style = course.style;

  // Calculate meters per pixel for scale bar
  const lngRange = bounds.maxLng - bounds.minLng;
  const metersPerDegree = 111320 * Math.cos((bounds.minLat + bounds.maxLat) / 2 * Math.PI / 180);
  const metersPerPixel = (lngRange * metersPerDegree) / (width - 2 * padding);

  // Collect patterns
  const terrainPatternMap: Map<string, string> = new Map();
  let defsContent = '';

  // Start SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Generate default terrain background
  if (includeTerrain) {
    const defaultTerrainType = style.defaultTerrain ?? 'grass';
    const defaultTerrainPattern = TERRAIN_PATTERNS[defaultTerrainType];
    const bgColors = {
      primary: defaultTerrainPattern.defaultColors.primary,
      secondary: defaultTerrainPattern.defaultColors.secondary,
      accent: defaultTerrainPattern.defaultColors.accent ?? defaultTerrainPattern.defaultColors.primary,
    };

    // Generate background pattern
    const { id: bgPatternId, svg: bgPatternSvg } = generateTerrainPattern(defaultTerrainType, bgColors, 1.5);
    defsContent += bgPatternSvg;
    terrainPatternMap.set('background', bgPatternId);

    // Add defs and background
    svg += `<defs>${defsContent}</defs>`;
    svg += `<rect width="${width}" height="${height}" fill="url(#${bgPatternId})" />`;

    // Add subtle vignette for depth
    const vignetteId = `vignette_${Date.now()}`;
    svg = svg.replace('</defs>', `
      <radialGradient id="${vignetteId}" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="#000" stop-opacity="0" />
        <stop offset="70%" stop-color="#000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000" stop-opacity="0.15" />
      </radialGradient>
    </defs>`);
    svg += `<rect width="${width}" height="${height}" fill="url(#${vignetteId})" />`;

    // Add frame
    svg += `<rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="${darkenColor(bgColors.primary)}" stroke-width="3" rx="8" />`;
  } else {
    svg += `<defs></defs>`;
    svg += `<rect width="${width}" height="${height}" fill="#f8fafc" />`;
  }

  // Infrastructure terrain features (on top of default terrain)
  if (includeInfrastructure) {
    const infrastructure = allFeatures.filter((f) => f.properties.type === 'infrastructure');
    infrastructure.forEach((f) => {
      const props = f.properties as InfrastructureProperties;
      const colors = getTerrainColors(props.terrainType, props.customColors);

      // Generate pattern if not already created
      const patternKey = props.terrainType + JSON.stringify(colors);
      let patternId = terrainPatternMap.get(patternKey);
      if (!patternId) {
        const { id, svg: patternSvg } = generateTerrainPattern(props.terrainType, colors, 1);
        patternId = id;
        terrainPatternMap.set(patternKey, patternId);
        // Inject pattern into defs
        svg = svg.replace('</defs>', `${patternSvg}</defs>`);
      }

      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      const cornerRadius = props.cornerRadius ?? 0;

      // Convert corner radius from meters to pixels
      const radiusInPixels = cornerRadius > 0 ? cornerRadius / metersPerPixel : 0;

      if (radiusInPixels > 0) {
        // Use path with rounded corners
        const pathD = polygonToPath(coords, viewport, radiusInPixels);
        svg += `<path d="${pathD}" fill="url(#${patternId})" opacity="${props.opacity ?? 0.9}" />`;
      } else {
        // Use simple polygon
        const points = polygonCoordsToSVG(coords, viewport);
        svg += `<polygon points="${points}" fill="url(#${patternId})" opacity="${props.opacity ?? 0.9}" />`;
      }
    });
  }

  // Fairways (bottom layer of game features)
  const fairways = allFeatures.filter((f) => f.properties.type === 'fairway');
  fairways.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const points = polygonCoordsToSVG(coords, viewport);
    svg += `<polygon points="${points}" fill="${style.fairwayColor}" fill-opacity="${style.fairwayOpacity}" />`;
  });

  // Dropzone Areas (boundary lines with gradient effect)
  const dropzoneAreas = allFeatures.filter((f) => f.properties.type === 'dropzoneArea');
  dropzoneAreas.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const props = f.properties as DropzoneAreaProperties;
    const fairwayInside = props.fairwayInside ?? true;

    // Draw gradient effects on both sides
    const pathD = lineStringToSVG(coords, viewport) + ' Z';

    // Fairway side (green) - offset depends on fairwayInside
    const greenOffset = fairwayInside ? -6 : 6;
    svg += `<path d="${pathD}" fill="none" stroke="#22c55e" stroke-width="12" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" />`;

    // OB side (red)
    const redOffset = fairwayInside ? 6 : -6;
    svg += `<path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="12" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" />`;

    // Main boundary line
    svg += `<path d="${pathD}" fill="none" stroke="${style.dropzoneAreaBorderColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  // OB Lines (with gradient effect showing fairway/OB sides)
  const obLines = allFeatures.filter((f) => f.properties.type === 'obLine');
  obLines.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][] }).coordinates;
    const props = f.properties as OBLineProperties;
    const path = lineStringToSVG(coords, viewport);
    const fairwaySide = props.fairwaySide || 'left';

    // Calculate perpendicular offset direction for gradient effects
    const greenOffset = fairwaySide === 'left' ? -6 : 6;
    const redOffset = fairwaySide === 'left' ? 6 : -6;

    // Fairway side (green glow)
    svg += `<path d="${path}" fill="none" stroke="#22c55e" stroke-width="12" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" stroke-linecap="round" stroke-linejoin="round" />`;

    // OB side (red glow)
    svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="12" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" stroke-linecap="round" stroke-linejoin="round" />`;

    // Main OB line
    svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  // OB Zones
  const obZones = allFeatures.filter((f) => f.properties.type === 'obZone');
  obZones.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const points = polygonCoordsToSVG(coords, viewport);
    svg += `<polygon points="${points}" fill="${style.obZoneColor}" fill-opacity="${style.obZoneOpacity}" stroke="${style.obZoneColor}" stroke-width="2" stroke-dasharray="8 4" />`;
  });

  // Flight Lines - use feature color or default
  const flightLines = allFeatures.filter((f) => f.properties.type === 'flightLine');
  flightLines.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][] }).coordinates;
    const path = lineStringToSVG(coords, viewport);
    const props = f.properties as FlightLineProperties;
    const lineColor = props.color || style.defaultFlightLineColor;
    svg += `<path d="${path}" fill="none" stroke="${lineColor}" stroke-width="${style.flightLineWidth}" stroke-dasharray="8 4" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  // Flight Line Distance Labels
  flightLines.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][] }).coordinates as [number, number][];
    if (coords.length < 2) return;

    const props = f.properties as FlightLineProperties;
    const lineColor = props.color || style.defaultFlightLineColor;

    // Calculate midpoint
    const midIdx = Math.floor(coords.length / 2);
    const midPoint: [number, number] = coords.length === 2
      ? [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2]
      : coords[midIdx];

    // Calculate distance using simple approximation
    let totalDist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const dx = (coords[i + 1][0] - coords[i][0]) * 111320 * Math.cos((coords[i][1] + coords[i + 1][1]) / 2 * Math.PI / 180);
      const dy = (coords[i + 1][1] - coords[i][1]) * 110540;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }
    const distanceLabel = Math.round(totalDist) + 'm';

    // Convert midpoint to SVG coordinates
    const [labelX, labelY] = geoToSVG(midPoint, viewport);

    // Draw distance label
    const labelWidth = distanceLabel.length * 8 + 12;
    svg += `
      <g transform="translate(${labelX}, ${labelY - 12})">
        <rect x="${-labelWidth / 2}" y="-10" width="${labelWidth}" height="20" rx="10" fill="white" stroke="${lineColor}" stroke-width="2" />
        <text x="0" y="5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="${lineColor}">${distanceLabel}</text>
      </g>
    `;
  });

  // Dropzones
  const dropzones = allFeatures.filter((f) => f.properties.type === 'dropzone');
  dropzones.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const props = f.properties as DropzoneProperties;
    const dzColor = props.color || style.dropzoneColor;
    svg += generateDropzoneSVG(x, y, dzColor, 1, props.rotation ?? 0);
  });

  // Mandatories
  const mandatories = allFeatures.filter((f) => f.properties.type === 'mandatory');
  mandatories.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
    svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 1, props.lineAngle ?? 270, props.lineLength ?? 60);
  });

  // Landmarks
  const landmarks = allFeatures.filter((f) => f.properties.type === 'landmark');
  landmarks.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const props = f.properties as LandmarkProperties;
    svg += generateLandmarkSVG(props.landmarkType, x, y, {
      size: props.size ?? 1,
      rotation: props.rotation ?? 0,
      color: props.color,
    });
  });

  // Annotations
  const annotations = allFeatures.filter((f) => f.properties.type === 'annotation');
  annotations.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const props = f.properties as {
      text: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      textColor?: string;
      backgroundColor?: string;
      borderColor?: string;
    };
    svg += generateAnnotationSVG(
      x, y,
      props.text,
      props.fontSize || style.annotationFontSize,
      props.fontFamily || 'sans-serif',
      props.fontWeight || 'normal',
      props.textColor || style.annotationTextColor,
      props.backgroundColor || style.annotationBackgroundColor,
      props.borderColor || '#e5e7eb'
    );
  });

  // Tees
  const tees = allFeatures.filter((f) => f.properties.type === 'tee');
  tees.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const props = f.properties as TeeProperties;
    const teeColor = props.color || style.defaultTeeColor;
    const holeId = f.properties.holeId;
    const holeNumber = includeHoleNumbers
      ? holesToExport.find((h) => h.id === holeId)?.number
      : undefined;
    svg += generateTeeSVG(x, y, teeColor, holeNumber, props.name, 1, props.rotation ?? 0);
  });

  // Baskets
  const baskets = allFeatures.filter((f) => f.properties.type === 'basket');
  baskets.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const holeId = f.properties.holeId;
    const holeNumber = includeHoleNumbers
      ? holesToExport.find((h) => h.id === holeId)?.number
      : undefined;
    svg += generateBasketSVG(x, y, holeNumber, style);
  });

  // Title with styled background
  if (includeTitle) {
    svg += `
      <rect x="${width / 2 - 120}" y="12" width="240" height="36" rx="6" fill="#1f2937" opacity="0.9" />
      <text x="${width / 2}" y="38" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="20" fill="#ffffff">${course.name}</text>
    `;
  }

  // Compass Rose
  if (includeCompass && includeTerrain) {
    const compassX = width - 50;
    const compassY = 60;
    svg += generateCompassRose(compassX, compassY, 50, '#374151');
  }

  // Scale Bar
  if (includeScaleBar && includeTerrain) {
    const scaleX = padding + 10;
    const scaleY = height - 30;
    svg += generateScaleBar(scaleX, scaleY, metersPerPixel, 150, '#374151');
  }

  // Legend
  if (includeLegend) {
    const legendX = width - 160;
    const legendY = height - 240;
    svg += generateLegendSVG(legendX, legendY, style, options);
  }

  svg += '</svg>';
  return svg;
}

// ============ HOLE-BY-HOLE PDF EXPORT DATA ============

export interface HoleExportData {
  holeNumber: number;
  holeName?: string;
  par: number;
  notes?: string;
  rules?: string[];
  svgContent: string;
}

export function generateHoleExportData(
  course: Course,
  config: ExportConfig
): HoleExportData[] {
  return course.holes.map((hole) => {
    const holeOptions: SVGExportOptions = {
      ...config,
      course: { ...course, holes: [hole] },
      holes: 'all',
      includeTitle: false,
      includeLegend: false,
    };

    return {
      holeNumber: hole.number,
      holeName: hole.name,
      par: hole.par,
      notes: hole.notes,
      rules: hole.rules,
      svgContent: generateCourseSVG(holeOptions),
    };
  });
}

// ============ PRINT LAYOUT GENERATOR ============

export interface PrintLayoutOptions extends ExportConfig {
  course: Course;
  units: 'meters' | 'feet';
}

export function generatePrintLayoutSVG(options: PrintLayoutOptions): string {
  const { course, width, height, includeLegend } = options;
  const style = course.style;

  // Layout dimensions
  const headerHeight = 60;
  const footerHeight = 120;
  const mapPadding = 20;
  const mapWidth = width - 2 * mapPadding;
  const mapHeight = height - headerHeight - footerHeight - 2 * mapPadding;

  // Get all features
  const allFeatures = course.holes.flatMap((h) => h.features);
  const bounds = calculateBounds(allFeatures);

  if (!bounds) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="50%" y="50%" text-anchor="middle">No features to export</text></svg>`;
  }

  // Add padding to bounds
  const lngPadding = (bounds.maxLng - bounds.minLng) * 0.1;
  const latPadding = (bounds.maxLat - bounds.minLat) * 0.1;
  bounds.minLng -= lngPadding;
  bounds.maxLng += lngPadding;
  bounds.minLat -= latPadding;
  bounds.maxLat += latPadding;

  const mapViewport: SVGViewport = {
    width: mapWidth,
    height: mapHeight,
    padding: 20,
    bounds,
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="white" />`;

  // Header
  svg += `
    <rect x="0" y="0" width="${width}" height="${headerHeight}" fill="#1f2937" />
    <text x="${width / 2}" y="${headerHeight / 2 + 8}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="white">${course.name}</text>
  `;

  if (course.location.name) {
    svg += `<text x="${width / 2}" y="${headerHeight / 2 + 28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">${course.location.name}</text>`;
  }

  // Map area with border
  svg += `
    <g transform="translate(${mapPadding}, ${headerHeight + mapPadding})">
      <rect width="${mapWidth}" height="${mapHeight}" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" rx="4" />
  `;

  // Render features in map area
  const fairways = allFeatures.filter((f) => f.properties.type === 'fairway');
  fairways.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const points = polygonCoordsToSVG(coords, mapViewport);
    svg += `<polygon points="${points}" fill="${style.fairwayColor}" fill-opacity="${style.fairwayOpacity}" />`;
  });

  // Dropzone Areas
  const dropzoneAreas = allFeatures.filter((f) => f.properties.type === 'dropzoneArea');
  dropzoneAreas.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const props = f.properties as DropzoneAreaProperties;
    const fairwayInside = props.fairwayInside ?? true;
    const pathD = lineStringToSVG(coords, mapViewport) + ' Z';
    const greenOffset = fairwayInside ? -4 : 4;
    const redOffset = fairwayInside ? 4 : -4;
    svg += `<path d="${pathD}" fill="none" stroke="#22c55e" stroke-width="8" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" />`;
    svg += `<path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="8" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" />`;
    svg += `<path d="${pathD}" fill="none" stroke="${style.dropzoneAreaBorderColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  // OB Lines
  const obLines = allFeatures.filter((f) => f.properties.type === 'obLine');
  obLines.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][] }).coordinates;
    const props = f.properties as OBLineProperties;
    const path = lineStringToSVG(coords, mapViewport);
    const fairwaySide = props.fairwaySide || 'left';
    const greenOffset = fairwaySide === 'left' ? -4 : 4;
    const redOffset = fairwaySide === 'left' ? 4 : -4;
    svg += `<path d="${path}" fill="none" stroke="#22c55e" stroke-width="8" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" stroke-linecap="round" />`;
    svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="8" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" stroke-linecap="round" />`;
    svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  const obZones = allFeatures.filter((f) => f.properties.type === 'obZone');
  obZones.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const points = polygonCoordsToSVG(coords, mapViewport);
    svg += `<polygon points="${points}" fill="${style.obZoneColor}" fill-opacity="${style.obZoneOpacity}" stroke="${style.obZoneColor}" stroke-width="2" stroke-dasharray="8 4" />`;
  });

  const flightLines = allFeatures.filter((f) => f.properties.type === 'flightLine');
  flightLines.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][] }).coordinates;
    const path = lineStringToSVG(coords, mapViewport);
    const props = f.properties as FlightLineProperties;
    const lineColor = props.color || style.defaultFlightLineColor;
    svg += `<path d="${path}" fill="none" stroke="${lineColor}" stroke-width="${style.flightLineWidth}" stroke-dasharray="8 4" stroke-linecap="round" />`;
  });

  const dropzones = allFeatures.filter((f) => f.properties.type === 'dropzone');
  dropzones.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as DropzoneProperties;
    const dzColor = props.color || style.dropzoneColor;
    svg += generateDropzoneSVG(x, y, dzColor, 0.8, props.rotation ?? 0);
  });

  const mandatories = allFeatures.filter((f) => f.properties.type === 'mandatory');
  mandatories.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
    svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 0.8, props.lineAngle ?? 270, (props.lineLength ?? 60) * 0.8);
  });

  // Landmarks
  const landmarks = allFeatures.filter((f) => f.properties.type === 'landmark');
  landmarks.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as LandmarkProperties;
    svg += generateLandmarkSVG(props.landmarkType, x, y, {
      size: (props.size ?? 1) * 0.8,
      rotation: props.rotation ?? 0,
      color: props.color,
    });
  });

  // Annotations
  const annotations = allFeatures.filter((f) => f.properties.type === 'annotation');
  annotations.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as {
      text: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      textColor?: string;
      backgroundColor?: string;
      borderColor?: string;
    };
    svg += generateAnnotationSVG(
      x, y,
      props.text,
      (props.fontSize || style.annotationFontSize) * 0.8,
      props.fontFamily || 'sans-serif',
      props.fontWeight || 'normal',
      props.textColor || style.annotationTextColor,
      props.backgroundColor || style.annotationBackgroundColor,
      props.borderColor || '#e5e7eb',
      0.8
    );
  });

  const tees = allFeatures.filter((f) => f.properties.type === 'tee');
  tees.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as TeeProperties;
    const teeColor = props.color || style.defaultTeeColor;
    const holeId = f.properties.holeId;
    const holeNumber = course.holes.find((h) => h.id === holeId)?.number;
    svg += generateTeeSVG(x, y, teeColor, holeNumber, props.name, 0.8, props.rotation ?? 0);
  });

  const baskets = allFeatures.filter((f) => f.properties.type === 'basket');
  baskets.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const holeId = f.properties.holeId;
    const holeNumber = course.holes.find((h) => h.id === holeId)?.number;
    svg += generateBasketSVG(x, y, holeNumber, style, 0.8);
  });

  svg += '</g>'; // End map area

  // Footer with hole info table
  const footerY = height - footerHeight;
  svg += `<line x1="0" y1="${footerY}" x2="${width}" y2="${footerY}" stroke="#e2e8f0" stroke-width="1" />`;

  // Hole info table
  const tableStartX = mapPadding;
  const tableStartY = footerY + 20;
  const rowHeight = 20;

  // Table header
  svg += `
    <text x="${tableStartX}" y="${tableStartY}" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#374151">Hole</text>
    <text x="${tableStartX + 60}" y="${tableStartY}" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#374151">Par</text>
  `;

  // Table rows (max 9 holes per row, then wrap)
  const holesPerRow = 9;
  course.holes.forEach((hole, index) => {
    const row = Math.floor(index / holesPerRow);
    const col = index % holesPerRow;
    const x = tableStartX + col * 70;
    const y = tableStartY + (row + 1) * rowHeight;

    svg += `
      <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="9" fill="#374151">${hole.number}</text>
      <text x="${x + 25}" y="${y}" font-family="Arial, sans-serif" font-size="9" fill="#374151">${hole.par}</text>
    `;
  });

  // Legend (if enabled)
  if (includeLegend) {
    const legendX = width - 160;
    const legendY = footerY + 10;
    svg += generateLegendSVG(legendX, legendY, style, options, 0.8);
  }

  // Course totals
  const totalPar = course.holes.reduce((sum, h) => sum + h.par, 0);
  svg += `
    <text x="${width - 100}" y="${footerY + 100}" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#374151">Total Par: ${totalPar}</text>
    <text x="${width - 100}" y="${footerY + 115}" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">${course.holes.length} holes</text>
  `;

  svg += '</svg>';
  return svg;
}

// ============ SINGLE HOLE PDF PAGE ============

export function generateHolePageSVG(
  hole: Hole,
  course: Course,
  options: PrintLayoutOptions
): string {
  const { width, height } = options;
  const style = course.style;

  const headerHeight = 80;
  const infoHeight = 100;
  const mapHeight = height - headerHeight - infoHeight - 40;

  const holeFeatures = hole.features;
  const bounds = calculateBounds(holeFeatures);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="white" />`;

  // Header
  svg += `
    <rect x="0" y="0" width="${width}" height="${headerHeight}" fill="#1f2937" />
    <text x="30" y="35" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="white">${course.name}</text>
    <text x="30" y="60" font-family="Arial, sans-serif" font-size="28" fill="#60a5fa">Hole ${hole.number}</text>
    <text x="${width - 30}" y="50" text-anchor="end" font-family="Arial, sans-serif" font-weight="bold" font-size="36" fill="white">Par ${hole.par}</text>
  `;

  if (hole.name) {
    svg += `<text x="120" y="60" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">- ${hole.name}</text>`;
  }

  // Map area
  if (bounds) {
    const lngPadding = (bounds.maxLng - bounds.minLng) * 0.15;
    const latPadding = (bounds.maxLat - bounds.minLat) * 0.15;
    bounds.minLng -= lngPadding;
    bounds.maxLng += lngPadding;
    bounds.minLat -= latPadding;
    bounds.maxLat += latPadding;

    const mapViewport: SVGViewport = {
      width: width - 60,
      height: mapHeight,
      padding: 30,
      bounds,
    };

    svg += `<g transform="translate(30, ${headerHeight + 20})">`;
    svg += `<rect width="${width - 60}" height="${mapHeight}" fill="#f8fafc" stroke="#e2e8f0" rx="8" />`;

    // Render hole features
    holeFeatures.filter((f) => f.properties.type === 'fairway').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      svg += `<polygon points="${polygonCoordsToSVG(coords, mapViewport)}" fill="${style.fairwayColor}" fill-opacity="${style.fairwayOpacity}" />`;
    });

    // Dropzone Areas
    holeFeatures.filter((f) => f.properties.type === 'dropzoneArea').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      const props = f.properties as DropzoneAreaProperties;
      const fairwayInside = props.fairwayInside ?? true;
      const pathD = lineStringToSVG(coords, mapViewport) + ' Z';
      const greenOffset = fairwayInside ? -5 : 5;
      const redOffset = fairwayInside ? 5 : -5;
      svg += `<path d="${pathD}" fill="none" stroke="#22c55e" stroke-width="10" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" />`;
      svg += `<path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="10" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" />`;
      svg += `<path d="${pathD}" fill="none" stroke="${style.dropzoneAreaBorderColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    });

    // OB Lines
    holeFeatures.filter((f) => f.properties.type === 'obLine').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][] }).coordinates;
      const props = f.properties as OBLineProperties;
      const path = lineStringToSVG(coords, mapViewport);
      const fairwaySide = props.fairwaySide || 'left';
      const greenOffset = fairwaySide === 'left' ? -5 : 5;
      const redOffset = fairwaySide === 'left' ? 5 : -5;
      svg += `<path d="${path}" fill="none" stroke="#22c55e" stroke-width="10" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" stroke-linecap="round" />`;
      svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="10" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" stroke-linecap="round" />`;
      svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    });

    holeFeatures.filter((f) => f.properties.type === 'obZone').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      svg += `<polygon points="${polygonCoordsToSVG(coords, mapViewport)}" fill="${style.obZoneColor}" fill-opacity="${style.obZoneOpacity}" stroke="${style.obZoneColor}" stroke-width="2" stroke-dasharray="8 4" />`;
    });

    holeFeatures.filter((f) => f.properties.type === 'flightLine').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][] }).coordinates;
      const props = f.properties as FlightLineProperties;
      const lineColor = props.color || style.defaultFlightLineColor;
      svg += `<path d="${lineStringToSVG(coords, mapViewport)}" fill="none" stroke="${lineColor}" stroke-width="${style.flightLineWidth * 1.5}" stroke-dasharray="12 6" stroke-linecap="round" />`;
    });

    holeFeatures.filter((f) => f.properties.type === 'dropzone').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as DropzoneProperties;
      const dzColor = props.color || style.dropzoneColor;
      svg += generateDropzoneSVG(x, y, dzColor, 1.2, props.rotation ?? 0);
    });

    holeFeatures.filter((f) => f.properties.type === 'mandatory').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
      svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 1.2, props.lineAngle ?? 270, (props.lineLength ?? 60) * 1.2);
    });

    // Landmarks
    holeFeatures.filter((f) => f.properties.type === 'landmark').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as LandmarkProperties;
      svg += generateLandmarkSVG(props.landmarkType, x, y, {
        size: (props.size ?? 1) * 1.2,
        rotation: props.rotation ?? 0,
        color: props.color,
      });
    });

    // Annotations
    holeFeatures.filter((f) => f.properties.type === 'annotation').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as {
        text: string;
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: string;
        textColor?: string;
        backgroundColor?: string;
        borderColor?: string;
      };
      svg += generateAnnotationSVG(
        x, y,
        props.text,
        (props.fontSize || style.annotationFontSize) * 1.2,
        props.fontFamily || 'sans-serif',
        props.fontWeight || 'normal',
        props.textColor || style.annotationTextColor,
        props.backgroundColor || style.annotationBackgroundColor,
        props.borderColor || '#e5e7eb',
        1.2
      );
    });

    holeFeatures.filter((f) => f.properties.type === 'tee').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as TeeProperties;
      const teeColor = props.color || style.defaultTeeColor;
      svg += generateTeeSVG(x, y, teeColor, hole.number, props.name, 1.2, props.rotation ?? 0);
    });

    holeFeatures.filter((f) => f.properties.type === 'basket').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      svg += generateBasketSVG(x, y, hole.number, style, 1.2);
    });

    svg += '</g>';
  }

  // Info section
  const infoY = height - infoHeight;

  svg += `<line x1="0" y1="${infoY}" x2="${width}" y2="${infoY}" stroke="#e2e8f0" stroke-width="1" />`;

  // Notes
  if (hole.notes) {
    const boxY = infoY + 20;
    svg += `
      <text x="30" y="${boxY + 20}" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#374151">Notes:</text>
      <text x="30" y="${boxY + 40}" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">${hole.notes.substring(0, 100)}${hole.notes.length > 100 ? '...' : ''}</text>
    `;
  }

  svg += '</svg>';
  return svg;
}

// ============ DOWNLOAD HELPER ============

export function downloadSVG(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
