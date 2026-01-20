import { Source, Layer, Marker } from 'react-map-gl/maplibre';
import type { TerrainFeature } from '../../../types/course';
import { TERRAIN_PATTERNS } from '../../../types/terrain';

interface TerrainLayersProps {
  features: TerrainFeature[];
  selectedFeatureId: string | null;
  setSelectedFeature: (id: string | null) => void;
}

export function TerrainLayers({ features, selectedFeatureId, setSelectedFeature }: TerrainLayersProps) {
  return (
    <>
      {/* Course-level Terrain (bottom-most layer) */}
      {features.map((feature) => {
        const terrainType = feature.properties.terrainType;
        const pattern = TERRAIN_PATTERNS[terrainType];
        const colors = feature.properties.customColors || {};
        const fillColor = colors.primary || pattern.defaultColors.primary;
        const strokeColor = colors.secondary || pattern.defaultColors.secondary;
        const opacity = feature.properties.opacity ?? 0.7;
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Source
            key={feature.properties.id}
            id={`terrain-${feature.properties.id}`}
            type="geojson"
            data={feature}
          >
            <Layer
              id={`terrain-fill-${feature.properties.id}`}
              type="fill"
              paint={{
                'fill-color': fillColor,
                'fill-opacity': opacity,
              }}
            />
            <Layer
              id={`terrain-outline-${feature.properties.id}`}
              type="line"
              paint={{
                'line-color': strokeColor,
                'line-width': isSelected ? 3 : 1.5,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        );
      })}

      {/* Terrain labels */}
      {features.map((feature) => {
        const coords = feature.geometry.coordinates[0] as [number, number][];
        // Get centroid of polygon
        const centroid = coords.reduce(
          (acc, coord) => [acc[0] + coord[0] / coords.length, acc[1] + coord[1] / coords.length],
          [0, 0] as [number, number]
        );
        const terrainType = feature.properties.terrainType;
        const pattern = TERRAIN_PATTERNS[terrainType];
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Marker
            key={`label-${feature.properties.id}`}
            longitude={centroid[0]}
            latitude={centroid[1]}
            anchor="center"
          >
            <div
              className={`
                px-2 py-1 rounded-lg text-xs font-medium shadow-md cursor-pointer
                transition-all hover:scale-105
                ${isSelected ? 'ring-2 ring-blue-400' : ''}
              `}
              style={{
                backgroundColor: `${pattern.defaultColors.primary}ee`,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
              onClick={() => setSelectedFeature(feature.properties.id)}
            >
              {pattern.name}
            </div>
          </Marker>
        );
      })}
    </>
  );
}
