import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { IControl } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useCourseStore, useEditorStore, useMapStore } from '../../stores';
import type { DiscGolfFeature, TeeProperties, BasketProperties, DropzoneProperties, DropzoneAreaProperties, MandatoryProperties, FlightLineProperties, OBZoneProperties, OBLineProperties, FairwayProperties, AnnotationProperties, InfrastructureProperties, LandmarkProperties } from '../../types/course';
import { DEFAULT_TEE_COLORS } from '../../types/course';
import type { DrawMode } from '../../types/editor';
import { TERRAIN_PATTERNS } from '../../types/terrain';
import { LANDMARK_DEFINITIONS } from '../../types/landmarks';

interface DrawControlsProps {
  mapRef: React.RefObject<MapRef | null>;
}

export function DrawControls({ mapRef }: DrawControlsProps) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const isMapLoaded = useMapStore((s) => s.isMapLoaded);
  const drawMode = useEditorStore((s) => s.drawMode);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const activeTerrainType = useEditorStore((s) => s.activeTerrainType);
  const activeLandmarkType = useEditorStore((s) => s.activeLandmarkType);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const addFeature = useCourseStore((s) => s.addFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);
  const courses = useCourseStore((s) => s.courses);

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

  // Get existing tee count for the current hole
  const getExistingTeeCount = (): number => {
    if (!activeCourseId || !activeHoleId) return 0;
    const course = courses[activeCourseId];
    const hole = course?.holes.find((h) => h.id === activeHoleId);
    if (!hole) return 0;
    return hole.features.filter((f) => f.properties.type === 'tee').length;
  };

  // Get default flight line color from course style
  const getDefaultFlightLineColor = (): string => {
    if (!activeCourseId) return '#3b82f6';
    const course = courses[activeCourseId];
    return course?.style?.defaultFlightLineColor || '#3b82f6';
  };

  // Create feature from draw mode
  const createFeatureProperties = (drawMode: DrawMode): Partial<DiscGolfFeature['properties']> | null => {
    if (!activeHoleId) return null;

    const now = new Date().toISOString();
    const baseProps = {
      id: crypto.randomUUID(),
      holeId: activeHoleId,
      createdAt: now,
      updatedAt: now,
    };

    switch (drawMode) {
      case 'tee': {
        const existingTeeCount = getExistingTeeCount();
        const color = DEFAULT_TEE_COLORS[existingTeeCount % DEFAULT_TEE_COLORS.length];
        return {
          ...baseProps,
          type: 'tee',
          color,
        } as TeeProperties;
      }
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
          rotation: 0, // Default pointing right
          lineAngle: 90, // Default perpendicular to arrow
          lineLength: 50, // Default 50 meters
        } as MandatoryProperties;
      case 'flightLine': {
        const flightLineColor = getDefaultFlightLineColor();
        return {
          ...baseProps,
          type: 'flightLine',
          startFrom: 'tee',
          color: flightLineColor,
        } as FlightLineProperties;
      }
      case 'obZone':
        return {
          ...baseProps,
          type: 'obZone',
          penalty: 'stroke',
        } as OBZoneProperties;
      case 'obLine':
        return {
          ...baseProps,
          type: 'obLine',
          fairwaySide: 'left',
        } as OBLineProperties;
      case 'fairway':
        return {
          ...baseProps,
          type: 'fairway',
        } as FairwayProperties;
      case 'dropzoneArea':
        return {
          ...baseProps,
          type: 'dropzoneArea',
          fairwayInside: true,
        } as DropzoneAreaProperties;
      case 'annotation':
        return {
          ...baseProps,
          type: 'annotation',
          text: 'New annotation',
        } as AnnotationProperties;
      case 'infrastructure': {
        const terrainPattern = TERRAIN_PATTERNS[activeTerrainType];
        return {
          ...baseProps,
          type: 'infrastructure',
          terrainType: activeTerrainType,
          label: terrainPattern.name,
        } as InfrastructureProperties;
      }
      case 'landmark': {
        const landmarkDef = LANDMARK_DEFINITIONS[activeLandmarkType];
        return {
          ...baseProps,
          type: 'landmark',
          landmarkType: activeLandmarkType,
          label: landmarkDef.name,
          size: 1,
          rotation: 0,
        } as LandmarkProperties;
      }
      default:
        return null;
    }
  };

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
      case 'annotation':
      case 'landmark':
        draw.changeMode('draw_point');
        break;
      case 'flightLine':
        // Flight lines use custom click-based creation (tee/dropzone → basket)
        // Don't use mapbox-gl-draw for these
        draw.changeMode('simple_select');
        break;
      case 'obLine':
        draw.changeMode('draw_line_string');
        break;
      case 'obZone':
      case 'fairway':
      case 'dropzoneArea':
      case 'infrastructure':
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
    activeTerrainType,
    activeLandmarkType,
    createFeatureProperties,
    addFeature,
    saveSnapshot,
    setDrawMode,
    setSelectedFeature,
  ]);

  return null;
}
