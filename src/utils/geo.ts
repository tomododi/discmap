import { distance, point, length, bbox, center, destination } from '@turf/turf';
import type { Feature, LineString, BBox } from 'geojson';
import type { Units } from '../stores/settingsStore';

export function calculateDistance(
  from: [number, number],
  to: [number, number],
  units: Units = 'meters'
): number {
  const fromPoint = point(from);
  const toPoint = point(to);
  const dist = distance(fromPoint, toPoint, { units: units === 'meters' ? 'meters' : 'feet' });
  return Math.round(dist);
}

export function calculateLineLength(
  coordinates: [number, number][],
  units: Units = 'meters'
): number {
  const line: Feature<LineString> = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
    properties: {},
  };
  const len = length(line, { units: units === 'meters' ? 'meters' : 'feet' });
  return Math.round(len);
}

export function getBounds(features: Feature[]): BBox | null {
  if (features.length === 0) return null;

  const featureCollection = {
    type: 'FeatureCollection' as const,
    features,
  };

  return bbox(featureCollection);
}

export function getCenter(features: Feature[]): [number, number] | null {
  if (features.length === 0) return null;

  const featureCollection = {
    type: 'FeatureCollection' as const,
    features,
  };

  const centerPoint = center(featureCollection);
  return centerPoint.geometry.coordinates as [number, number];
}

export function metersToFeet(meters: number): number {
  return Math.round(meters * 3.28084);
}

export function feetToMeters(feet: number): number {
  return Math.round(feet / 3.28084);
}

export function formatDistance(distance: number, units: Units): string {
  return `${distance} ${units === 'meters' ? 'm' : 'ft'}`;
}

/**
 * Calculate a destination point given a start point, bearing (degrees), and distance (meters).
 * Bearing: 0 = North, 90 = East, 180 = South, 270 = West
 */
export function calculateDestination(
  from: [number, number],
  bearing: number,
  distanceMeters: number
): [number, number] {
  const fromPoint = point(from);
  const dest = destination(fromPoint, distanceMeters / 1000, bearing, { units: 'kilometers' });
  return dest.geometry.coordinates as [number, number];
}
