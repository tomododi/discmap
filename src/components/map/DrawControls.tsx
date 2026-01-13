import { useCallback, useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { IControl } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useCourseStore, useEditorStore, useMapStore } from '../../stores';
import type { DiscGolfFeature, TeeProperties, BasketProperties, DropzoneProperties, MandatoryProperties, FlightLineProperties, OBZoneProperties, FairwayProperties } from '../../types/course';
import type { DrawMode } from '../../types/editor';

interface DrawControlsProps {
  mapRef: React.RefObject<MapRef | null>;
}

export function DrawControls({ mapRef }: DrawControlsProps) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const isMapLoaded = useMapStore((s) => s.isMapLoaded);
  const drawMode = useEditorStore((s) => s.drawMode);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const activeTeePosition = useEditorStore((s) => s.activeTeePosition);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const addFeature = useCourseStore((s) => s.addFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);

  // Initialize draw control
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const map = mapRef.current.getMap();

    // Create draw control with custom styles
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        // Point styles
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 8,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        },
        // Line styles
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
          },
        },
        // Polygon fill
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.2,
          },
        },
        // Polygon outline
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
          },
        },
        // Vertex points
        {
          id: 'gl-draw-point-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#3b82f6',
          },
        },
      ],
    });

    // Cast to IControl since mapbox-gl-draw works with maplibre at runtime
    map.addControl(draw as unknown as IControl);
    drawRef.current = draw;

    return () => {
      if (map && drawRef.current) {
        map.removeControl(drawRef.current as unknown as IControl);
        drawRef.current = null;
      }
    };
  }, [isMapLoaded, mapRef]);

  // Create feature from draw mode
  const createFeatureProperties = useCallback(
    (drawMode: DrawMode): Partial<DiscGolfFeature['properties']> | null => {
      if (!activeHoleId) return null;

      const now = new Date().toISOString();
      const baseProps = {
        id: crypto.randomUUID(),
        holeId: activeHoleId,
        createdAt: now,
        updatedAt: now,
      };

      switch (drawMode) {
        case 'tee':
          return {
            ...baseProps,
            type: 'tee',
            position: activeTeePosition,
          } as TeeProperties;
        case 'basket':
          return {
            ...baseProps,
            type: 'basket',
          } as BasketProperties;
        case 'dropzone':
          return {
            ...baseProps,
            type: 'dropzone',
          } as DropzoneProperties;
        case 'mandatory':
          return {
            ...baseProps,
            type: 'mandatory',
            direction: 'right',
          } as MandatoryProperties;
        case 'flightLine':
          return {
            ...baseProps,
            type: 'flightLine',
            position: activeTeePosition,
          } as FlightLineProperties;
        case 'obZone':
          return {
            ...baseProps,
            type: 'obZone',
            penalty: 'stroke',
          } as OBZoneProperties;
        case 'fairway':
          return {
            ...baseProps,
            type: 'fairway',
          } as FairwayProperties;
        default:
          return null;
      }
    },
    [activeHoleId, activeTeePosition]
  );

  // Handle draw mode changes
  useEffect(() => {
    if (!drawRef.current || !isMapLoaded) return;

    const draw = drawRef.current;

    switch (drawMode) {
      case 'select':
        draw.changeMode('simple_select');
        break;
      case 'tee':
      case 'basket':
      case 'dropzone':
      case 'mandatory':
        draw.changeMode('draw_point');
        break;
      case 'flightLine':
        draw.changeMode('draw_line_string');
        break;
      case 'obZone':
      case 'fairway':
        draw.changeMode('draw_polygon');
        break;
    }
  }, [drawMode, isMapLoaded]);

  // Handle draw events
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current.getMap();

    const handleCreate = (e: { features: GeoJSON.Feature[] }) => {
      if (!activeCourseId || !activeHoleId) return;

      const feature = e.features[0];
      if (!feature) return;

      const properties = createFeatureProperties(drawMode);
      if (!properties) return;

      // Save snapshot for undo
      saveSnapshot(activeCourseId);

      // Create the disc golf feature
      const discGolfFeature: DiscGolfFeature = {
        type: 'Feature',
        geometry: feature.geometry,
        properties: properties as DiscGolfFeature['properties'],
      } as DiscGolfFeature;

      addFeature(activeCourseId, activeHoleId, discGolfFeature);

      // Delete the drawn feature (we're storing it in our own state)
      if (drawRef.current && feature.id) {
        drawRef.current.delete(feature.id as string);
      }

      // Reset to select mode
      setDrawMode('select');
    };

    const handleSelect = (e: { features: GeoJSON.Feature[] }) => {
      const feature = e.features[0];
      if (feature?.properties?.id) {
        setSelectedFeature(feature.properties.id);
      } else {
        setSelectedFeature(null);
      }
    };

    map.on('draw.create', handleCreate);
    map.on('draw.selectionchange', handleSelect);

    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.selectionchange', handleSelect);
    };
  }, [
    mapRef,
    isMapLoaded,
    drawMode,
    activeCourseId,
    activeHoleId,
    createFeatureProperties,
    addFeature,
    saveSnapshot,
    setDrawMode,
    setSelectedFeature,
  ]);

  return null;
}
