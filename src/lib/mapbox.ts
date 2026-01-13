import type { StyleSpecification } from 'maplibre-gl';
import type { CourseStyle } from '../types/course';

// Free map styles that don't require API keys
export const MAP_STYLES: Record<CourseStyle['mapStyle'], string> = {
  // Esri World Imagery - free satellite imagery
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  // OpenStreetMap with satellite hybrid
  'satellite-streets': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  // OpenStreetMap outdoors style
  outdoors: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

// MapLibre style spec for raster tiles
export function createMapStyle(styleType: CourseStyle['mapStyle']): StyleSpecification {
  const isOSM = styleType === 'outdoors';

  return {
    version: 8,
    name: styleType,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [MAP_STYLES[styleType]],
        tileSize: 256,
        attribution: isOSM
          ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          : '© <a href="https://www.esri.com/">Esri</a>',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f0f0f0',
        },
      },
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

// No token needed for MapLibre with free tiles
export function getMapboxToken(): string {
  return '';
}

export function isValidMapboxToken(_token: string): boolean {
  // Always return true - we don't need tokens with MapLibre + free tiles
  return true;
}
