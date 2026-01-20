import { bbox } from '@turf/turf';
import type { DiscGolfFeature } from '../../types/course';

export interface SVGViewport {
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

export function calculateBounds(features: DiscGolfFeature[]): SVGViewport['bounds'] | null {
  if (features.length === 0) return null;

  const featureCollection = {
    type: 'FeatureCollection' as const,
    features,
  };

  const [minLng, minLat, maxLng, maxLat] = bbox(featureCollection);
  return { minLng, minLat, maxLng, maxLat };
}

export function geoToSVG(
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

export function polygonCoordsToSVG(
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

export function lineStringToSVG(
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
export function polygonToPath(
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
