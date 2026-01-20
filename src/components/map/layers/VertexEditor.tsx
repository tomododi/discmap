import { Marker } from 'react-map-gl/maplibre';
import type { MarkerDragEvent } from 'react-map-gl/maplibre';
import type { DiscGolfFeature, TerrainFeature, PathFeature } from '../../../types/course';

interface VertexEditorProps {
  selectedFeatureId: string | null;
  features: DiscGolfFeature[];
  terrainFeatures: TerrainFeature[];
  pathFeatures: PathFeature[];
  
  // Handlers
  onTerrainVertexDrag: (featureId: string, idx: number, e: MarkerDragEvent) => void;
  onAddTerrainNode: (featureId: string, idx: number) => void;
  onRemoveTerrainNode: (featureId: string, idx: number) => void;
  
  onPathVertexDrag: (featureId: string, idx: number, e: MarkerDragEvent) => void;
  onAddPathNode: (featureId: string, idx: number) => void;
  onRemovePathNode: (featureId: string, idx: number) => void;
  
  onPolygonVertexDrag: (featureId: string, holeId: string, idx: number, e: MarkerDragEvent) => void;
  onAddPolygonNode: (featureId: string, holeId: string, idx: number) => void;
  onRemovePolygonNode: (featureId: string, holeId: string, idx: number) => void;
  
  onLineVertexDrag: (featureId: string, holeId: string, idx: number, e: MarkerDragEvent) => void;
  onAddLineNode: (featureId: string, holeId: string, idx: number) => void;
  onRemoveLineNode: (featureId: string, holeId: string, idx: number) => void;
}

export function VertexEditor({
  selectedFeatureId,
  features,
  terrainFeatures,
  pathFeatures,
  onTerrainVertexDrag,
  onAddTerrainNode,
  onRemoveTerrainNode,
  onPathVertexDrag,
  onAddPathNode,
  onRemovePathNode,
  onPolygonVertexDrag,
  onAddPolygonNode,
  onRemovePolygonNode,
  onLineVertexDrag,
  onAddLineNode,
  onRemoveLineNode
}: VertexEditorProps) {

  if (!selectedFeatureId) return null;

  // Check if selected feature is a hole-level feature
  const selectedFeature = features.find((f) => f.properties.id === selectedFeatureId);
  // Check if selected feature is a course-level terrain
  const selectedTerrain = terrainFeatures.find((f) => f.properties.id === selectedFeatureId);
  // Check if selected feature is a course-level path
  const selectedPath = pathFeatures.find((f) => f.properties.id === selectedFeatureId);

  // Handle terrain features (course-level)
  if (selectedTerrain && selectedTerrain.geometry.type === 'Polygon') {
    const coords = (selectedTerrain.geometry as { coordinates: number[][][] }).coordinates[0] as [number, number][];
    const vertices = coords.slice(0, -1);
    const featureColor = '#10b981'; // Terrain color

    return (
      <>
        {/* Vertex handles for terrain */}
        {vertices.map((coord, idx) => (
          <Marker
            key={`vertex-${selectedFeatureId}-${idx}`}
            longitude={coord[0]}
            latitude={coord[1]}
            anchor="center"
            draggable
            onDragEnd={(e) => onTerrainVertexDrag(selectedFeatureId, idx, e)}
          >
            <div
              className="w-4 h-4 rounded-full border-2 cursor-move shadow-md hover:scale-125 transition-transform"
              style={{ backgroundColor: 'white', borderColor: featureColor }}
              title={`Vertex ${idx + 1} (double-click to remove)`}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRemoveTerrainNode(selectedFeatureId, idx);
              }}
            />
          </Marker>
        ))}

        {/* Add node buttons between vertices */}
        {vertices.map((coord, idx) => {
          const nextIdx = (idx + 1) % vertices.length;
          const nextCoord = vertices[nextIdx];
          const midpoint: [number, number] = [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2];
          return (
            <Marker
              key={`add-node-${selectedFeatureId}-${idx}`}
              longitude={midpoint[0]}
              latitude={midpoint[1]}
              anchor="center"
            >
              <button
                className="w-5 h-5 rounded-full border-2 bg-white hover:bg-gray-100 flex items-center justify-center shadow-md hover:scale-125 transition-transform opacity-60 hover:opacity-100"
                style={{ borderColor: featureColor, color: featureColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTerrainNode(selectedFeatureId, idx);
                }}
                title="Add vertex"
              >
                <span className="text-xs font-bold leading-none">+</span>
              </button>
            </Marker>
          );
        })}
      </>
    );
  }

  // Handle path features (course-level)
  if (selectedPath && selectedPath.geometry.type === 'LineString') {
    const coords = (selectedPath.geometry as { coordinates: number[][] }).coordinates as [number, number][];
    const featureColor = selectedPath.properties.color || '#a8a29e'; // Path color

    return (
      <>
        {/* Vertex handles for path */}
        {coords.map((coord, idx) => (
          <Marker
            key={`vertex-${selectedFeatureId}-${idx}`}
            longitude={coord[0]}
            latitude={coord[1]}
            anchor="center"
            draggable
            onDragEnd={(e) => onPathVertexDrag(selectedFeatureId, idx, e)}
          >
            <div
              className="w-4 h-4 rounded-full border-2 cursor-move shadow-md hover:scale-125 transition-transform"
              style={{ backgroundColor: 'white', borderColor: featureColor }}
              title={`Vertex ${idx + 1}${coords.length > 2 ? ' (double-click to remove)' : ''}`}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (coords.length > 2) {
                  onRemovePathNode(selectedFeatureId, idx);
                }
              }}
            />
          </Marker>
        ))}

        {/* Add node buttons between vertices */}
        {coords.slice(0, -1).map((coord, idx) => {
          const nextCoord = coords[idx + 1];
          const midpoint: [number, number] = [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2];
          return (
            <Marker
              key={`add-node-${selectedFeatureId}-${idx}`}
              longitude={midpoint[0]}
              latitude={midpoint[1]}
              anchor="center"
            >
              <button
                className="w-5 h-5 rounded-full border-2 bg-white hover:bg-gray-100 flex items-center justify-center shadow-md hover:scale-125 transition-transform opacity-60 hover:opacity-100"
                style={{ borderColor: featureColor, color: featureColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPathNode(selectedFeatureId, idx);
                }}
                title="Add vertex"
              >
                <span className="text-xs font-bold leading-none">+</span>
              </button>
            </Marker>
          );
        })}
      </>
    );
  }

  // Handle hole-level features
  if (!selectedFeature) return null;

  const featureType = selectedFeature.properties.type;
  const isEditablePolygon = ['obZone', 'fairway', 'dropzoneArea'].includes(featureType);
  const isEditableLine = featureType === 'obLine';

  if (isEditablePolygon && selectedFeature.geometry.type === 'Polygon') {
    const coords = (selectedFeature.geometry as { coordinates: number[][][] }).coordinates[0] as [number, number][];
    // Don't render the last point (it's the same as first for closed polygons)
    const vertices = coords.slice(0, -1);
    const featureColor = featureType === 'obZone' ? '#dc2626' :
                        featureType === 'fairway' ? '#22c55e' :
                        '#3b82f6';

    return (
      <>
        {/* Vertex handles */}
        {vertices.map((coord, idx) => (
          <Marker
            key={`vertex-${selectedFeatureId}-${idx}`}
            longitude={coord[0]}
            latitude={coord[1]}
            anchor="center"
            draggable
            onDragEnd={(e) => onPolygonVertexDrag(selectedFeatureId, selectedFeature.properties.holeId, idx, e)}
          >
            <div
              className="w-4 h-4 rounded-full border-2 cursor-move shadow-md hover:scale-125 transition-transform"
              style={{ backgroundColor: 'white', borderColor: featureColor }}
              title={`Vertex ${idx + 1} (double-click to remove)`}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRemovePolygonNode(selectedFeatureId, selectedFeature.properties.holeId, idx);
              }}
            />
          </Marker>
        ))}

        {/* Add node buttons between vertices */}
        {vertices.map((coord, idx) => {
          const nextIdx = (idx + 1) % vertices.length;
          const nextCoord = vertices[nextIdx];
          const midpoint: [number, number] = [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2];
          return (
            <Marker
              key={`add-node-${selectedFeatureId}-${idx}`}
              longitude={midpoint[0]}
              latitude={midpoint[1]}
              anchor="center"
            >
              <button
                className="w-5 h-5 rounded-full border-2 bg-white hover:bg-gray-100 flex items-center justify-center shadow-md hover:scale-125 transition-transform opacity-60 hover:opacity-100"
                style={{ borderColor: featureColor, color: featureColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPolygonNode(selectedFeatureId, selectedFeature.properties.holeId, idx);
                }}
                title="Add vertex"
              >
                <span className="text-xs font-bold leading-none">+</span>
              </button>
            </Marker>
          );
        })}
      </>
    );
  }

  if (isEditableLine && selectedFeature.geometry.type === 'LineString') {
    const coords = (selectedFeature.geometry as { coordinates: number[][] }).coordinates as [number, number][];
    const featureColor = '#dc2626'; // OB line color

    return (
      <>
        {/* Vertex handles */}
        {coords.map((coord, idx) => (
          <Marker
            key={`vertex-${selectedFeatureId}-${idx}`}
            longitude={coord[0]}
            latitude={coord[1]}
            anchor="center"
            draggable
            onDragEnd={(e) => onLineVertexDrag(selectedFeatureId, selectedFeature.properties.holeId, idx, e)}
          >
            <div
              className="w-4 h-4 rounded-full border-2 cursor-move shadow-md hover:scale-125 transition-transform"
              style={{ backgroundColor: 'white', borderColor: featureColor }}
              title={`Vertex ${idx + 1}${coords.length > 2 ? ' (double-click to remove)' : ''}`}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (coords.length > 2) {
                  onRemoveLineNode(selectedFeatureId, selectedFeature.properties.holeId, idx);
                }
              }}
            />
          </Marker>
        ))}

        {/* Add node buttons between vertices */}
        {coords.slice(0, -1).map((coord, idx) => {
          const nextCoord = coords[idx + 1];
          const midpoint: [number, number] = [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2];
          return (
            <Marker
              key={`add-node-${selectedFeatureId}-${idx}`}
              longitude={midpoint[0]}
              latitude={midpoint[1]}
              anchor="center"
            >
              <button
                className="w-5 h-5 rounded-full border-2 bg-white hover:bg-gray-100 flex items-center justify-center shadow-md hover:scale-125 transition-transform opacity-60 hover:opacity-100"
                style={{ borderColor: featureColor, color: featureColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddLineNode(selectedFeatureId, selectedFeature.properties.holeId, idx);
                }}
                title="Add vertex"
              >
                <span className="text-xs font-bold leading-none">+</span>
              </button>
            </Marker>
          );
        })}
      </>
    );
  }

  return null;
}
