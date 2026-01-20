import { useCallback } from 'react';
import type { MarkerDragEvent } from 'react-map-gl/maplibre';
import { useCourseStore, useEditorStore } from '../stores';
import type { FlightLineFeature } from '../types/course';

export function useFeatureEditing() {
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const addFeature = useCourseStore((s) => s.addFeature);
  const updateFeatureGeometry = useCourseStore((s) => s.updateFeatureGeometry);
  const updateFeature = useCourseStore((s) => s.updateFeature);
  const updateTerrainFeatureGeometry = useCourseStore((s) => s.updateTerrainFeatureGeometry);
  const updatePathFeatureGeometry = useCourseStore((s) => s.updatePathFeatureGeometry);
  const updateTreeFeatureGeometry = useCourseStore((s) => s.updateTreeFeatureGeometry);
  const updateTreeFeature = useCourseStore((s) => s.updateTreeFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);
  const drawMode = useEditorStore((s) => s.drawMode);
  const pendingFlightLine = useEditorStore((s) => s.pendingFlightLine);
  const setPendingFlightLine = useEditorStore((s) => s.setPendingFlightLine);
  const clearPendingFlightLine = useEditorStore((s) => s.clearPendingFlightLine);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);

  // Update flight lines when tee, basket, or dropzone position changes
  const updateFlightLinesForHole = useCallback(
    (holeId: string, featureType: 'tee' | 'basket' | 'dropzone', newCoords: [number, number], featureId?: string) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      if (!hole) return;

      if ((featureType === 'tee' || featureType === 'dropzone') && featureId) {
        // Find flight lines that start from this tee or dropzone
        const flightLines = hole.features.filter(
          (f) => f.properties.type === 'flightLine' && f.properties.startFeatureId === featureId
        ) as FlightLineFeature[];

        flightLines.forEach((flightLine) => {
          const coords = flightLine.geometry.coordinates as [number, number][];
          // Update the start point (tee/dropzone position)
          const newLineCoords = [newCoords, ...coords.slice(1)];
          updateFeatureGeometry(activeCourseId, holeId, flightLine.properties.id, newLineCoords);
        });
      } else if (featureType === 'basket') {
        // Find all flight lines in this hole and update their end points
        const holeFlightLines = hole.features.filter(
          (f) => f.properties.type === 'flightLine'
        ) as FlightLineFeature[];

        holeFlightLines.forEach((flightLine) => {
          const coords = flightLine.geometry.coordinates as [number, number][];
          // Update the end point (basket position)
          const newLineCoords = [...coords.slice(0, -1), newCoords];
          updateFeatureGeometry(activeCourseId, holeId, flightLine.properties.id, newLineCoords);
        });
      }
    },
    [activeCourseId, course, updateFeatureGeometry]
  );

  // Handler for dragging point features
  const handleDragEnd = useCallback(
    (featureId: string, holeId: string, event: MarkerDragEvent, featureType?: 'tee' | 'basket' | 'dropzone') => {
      if (!activeCourseId) return;
      saveSnapshot(activeCourseId);
      const newCoords: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      updateFeatureGeometry(activeCourseId, holeId, featureId, newCoords);

      // Update flight lines if tee, basket, or dropzone was moved
      if (featureType === 'tee' || featureType === 'dropzone') {
        updateFlightLinesForHole(holeId, featureType, newCoords, featureId);
      } else if (featureType === 'basket') {
        updateFlightLinesForHole(holeId, featureType, newCoords);
      }
    },
    [activeCourseId, updateFeatureGeometry, saveSnapshot, updateFlightLinesForHole]
  );

  // Handler for rotating point markers (mandatory, tee, dropzone)
  const handleFeatureRotate = useCallback(
    (featureId: string, holeId: string, newRotation: number) => {
      if (!activeCourseId) return;
      saveSnapshot(activeCourseId);
      updateFeature(activeCourseId, holeId, featureId, { rotation: newRotation });
    },
    [activeCourseId, updateFeature, saveSnapshot]
  );

  // Handler for dragging flight line vertices
  const handleFlightLineVertexDrag = useCallback(
    (featureId: string, holeId: string, vertexIndex: number, event: MarkerDragEvent) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const flightLine = hole?.features.find((f) => f.properties.id === featureId) as FlightLineFeature | undefined;
      if (!flightLine) return;

      const coords = [...flightLine.geometry.coordinates] as [number, number][];
      coords[vertexIndex] = [event.lngLat.lng, event.lngLat.lat];

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, coords);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for adding a new node to flight line
  const handleAddFlightLineNode = useCallback(
    (featureId: string, holeId: string, afterIndex: number) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const flightLine = hole?.features.find((f) => f.properties.id === featureId) as FlightLineFeature | undefined;
      if (!flightLine) return;

      const coords = [...flightLine.geometry.coordinates] as [number, number][];

      // Calculate midpoint between afterIndex and afterIndex + 1
      const p1 = coords[afterIndex];
      const p2 = coords[afterIndex + 1];
      const midpoint: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      // Insert new node
      coords.splice(afterIndex + 1, 0, midpoint);

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, coords);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for removing a node from flight line
  const handleRemoveFlightLineNode = useCallback(
    (featureId: string, holeId: string, nodeIndex: number) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const flightLine = hole?.features.find((f) => f.properties.id === featureId) as FlightLineFeature | undefined;
      if (!flightLine) return;

      const coords = [...flightLine.geometry.coordinates] as [number, number][];

      // Don't allow removing if only 2 nodes left
      if (coords.length <= 2) return;

      coords.splice(nodeIndex, 1);

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, coords);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for dragging polygon vertices (OB zones, fairways, dropzone areas)
  const handlePolygonVertexDrag = useCallback(
    (featureId: string, holeId: string, vertexIndex: number, event: MarkerDragEvent) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const feature = hole?.features.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'Polygon') return;

      const coords = [...(feature.geometry as { coordinates: number[][][] }).coordinates[0]] as [number, number][];
      coords[vertexIndex] = [event.lngLat.lng, event.lngLat.lat];

      // If editing first vertex, also update last vertex (closed ring)
      if (vertexIndex === 0) {
        coords[coords.length - 1] = [event.lngLat.lng, event.lngLat.lat];
      }
      // If editing last vertex, also update first vertex
      if (vertexIndex === coords.length - 1) {
        coords[0] = [event.lngLat.lng, event.lngLat.lat];
      }

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, [coords]);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for dragging terrain feature vertices (course-level)
  const handleTerrainVertexDrag = useCallback(
    (featureId: string, vertexIndex: number, event: MarkerDragEvent) => {
      if (!activeCourseId || !course) return;

      const feature = course.terrainFeatures?.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'Polygon') return;

      const coords = [...(feature.geometry as { coordinates: number[][][] }).coordinates[0]] as [number, number][];
      coords[vertexIndex] = [event.lngLat.lng, event.lngLat.lat];

      // If editing first vertex, also update last vertex (closed ring)
      if (vertexIndex === 0) {
        coords[coords.length - 1] = [event.lngLat.lng, event.lngLat.lat];
      }
      // If editing last vertex, also update first vertex
      if (vertexIndex === coords.length - 1) {
        coords[0] = [event.lngLat.lng, event.lngLat.lat];
      }

      saveSnapshot(activeCourseId);
      updateTerrainFeatureGeometry(activeCourseId, featureId, [coords]);
    },
    [activeCourseId, course, updateTerrainFeatureGeometry, saveSnapshot]
  );

  // Handler for adding a new node to polygon
  const handleAddPolygonNode = useCallback(
    (featureId: string, holeId: string, afterIndex: number) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const feature = hole?.features.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'Polygon') return;

      const coords = [...(feature.geometry as { coordinates: number[][][] }).coordinates[0]] as [number, number][];

      // Calculate midpoint between afterIndex and afterIndex + 1
      const p1 = coords[afterIndex];
      const p2 = coords[(afterIndex + 1) % coords.length];
      const midpoint: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      // Insert new node after afterIndex
      coords.splice(afterIndex + 1, 0, midpoint);

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, [coords]);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for removing a node from polygon
  const handleRemovePolygonNode = useCallback(
    (featureId: string, holeId: string, nodeIndex: number) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const feature = hole?.features.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'Polygon') return;

      const coords = [...(feature.geometry as { coordinates: number[][][] }).coordinates[0]] as [number, number][];

      // Don't allow removing if only 3 vertices left (4 points including closing point)
      if (coords.length <= 4) return;

      // If removing the first/last vertex (they're the same), handle specially
      if (nodeIndex === 0 || nodeIndex === coords.length - 1) {
        coords.splice(0, 1);
        coords[coords.length - 1] = coords[0]; // Update closing point
      } else {
        coords.splice(nodeIndex, 1);
      }

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, [coords]);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for adding a new node to terrain feature (course-level)
  const handleAddTerrainNode = useCallback(
    (featureId: string, afterIndex: number) => {
      if (!activeCourseId || !course) return;

      const feature = course.terrainFeatures?.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'Polygon') return;

      const coords = [...(feature.geometry as { coordinates: number[][][] }).coordinates[0]] as [number, number][];

      // Calculate midpoint between afterIndex and afterIndex + 1
      const p1 = coords[afterIndex];
      const p2 = coords[(afterIndex + 1) % coords.length];
      const midpoint: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      // Insert new node after afterIndex
      coords.splice(afterIndex + 1, 0, midpoint);

      saveSnapshot(activeCourseId);
      updateTerrainFeatureGeometry(activeCourseId, featureId, [coords]);
    },
    [activeCourseId, course, updateTerrainFeatureGeometry, saveSnapshot]
  );

  // Handler for removing a node from terrain feature (course-level)
  const handleRemoveTerrainNode = useCallback(
    (featureId: string, nodeIndex: number) => {
      if (!activeCourseId || !course) return;

      const feature = course.terrainFeatures?.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'Polygon') return;

      const coords = [...(feature.geometry as { coordinates: number[][][] }).coordinates[0]] as [number, number][];

      // Don't allow removing if only 3 vertices left (4 points including closing point)
      if (coords.length <= 4) return;

      // If removing the first/last vertex (they're the same), handle specially
      if (nodeIndex === 0 || nodeIndex === coords.length - 1) {
        coords.splice(0, 1);
        coords[coords.length - 1] = coords[0]; // Update closing point
      } else {
        coords.splice(nodeIndex, 1);
      }

      saveSnapshot(activeCourseId);
      updateTerrainFeatureGeometry(activeCourseId, featureId, [coords]);
    },
    [activeCourseId, course, updateTerrainFeatureGeometry, saveSnapshot]
  );

  // Handler for dragging path vertices (course-level)
  const handlePathVertexDrag = useCallback(
    (featureId: string, vertexIndex: number, event: MarkerDragEvent) => {
      if (!activeCourseId || !course) return;

      const feature = course.pathFeatures?.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'LineString') return;

      const coords = [...(feature.geometry as { coordinates: number[][] }).coordinates] as [number, number][];
      coords[vertexIndex] = [event.lngLat.lng, event.lngLat.lat];

      saveSnapshot(activeCourseId);
      updatePathFeatureGeometry(activeCourseId, featureId, coords);
    },
    [activeCourseId, course, updatePathFeatureGeometry, saveSnapshot]
  );

  // Handler for adding a new node to path (course-level)
  const handleAddPathNode = useCallback(
    (featureId: string, afterIndex: number) => {
      if (!activeCourseId || !course) return;

      const feature = course.pathFeatures?.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'LineString') return;

      const coords = [...(feature.geometry as { coordinates: number[][] }).coordinates] as [number, number][];

      // Calculate midpoint
      const p1 = coords[afterIndex];
      const p2 = coords[afterIndex + 1];
      const midpoint: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      coords.splice(afterIndex + 1, 0, midpoint);

      saveSnapshot(activeCourseId);
      updatePathFeatureGeometry(activeCourseId, featureId, coords);
    },
    [activeCourseId, course, updatePathFeatureGeometry, saveSnapshot]
  );

  // Handler for removing a node from path (course-level)
  const handleRemovePathNode = useCallback(
    (featureId: string, nodeIndex: number) => {
      if (!activeCourseId || !course) return;

      const feature = course.pathFeatures?.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'LineString') return;

      const coords = [...(feature.geometry as { coordinates: number[][] }).coordinates] as [number, number][];

      // Don't allow removing if only 2 nodes left
      if (coords.length <= 2) return;

      coords.splice(nodeIndex, 1);

      saveSnapshot(activeCourseId);
      updatePathFeatureGeometry(activeCourseId, featureId, coords);
    },
    [activeCourseId, course, updatePathFeatureGeometry, saveSnapshot]
  );

  // Handler for dragging tree features (course-level)
  const handleTreeDragEnd = useCallback(
    (featureId: string, event: MarkerDragEvent) => {
      if (!activeCourseId) return;
      saveSnapshot(activeCourseId);
      const newCoords: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      updateTreeFeatureGeometry(activeCourseId, featureId, newCoords);
    },
    [activeCourseId, updateTreeFeatureGeometry, saveSnapshot]
  );

  // Handler for rotating tree features (course-level)
  const handleTreeRotate = useCallback(
    (featureId: string, newRotation: number) => {
      if (!activeCourseId) return;
      saveSnapshot(activeCourseId);
      updateTreeFeature(activeCourseId, featureId, { rotation: newRotation });
    },
    [activeCourseId, updateTreeFeature, saveSnapshot]
  );

  // Handler for dragging line vertices (OB lines)
  const handleLineVertexDrag = useCallback(
    (featureId: string, holeId: string, vertexIndex: number, event: MarkerDragEvent) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const feature = hole?.features.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'LineString') return;

      const coords = [...(feature.geometry as { coordinates: number[][] }).coordinates] as [number, number][];
      coords[vertexIndex] = [event.lngLat.lng, event.lngLat.lat];

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, coords);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for adding a new node to line
  const handleAddLineNode = useCallback(
    (featureId: string, holeId: string, afterIndex: number) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const feature = hole?.features.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'LineString') return;

      const coords = [...(feature.geometry as { coordinates: number[][] }).coordinates] as [number, number][];

      // Calculate midpoint
      const p1 = coords[afterIndex];
      const p2 = coords[afterIndex + 1];
      const midpoint: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

      coords.splice(afterIndex + 1, 0, midpoint);

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, coords);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  // Handler for removing a node from line
  const handleRemoveLineNode = useCallback(
    (featureId: string, holeId: string, nodeIndex: number) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      const feature = hole?.features.find((f) => f.properties.id === featureId);
      if (!feature || feature.geometry.type !== 'LineString') return;

      const coords = [...(feature.geometry as { coordinates: number[][] }).coordinates] as [number, number][];

      // Don't allow removing if only 2 nodes left
      if (coords.length <= 2) return;

      coords.splice(nodeIndex, 1);

      saveSnapshot(activeCourseId);
      updateFeatureGeometry(activeCourseId, holeId, featureId, coords);
    },
    [activeCourseId, course, updateFeatureGeometry, saveSnapshot]
  );

  return {
    handleDragEnd,
    handleFeatureRotate,
    handleFlightLineVertexDrag,
    handleAddFlightLineNode,
    handleRemoveFlightLineNode,
    handlePolygonVertexDrag,
    handleTerrainVertexDrag,
    handleAddPolygonNode,
    handleRemovePolygonNode,
    handleAddTerrainNode,
    handleRemoveTerrainNode,
    handlePathVertexDrag,
    handleAddPathNode,
    handleRemovePathNode,
    handleTreeDragEnd,
    handleTreeRotate,
    handleLineVertexDrag,
    handleAddLineNode,
    handleRemoveLineNode,
    course, // Returning course as it's often needed alongside handlers
    activeCourseId,
    pendingFlightLine,
    setPendingFlightLine,
    clearPendingFlightLine,
    setDrawMode,
    addFeature,
    saveSnapshot,
    drawMode
  };
}
