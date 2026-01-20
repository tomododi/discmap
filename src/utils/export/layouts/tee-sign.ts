import type { Course, Hole, TeeProperties, FlightLineProperties, DropzoneProperties, OBLineProperties, DropzoneAreaProperties, TerrainFeature, TerrainFeatureProperties, PathFeature } from '../../../types/course';
import { TERRAIN_PATTERNS, getTerrainColors } from '../../../types/terrain';
import type { TreeType } from '../../../types/trees';
import { generateGrassImageBackground, generateTerrainPattern, resetPatternIds } from '../../svgPatterns';
import { generateTreeSVG } from '../../treeSvg';
import { calculateBounds, geoToSVG, polygonCoordsToSVG, lineStringToSVG } from '../coordinate-transform';
import type { SVGViewport } from '../coordinate-transform';
import { getTextColor, generateTeeSVG, generateBasketTopViewSVG, generateDropzoneSVG, generateMandatorySVG, darkenColor } from '../svg-markers';

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
  const sidebarWidth = 150;
  const sidebarPadding = 12;
  const mapAreaWidth = width - sidebarWidth; // Map fills entire right side
  const mapAreaHeight = height; // Full height
  const mapX = sidebarWidth;
  const mapY = 0;

  // Reset pattern IDs for consistent generation
  resetPatternIds();

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // ============ SIDEBAR SECTION (Left) ============
  // Dark sidebar background
  svg += `<rect x="0" y="0" width="${sidebarWidth}" height="${height}" fill="#1f2937" />`;

  // Current Y position for stacking sidebar elements
  let sidebarY = sidebarPadding;

  // Title: "Hole X"
  svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="white">Hole ${hole.number}</text>`;

  // Subtitle: course name or hole name
  if (includeCourseName) {
    svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">${escapeXml(course.name)}</text>`;
    sidebarY += 50;
  } else if (hole.name) {
    svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">${escapeXml(hole.name)}</text>`;
    sidebarY += 50;
  } else {
    sidebarY += 32;
  }

  // Par box (blue)
  const parBoxWidth = sidebarWidth - sidebarPadding * 2;
  const parBoxHeight = 60;
  const parBoxX = sidebarPadding;
  svg += `<rect x="${parBoxX}" y="${sidebarY}" width="${parBoxWidth}" height="${parBoxHeight}" rx="6" fill="#3b82f6" />`;
  svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 35}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="32" fill="white">${hole.number}</text>`;
  svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 52}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.9)">Par ${hole.par}</text>`;
  sidebarY += parBoxHeight + 10;

  // Distance boxes - stacked vertically
  const distances = getHoleDistances(hole, course, units);
  const unitLabel = units === 'meters' ? 'm' : 'ft';
  const distBoxWidth = sidebarWidth - sidebarPadding * 2;
  const distBoxHeight = 36;
  const distBoxGap = 6;

  if (distances.length > 0) {
    distances.forEach((dist) => {
      svg += `<rect x="${parBoxX}" y="${sidebarY}" width="${distBoxWidth}" height="${distBoxHeight}" rx="4" fill="${dist.color}" />`;
      svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 24}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="18" fill="${getTextColor(dist.color)}">${dist.distance}${unitLabel}</text>`;
      if (dist.teeName) {
        svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="${getTextColor(dist.color)}" opacity="0.85">${escapeXml(dist.teeName)}</text>`;
      }
      sidebarY += distBoxHeight + distBoxGap;
    });
  } else {
    svg += `<rect x="${parBoxX}" y="${sidebarY}" width="${distBoxWidth}" height="${distBoxHeight}" rx="4" fill="#4b5563" />`;
    svg += `<text x="${sidebarWidth / 2}" y="${sidebarY + 22}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">No tees placed</text>`;
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
    sidebarY += 6;
    // Section header
    svg += `<text x="${sidebarPadding}" y="${sidebarY + 12}" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="rgba(255,255,255,0.6)">HOLE INFO</text>`;
    sidebarY += 18;

    // Divider line
    svg += `<line x1="${sidebarPadding}" y1="${sidebarY}" x2="${sidebarWidth - sidebarPadding}" y2="${sidebarY}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />`;
    sidebarY += 8;

    const maxNoteWidth = sidebarWidth - sidebarPadding * 2;
    const lineHeight = 12;
    const noteGap = 10;
    const maxSidebarY = height - 40; // Leave space at bottom

    allNotes.forEach((noteItem) => {
      if (sidebarY > maxSidebarY - 30) return; // Stop if running out of space

      // Note label with color indicator
      svg += `<rect x="${sidebarPadding}" y="${sidebarY}" width="3" height="12" rx="1" fill="${noteItem.color}" />`;
      svg += `<text x="${sidebarPadding + 6}" y="${sidebarY + 9}" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="${noteItem.color}">${escapeXml(noteItem.label)}</text>`;
      sidebarY += 14;

      // Note text - wrap lines
      const noteLines = wrapText(noteItem.note, maxNoteWidth, 9);
      const maxLines = Math.min(2, Math.floor((maxSidebarY - sidebarY) / lineHeight));

      noteLines.slice(0, maxLines).forEach((line, lineIndex) => {
        const displayLine = lineIndex === maxLines - 1 && noteLines.length > maxLines
          ? line.substring(0, Math.floor(line.length * 0.8)) + '...'
          : line;
        svg += `<text x="${sidebarPadding}" y="${sidebarY + 9}" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.85)">${escapeXml(displayLine)}</text>`;
        sidebarY += lineHeight;
      });

      sidebarY += noteGap;
    });
  }

  // Logo at bottom of sidebar
  if (logoDataUrl) {
    const logoMaxWidth = sidebarWidth - sidebarPadding * 2;
    const logoMaxHeight = 60;
    const logoY = height - sidebarPadding - logoMaxHeight;
    const logoCenterX = sidebarWidth / 2;

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

    // Add marker padding: 60 pixels worth of space on each edge (for tee/basket markers)
    const markerPaddingPixels = 60;
    const markerPaddingMeters = markerPaddingPixels * estimatedMetersPerPixel;
    const markerPaddingLng = markerPaddingMeters / metersPerDegreeLng;
    const markerPaddingLat = markerPaddingMeters / metersPerDegreeLat;

    bounds.minLng -= markerPaddingLng;
    bounds.maxLng += markerPaddingLng;
    bounds.minLat -= markerPaddingLat;
    bounds.maxLat += markerPaddingLat;

    // Adjust bounds aspect ratio to match viewport for optimal fill
    // This ensures the hole fills the available space
    const viewportPadding = 20;
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
      const grassPattern = generateGrassImageBackground('teesign_grass_bg', metersPerPixel, 20);
      bgPatternId = grassPattern.id;
      bgPatternSvg = grassPattern.svg;
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

    // Clip path for map area
    const clipId = `clip_${Date.now()}`;
    defsContent += `<clipPath id="${clipId}"><rect width="${mapAreaWidth}" height="${mapAreaHeight}" /></clipPath>`;

    svg += `<defs>${defsContent}</defs>`;
    svg += `<g transform="translate(${mapX}, ${mapY})">`;

    // Clip group for map content
    svg += `<g clip-path="url(#${clipId})">`;

    // Background
    if (defaultTerrainType === 'grass') {
      svg += `<rect width="${mapAreaWidth}" height="${mapAreaHeight}" fill="url(#${bgPatternId})" />`;
    } else {
      svg += `<rect width="${mapAreaWidth}" height="${mapAreaHeight}" fill="#1a2e1a" />`;
      svg += `<rect width="${mapAreaWidth}" height="${mapAreaHeight}" fill="url(#${bgPatternId})" opacity="0.7" />`;
    }

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
        const { id, svg: patternSvg } = generateTerrainPattern(props.terrainType, colors, 1);
        patternId = id;
        terrainPatternMap.set(patternKey, patternId);
        svg = svg.replace('</defs>', `${patternSvg}</defs>`);
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
        svg += generateTreeSVG(
          x, y,
          props.treeType,
          props.size ?? 1,
          props.rotation ?? 0,
          undefined,
          props.opacity ?? 1,
          1.0
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

      // Calculate number of trees based on area - dense forest
      const baseDensity = 25;
      const treeCount = Math.max(3, Math.floor((area / 10000) * baseDensity));
      const minSpacing = 18;
      // Edge margin proportional to polygon size, but minimum for small areas
      const maxDim = Math.max(polyWidth, polyHeight);
      const edgeMargin = Math.min(15, maxDim * 0.1);

      // Generate tree placements
      const placements: Array<{ x: number; y: number; type: TreeType; size: number; rotation: number }> = [];
      let attempts = 0;
      const maxAttempts = treeCount * 20;

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
          size: 1.0 + random() * 0.5,
          rotation: random() * 360,
        });
      }

      // Render trees (sorted by y for proper overlap)
      placements.sort((a, b) => a.y - b.y);
      placements.forEach(p => {
        svg += generateTreeSVG(
          p.x, p.y,
          p.type,
          p.size,
          p.rotation,
          undefined,
          0.9 + random() * 0.1,
          1.0
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
    svg += '</g>'; // End clip group

    // Legend (outside rotation, always in corner)
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

    svg += '</g>'; // End map translate group
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
