import { useEffect, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { MapMouseEvent } from 'maplibre-gl';
import { useCourseStore, useEditorStore, useMapStore } from '../stores';
import { TREE_PATTERNS } from '../types/trees';
import type { TreeFeature, TreeFeatureProperties } from '../types/trees';

export function useTreeBrush(mapRef: React.RefObject<MapRef | null>) {
  const isMapLoaded = useMapStore((s) => s.isMapLoaded);
  const drawMode = useEditorStore((s) => s.drawMode);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeTreeType = useEditorStore((s) => s.activeTreeType);
  const treeBrushSettings = useEditorStore((s) => s.treeBrushSettings);
  const addTreeFeature = useCourseStore((s) => s.addTreeFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);

  // Helper to create tree properties
  const createTreeFeatureProperties = useCallback((sizeOverride?: number, rotationOverride?: number): TreeFeatureProperties => {
    const now = new Date().toISOString();
    const treePattern = TREE_PATTERNS[activeTreeType];
    return {
      id: crypto.randomUUID(),
      type: 'tree',
      treeType: activeTreeType,
      size: sizeOverride ?? 1, // Default scale multiplier
      rotation: rotationOverride ?? 0, // Default rotation
      opacity: 1, // Default opacity
      label: treePattern.name,
      createdAt: now,
      updatedAt: now,
    };
  }, [activeTreeType]);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    if (drawMode !== 'tree' || !treeBrushSettings.enabled) return;
    if (!activeCourseId) return;

    const map = mapRef.current.getMap();
    let isPainting = false;
    let lastPlacementPoint: { x: number; y: number } | null = null;

    const placeTreeAtPoint = (lngLat: { lng: number; lat: number }) => {
      // Random size variation
      const sizeVariation = treeBrushSettings.sizeVariation;
      const size = 1 + (Math.random() - 0.5) * 2 * sizeVariation;

      // Random rotation
      const rotation = Math.floor(Math.random() * 360);

      const treeProps = createTreeFeatureProperties(size, rotation);

      const treeFeature: TreeFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lngLat.lng, lngLat.lat],
        },
        properties: treeProps,
      };

      addTreeFeature(activeCourseId, treeFeature);
    };

    const handleMouseDown = (e: MapMouseEvent) => {
      if (e.originalEvent.button !== 0) return; // Only left mouse button

      isPainting = true;

      // Save snapshot for undo on first placement
      saveSnapshot(activeCourseId);

      // Place first tree
      placeTreeAtPoint(e.lngLat);
      lastPlacementPoint = { x: e.point.x, y: e.point.y };

      // Prevent default draw behavior
      e.preventDefault();
    };

    const handleMouseMove = (e: MapMouseEvent) => {
      if (!isPainting || !lastPlacementPoint) return;

      // Calculate distance from last placement
      const dx = e.point.x - lastPlacementPoint.x;
      const dy = e.point.y - lastPlacementPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Place tree if we've moved far enough (based on density setting)
      if (distance >= treeBrushSettings.density) {
        placeTreeAtPoint(e.lngLat);
        lastPlacementPoint = { x: e.point.x, y: e.point.y };
      }
    };

    const handleMouseUp = () => {
      isPainting = false;
      lastPlacementPoint = null;
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    map.on('mouseleave', handleMouseUp);

    // Change cursor to crosshair
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
    activeTreeType,
    addTreeFeature,
    saveSnapshot,
    createTreeFeatureProperties,
  ]);
}
