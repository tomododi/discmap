import { useCallback, useRef } from 'react';
import Map, { NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import type { MapRef, ViewStateChangeEvent, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { useMapStore, useSettingsStore, useEditorStore } from '../../stores';
import { createMapStyle } from '../../lib/mapbox';
import { DrawControls } from './DrawControls';
import { FeatureLayers } from './FeatureLayers';
import { MapStyleSwitcher } from './MapStyleSwitcher';

export function MapContainer() {
  const mapRef = useRef<MapRef>(null);
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);
  const setIsMapLoaded = useMapStore((s) => s.setIsMapLoaded);
  const defaultMapStyle = useSettingsStore((s) => s.defaultMapStyle);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);

  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewState(evt.viewState);
    },
    [setViewState]
  );

  const handleLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, [setIsMapLoaded]);

  // Handle clicks on interactive layers (flight lines, OB zones, fairways, infrastructure)
  // Also deselects when clicking on empty space
  const handleClick = useCallback(
    (evt: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      const features = evt.features;

      // Check if click was on a React marker/button element (vertex handles, add node buttons, etc.)
      // These elements handle their own selection, so we shouldn't deselect here
      const target = evt.originalEvent.target as HTMLElement;
      if (target && (
        target.closest('button') ||
        target.closest('[data-marker]') ||
        target.classList.contains('maplibregl-marker') ||
        target.closest('.maplibregl-marker')
      )) {
        return; // Let the React onClick handler deal with this
      }

      // First check if we clicked on a standard interactive layer
      if (features && features.length > 0) {
        const clickedFeature = features[0];
        const featureId = clickedFeature.properties?.id;
        if (featureId) {
          setSelectedFeature(featureId);
          return;
        }
      }

      // If no interactive feature, check for course-level features with dynamic IDs
      if (map) {
        const point = evt.point;
        const allFeatures = map.queryRenderedFeatures(point);

        // Check for terrain layers
        const terrainFeature = allFeatures.find(f =>
          f.layer.id.startsWith('terrain-fill-')
        );
        if (terrainFeature) {
          const featureId = terrainFeature.properties?.id;
          if (featureId) {
            setSelectedFeature(featureId);
            return;
          }
        }

        // Check for path layers
        const pathFeature = allFeatures.find(f =>
          f.layer.id.startsWith('path-line-')
        );
        if (pathFeature) {
          const featureId = pathFeature.properties?.id;
          if (featureId) {
            setSelectedFeature(featureId);
            return;
          }
        }
      }

      // Clicked on empty space - deselect
      setSelectedFeature(null);
    },
    [setSelectedFeature]
  );

  // Use defaultMapStyle from settings - controlled by MapStyleSwitcher
  const mapStyle = createMapStyle(defaultMapStyle);

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
        <MapStyleSwitcher />

        <FeatureLayers />
        <DrawControls mapRef={mapRef} />
      </Map>
    </div>
  );
}
