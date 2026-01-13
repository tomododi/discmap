import { Source, Layer, Marker } from 'react-map-gl/maplibre';
import { useCourseStore, useEditorStore } from '../../stores';
import type { TeeFeature, BasketFeature, DropzoneFeature, MandatoryFeature } from '../../types/course';
import { TeeMarker } from './markers/TeeMarker';
import { BasketMarker } from './markers/BasketMarker';
import { DropzoneMarker } from './markers/DropzoneMarker';
import { MandatoryMarker } from './markers/MandatoryMarker';

export function FeatureLayers() {
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const showLayers = useEditorStore((s) => s.showLayers);
  const selectedFeatureId = useEditorStore((s) => s.selectedFeatureId);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);

  if (!course) return null;

  // Get features from active hole or all holes
  const holes = activeHoleId
    ? course.holes.filter((h) => h.id === activeHoleId)
    : course.holes;

  const features = holes.flatMap((hole) => hole.features);

  // Separate point features (rendered as Markers) from line/polygon features
  const tees = features.filter((f) => f.properties.type === 'tee' && showLayers.tees) as TeeFeature[];
  const baskets = features.filter((f) => f.properties.type === 'basket' && showLayers.baskets) as BasketFeature[];
  const dropzones = features.filter((f) => f.properties.type === 'dropzone' && showLayers.dropzones) as DropzoneFeature[];
  const mandatories = features.filter((f) => f.properties.type === 'mandatory' && showLayers.mandatories) as MandatoryFeature[];

  // Line and polygon features for Source/Layer rendering
  const flightLines = features.filter((f) => f.properties.type === 'flightLine' && showLayers.flightLines);
  const obZones = features.filter((f) => f.properties.type === 'obZone' && showLayers.obZones);
  const fairways = features.filter((f) => f.properties.type === 'fairway' && showLayers.fairways);

  const createFeatureCollection = (featureList: typeof features) => ({
    type: 'FeatureCollection' as const,
    features: featureList,
  });

  return (
    <>
      {/* Fairways (bottom layer) */}
      <Source id="fairways" type="geojson" data={createFeatureCollection(fairways)}>
        <Layer
          id="fairways"
          type="fill"
          paint={{
            'fill-color': course.style.fairwayColor,
            'fill-opacity': course.style.fairwayOpacity,
          }}
        />
      </Source>

      {/* OB Zones */}
      <Source id="obZones" type="geojson" data={createFeatureCollection(obZones)}>
        <Layer
          id="obZones"
          type="fill"
          paint={{
            'fill-color': course.style.obZoneColor,
            'fill-opacity': course.style.obZoneOpacity,
          }}
        />
        <Layer
          id="obZones-outline"
          type="line"
          paint={{
            'line-color': course.style.obZoneColor,
            'line-width': 2,
            'line-dasharray': [4, 2],
          }}
        />
      </Source>

      {/* Flight Lines */}
      <Source id="flightLines" type="geojson" data={createFeatureCollection(flightLines)}>
        <Layer
          id="flightLines"
          type="line"
          paint={{
            'line-color': course.style.flightLineColor,
            'line-width': course.style.flightLineWidth,
            'line-dasharray': [2, 1],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
      </Source>

      {/* Custom Markers for point features */}
      {dropzones.map((feature) => (
        <Marker
          key={feature.properties.id}
          longitude={feature.geometry.coordinates[0]}
          latitude={feature.geometry.coordinates[1]}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedFeature(feature.properties.id);
          }}
        >
          <DropzoneMarker selected={selectedFeatureId === feature.properties.id} />
        </Marker>
      ))}

      {mandatories.map((feature) => (
        <Marker
          key={feature.properties.id}
          longitude={feature.geometry.coordinates[0]}
          latitude={feature.geometry.coordinates[1]}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedFeature(feature.properties.id);
          }}
        >
          <MandatoryMarker
            direction={feature.properties.direction}
            selected={selectedFeatureId === feature.properties.id}
          />
        </Marker>
      ))}

      {tees.map((feature) => (
        <Marker
          key={feature.properties.id}
          longitude={feature.geometry.coordinates[0]}
          latitude={feature.geometry.coordinates[1]}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedFeature(feature.properties.id);
          }}
        >
          <TeeMarker
            position={feature.properties.position}
            selected={selectedFeatureId === feature.properties.id}
            holeNumber={holes.find(h => h.id === feature.properties.holeId)?.number}
          />
        </Marker>
      ))}

      {baskets.map((feature) => (
        <Marker
          key={feature.properties.id}
          longitude={feature.geometry.coordinates[0]}
          latitude={feature.geometry.coordinates[1]}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedFeature(feature.properties.id);
          }}
        >
          <BasketMarker
            selected={selectedFeatureId === feature.properties.id}
            holeNumber={holes.find(h => h.id === feature.properties.holeId)?.number}
          />
        </Marker>
      ))}
    </>
  );
}
