import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { IControl } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useCourseStore, useEditorStore, useMapStore } from '../../stores';
import type { DiscGolfFeature, TeeProperties, BasketProperties, DropzoneProperties, DropzoneAreaProperties, MandatoryProperties, FlightLineProperties, OBZoneProperties, OBLineProperties, FairwayProperties, AnnotationProperties, TerrainFeature, TerrainFeatureProperties, PathFeature, PathFeatureProperties } from '../../types/course';
import { DEFAULT_TEE_COLORS } from '../../types/course';
import type { DrawMode } from '../../types/editor';
import { TERRAIN_PATTERNS } from '../../types/terrain';

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
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const addFeature = useCourseStore((s) => s.addFeature);
  const addTerrainFeature = useCourseStore((s) => s.addTerrainFeature);
  const addPathFeature = useCourseStore((s) => s.addPathFeature);
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

  // Create terrain feature properties (course-level)
  const createTerrainFeatureProperties = (): TerrainFeatureProperties | null => {
    const now = new Date().toISOString();
    const terrainPattern = TERRAIN_PATTERNS[activeTerrainType];
    return {
      id: crypto.randomUUID(),
      type: 'terrain',
      terrainType: activeTerrainType,
      label: terrainPattern.name,
      createdAt: now,
      updatedAt: now,
    };
  };

  // Create path feature properties (course-level)
  const createPathFeatureProperties = (): PathFeatureProperties => {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      type: 'path',
      label: 'Path',
      color: '#a8a29e', // Default path color
      strokeWidth: 4,
      opacity: 1,
      createdAt: now,
      updatedAt: now,
    };
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
          rotation: 0, // Arrow pointing right (absolute)
          lineAngle: 270, // Line pointing up (absolute, independent of arrow)
          lineLength: 60, // Line length in pixels
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
      case 'infrastructure':
        // Terrain features are handled separately (course-level)
        return null;
      case 'path':
        // Path features are handled separately (course-level)
        return null;
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
        draw.changeMode('draw_point');
        break;
      case 'flightLine':
        // Flight lines use custom click-based creation (tee/dropzone → basket)
        // Don't use mapbox-gl-draw for these
        draw.changeMode('simple_select');
        break;
      case 'obLine':
      case 'path':
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
      if (!activeCourseId) return;

      const feature = e.features[0];
      if (!feature) return;

      // Save snapshot for undo
      saveSnapshot(activeCourseId);

      // Handle terrain features separately (course-level, not hole-level)
      if (drawMode === 'infrastructure') {
        const terrainProps = createTerrainFeatureProperties();
        if (!terrainProps) return;

        const terrainFeature: TerrainFeature = {
          type: 'Feature',
          geometry: feature.geometry as GeoJSON.Polygon,
          properties: terrainProps,
        };

        addTerrainFeature(activeCourseId, terrainFeature);

        // Delete the drawn feature (we're storing it in our own state)
        if (drawRef.current && feature.id) {
          drawRef.current.delete(feature.id as string);
        }

        // Select the newly created terrain feature
        setSelectedFeature(terrainProps.id);

        // Reset to select mode
        setDrawMode('select');
        return;
      }

      // Handle path features separately (course-level, not hole-level)
      if (drawMode === 'path') {
        const pathProps = createPathFeatureProperties();

        const pathFeature: PathFeature = {
          type: 'Feature',
          geometry: feature.geometry as GeoJSON.LineString,
          properties: pathProps,
        };

        addPathFeature(activeCourseId, pathFeature);

        // Delete the drawn feature (we're storing it in our own state)
        if (drawRef.current && feature.id) {
          drawRef.current.delete(feature.id as string);
        }

        // Select the newly created path feature
        setSelectedFeature(pathProps.id);

        // Reset to select mode
        setDrawMode('select');
        return;
      }

      // Handle hole-level features
      if (!activeHoleId) return;

      const properties = createFeatureProperties(drawMode);
      if (!properties) return;

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
    createFeatureProperties,
    createTerrainFeatureProperties,
    createPathFeatureProperties,
    addFeature,
    addTerrainFeature,
    addPathFeature,
    saveSnapshot,
    setDrawMode,
    setSelectedFeature,
  ]);

  return null;
}
