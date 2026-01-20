import type { Course, Hole, TeeProperties, FlightLineProperties, DropzoneProperties, OBLineProperties, DropzoneAreaProperties, TerrainFeature, TerrainFeatureProperties, PathFeature, MandatoryProperties } from '../../../types/course';
import { TERRAIN_PATTERNS, getTerrainColors } from '../../../types/terrain';
import type { TreeType } from '../../../types/trees';
import { TREE_PATTERNS, getTreeImagePath } from '../../../types/trees';
import { generateGrassImageBackground, generateHighgrassImageBackground, generateTerrainPattern, resetPatternIds } from '../../svgPatterns';
import { getCachedTreeImage } from '../../treeSvg';
import { calculateBounds, geoToSVG, polygonCoordsToSVG, lineStringToSVG } from '../coordinate-transform';
import type { SVGViewport } from '../coordinate-transform';
import { generateTeeSVG, generateBasketTopViewSVG, generateDropzoneSVG, generateMandatorySVG, darkenColor } from '../svg-markers';

export interface TeeSignOptions {
  hole: Hole;
  course: Course;
  width?: number;      // default 794 (A4 portrait width)
  height?: number;     // default 1123 (A4 portrait height)
  units: 'meters' | 'feet';
  includeNotes: boolean;
  includeRules: boolean;
  includeLegend: boolean;
  includeCourseName: boolean;
  logoDataUrl?: string; // Base64 data URL for club logo (displayed at bottom of sidebar)
}

interface TeeDistanceInfo {
  teeName?: string;
  color: string;
  distance: number;
  position?: string;
}

export function getHoleDistances(
  hole: Hole,
  course: Course,
  units: 'meters' | 'feet'
): TeeDistanceInfo[] {
  const basket = hole.features.find(f => f.properties.type === 'basket');
  const tees = hole.features.filter(f => f.properties.type === 'tee');
  const flightLines = hole.features.filter(f => f.properties.type === 'flightLine');

  if (!basket || tees.length === 0) return [];

  return tees.map(tee => {
    const props = tee.properties as TeeProperties;

    // Look for a flight line starting from this tee
    const flightLine = flightLines.find(fl => {
      const flProps = fl.properties as FlightLineProperties;
      return flProps.startFeatureId === props.id;
    });

    let distance: number;

    if (flightLine) {
      // Calculate distance along the flight line
      const coords = (flightLine.geometry as { coordinates: number[][] }).coordinates;
      let totalDist = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const dx = (coords[i + 1][0] - coords[i][0]) * 111320 * Math.cos((coords[i][1] + coords[i + 1][1]) / 2 * Math.PI / 180);
        const dy = (coords[i + 1][1] - coords[i][1]) * 110540;
        totalDist += Math.sqrt(dx * dx + dy * dy);
      }
      distance = totalDist;
    } else {
      // Calculate straight-line distance from tee to basket
      const teeCoords = (tee.geometry as { coordinates: number[] }).coordinates;
      const basketCoords = (basket.geometry as { coordinates: number[] }).coordinates;
      const dx = (basketCoords[0] - teeCoords[0]) * 111320 * Math.cos((teeCoords[1] + basketCoords[1]) / 2 * Math.PI / 180);
      const dy = (basketCoords[1] - teeCoords[1]) * 110540;
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    // Convert to feet if needed
    if (units === 'feet') {
      distance = distance * 3.28084;
    }

    return {
      teeName: props.name,
      color: props.color || course.style.defaultTeeColor,
      distance: Math.round(distance),
    };
  });
}

export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.5;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

// Escape special XML characters in text
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Sole/insole shape - normalized points (0-1 range)
const SOLE_SHAPE: Array<[number, number]> = [
  [0.184, 0.504], [0.132, 0.467], [0.083, 0.431], [0.039, 0.394], [0.013, 0.357],
  [0.009, 0.321], [0.013, 0.284], [0.018, 0.247], [0.031, 0.21], [0.048, 0.174],
  [0.07, 0.137], [0.101, 0.1], [0.145, 0.063], [0.211, 0.027], [0.307, 0.005],
  [0.404, 0.0], [0.5, 0.008], [0.596, 0.028], [0.689, 0.06], [0.768, 0.097],
  [0.825, 0.134], [0.877, 0.17], [0.917, 0.207], [0.952, 0.244], [0.974, 0.28],
  [0.991, 0.317], [1.0, 0.354], [1.0, 0.391], [0.987, 0.427], [0.969, 0.464],
  [0.943, 0.501], [0.917, 0.538], [0.89, 0.574], [0.873, 0.611], [0.855, 0.648],
  [0.846, 0.684], [0.838, 0.721], [0.825, 0.758], [0.811, 0.795], [0.794, 0.831],
  [0.772, 0.868], [0.737, 0.905], [0.684, 0.942], [0.592, 0.975], [0.496, 0.995],
  [0.399, 1.0], [0.303, 0.997], [0.206, 0.987], [0.11, 0.958], [0.048, 0.922],
  [0.013, 0.885], [0.0, 0.848], [0.004, 0.811], [0.026, 0.773], [0.057, 0.736],
  [0.092, 0.703], [0.145, 0.663], [0.184, 0.629], [0.219, 0.591], [0.228, 0.554],
  [0.202, 0.518]
];

// Generate blob path from sole shape - scales to fit area
function generateOrganicBlobPath(
  cx: number,
  cy: number,
  width: number,
  height: number,
  _seed: number = 42
): string {
  const halfW = width / 2;
  const halfH = height / 2;

  // Scale and position the sole shape points
  const points = SOLE_SHAPE.map(([nx, ny]) => ({
    x: cx - halfW + nx * width,
    y: cy - halfH + ny * height
  }));

  // Build smooth bezier path through points for flowing curves
  const numPoints = points.length;
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < numPoints; i++) {
    const p0 = points[(i - 1 + numPoints) % numPoints];
    const p1 = points[i];
    const p2 = points[(i + 1) % numPoints];
    const p3 = points[(i + 2) % numPoints];

    // Catmull-Rom to Bezier conversion for smooth curves
    const tension = 0.4;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  path += ' Z';
  return path;
}

// Generate tree SVG using <use> reference to defined image (avoids duplicating base64)
// metersPerPixel allows scaling trees to realistic sizes (crown width ~8-12 meters)
function generateTreeUseRef(
  x: number,
  y: number,
  treeType: TreeType,
  size: number,
  rotation: number,
  opacity: number = 1,
  metersPerPixel?: number
): string {
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.tree1;

  let heightPx: number;
  if (metersPerPixel && metersPerPixel > 0) {
    // Realistic tree crown size: 4-6 meters for typical trees viewed from above
    const treeCrownMeters = 5 * size;
    heightPx = treeCrownMeters / metersPerPixel;
    // Clamp to reasonable pixel range to prevent oversized trees
    heightPx = Math.min(heightPx, 60);
  } else {
    // Fallback to fixed pixel size for UI rendering
    heightPx = pattern.defaultSize * size;
  }

  const widthPx = heightPx * pattern.aspectRatio;
  const imgX = x - widthPx / 2;
  const imgY = y - heightPx / 2;

  return `<use href="#tree_img_${treeType}" x="${imgX.toFixed(2)}" y="${imgY.toFixed(2)}" width="${widthPx.toFixed(2)}" height="${heightPx.toFixed(2)}" transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}" />`;
}

export function generateTeeSignSVG(options: TeeSignOptions): string {
  const {
    hole,
    course,
    width = 794,
    height = 1123,
    units,
    includeNotes,
    includeLegend,
    logoDataUrl,
  } = options;

  const style = course.style;

  // Reset pattern IDs for consistent generation
  resetPatternIds();

  // Layout dimensions - full width blob design
  const pagePadding = 30;
  const infoAreaWidth = 180; // Left side info area
  const blobPadding = 30; // Reduced padding inside blob for better fill

  // Blob dimensions - positioned to leave room for info on left
  const blobWidth = width - infoAreaWidth - pagePadding;
  const blobHeight = height - pagePadding * 2;
  const blobCenterX = infoAreaWidth + blobWidth / 2;
  const blobCenterY = pagePadding + blobHeight / 2;

  // Map area inside blob (smaller to fit within organic shape)
  const mapAreaWidth = blobWidth - blobPadding * 2;
  const mapAreaHeight = blobHeight - blobPadding * 2;
  const mapX = infoAreaWidth + blobPadding;
  const mapY = pagePadding + blobPadding;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // ============ BACKGROUND ============
  // Light gray textured background
  svg += `<defs>
    <pattern id="bg_dots" patternUnits="userSpaceOnUse" width="20" height="20">
      <circle cx="10" cy="10" r="1" fill="#d1d5db" opacity="0.5" />
    </pattern>
  </defs>`;
  svg += `<rect width="${width}" height="${height}" fill="#f3f4f6" />`;
  svg += `<rect width="${width}" height="${height}" fill="url(#bg_dots)" />`;

  // ============ ORGANIC BLOB SHAPE ============
  const blobSeed = hole.number * 12345 + course.id.charCodeAt(0);
  const blobPath = generateOrganicBlobPath(blobCenterX, blobCenterY, blobWidth * 0.98, blobHeight * 0.98, blobSeed);
  const blobClipId = `blob_clip_${hole.number}`;

  // ============ LEFT SIDE INFO ============
  const infoX = pagePadding;
  let infoY = pagePadding + 20;

  // Logo (if provided)
  if (logoDataUrl) {
    const logoSize = 100;
    svg += `<image href="${logoDataUrl}" x="${infoX}" y="${infoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`;
    infoY += logoSize + 30;
  } else {
    infoY += 40;
  }

  // PAR label
  svg += `<text x="${infoX}" y="${infoY}" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="28" fill="#1f2937">PAR ${hole.par}</text>`;
  infoY += 60;

  // Hole number (large)
  svg += `<text x="${infoX}" y="${infoY + 80}" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="140" fill="#1f2937">${hole.number}</text>`;
  infoY += 160;

  // Distance
  const distances = getHoleDistances(hole, course, units);
  const unitLabel = units === 'meters' ? 'M' : 'FT';
  if (distances.length > 0) {
    const mainDistance = distances[0];
    svg += `<text x="${infoX}" y="${infoY}" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="36" fill="#1f2937">${mainDistance.distance} ${unitLabel}</text>`;
    infoY += 50;
  }

  // Get hole features
  const holeFeatures = hole.features || [];

  // ============ NOTES FROM FEATURES ============
  if (includeNotes) {
    const notes: string[] = [];

    // Mandatories
    const mandatories = holeFeatures.filter(f => f.properties.type === 'mandatory');
    if (mandatories.length > 0) {
      mandatories.forEach((m, idx) => {
        const props = m.properties as MandatoryProperties;
        const rotation = props.rotation ?? 0;
        // Convert rotation to direction
        let direction = '';
        if (rotation >= 315 || rotation < 45) direction = '→';
        else if (rotation >= 45 && rotation < 135) direction = '↓';
        else if (rotation >= 135 && rotation < 225) direction = '←';
        else direction = '↑';
        const label = mandatories.length > 1 ? `Mando ${idx + 1}: ${direction}` : `Mando: ${direction}`;
        notes.push(label);
      });
    }

    // Dropzones
    const dropzones = holeFeatures.filter(f => f.properties.type === 'dropzone');
    if (dropzones.length > 0) {
      notes.push(`Dropzone${dropzones.length > 1 ? 's' : ''}: ${dropzones.length}`);
    }

    // OB zones/lines
    const obZones = holeFeatures.filter(f => f.properties.type === 'obZone');
    const obLines = holeFeatures.filter(f => f.properties.type === 'obLine');
    if (obZones.length > 0 || obLines.length > 0) {
      notes.push('OB zaznaczone na mapie');
    }

    // Hole notes
    if (hole.notes) {
      notes.push(hole.notes);
    }

    // Hole rules
    if (hole.rules && hole.rules.length > 0) {
      hole.rules.forEach(rule => notes.push(rule));
    }

    // Render notes
    if (notes.length > 0) {
      infoY += 10;
      const noteFontSize = 12;
      const noteLineHeight = 16;
      const maxNoteWidth = infoAreaWidth - 20;

      notes.forEach(note => {
        const wrappedLines = wrapText(note, maxNoteWidth, noteFontSize);
        wrappedLines.forEach(line => {
          svg += `<text x="${infoX}" y="${infoY}" font-family="Arial, sans-serif" font-size="${noteFontSize}" fill="#4b5563">${escapeXml(line)}</text>`;
          infoY += noteLineHeight;
        });
        infoY += 4; // Space between notes
      });
    }
  }
  const bounds = calculateBounds(holeFeatures);

  if (bounds) {
    // Find tee and basket for rotation calculation
    const firstTee = holeFeatures.find(f => f.properties.type === 'tee');
    const basket = holeFeatures.find(f => f.properties.type === 'basket');

    // Calculate map rotation so tee is at bottom pointing up
    let mapRotation = 0;
    if (firstTee && basket) {
      const teeCoords = (firstTee.geometry as { coordinates: number[] }).coordinates;
      const basketCoords = (basket.geometry as { coordinates: number[] }).coordinates;

      // Calculate bearing from tee to basket
      const dx = basketCoords[0] - teeCoords[0];
      const dy = basketCoords[1] - teeCoords[1];
      const geoAngleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
      mapRotation = geoAngleDeg - 90;
    }

    // Calculate bounds expansion needed for rotation
    // When a rectangle is rotated, its bounding box expands
    const rotationRad = mapRotation * Math.PI / 180;
    const cos = Math.abs(Math.cos(rotationRad));
    const sin = Math.abs(Math.sin(rotationRad));

    const origLngRange = bounds.maxLng - bounds.minLng;
    const origLatRange = bounds.maxLat - bounds.minLat;

    // Calculate the bounding box of the rotated rectangle
    const rotatedLngRange = origLngRange * cos + origLatRange * sin;
    const rotatedLatRange = origLngRange * sin + origLatRange * cos;

    // Calculate how much to expand bounds for rotation
    const lngExpansion = (rotatedLngRange - origLngRange) / 2;
    const latExpansion = (rotatedLatRange - origLatRange) / 2;

    bounds.minLng -= lngExpansion;
    bounds.maxLng += lngExpansion;
    bounds.minLat -= latExpansion;
    bounds.maxLat += latExpansion;

    // Calculate meters per degree for padding conversion
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
    const metersPerDegreeLat = 110540;

    // Add fixed padding for markers (in meters, then convert to degrees)
    // Tee marker ~40px, Basket marker ~50px at scale 1.0
    // We need to estimate the scale first to convert pixels to meters
    const viewportAspect = mapAreaHeight / mapAreaWidth;
    const boundsAspect = (bounds.maxLat - bounds.minLat) / (bounds.maxLng - bounds.minLng) * (metersPerDegreeLat / metersPerDegreeLng);

    // Estimate scale based on which dimension is limiting
    let estimatedMetersPerPixel: number;
    if (boundsAspect > viewportAspect) {
      // Height is limiting factor
      const boundsHeightMeters = (bounds.maxLat - bounds.minLat) * metersPerDegreeLat;
      estimatedMetersPerPixel = boundsHeightMeters / (mapAreaHeight - 10);
    } else {
      // Width is limiting factor
      const boundsWidthMeters = (bounds.maxLng - bounds.minLng) * metersPerDegreeLng;
      estimatedMetersPerPixel = boundsWidthMeters / (mapAreaWidth - 10);
    }

    // Add marker padding: minimal padding for tee/basket markers (will be refined after aspect ratio adjustment)
    const markerPaddingPixels = 35;
    const markerPaddingMeters = markerPaddingPixels * estimatedMetersPerPixel;
    const markerPaddingLng = markerPaddingMeters / metersPerDegreeLng;
    const markerPaddingLat = markerPaddingMeters / metersPerDegreeLat;

    bounds.minLng -= markerPaddingLng;
    bounds.maxLng += markerPaddingLng;
    bounds.minLat -= markerPaddingLat;
    bounds.maxLat += markerPaddingLat;

    // Adjust bounds aspect ratio to match viewport for optimal fill
    // This ensures the hole fills the available space
    const viewportPadding = 10;
    const contentWidth = mapAreaWidth - 2 * viewportPadding;
    const contentHeight = mapAreaHeight - 2 * viewportPadding;
    const targetAspect = contentHeight / contentWidth; // SVG aspect ratio (height/width)

    const boundsLngRange = bounds.maxLng - bounds.minLng;
    const boundsLatRange = bounds.maxLat - bounds.minLat;

    // Convert bounds to meters for accurate aspect calculation
    const boundsWidthMeters = boundsLngRange * metersPerDegreeLng;
    const boundsHeightMeters = boundsLatRange * metersPerDegreeLat;
    const currentAspect = boundsHeightMeters / boundsWidthMeters;

    // Expand bounds in the smaller dimension to match viewport aspect ratio
    if (currentAspect < targetAspect) {
      // Bounds are wider than viewport - expand height
      const newHeightMeters = boundsWidthMeters * targetAspect;
      const heightExpansionMeters = (newHeightMeters - boundsHeightMeters) / 2;
      const heightExpansionDeg = heightExpansionMeters / metersPerDegreeLat;
      bounds.minLat -= heightExpansionDeg;
      bounds.maxLat += heightExpansionDeg;
    } else {
      // Bounds are taller than viewport - expand width
      const newWidthMeters = boundsHeightMeters / targetAspect;
      const widthExpansionMeters = (newWidthMeters - boundsWidthMeters) / 2;
      const widthExpansionDeg = widthExpansionMeters / metersPerDegreeLng;
      bounds.minLng -= widthExpansionDeg;
      bounds.maxLng += widthExpansionDeg;
    }

    // Create viewport
    const mapViewport: SVGViewport = {
      width: mapAreaWidth,
      height: mapAreaHeight,
      padding: viewportPadding,
      bounds,
    };

    // Build defs content
    let defsContent = '';
    const terrainPatternMap: Map<string, string> = new Map();

    // Calculate meters per pixel for grass tile scaling
    const lngRange = bounds.maxLng - bounds.minLng;
    const metersPerDegree = 111320 * Math.cos((bounds.minLat + bounds.maxLat) / 2 * Math.PI / 180);
    const metersPerPixel = (lngRange * metersPerDegree) / (mapAreaWidth - 2 * mapViewport.padding);

    // Background pattern
    const defaultTerrainType = style.defaultTerrain ?? 'grass';
    let bgPatternId: string;
    let bgPatternSvg: string;

    if (defaultTerrainType === 'grass') {
      const grassPattern = generateGrassImageBackground('teesign_grass_bg', metersPerPixel, 10);
      bgPatternId = grassPattern.id;
      bgPatternSvg = grassPattern.svg;
    } else if (defaultTerrainType === 'roughGrass') {
      const highgrassPattern = generateHighgrassImageBackground('teesign_highgrass_bg', metersPerPixel, 10);
      bgPatternId = highgrassPattern.id;
      bgPatternSvg = highgrassPattern.svg;
    } else {
      const defaultTerrainPattern = TERRAIN_PATTERNS[defaultTerrainType];
      const bgColors = {
        primary: defaultTerrainPattern.defaultColors.primary,
        secondary: defaultTerrainPattern.defaultColors.secondary,
        accent: defaultTerrainPattern.defaultColors.accent ?? defaultTerrainPattern.defaultColors.primary,
      };
      const pattern = generateTerrainPattern(defaultTerrainType, bgColors, 1.5);
      bgPatternId = pattern.id;
      bgPatternSvg = pattern.svg;
    }
    defsContent += bgPatternSvg;

    // Add tree image definitions wrapped in symbols for proper scaling with <use>
    const treeTypes: TreeType[] = ['tree1', 'tree2', 'tree3', 'tree4'];
    treeTypes.forEach(treeType => {
      const cachedBase64 = getCachedTreeImage(treeType);
      const imageHref = cachedBase64 || getTreeImagePath(treeType).slice(1);
      // Wrap in <symbol> with viewBox so <use> width/height will scale it properly
      defsContent += `<symbol id="tree_img_${treeType}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <image href="${imageHref}" width="100" height="100" />
      </symbol>`;
    });

    // Clip path for organic blob shape
    defsContent += `<clipPath id="${blobClipId}"><path d="${blobPath}" /></clipPath>`;

    svg += `<defs>${defsContent}</defs>`;

    // Dark blob outline/shadow
    svg += `<path d="${blobPath}" fill="#1f2937" transform="translate(4, 4)" opacity="0.3" />`;
    svg += `<path d="${blobPath}" fill="#1f2937" />`;

    // Map content inside blob (slightly smaller for border effect)
    svg += `<g clip-path="url(#${blobClipId})">`;

    // Background fills the blob area
    const blobBoundsMinX = blobCenterX - blobWidth / 2;
    const blobBoundsMinY = blobCenterY - blobHeight / 2;
    if (defaultTerrainType === 'grass') {
      svg += `<rect x="${blobBoundsMinX - 50}" y="${blobBoundsMinY - 50}" width="${blobWidth + 100}" height="${blobHeight + 100}" fill="url(#${bgPatternId})" />`;
    } else {
      svg += `<rect x="${blobBoundsMinX - 50}" y="${blobBoundsMinY - 50}" width="${blobWidth + 100}" height="${blobHeight + 100}" fill="#1a2e1a" />`;
      svg += `<rect x="${blobBoundsMinX - 50}" y="${blobBoundsMinY - 50}" width="${blobWidth + 100}" height="${blobHeight + 100}" fill="url(#${bgPatternId})" opacity="0.7" />`;
    }

    // Inner group for map content positioning
    svg += `<g transform="translate(${mapX}, ${mapY})">`;

    // Calculate center for rotation
    const centerX = mapAreaWidth / 2;
    const centerY = mapAreaHeight / 2;

    // Apply rotation to all map content
    svg += `<g transform="rotate(${mapRotation} ${centerX} ${centerY})">`;

    // Course-level terrain features - separate forests from other terrain
    const forestFeatures: TerrainFeature[] = [];
    const otherTerrainFeatures: TerrainFeature[] = [];

    if (course.terrainFeatures && course.terrainFeatures.length > 0) {
      course.terrainFeatures.forEach((f: TerrainFeature) => {
        if (f.properties.terrainType === 'forest') {
          forestFeatures.push(f);
        } else {
          otherTerrainFeatures.push(f);
        }
      });
    }

    // Render non-forest terrain features
    otherTerrainFeatures.forEach((f: TerrainFeature) => {
      const props = f.properties as TerrainFeatureProperties;
      const colors = getTerrainColors(props.terrainType, props.customColors);

      const patternKey = props.terrainType + JSON.stringify(colors);
      let patternId = terrainPatternMap.get(patternKey);
      if (!patternId) {
        // Use image patterns for grass and roughGrass
        if (props.terrainType === 'grass') {
          const { id, svg: patternSvg } = generateGrassImageBackground(`terrain_grass_${Date.now()}`, metersPerPixel, 10);
          patternId = id;
          svg = svg.replace('</defs>', `${patternSvg}</defs>`);
        } else if (props.terrainType === 'roughGrass') {
          const { id, svg: patternSvg } = generateHighgrassImageBackground(`terrain_highgrass_${Date.now()}`, metersPerPixel, 10);
          patternId = id;
          svg = svg.replace('</defs>', `${patternSvg}</defs>`);
        } else {
          const { id, svg: patternSvg } = generateTerrainPattern(props.terrainType, colors, 1);
          patternId = id;
          svg = svg.replace('</defs>', `${patternSvg}</defs>`);
        }
        terrainPatternMap.set(patternKey, patternId);
      }

      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      const points = polygonCoordsToSVG(coords, mapViewport);
      svg += `<polygon points="${points}" fill="url(#${patternId})" opacity="${props.opacity ?? 0.85}" />`;
    });

    // Course-level path features
    if (course.pathFeatures && course.pathFeatures.length > 0) {
      course.pathFeatures.forEach((f: PathFeature) => {
        const props = f.properties;
        const coords = (f.geometry as { coordinates: number[][] }).coordinates;
        const path = lineStringToSVG(coords, mapViewport);
        const color = props.color || '#a8a29e';
        const strokeWidth = props.strokeWidth || 4;
        const opacity = props.opacity ?? 1;
        svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" />`;
      });
    }

    // Course-level tree features
    if (course.treeFeatures && course.treeFeatures.length > 0) {
      course.treeFeatures.forEach((f) => {
        const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
        const props = f.properties;
        svg += generateTreeUseRef(
          x, y,
          props.treeType,
          props.size ?? 1,
          props.rotation ?? 0,
          props.opacity ?? 1,
          metersPerPixel
        );
      });
    }

    // Forest terrain features - render as individual top-view trees
    forestFeatures.forEach((f: TerrainFeature) => {
      const props = f.properties as TerrainFeatureProperties;
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];

      // Convert polygon coordinates from geo to SVG
      const svgPolygon: Array<[number, number]> = coords.map(coord => {
        const [x, y] = geoToSVG(coord as [number, number], mapViewport);
        return [x, y] as [number, number];
      });

      // Get polygon bounds
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      svgPolygon.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });

      const polyWidth = maxX - minX;
      const polyHeight = maxY - minY;

      // Skip invalid polygons
      if (!isFinite(polyWidth) || !isFinite(polyHeight) || polyWidth <= 0 || polyHeight <= 0) {
        return;
      }

      const area = polyWidth * polyHeight;

      // Point in polygon check
      const pointInPoly = (px: number, py: number): boolean => {
        let inside = false;
        for (let i = 0, j = svgPolygon.length - 1; i < svgPolygon.length; j = i++) {
          const [xi, yi] = svgPolygon[i];
          const [xj, yj] = svgPolygon[j];
          if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
            inside = !inside;
          }
        }
        return inside;
      };

      // Seeded random for consistent tree placement
      const seedVal = props.id.charCodeAt(0) * 1000 + (props.id.charCodeAt(1) || 0);
      let seed = seedVal;
      const random = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };

      // Tree types distribution
      const treeTypes: TreeType[] = ['tree1', 'tree2', 'tree3', 'tree4'];
      const pickTreeType = (): TreeType => treeTypes[Math.floor(random() * treeTypes.length)];

      // Distance from point to line segment
      const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
      };

      // Minimum distance from point to polygon edge
      const distToPolygonEdge = (px: number, py: number): number => {
        let minDist = Infinity;
        for (let i = 0; i < svgPolygon.length; i++) {
          const j = (i + 1) % svgPolygon.length;
          const d = distToSegment(px, py, svgPolygon[i][0], svgPolygon[i][1], svgPolygon[j][0], svgPolygon[j][1]);
          if (d < minDist) minDist = d;
        }
        return minDist;
      };

      // Calculate tree spacing based on map scale
      // For dense forest canopy, trees should overlap slightly
      const treeSpacingMeters = 4; // Tight spacing for canopy overlap
      const edgeMarginMeters = 2; // Keep trees 2m from forest edge

      // Convert to pixels
      const minSpacing = Math.max(8, treeSpacingMeters / metersPerPixel);
      const edgeMargin = Math.max(4, edgeMarginMeters / metersPerPixel);

      // Calculate area in square meters for density calculation
      const areaMeters = area * metersPerPixel * metersPerPixel;
      // Dense forest: ~600-800 trees per hectare for full canopy coverage
      const treesPerHectare = 700;
      const rawTreeCount = Math.floor((areaMeters / 10000) * treesPerHectare);
      const treeCount = Math.max(5, Math.min(300, rawTreeCount)); // Cap at 300 trees per polygon

      // Generate tree placements
      const placements: Array<{ x: number; y: number; type: TreeType; size: number; rotation: number }> = [];
      let attempts = 0;
      const maxAttempts = treeCount * 50; // More attempts for denser placement

      while (placements.length < treeCount && attempts < maxAttempts) {
        attempts++;
        const x = minX + random() * polyWidth;
        const y = minY + random() * polyHeight;

        if (!pointInPoly(x, y)) continue;

        // Check distance from polygon edge
        if (distToPolygonEdge(x, y) < edgeMargin) continue;

        // Check spacing from other trees
        let tooClose = false;
        for (const p of placements) {
          const dx = p.x - x;
          const dy = p.y - y;
          if (dx * dx + dy * dy < minSpacing * minSpacing) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        placements.push({
          x,
          y,
          type: pickTreeType(),
          size: 1.2 + random() * 0.8, // Larger trees (1.2-2.0) for better coverage
          rotation: random() * 360,
        });
      }

      // Render trees (sorted by y for proper overlap)
      placements.sort((a, b) => a.y - b.y);
      placements.forEach(p => {
        svg += generateTreeUseRef(
          p.x, p.y,
          p.type,
          p.size,
          p.rotation,
          0.9 + random() * 0.1,
          metersPerPixel
        );
      });
    });

    // ============ HOLE FEATURES ============

    // Fairways
    holeFeatures.filter(f => f.properties.type === 'fairway').forEach(f => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      const points = polygonCoordsToSVG(coords, mapViewport);
      svg += `<polygon points="${points}" fill="${style.fairwayColor}" fill-opacity="${style.fairwayOpacity}" />`;
    });

    // Dropzone Areas
    holeFeatures.filter(f => f.properties.type === 'dropzoneArea').forEach(f => {
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
    holeFeatures.filter(f => f.properties.type === 'obLine').forEach(f => {
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

    // OB Zones
    holeFeatures.filter(f => f.properties.type === 'obZone').forEach(f => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      const points = polygonCoordsToSVG(coords, mapViewport);
      svg += `<polygon points="${points}" fill="${style.obZoneColor}" fill-opacity="${style.obZoneOpacity}" stroke="${style.obZoneColor}" stroke-width="2" stroke-dasharray="8 4" />`;
    });

    // Flight Lines
    holeFeatures.filter(f => f.properties.type === 'flightLine').forEach(f => {
      const coords = (f.geometry as { coordinates: number[][] }).coordinates;
      const props = f.properties as FlightLineProperties;
      const path = lineStringToSVG(coords, mapViewport);
      const lineColor = props.color || style.defaultFlightLineColor;
      svg += `<path d="${path}" fill="none" stroke="${lineColor}" stroke-width="${style.flightLineWidth * 1.5}" stroke-dasharray="12 6" stroke-linecap="round" />`;
    });

    // Dropzones - point toward basket (UP on teesign)
    holeFeatures.filter(f => f.properties.type === 'dropzone').forEach(f => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as DropzoneProperties;
      const dzColor = props.color || style.dropzoneColor;
      const dzPointsUp = 270 - mapRotation;
      svg += generateDropzoneSVG(x, y, dzColor, 1.0, dzPointsUp, false);
    });

    // Mandatories
    holeFeatures.filter(f => f.properties.type === 'mandatory').forEach(f => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as { rotation: number; lineAngle?: number };
      svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 1.0, props.lineAngle ?? 270);
    });

    // Tees - always point toward basket (UP on teesign)
    holeFeatures.filter(f => f.properties.type === 'tee').forEach(f => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as TeeProperties;
      const teeColor = props.color || style.defaultTeeColor;
      const teePointsUp = 270 - mapRotation;
      svg += generateTeeSVG(x, y, teeColor, undefined, props.name, 1.0, teePointsUp);
    });

    // Baskets - counter-rotate so basket always appears upright
    holeFeatures.filter(f => f.properties.type === 'basket').forEach(f => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      svg += generateBasketTopViewSVG(x, y, style, 1.0);
    });

    svg += '</g>'; // End rotation group
    svg += '</g>'; // End inner translate group
    svg += '</g>'; // End blob clip group

    // Legend (outside blob, positioned in bottom right of page)
    if (includeLegend) {
      const hasOB = holeFeatures.some(f => f.properties.type === 'obZone' || f.properties.type === 'obLine' || f.properties.type === 'dropzoneArea');
      const hasFairway = holeFeatures.some(f => f.properties.type === 'fairway');
      const hasMandatory = holeFeatures.some(f => f.properties.type === 'mandatory');
      const hasDropzone = holeFeatures.some(f => f.properties.type === 'dropzone');
      const hasFlightLine = holeFeatures.some(f => f.properties.type === 'flightLine');

      const legendItems: Array<{ type: string; render: (x: number, y: number) => string }> = [];

      if (hasOB) {
        legendItems.push({
          type: 'OB',
          render: (x, y) => `
            <rect x="${x}" y="${y - 5}" width="12" height="8" rx="1" fill="${style.obZoneColor}" fill-opacity="0.5" />
            <text x="${x + 16}" y="${y + 2}" font-family="Arial, sans-serif" font-size="8" fill="#374151">OB</text>
          `
        });
      }

      if (hasFairway) {
        legendItems.push({
          type: 'Fairway',
          render: (x, y) => `
            <rect x="${x}" y="${y - 5}" width="12" height="8" rx="1" fill="${style.fairwayColor}" fill-opacity="0.7" />
            <text x="${x + 16}" y="${y + 2}" font-family="Arial, sans-serif" font-size="8" fill="#374151">Fairway</text>
          `
        });
      }

      if (hasMandatory) {
        legendItems.push({
          type: 'Mando',
          render: (x, y) => `
            <path d="M${x} ${y - 1} L${x + 6} ${y - 1} L${x + 6} ${y - 3} L${x + 10} ${y + 1} L${x + 6} ${y + 5} L${x + 6} ${y + 3} L${x} ${y + 3} Z" fill="${style.mandatoryColor}" stroke="${darkenColor(style.mandatoryColor)}" stroke-width="0.5" stroke-linejoin="round" />
            <text x="${x + 16}" y="${y + 2}" font-family="Arial, sans-serif" font-size="8" fill="#374151">Mando</text>
          `
        });
      }

      if (hasDropzone) {
        legendItems.push({
          type: 'Dropzone',
          render: (x, y) => `
            <rect x="${x}" y="${y - 5}" width="12" height="8" rx="2" fill="${style.dropzoneColor}" />
            <text x="${x + 16}" y="${y + 2}" font-family="Arial, sans-serif" font-size="8" fill="#374151">DZ</text>
          `
        });
      }

      if (hasFlightLine) {
        legendItems.push({
          type: 'Flight',
          render: (x, y) => `
            <line x1="${x}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="${style.defaultFlightLineColor}" stroke-width="2" stroke-dasharray="3 2" />
            <text x="${x + 16}" y="${y + 3}" font-family="Arial, sans-serif" font-size="8" fill="#374151">Flight</text>
          `
        });
      }

      if (legendItems.length > 0) {
        const legendPadding = 8;
        const legendItemHeight = 16;
        const legendWidth = 80;
        const legendHeight = legendItems.length * legendItemHeight + legendPadding * 2 + 14;
        const legendX = width - legendWidth - pagePadding;
        const legendY = height - legendHeight - pagePadding;

        svg += `<rect x="${legendX}" y="${legendY}" width="${legendWidth}" height="${legendHeight}" rx="4" fill="white" fill-opacity="0.95" stroke="#374151" stroke-width="1" />`;

        let currentY = legendY + legendPadding + 10;
        svg += `<text x="${legendX + legendPadding}" y="${currentY}" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#374151">Legend</text>`;

        legendItems.forEach((item) => {
          currentY += legendItemHeight;
          svg += item.render(legendX + legendPadding, currentY);
        });
      }
    }

  } else {
    // No features - show placeholder blob
    svg += `<path d="${blobPath}" fill="#1f2937" transform="translate(4, 4)" opacity="0.3" />`;
    svg += `<path d="${blobPath}" fill="#2d3748" />`;
    svg += `<text x="${blobCenterX}" y="${blobCenterY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">No features on this hole</text>`;
  }

  svg += '</svg>';
  return svg;
}
