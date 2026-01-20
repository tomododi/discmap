import { useEffect } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapMouseEvent } from 'maplibre-gl';
import { useCourseStore, useEditorStore, useMapStore } from '../stores';

export function useTreeEraser(mapRef: React.RefObject<MapRef | null>) {
  const isMapLoaded = useMapStore((s) => s.isMapLoaded);
  const drawMode = useEditorStore((s) => s.drawMode);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const treeBrushSettings = useEditorStore((s) => s.treeBrushSettings);
  const deleteTreeFeature = useCourseStore((s) => s.deleteTreeFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);
  const courses = useCourseStore((s) => s.courses);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    if (drawMode !== 'tree' || !treeBrushSettings.eraserEnabled) return;
    if (!activeCourseId) return;

    const map = mapRef.current.getMap();
    const course = courses[activeCourseId];
    if (!course) return;

    let isErasing = false;
    let hasErasedInSession = false;

    const eraseTreesAtPoint = (point: { x: number; y: number }) => {
      const currentCourse = useCourseStore.getState().courses[activeCourseId]; // Get fresh state
      if (!currentCourse?.treeFeatures) return;

      const eraserRadius = treeBrushSettings.eraserRadius;

      // Find trees within eraser radius (in pixels)
      const treesToDelete: string[] = [];

      for (const tree of currentCourse.treeFeatures) {
        const treeCoords = tree.geometry.coordinates;
        const treePoint = map.project([treeCoords[0], treeCoords[1]]);

        // Calculate pixel distance
        const dx = point.x - treePoint.x;
        const dy = point.y - treePoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= eraserRadius) {
          treesToDelete.push(tree.properties.id);
        }
      }

      // Delete matching trees
      for (const treeId of treesToDelete) {
        deleteTreeFeature(activeCourseId, treeId);
      }
    };

    const handleMouseDown = (e: MapMouseEvent) => {
      if (e.originalEvent.button !== 0) return; // Only left mouse button

      isErasing = true;

      // Save snapshot for undo before first deletion
      if (!hasErasedInSession) {
        saveSnapshot(activeCourseId);
        hasErasedInSession = true;
      }

      // Erase trees at click point
      eraseTreesAtPoint(e.point);

      // Prevent default draw behavior
      e.preventDefault();
    };

    const handleMouseMove = (e: MapMouseEvent) => {
      if (!isErasing) return;

      // Erase trees as we move
      eraseTreesAtPoint(e.point);
    };

    const handleMouseUp = () => {
      isErasing = false;
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    map.on('mouseleave', handleMouseUp);

    // Change cursor to indicate eraser mode
    map.getCanvas().style.cursor = 'crosshair';

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      map.off('mouseleave', handleMouseUp);
      map.getCanvas().style.cursor = '';
    };
  }, [
    mapRef,
    isMapLoaded,
    drawMode,
    treeBrushSettings,
    activeCourseId,
    // courses, // Removed to prevent infinite loop, using getState inside
    deleteTreeFeature,
    saveSnapshot,
  ]);
}
