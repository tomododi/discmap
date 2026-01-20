import { Source, Layer } from 'react-map-gl/maplibre';
import type { PathFeature } from '../../../types/course';

interface PathLayersProps {
  features: PathFeature[];
  selectedFeatureId: string | null;
}

export function PathLayers({ features, selectedFeatureId }: PathLayersProps) {
  return (
    <>
      {features.map((feature) => {
        const color = feature.properties.color || '#a8a29e';
        const strokeWidth = feature.properties.strokeWidth || 4;
        const opacity = feature.properties.opacity ?? 1;
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Source
            key={feature.properties.id}
            id={`path-${feature.properties.id}`}
            type="geojson"
            data={feature}
          >
            <Layer
              id={`path-line-${feature.properties.id}`}
              type="line"
              paint={{
                'line-color': color,
                'line-width': isSelected ? strokeWidth + 2 : strokeWidth,
                'line-opacity': opacity,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </Source>
        );
      })}
    </>
  );
}
