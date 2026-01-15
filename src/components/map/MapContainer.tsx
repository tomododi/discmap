import { useCallback, useRef } from 'react';
import Map, { NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import type { MapRef, ViewStateChangeEvent, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { useMapStore, useSettingsStore, useCourseStore, useEditorStore } from '../../stores';
import { createMapStyle } from '../../lib/mapbox';
import { DrawControls } from './DrawControls';
import { FeatureLayers } from './FeatureLayers';

export function MapContainer() {
  const mapRef = useRef<MapRef>(null);
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);
  const setIsMapLoaded = useMapStore((s) => s.setIsMapLoaded);
  const defaultMapStyle = useSettingsStore((s) => s.defaultMapStyle);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);

  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewState(evt.viewState);
    },
    [setViewState]
  );

  const handleLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, [setIsMapLoaded]);

  // Handle clicks on interactive layers (flight lines, OB zones, fairways)
  // Also deselects when clicking on empty space
  const handleClick = useCallback(
    (evt: MapLayerMouseEvent) => {
      const features = evt.features;
      if (features && features.length > 0) {
        const clickedFeature = features[0];
        const featureId = clickedFeature.properties?.id;
        if (featureId) {
          setSelectedFeature(featureId);
        }
      } else {
        // Clicked on empty space - deselect
        setSelectedFeature(null);
      }
    },
    [setSelectedFeature]
  );

  const styleType = course?.style.mapStyle || defaultMapStyle;
  const mapStyle = createMapStyle(styleType);

  // Layers that should be clickable
  const interactiveLayerIds = ['flightLines', 'obZones', 'fairways', 'dropzoneAreas-fill', 'obLines'];

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onLoad={handleLoad}
        onClick={handleClick}
        mapStyle={mapStyle}
        interactiveLayerIds={interactiveLayerIds}
        attributionControl={{ compact: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        <FeatureLayers />
        <DrawControls mapRef={mapRef} />
      </Map>
    </div>
  );
}
