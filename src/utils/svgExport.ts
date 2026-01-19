import { bbox } from '@turf/turf';
import type { Course, Hole, DiscGolfFeature, CourseStyle, TeeProperties, FlightLineProperties, DropzoneProperties, OBLineProperties, DropzoneAreaProperties, TerrainFeature, TerrainFeatureProperties, PathFeature } from '../types/course';
import type { ExportConfig } from '../types/export';
import { TERRAIN_PATTERNS, getTerrainColors } from '../types/terrain';
import type { TreeFeature } from '../types/trees';
import { generateTerrainPattern, generateCompassRose, generateScaleBar, resetPatternIds } from './svgPatterns';
import { generateTreeSVG } from './treeSvg';

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

// ============ ADAPTIVE SCALING & COLLISION DETECTION ============

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacedElement {
  id: string;
  bbox: BoundingBox;
  priority: number; // Lower = higher priority (will stay in place)
}

class CollisionManager {
  private placedElements: PlacedElement[] = [];

  clear(): void {
    this.placedElements = [];
  }

  addElement(id: string, bbox: BoundingBox, priority: number): void {
    this.placedElements.push({ id, bbox, priority });
  }

  checkCollision(bbox: BoundingBox, margin: number = 2): boolean {
    const expanded = {
      x: bbox.x - margin,
      y: bbox.y - margin,
      width: bbox.width + margin * 2,
      height: bbox.height + margin * 2,
    };

    return this.placedElements.some((el) =>
      this.boxesIntersect(expanded, el.bbox)
    );
  }

  private boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  findNonCollidingPosition(
    originalX: number,
    originalY: number,
    width: number,
    height: number,
    _anchorX: number,
    _anchorY: number,
    maxOffset: number = 80
  ): { x: number; y: number; needsLeader: boolean } {
    // Try original position first
    const originalBbox: BoundingBox = {
      x: originalX - width / 2,
      y: originalY - height / 2,
      width,
      height,
    };

    if (!this.checkCollision(originalBbox, 4)) {
      return { x: originalX, y: originalY, needsLeader: false };
    }

    // Try positions in expanding circles
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const distances = [20, 35, 50, 65, maxOffset];

    for (const dist of distances) {
      for (const angle of angles) {
        const rad = (angle * Math.PI) / 180;
        const testX = originalX + Math.cos(rad) * dist;
        const testY = originalY + Math.sin(rad) * dist;

        const testBbox: BoundingBox = {
          x: testX - width / 2,
          y: testY - height / 2,
          width,
          height,
        };

        if (!this.checkCollision(testBbox, 4)) {
          return { x: testX, y: testY, needsLeader: dist > 25 };
        }
      }
    }

    // If no good position found, use the least crowded direction
    // Default to above-right with max offset
    return {
      x: originalX + maxOffset * 0.7,
      y: originalY - maxOffset * 0.7,
      needsLeader: true,
    };
  }
}

interface DensityMetrics {
  featureCount: number;
  mapAreaPx: number;
  avgFeatureDistance: number;
  densityFactor: number; // 0-1, where 1 = very dense
  markerScale: number; // Recommended marker scale
  labelScale: number; // Recommended label scale
}

function calculateDensityMetrics(
  features: DiscGolfFeature[],
  viewport: SVGViewport
): DensityMetrics {
  const contentWidth = viewport.width - 2 * viewport.padding;
  const contentHeight = viewport.height - 2 * viewport.padding;
  const mapAreaPx = contentWidth * contentHeight;

  // Get point features for distance calculation
  const pointFeatures = features.filter(
    (f) => f.geometry.type === 'Point'
  );
  const featureCount = pointFeatures.length;

  if (featureCount < 2) {
    return {
      featureCount,
      mapAreaPx,
      avgFeatureDistance: Infinity,
      densityFactor: 0,
      markerScale: 1,
      labelScale: 1,
    };
  }

  // Calculate average distance between features in pixel space
  let totalDistance = 0;
  let distanceCount = 0;

  const points = pointFeatures.map((f) =>
    geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], viewport)
  );

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j][0] - points[i][0];
      const dy = points[j][1] - points[i][1];
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      distanceCount++;
    }
  }

  const avgFeatureDistance = distanceCount > 0 ? totalDistance / distanceCount : Infinity;

  // Calculate minimum distance between any two features
  let minDistance = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j][0] - points[i][0];
      const dy = points[j][1] - points[i][1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) minDistance = dist;
    }
  }

  // Base marker size is about 40px, so if features are closer than 60px, we have density issues
  const idealMinDistance = 70; // Minimum comfortable distance between markers
  const densityFactor = Math.max(0, Math.min(1, 1 - minDistance / idealMinDistance));

  // Calculate recommended scales
  // For very dense courses (densityFactor close to 1), scale down to ~0.6
  // For sparse courses (densityFactor close to 0), keep at 1.0
  const markerScale = Math.max(0.5, 1 - densityFactor * 0.5);
  const labelScale = Math.max(0.6, 1 - densityFactor * 0.4);

  return {
    featureCount,
    mapAreaPx,
    avgFeatureDistance,
    densityFactor,
    markerScale,
    labelScale,
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
  style: CourseStyle,
  scale: number = 1,
  rotation: number = 0
): string {
  const topColor = style.basketTopColor;
  const bodyColor = style.basketBodyColor;
  const chainColor = style.basketChainColor;
  const poleColor = style.basketPoleColor;
  const topBorder = darkenColor(topColor);
  const bodyBorder = darkenColor(bodyColor);

  // Basket is drawn centered at origin, then translated to position
  // rotation is applied around the basket's center
  const s = scale;
  const basketWidth = 32 * s;
  const basketHeight = 44 * s;
  const cx = basketWidth / 2;  // center x of basket
  const cy = basketHeight / 2; // center y of basket

  return `
    <g transform="translate(${x}, ${y})">
      <g transform="rotate(${rotation})">
        <g transform="translate(${-cx}, ${-cy})">
          <!-- Pole -->
          <rect x="${15 * s}" y="${28 * s}" width="${2 * s}" height="${14 * s}" fill="${poleColor}" />
          <!-- Base -->
          <ellipse cx="${16 * s}" cy="${42 * s}" rx="${6 * s}" ry="${2 * s}" fill="${poleColor}" />
          <!-- Basket body -->
          <path d="M${6 * s} ${18 * s} L${26 * s} ${18 * s} L${24 * s} ${28 * s} L${8 * s} ${28 * s} Z" fill="${bodyColor}" stroke="${bodyBorder}" stroke-width="${1.5 * s}" />
          <!-- Chains -->
          <path d="M${8 * s} ${10 * s} L${8 * s} ${18 * s} M${12 * s} ${8 * s} L${12 * s} ${18 * s} M${16 * s} ${6 * s} L${16 * s} ${18 * s} M${20 * s} ${8 * s} L${20 * s} ${18 * s} M${24 * s} ${10 * s} L${24 * s} ${18 * s}" stroke="${chainColor}" stroke-width="${1.5 * s}" stroke-linecap="round" />
          <!-- Top band -->
          <ellipse cx="${16 * s}" cy="${6 * s}" rx="${10 * s}" ry="${3 * s}" fill="${topColor}" stroke="${topBorder}" stroke-width="${1.5 * s}" />
          <!-- Inner ring -->
          <ellipse cx="${16 * s}" cy="${18 * s}" rx="${8 * s}" ry="${2 * s}" fill="none" stroke="${bodyBorder}" stroke-width="${s}" />
        </g>
      </g>
    </g>
  `;
}

function generateDropzoneSVG(
  x: number,
  y: number,
  color: string,
  scale: number = 1,
  rotation: number = 0,
  showLabel: boolean = true
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
      ${showLabel ? `<!-- Text stays upright -->
      <text x="0" y="${4 * scale}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${10 * scale}" fill="${textColor}">DZ</text>` : ''}
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
  lineColor: string = '#dc2626'
): string {
  const borderColor = darkenColor(color);
  const s = scale;

  // Canvas size matching React component
  const cx = 32 * s;
  const cy = 32 * s;

  // Boundary line length with arrowhead
  const boundaryLineLength = 24 * s;
  const arrowheadSize = 6 * s;

  // Calculate boundary line end point and arrowhead
  // lineAngle is used directly (no offset) - 0=right, 90=down, 180=left, 270=up
  const lineRad = (lineAngle * Math.PI) / 180;
  const lineEndX = cx + Math.cos(lineRad) * boundaryLineLength;
  const lineEndY = cy + Math.sin(lineRad) * boundaryLineLength;

  // Arrowhead points
  const arrowAngle1 = lineRad + Math.PI * 0.8;
  const arrowAngle2 = lineRad - Math.PI * 0.8;
  const arrow1X = lineEndX + Math.cos(arrowAngle1) * arrowheadSize;
  const arrow1Y = lineEndY + Math.sin(arrowAngle1) * arrowheadSize;
  const arrow2X = lineEndX + Math.cos(arrowAngle2) * arrowheadSize;
  const arrow2Y = lineEndY + Math.sin(arrowAngle2) * arrowheadSize;

  // Direction arrow path (centered, pointing right at 0 degrees)
  const arrowPath = `
    M${cx - 10 * s} ${cy - 2 * s}
    L${cx + 2 * s} ${cy - 2 * s}
    L${cx + 2 * s} ${cy - 6 * s}
    L${cx + 12 * s} ${cy}
    L${cx + 2 * s} ${cy + 6 * s}
    L${cx + 2 * s} ${cy + 2 * s}
    L${cx - 10 * s} ${cy + 2 * s}
    Z
  `;

  return `
    <g transform="translate(${x - cx}, ${y - cy})">
      <!-- Boundary line with arrowhead -->
      <line x1="${cx}" y1="${cy}" x2="${lineEndX.toFixed(2)}" y2="${lineEndY.toFixed(2)}" stroke="${lineColor}" stroke-width="${2.5 * s}" stroke-linecap="round" />
      <path d="M${lineEndX.toFixed(2)},${lineEndY.toFixed(2)} L${arrow1X.toFixed(2)},${arrow1Y.toFixed(2)} L${arrow2X.toFixed(2)},${arrow2Y.toFixed(2)} Z" fill="${lineColor}" />
      <!-- Direction arrow -->
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

  // Initialize collision manager and calculate density metrics
  const collisionManager = new CollisionManager();
  const densityMetrics = calculateDensityMetrics(allFeatures, viewport);
  const markerScale = densityMetrics.markerScale;
  const labelScale = densityMetrics.labelScale;

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

  // Course-level terrain features (on top of default terrain)
  if (includeInfrastructure && course.terrainFeatures) {
    course.terrainFeatures.forEach((f: TerrainFeature) => {
      const props = f.properties as TerrainFeatureProperties;
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

  // Course-level path features (line features with stroke width)
  if (course.pathFeatures && course.pathFeatures.length > 0) {
    course.pathFeatures.forEach((f: PathFeature) => {
      const props = f.properties;
      const coords = (f.geometry as { coordinates: number[][] }).coordinates;
      const path = lineStringToSVG(coords, viewport);
      const color = props.color || '#a8a29e';
      const strokeWidth = props.strokeWidth || 4;
      const opacity = props.opacity ?? 1;

      svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" />`;
    });
  }

  // Course-level tree features (decorative trees)
  if (course.treeFeatures && course.treeFeatures.length > 0) {
    course.treeFeatures.forEach((f: TreeFeature) => {
      const props = f.properties;
      const coords = f.geometry.coordinates as [number, number];
      const [x, y] = geoToSVG(coords, viewport);

      // Generate tree SVG at this position
      const treeSvg = generateTreeSVG(
        x,
        y,
        props.treeType,
        props.size ?? 1,
        props.rotation ?? 0,
        props.customColors,
        props.opacity ?? 1,
        densityMetrics.markerScale
      );
      svg += treeSvg;
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

  // Flight Line Distance Labels - stored for later rendering after markers
  // This allows collision detection to work properly
  const distanceLabelData: Array<{
    coords: [number, number][];
    lineColor: string;
    distanceLabel: string;
    midPoint: [number, number];
  }> = [];

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

    distanceLabelData.push({ coords, lineColor, distanceLabel, midPoint });
  });

  // Dropzones - with adaptive scaling
  const dropzones = allFeatures.filter((f) => f.properties.type === 'dropzone');
  dropzones.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const props = f.properties as DropzoneProperties;
    const dzColor = props.color || style.dropzoneColor;
    const scaledDzSize = 32 * markerScale;
    svg += generateDropzoneSVG(x, y, dzColor, markerScale, props.rotation ?? 0, false);
    // Register dropzone bounding box
    collisionManager.addElement(`dz-${f.properties.id}`, {
      x: x - scaledDzSize / 2,
      y: y - (20 * markerScale) / 2,
      width: scaledDzSize,
      height: 20 * markerScale,
    }, 2);
  });

  // Mandatories - with adaptive scaling
  const mandatories = allFeatures.filter((f) => f.properties.type === 'mandatory');
  mandatories.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
    svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, markerScale, props.lineAngle ?? 270);
    // Register mandatory bounding box (48px canvas size)
    collisionManager.addElement(`mando-${f.properties.id}`, {
      x: x - 24 * markerScale,
      y: y - 24 * markerScale,
      width: 48 * markerScale,
      height: 48 * markerScale,
    }, 3);
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

  // Tees - with adaptive scaling and collision registration
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
    const scaledTeeW = 32 * markerScale;
    const scaledTeeH = 20 * markerScale;
    svg += generateTeeSVG(x, y, teeColor, holeNumber, props.name, markerScale, props.rotation ?? 0);
    // Register tee bounding box (highest priority - will not be moved)
    collisionManager.addElement(`tee-${f.properties.id}`, {
      x: x - scaledTeeW / 2,
      y: y - scaledTeeH / 2,
      width: scaledTeeW,
      height: scaledTeeH,
    }, 1);
  });

  // Baskets - with adaptive scaling and collision registration
  const baskets = allFeatures.filter((f) => f.properties.type === 'basket');
  baskets.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, viewport);
    const scaledBasketW = 32 * markerScale;
    const scaledBasketH = 44 * markerScale;
    svg += generateBasketSVG(x, y, style, markerScale);
    // Register basket bounding box (highest priority)
    collisionManager.addElement(`basket-${f.properties.id}`, {
      x: x - scaledBasketW / 2,
      y: y - scaledBasketH, // basket anchors at bottom
      width: scaledBasketW,
      height: scaledBasketH,
    }, 1);
  });

  // Now render distance labels with collision detection
  distanceLabelData.forEach((labelData, index) => {
    const [anchorX, anchorY] = geoToSVG(labelData.midPoint, viewport);
    const scaledFontSize = 11 * labelScale;
    const labelWidth = (labelData.distanceLabel.length * scaledFontSize * 0.7 + 12) * labelScale;
    const labelHeight = 20 * labelScale;

    // Calculate perpendicular direction to the flight line for smarter label placement
    const coords = labelData.coords;
    const midIdx = Math.floor(coords.length / 2);
    const p1Geo = coords.length === 2 ? coords[0] : coords[Math.max(0, midIdx - 1)];
    const p2Geo = coords.length === 2 ? coords[1] : coords[Math.min(coords.length - 1, midIdx + 1)];
    const [p1x, p1y] = geoToSVG(p1Geo, viewport);
    const [p2x, p2y] = geoToSVG(p2Geo, viewport);

    // Calculate perpendicular offset (normal to the line)
    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = len > 0 ? -dy / len : 0;
    const perpY = len > 0 ? dx / len : -1;

    // Try positions perpendicular to the line first (both sides)
    const baseOffset = 18 * labelScale;
    const tryPositions: Array<{ x: number; y: number; dist: number }> = [
      { x: anchorX + perpX * baseOffset, y: anchorY + perpY * baseOffset, dist: baseOffset },
      { x: anchorX - perpX * baseOffset, y: anchorY - perpY * baseOffset, dist: baseOffset },
      { x: anchorX + perpX * baseOffset * 2, y: anchorY + perpY * baseOffset * 2, dist: baseOffset * 2 },
      { x: anchorX - perpX * baseOffset * 2, y: anchorY - perpY * baseOffset * 2, dist: baseOffset * 2 },
    ];

    let labelX = anchorX;
    let labelY = anchorY - baseOffset;
    let needsLeader = false;
    let foundPosition = false;

    // Try perpendicular positions first
    for (const pos of tryPositions) {
      const testBbox: BoundingBox = {
        x: pos.x - labelWidth / 2,
        y: pos.y - labelHeight / 2,
        width: labelWidth,
        height: labelHeight,
      };
      if (!collisionManager.checkCollision(testBbox, 4)) {
        labelX = pos.x;
        labelY = pos.y;
        needsLeader = pos.dist > baseOffset * 1.5;
        foundPosition = true;
        break;
      }
    }

    // If no perpendicular position works, use the general collision manager
    if (!foundPosition) {
      const result = collisionManager.findNonCollidingPosition(
        anchorX,
        anchorY - baseOffset,
        labelWidth,
        labelHeight,
        anchorX,
        anchorY,
        60 * labelScale
      );
      labelX = result.x;
      labelY = result.y;
      needsLeader = result.needsLeader;
    }

    // Register the label position
    collisionManager.addElement(`label-${index}`, {
      x: labelX - labelWidth / 2,
      y: labelY - labelHeight / 2,
      width: labelWidth,
      height: labelHeight,
    }, 5);

    // Draw leader line if label was moved significantly
    if (needsLeader) {
      svg += `<line x1="${anchorX}" y1="${anchorY}" x2="${labelX}" y2="${labelY}" stroke="${labelData.lineColor}" stroke-width="${1 * labelScale}" stroke-opacity="0.5" />`;
      svg += `<circle cx="${anchorX}" cy="${anchorY}" r="${3 * labelScale}" fill="${labelData.lineColor}" opacity="0.5" />`;
    }

    // Draw distance label
    svg += `
      <g transform="translate(${labelX}, ${labelY})">
        <rect x="${-labelWidth / 2}" y="${-labelHeight / 2}" width="${labelWidth}" height="${labelHeight}" rx="${10 * labelScale}" fill="white" stroke="${labelData.lineColor}" stroke-width="${2 * labelScale}" />
        <text x="0" y="${scaledFontSize / 3}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${scaledFontSize}" fill="${labelData.lineColor}">${labelData.distanceLabel}</text>
      </g>
    `;
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
    svg += generateDropzoneSVG(x, y, dzColor, 0.8, props.rotation ?? 0, false);
  });

  const mandatories = allFeatures.filter((f) => f.properties.type === 'mandatory');
  mandatories.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
    svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 0.8, props.lineAngle ?? 270);
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
    svg += generateBasketSVG(x, y, style, 0.8);
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
      svg += generateDropzoneSVG(x, y, dzColor, 1.2, props.rotation ?? 0, false);
    });

    holeFeatures.filter((f) => f.properties.type === 'mandatory').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
      svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 1.2, props.lineAngle ?? 270);
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
      svg += generateBasketSVG(x, y, style, 1.2);
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

// ============ TEE SIGN EXPORT ============

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

function getHoleDistances(
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

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
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
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateTeeSignSVG(options: TeeSignOptions): string {
  const {
    hole,
    course,
    width = 794,
    height = 1123,
    units,
    includeNotes,
    includeRules,
    includeLegend,
    includeCourseName,
    logoDataUrl,
  } = options;

  const style = course.style;

  // Layout dimensions - sidebar on left, map fills the rest
  const sidebarWidth = 220;
  const sidebarPadding = 20;
  const mapAreaWidth = width - sidebarWidth; // Map fills entire right side
  const mapAreaHeight = height; // Full height
  const mapX = sidebarWidth;
  const mapY = 0;

  // Reset pattern IDs for consistent generation
  resetPatternIds();

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // ============ SIDEBAR SECTION (Left) ============
  // Dark sidebar background
  svg += `<rect x="0" y="0" width="${sidebarWidth}" height="${height}" fill="#1f2937" />`;

  // Current Y position for stacking sidebar elements
  let sidebarY = sidebarPadding;

  // Title: "Hole X"
  svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 28}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="white">Hole ${hole.number}</text>`;

  // Subtitle: course name or hole name
  if (includeCourseName) {
    svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 52}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.7)">${escapeXml(course.name)}</text>`;
    sidebarY += 70;
  } else if (hole.name) {
    svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 52}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.7)">${escapeXml(hole.name)}</text>`;
    sidebarY += 70;
  } else {
    sidebarY += 50;
  }

  // Par box (blue)
  const parBoxWidth = sidebarWidth - sidebarPadding * 2;
  const parBoxHeight = 80;
  const parBoxX = sidebarPadding;
  svg += `<rect x="${parBoxX}" y="${sidebarY}" width="${parBoxWidth}" height="${parBoxHeight}" rx="8" fill="#3b82f6" />`;
  svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 45}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="42" fill="white">${hole.number}</text>`;
  svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 70}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.9)">Par ${hole.par}</text>`;
  sidebarY += parBoxHeight + 16;

  // Distance boxes - stacked vertically
  const distances = getHoleDistances(hole, course, units);
  const unitLabel = units === 'meters' ? 'm' : 'ft';
  const distBoxWidth = sidebarWidth - sidebarPadding * 2;
  const distBoxHeight = 50;
  const distBoxGap = 8;

  if (distances.length > 0) {
    distances.forEach((dist) => {
      svg += `<rect x="${parBoxX}" y="${sidebarY}" width="${distBoxWidth}" height="${distBoxHeight}" rx="6" fill="${dist.color}" />`;
      svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 32}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="${getTextColor(dist.color)}">${dist.distance}${unitLabel}</text>`;
      if (dist.teeName) {
        svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 46}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${getTextColor(dist.color)}" opacity="0.85">${escapeXml(dist.teeName)}</text>`;
      }
      sidebarY += distBoxHeight + distBoxGap;
    });
  } else {
    svg += `<rect x="${parBoxX}" y="${sidebarY}" width="${distBoxWidth}" height="${distBoxHeight}" rx="6" fill="#4b5563" />`;
    svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">No tees placed</text>`;
    sidebarY += distBoxHeight + distBoxGap;
  }

  // Collect notes for the info section
  const allNotes: Array<{ label: string; note: string; color: string }> = [];

  if (includeNotes && hole.notes) {
    allNotes.push({ label: 'Hole Info', note: hole.notes, color: '#3b82f6' });
  }

  if (includeNotes) {
    hole.features.forEach(f => {
      const props = f.properties as { notes?: string; type: string; label?: string };
      if (props.notes) {
        let label = '';
        let color = '#6b7280';
        switch (props.type) {
          case 'dropzone':
            label = 'Dropzone';
            color = style.dropzoneColor;
            break;
          case 'mandatory':
            label = 'Mandatory';
            color = style.mandatoryColor;
            break;
          case 'tee':
            label = props.label || 'Tee';
            color = (f.properties as TeeProperties).color || style.defaultTeeColor;
            break;
          case 'basket':
            label = 'Basket';
            color = style.basketTopColor;
            break;
          case 'obZone':
          case 'obLine':
            label = props.label || 'OB';
            color = '#dc2626';
            break;
          default:
            label = props.label || props.type;
        }
        allNotes.push({ label, note: props.notes, color });
      }
    });
  }

  if (includeRules && hole.rules && hole.rules.length > 0) {
    hole.rules.forEach((rule, i) => {
      allNotes.push({ label: `Rule ${i + 1}`, note: rule, color: '#059669' });
    });
  }

  // Notes section in sidebar
  if (allNotes.length > 0) {
    sidebarY += 8;
    // Section header
    svg += `<text x="${sidebarPadding}" y="${sidebarY + 14}" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="rgba(255,255,255,0.6)">HOLE INFO</text>`;
    sidebarY += 24;

    // Divider line
    svg += `<line x1="${sidebarPadding}" y1="${sidebarY}" x2="${sidebarWidth - sidebarPadding}" y2="${sidebarY}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />`;
    sidebarY += 12;

    const maxNoteWidth = sidebarWidth - sidebarPadding * 2;
    const lineHeight = 14;
    const noteGap = 12;
    const maxSidebarY = height - 40; // Leave space at bottom

    allNotes.forEach((noteItem) => {
      if (sidebarY > maxSidebarY - 40) return; // Stop if running out of space

      // Note label with color indicator
      svg += `<rect x="${sidebarPadding}" y="${sidebarY}" width="3" height="14" rx="1" fill="${noteItem.color}" />`;
      svg += `<text x="${sidebarPadding + 8}" y="${sidebarY + 11}" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="${noteItem.color}">${escapeXml(noteItem.label)}</text>`;
      sidebarY += 16;

      // Note text - wrap lines
      const noteLines = wrapText(noteItem.note, maxNoteWidth, 11);
      const maxLines = Math.min(3, Math.floor((maxSidebarY - sidebarY) / lineHeight));

      noteLines.slice(0, maxLines).forEach((line, lineIndex) => {
        const displayLine = lineIndex === maxLines - 1 && noteLines.length > maxLines
          ? line.substring(0, Math.floor(line.length * 0.8)) + '...'
          : line;
        svg += `<text x="${sidebarPadding}" y="${sidebarY + 10}" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.85)">${escapeXml(displayLine)}</text>`;
        sidebarY += lineHeight;
      });

      sidebarY += noteGap;
    });
  }

  // Logo at bottom of sidebar
  if (logoDataUrl) {
    const logoMaxWidth = sidebarWidth - sidebarPadding * 2;
    const logoMaxHeight = 80;
    const logoY = height - sidebarPadding - logoMaxHeight;
    const logoCenterX = sidebarWidth / 2;

    // Render logo image centered at bottom of sidebar
    svg += `<image
      href="${logoDataUrl}"
      x="${logoCenterX - logoMaxWidth / 2}"
      y="${logoY}"
      width="${logoMaxWidth}"
      height="${logoMaxHeight}"
      preserveAspectRatio="xMidYMid meet"
    />`;
  }

  // ============ MAP SECTION (Right) ============

  // Get hole features and calculate bounds
  const holeFeatures = hole.features;
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

      // Calculate bearing from tee to basket in geographic coordinates
      const dx = basketCoords[0] - teeCoords[0]; // longitude difference (+ = east)
      const dy = basketCoords[1] - teeCoords[1]; // latitude difference (+ = north)

      // Angle in geo coords: 0 = east, 90 = north, 180 = west, -90 = south
      const geoAngleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

      // In SVG, Y is flipped, so svgAngle = -geoAngle
      // SVG angle: 0 = right, 90 = down, -90 = up, 180 = left
      // We want the tee-to-basket direction to point UP in SVG (-90° or 270°)
      // After rotation: svgAngle + mapRotation should equal -90 (up)
      // svgAngle = -geoAngle, so: -geoAngle + mapRotation = -90
      // mapRotation = geoAngle - 90
      mapRotation = geoAngleDeg - 90;
    }

    // Add padding to bounds, accounting for rotation expansion
    // When content is rotated, corners extend beyond original bounds
    // Maximum expansion at 45° is √2, formula: |cos(θ)| + |sin(θ)|
    const rotationRad = Math.abs(mapRotation) * Math.PI / 180;
    const rotationExpansion = Math.abs(Math.cos(rotationRad)) + Math.abs(Math.sin(rotationRad));
    // Base padding 15%, increased by rotation factor (max ~41% at 45°)
    const basePadding = 0.15;
    const rotatedPadding = basePadding * rotationExpansion;
    const lngPadding = (bounds.maxLng - bounds.minLng) * rotatedPadding;
    const latPadding = (bounds.maxLat - bounds.minLat) * rotatedPadding;
    bounds.minLng -= lngPadding;
    bounds.maxLng += lngPadding;
    bounds.minLat -= latPadding;
    bounds.maxLat += latPadding;

    const mapViewport: SVGViewport = {
      width: mapAreaWidth,
      height: mapAreaHeight,
      padding: 20,
      bounds,
    };

    // Map container with satellite-like base + terrain overlay
    let defsContent = '';
    const terrainPatternMap: Map<string, string> = new Map();

    const defaultTerrainType = style.defaultTerrain ?? 'grass';
    const defaultTerrainPattern = TERRAIN_PATTERNS[defaultTerrainType];
    const bgColors = {
      primary: defaultTerrainPattern.defaultColors.primary,
      secondary: defaultTerrainPattern.defaultColors.secondary,
      accent: defaultTerrainPattern.defaultColors.accent ?? defaultTerrainPattern.defaultColors.primary,
    };
    const { id: bgPatternId, svg: bgPatternSvg } = generateTerrainPattern(defaultTerrainType, bgColors, 1.5);
    defsContent += bgPatternSvg;

    // Create clip path for rounded rectangle
    const clipId = `clip_${Date.now()}`;
    defsContent += `<clipPath id="${clipId}"><rect width="${mapAreaWidth}" height="${mapAreaHeight}" /></clipPath>`;

    svg += `<defs>${defsContent}</defs>`;
    svg += `<g transform="translate(${mapX}, ${mapY})">`;

    // Clip group for map content
    svg += `<g clip-path="url(#${clipId})">`;

    // Satellite-like dark base layer
    svg += `<rect width="${mapAreaWidth}" height="${mapAreaHeight}" fill="#1a2e1a" />`;

    // Terrain pattern overlay with transparency (satellite showing through)
    svg += `<rect width="${mapAreaWidth}" height="${mapAreaHeight}" fill="url(#${bgPatternId})" opacity="0.7" />`;

    // Calculate center for rotation
    const centerX = mapAreaWidth / 2;
    const centerY = mapAreaHeight / 2;

    // Apply rotation to all map content
    svg += `<g transform="rotate(${mapRotation} ${centerX} ${centerY})">`;

    // Course-level terrain features
    if (course.terrainFeatures && course.terrainFeatures.length > 0) {
      course.terrainFeatures.forEach((f: TerrainFeature) => {
        const props = f.properties as TerrainFeatureProperties;
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
        const points = polygonCoordsToSVG(coords, mapViewport);
        svg += `<polygon points="${points}" fill="url(#${patternId})" opacity="${props.opacity ?? 0.85}" />`;
      });
    }

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
      course.treeFeatures.forEach((f: TreeFeature) => {
        const props = f.properties;
        const coords = f.geometry.coordinates as [number, number];
        const [x, y] = geoToSVG(coords, mapViewport);
        const treeSvg = generateTreeSVG(
          x,
          y,
          props.treeType,
          props.size ?? 1,
          props.rotation ?? 0,
          props.customColors,
          props.opacity ?? 1,
          0.8 // Fixed scale for individual hole pages
        );
        svg += treeSvg;
      });
    }

    // Render hole features (same order as main export)
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
      // Make DZ point UP (toward basket) on teesign: 270° final = R + mapRotation, so R = 270 - mapRotation
      const dzPointsUp = 270 - mapRotation;
      svg += generateDropzoneSVG(x, y, dzColor, 1.0, dzPointsUp, false);
    });

    // Mandatories - use user's rotation directly (map rotation is applied via outer group)
    holeFeatures.filter(f => f.properties.type === 'mandatory').forEach(f => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as { rotation: number; lineAngle?: number };
      // Don't adjust for mapRotation - mando directions are relative to course layout
      // and should rotate with the map
      svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 1.0, props.lineAngle ?? 270);
    });

    // Tees - always point toward basket (UP on teesign)
    // No hole number on tee pad for teesigns (number shown in header instead)
    holeFeatures.filter(f => f.properties.type === 'tee').forEach(f => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as TeeProperties;
      const teeColor = props.color || style.defaultTeeColor;
      // Make tee point UP (toward basket) on teesign: 270° final = R + mapRotation, so R = 270 - mapRotation
      const teePointsUp = 270 - mapRotation;
      svg += generateTeeSVG(x, y, teeColor, undefined, props.name, 1.0, teePointsUp);
    });

    // Baskets - counter-rotate so basket always appears upright
    holeFeatures.filter(f => f.properties.type === 'basket').forEach(f => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      svg += generateBasketSVG(x, y, style, 1.0, -mapRotation);
    });

    svg += '</g>'; // End rotation group
    svg += '</g>'; // End clip group


    // Mini legend (optional) - outside rotation, always in corner
    // Only show elements that are present on this hole
    if (includeLegend) {
      const hasOB = holeFeatures.some(f => f.properties.type === 'obZone' || f.properties.type === 'obLine' || f.properties.type === 'dropzoneArea');
      const hasFairway = holeFeatures.some(f => f.properties.type === 'fairway');
      const hasMandatory = holeFeatures.some(f => f.properties.type === 'mandatory');
      const hasDropzone = holeFeatures.some(f => f.properties.type === 'dropzone');
      const hasFlightLine = holeFeatures.some(f => f.properties.type === 'flightLine');

      // Count how many items will be in legend
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

      // Only render legend if there are items to show
      if (legendItems.length > 0) {
        const legendPadding = 8;
        const legendItemHeight = 16;
        const legendWidth = 90;
        const legendHeight = legendItems.length * legendItemHeight + legendPadding * 2 + 14;
        const legendX = mapAreaWidth - legendWidth - 10;
        const legendY = mapAreaHeight - legendHeight - 10;

        svg += `<rect x="${legendX}" y="${legendY}" width="${legendWidth}" height="${legendHeight}" rx="4" fill="white" fill-opacity="0.95" stroke="#374151" stroke-width="1" />`;

        let currentY = legendY + legendPadding + 10;
        svg += `<text x="${legendX + legendPadding}" y="${currentY}" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#374151">Legend</text>`;

        legendItems.forEach((item) => {
          currentY += legendItemHeight;
          svg += item.render(legendX + legendPadding, currentY);
        });
      }
    }

    svg += '</g>'; // End map group
  } else {
    // No features - show placeholder
    svg += `<g transform="translate(${mapX}, ${mapY})">`;
    svg += `<rect width="${mapAreaWidth}" height="${mapAreaHeight}" fill="#1a2e1a" />`;
    svg += `<text x="${mapAreaWidth / 2}" y="${mapAreaHeight / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">No features on this hole</text>`;
    svg += '</g>';
  }

  svg += '</svg>';
  return svg;
}

export async function generateTeeSignsZip(
  course: Course,
  options: Omit<TeeSignOptions, 'hole'>
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const hole of course.holes) {
    const svg = generateTeeSignSVG({ ...options, hole });
    const filename = `hole-${String(hole.number).padStart(2, '0')}.svg`;
    zip.file(filename, svg);
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function downloadZip(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.zip') ? filename : `${filename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
