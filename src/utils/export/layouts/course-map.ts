import type { Course, Hole, DiscGolfFeature, TeeProperties, FlightLineProperties, DropzoneProperties, OBLineProperties, DropzoneAreaProperties, TerrainFeature, TerrainFeatureProperties, PathFeature } from '../../../types/course';
import type { ExportConfig } from '../../../types/export';
import { TERRAIN_PATTERNS, getTerrainColors } from '../../../types/terrain';
import type { TreeFeature } from '../../../types/trees';
import { generateTerrainPattern, generateCompassRose, generateScaleBar, resetPatternIds, generateGrassImageBackground } from '../../svgPatterns';
import { generateTreeSVG } from '../../treeSvg';
import type { TreeType } from '../../../types/trees';
import { calculateBounds, geoToSVG, polygonCoordsToSVG, lineStringToSVG, polygonToPath } from '../coordinate-transform';
import type { SVGViewport } from '../coordinate-transform';
import { CollisionManager } from '../collision-detection';
import type { BoundingBox } from '../collision-detection';
import { darkenColor, generateTeeSVG, generateBasketSVG, generateDropzoneSVG, generateMandatorySVG, generateAnnotationSVG } from '../svg-markers';
import { generateLegendSVG } from '../svg-legend';

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
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Generate default terrain background
  if (includeTerrain) {
    const defaultTerrainType = style.defaultTerrain ?? 'grass';
    const defaultTerrainPattern = TERRAIN_PATTERNS[defaultTerrainType];
    // Frame color is always based on terrain pattern colors
    const frameColor = darkenColor(defaultTerrainPattern.defaultColors.primary);

    let bgPatternId: string;
    let bgPatternSvg: string;

    // For grass, use photo-realistic tile pattern (1 tile = 5 meters)
    if (defaultTerrainType === 'grass') {
      const grassPattern = generateGrassImageBackground('grass_bg', metersPerPixel, 20);
      bgPatternId = grassPattern.id;
      bgPatternSvg = grassPattern.svg;
    } else {
      // For other terrain types, use programmatic patterns
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
    svg += `<rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="none" stroke="${frameColor}" stroke-width="3" rx="8" />`;
  } else {
    svg += `<defs></defs>`;
    svg += `<rect width="${width}" height="${height}" fill="#f8fafc" />`;
  }

  // Course-level terrain features (on top of default terrain)
  // Separate forests from other terrain to render forests last (trees on top)
  const forestFeatures: TerrainFeature[] = [];
  const otherTerrainFeatures: TerrainFeature[] = [];

  if (includeInfrastructure && course.terrainFeatures) {
    course.terrainFeatures.forEach((f: TerrainFeature) => {
      if (f.properties.terrainType === 'forest') {
        forestFeatures.push(f);
      } else {
        otherTerrainFeatures.push(f);
      }
    });
  }

  // Render non-forest terrain features first
  otherTerrainFeatures.forEach((f: TerrainFeature) => {
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
        undefined,
        props.opacity ?? 1,
        densityMetrics.markerScale
      );
      svg += treeSvg;
    });
  }

  // Forest terrain features - render as individual top-view trees filling the polygon
  forestFeatures.forEach((f: TerrainFeature) => {
    const props = f.properties as TerrainFeatureProperties;
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];

    // Convert polygon coordinates from geo to SVG
    const svgPolygon: Array<[number, number]> = coords.map(coord => {
      const [x, y] = geoToSVG(coord as [number, number], viewport);
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
    const baseDensity = 25; // Trees per 10000 sq pixels
    const treeCount = Math.max(3, Math.floor((area / 10000) * baseDensity));
    const minSpacing = 18 * densityMetrics.markerScale;
    // Edge margin proportional to polygon size, but minimum for small areas
    const maxDim = Math.max(polyWidth, polyHeight);
    const edgeMargin = Math.min(15, maxDim * 0.1) * densityMetrics.markerScale;

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
        size: 1.0 + random() * 0.5, // Size variation
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
        undefined, // Use default colors
        0.9 + random() * 0.1, // Slight opacity variation
        densityMetrics.markerScale
      );
    });
  });

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
