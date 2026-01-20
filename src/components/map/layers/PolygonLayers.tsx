import { Source, Layer } from 'react-map-gl/maplibre';
import type { DiscGolfFeature, CourseStyle } from '../../../types/course';

interface PolygonLayersProps {
  fairways: DiscGolfFeature[];
  dropzoneAreas: DiscGolfFeature[];
  obZones: DiscGolfFeature[];
  style: CourseStyle;
}

export function PolygonLayers({ fairways, dropzoneAreas, obZones, style }: PolygonLayersProps) {
  const createFeatureCollection = (features: DiscGolfFeature[]) => ({
    type: 'FeatureCollection' as const,
    features,
  });

  return (
    <>
      {/* Fairways (bottom layer) */}
      <Source id="fairways" type="geojson" data={createFeatureCollection(fairways)}>
        <Layer
          id="fairways"
          type="fill"
          paint={{
            'fill-color': style.fairwayColor,
            'fill-opacity': style.fairwayOpacity,
          }}
        />
      </Source>

      {/* Dropzone Areas - flippable inside/outside */}
      <Source id="dropzoneAreas" type="geojson" data={createFeatureCollection(dropzoneAreas)}>
        {/* Green fade on fairway side */}
        <Layer
          id="dropzoneAreas-fairway-fade"
          type="line"
          paint={{
            'line-color': '#22c55e',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.4,
            // If fairwayInside is true (or undefined), green is inside (-8), otherwise outside (+8)
            'line-offset': ['case', ['coalesce', ['get', 'fairwayInside'], true], -8, 8],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
        {/* Red fade on OB side */}
        <Layer
          id="dropzoneAreas-ob-fade"
          type="line"
          paint={{
            'line-color': '#dc2626',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.4,
            // If fairwayInside is true (or undefined), red is outside (+8), otherwise inside (-8)
            'line-offset': ['case', ['coalesce', ['get', 'fairwayInside'], true], 8, -8],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
        {/* Invisible fill for click detection */}
        <Layer
          id="dropzoneAreas-fill"
          type="fill"
          paint={{
            'fill-color': '#000000',
            'fill-opacity': 0,
          }}
        />
        {/* Main boundary line */}
        <Layer
          id="dropzoneAreas-outline"
          type="line"
          paint={{
            'line-color': style.dropzoneAreaBorderColor,
            'line-width': 3,
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
      </Source>

      {/* OB Zones */}
      <Source id="obZones" type="geojson" data={createFeatureCollection(obZones)}>
        <Layer
          id="obZones"
          type="fill"
          paint={{
            'fill-color': style.obZoneColor,
            'fill-opacity': style.obZoneOpacity,
          }}
        />
        <Layer
          id="obZones-outline"
          type="line"
          paint={{
            'line-color': style.obZoneColor,
            'line-width': 3,
          }}
        />
      </Source>
    </>
  );
}
