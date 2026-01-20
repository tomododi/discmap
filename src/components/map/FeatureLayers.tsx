import { useEditorStore, useMapStore } from '../../stores';
import { useSettingsStore } from '../../stores/settingsStore';
import type { TeeFeature, BasketFeature, DropzoneFeature, MandatoryFeature, FlightLineFeature, AnnotationFeature, OBLineFeature, TerrainFeature, PathFeature } from '../../types/course';
import type { TreeFeature } from '../../types/trees';
import { useFeatureEditing } from '../../hooks/useFeatureEditing';
import { TerrainLayers } from './layers/TerrainLayers';
import { PathLayers } from './layers/PathLayers';
import { PolygonLayers } from './layers/PolygonLayers';
import { LineLayers } from './layers/LineLayers';
import { PointLayers } from './layers/PointLayers';
import { VertexEditor } from './layers/VertexEditor';

export function FeatureLayers() {
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const showAllHoles = useEditorStore((s) => s.showAllHoles);
  const showLayers = useEditorStore((s) => s.showLayers);
  const selectedFeatureId = useEditorStore((s) => s.selectedFeatureId);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const units = useSettingsStore((s) => s.units);
  const mapBearing = useMapStore((s) => s.viewState.bearing);

  const {
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
    course,
    pendingFlightLine,
    setPendingFlightLine,
    clearPendingFlightLine,
    setDrawMode,
    addFeature,
    saveSnapshot,
    drawMode
  } = useFeatureEditing();

  // Handler for clicking on tee/dropzone to start flight line
  const handleFlightLineStart = (featureId: string, startType: 'tee' | 'dropzone', coords: [number, number], color: string) => {
    if (drawMode !== 'flightLine') return;
    setPendingFlightLine({
      startFeatureId: featureId,
      startType,
      startCoords: coords,
      startColor: color,
    });
  };

  // Handler for clicking on basket to finish flight line
  const handleFlightLineEnd = (basketCoords: [number, number], holeId: string) => {
    if (drawMode !== 'flightLine' || !pendingFlightLine || !course) return;

    const now = new Date().toISOString();
    const flightLineFeature = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [pendingFlightLine.startCoords, basketCoords],
      },
      properties: {
        id: crypto.randomUUID(),
        type: 'flightLine',
        holeId,
        startFrom: pendingFlightLine.startType,
        startFeatureId: pendingFlightLine.startFeatureId,
        color: pendingFlightLine.startColor,
        createdAt: now,
        updatedAt: now,
      },
    };

    if (course) { // Just to be safe with types, though handled in hook
      const activeCourseId = useEditorStore.getState().activeCourseId;
      if (activeCourseId) {
        saveSnapshot(activeCourseId);
        addFeature(activeCourseId, holeId, flightLineFeature as any);
      }
    }
    clearPendingFlightLine();
    setDrawMode('select');
  };

  if (!course) return null;

  const { style } = course;

  // Get features from active hole or all holes
  const holes = (activeHoleId && !showAllHoles)
    ? course.holes.filter((h) => h.id === activeHoleId)
    : course.holes;

  const features = holes.flatMap((hole) => hole.features);

  // Separate point features (rendered as Markers) from line/polygon features
  const tees = features.filter((f) => f.properties.type === 'tee' && showLayers.tees) as TeeFeature[];
  const baskets = features.filter((f) => f.properties.type === 'basket' && showLayers.baskets) as BasketFeature[];
  const dropzones = features.filter((f) => f.properties.type === 'dropzone' && showLayers.dropzones) as DropzoneFeature[];
  const mandatories = features.filter((f) => f.properties.type === 'mandatory' && showLayers.mandatories) as MandatoryFeature[];
  const annotations = features.filter((f) => f.properties.type === 'annotation' && showLayers.annotations) as AnnotationFeature[];

  // Line and polygon features for Source/Layer rendering
  const flightLines = features.filter((f) => f.properties.type === 'flightLine' && showLayers.flightLines) as FlightLineFeature[];
  const obZones = features.filter((f) => f.properties.type === 'obZone' && showLayers.obZones);
  const obLines = features.filter((f) => f.properties.type === 'obLine' && showLayers.obLines) as OBLineFeature[];
  const fairways = features.filter((f) => f.properties.type === 'fairway' && showLayers.fairways);
  const dropzoneAreas = features.filter((f) => f.properties.type === 'dropzoneArea' && showLayers.dropzoneAreas);

  // Course-level terrain features (not tied to holes)
  const terrainFeatures = (showLayers.infrastructure && course.terrainFeatures) ? course.terrainFeatures : [] as TerrainFeature[];

  // Course-level path features (not tied to holes)
  const pathFeatures = (showLayers.paths && course.pathFeatures) ? course.pathFeatures : [] as PathFeature[];

  // Course-level tree features (not tied to holes)
  const treeFeatures = (showLayers.trees && course.treeFeatures) ? course.treeFeatures : [] as TreeFeature[];

  return (
    <>
      <TerrainLayers 
        features={terrainFeatures} 
        selectedFeatureId={selectedFeatureId} 
        setSelectedFeature={setSelectedFeature} 
      />

      <PathLayers 
        features={pathFeatures} 
        selectedFeatureId={selectedFeatureId} 
      />

      <PolygonLayers 
        fairways={fairways} 
        dropzoneAreas={dropzoneAreas} 
        obZones={obZones} 
        style={style} 
      />

      <LineLayers 
        flightLines={flightLines} 
        obLines={obLines} 
        style={style} 
        selectedFeatureId={selectedFeatureId} 
        setSelectedFeature={setSelectedFeature} 
        units={units}
        onVertexDrag={handleFlightLineVertexDrag}
        onAddNode={handleAddFlightLineNode}
        onRemoveNode={handleRemoveFlightLineNode}
      />

      <PointLayers 
        tees={tees}
        baskets={baskets}
        dropzones={dropzones}
        mandatories={mandatories}
        annotations={annotations}
        treeFeatures={treeFeatures}
        style={style}
        holes={holes}
        selectedFeatureId={selectedFeatureId}
        setSelectedFeature={setSelectedFeature}
        drawMode={drawMode}
        pendingFlightLine={pendingFlightLine}
        mapBearing={mapBearing}
        onDragEnd={handleDragEnd}
        onRotate={handleFeatureRotate}
        onTreeDragEnd={handleTreeDragEnd}
        onTreeRotate={handleTreeRotate}
        onFlightLineStart={handleFlightLineStart}
        onFlightLineEnd={handleFlightLineEnd}
      />

      <VertexEditor 
        selectedFeatureId={selectedFeatureId}
        features={features}
        terrainFeatures={terrainFeatures}
        pathFeatures={pathFeatures}
        onTerrainVertexDrag={handleTerrainVertexDrag}
        onAddTerrainNode={handleAddTerrainNode}
        onRemoveTerrainNode={handleRemoveTerrainNode}
        onPathVertexDrag={handlePathVertexDrag}
        onAddPathNode={handleAddPathNode}
        onRemovePathNode={handleRemovePathNode}
        onPolygonVertexDrag={handlePolygonVertexDrag}
        onAddPolygonNode={handleAddPolygonNode}
        onRemovePolygonNode={handleRemovePolygonNode}
        onLineVertexDrag={handleLineVertexDrag}
        onAddLineNode={handleAddLineNode}
        onRemoveLineNode={handleRemoveLineNode}
      />
    </>
  );
}