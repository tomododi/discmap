import { Source, Layer, Marker } from 'react-map-gl/maplibre';
import type { FlightLineFeature, OBLineFeature, CourseStyle } from '../../../types/course';
import { calculateLineLength } from '../../../utils/geo';
import type { MarkerDragEvent } from 'react-map-gl/maplibre';

interface LineLayersProps {
  flightLines: FlightLineFeature[];
  obLines: OBLineFeature[];
  style: CourseStyle;
  selectedFeatureId: string | null;
  setSelectedFeature: (id: string | null) => void;
  units: 'meters' | 'feet';
  
  // Handlers for flight line editing
  onVertexDrag: (featureId: string, holeId: string, idx: number, e: MarkerDragEvent) => void;
  onAddNode: (featureId: string, holeId: string, idx: number) => void;
  onRemoveNode: (featureId: string, holeId: string, idx: number) => void;
}

export function LineLayers({ 
  flightLines, 
  obLines, 
  style, 
  selectedFeatureId, 
  setSelectedFeature, 
  units,
  onVertexDrag,
  onAddNode,
  onRemoveNode
}: LineLayersProps) {
  
  const createFeatureCollection = (features: any[]) => ({
    type: 'FeatureCollection' as const,
    features,
  });

  const getFeatureColor = (feature: FlightLineFeature) => {
    return feature.properties.color || style.defaultFlightLineColor;
  };

  return (
    <>
      {/* OB Lines - with gradient effect */}
      <Source id="obLines" type="geojson" data={createFeatureCollection(obLines)}>
        {/* Fairway side - green fade */}
        <Layer
          id="obLines-fairway"
          type="line"
          paint={{
            'line-color': '#22c55e',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.4,
            'line-offset': ['match', ['get', 'fairwaySide'], 'left', -8, 'right', 8, 0],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
        {/* OB side - red fade */}
        <Layer
          id="obLines-ob"
          type="line"
          paint={{
            'line-color': '#dc2626',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.4,
            'line-offset': ['match', ['get', 'fairwaySide'], 'left', 8, 'right', -8, 0],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
        {/* Main OB boundary line */}
        <Layer
          id="obLines"
          type="line"
          paint={{
            'line-color': '#dc2626',
            'line-width': 3,
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
      </Source>

      {/* Flight Lines - colored by feature's color property */}
      <Source id="flightLines" type="geojson" data={createFeatureCollection(flightLines)}>
        <Layer
          id="flightLines"
          type="line"
          paint={{
            'line-color': ['coalesce', ['get', 'color'], style.defaultFlightLineColor],
            'line-width': style.flightLineWidth,
            'line-dasharray': [2, 1],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
      </Source>

      {/* Flight Line Distance Labels and Vertex Handles */}
      {flightLines.map((feature) => {
        const coords = feature.geometry.coordinates as [number, number][];
        if (coords.length < 2) return null;

        // Get midpoint of the line with offset to the side
        const midIdx = Math.floor(coords.length / 2);
        const midPoint = coords.length === 2
          ? [(coords[0][0] + coords[1][0]) / 2, (coords[0][1] + coords[1][1]) / 2] as [number, number]
          : coords[midIdx];

        // Calculate perpendicular offset to move label to the side
        const p1 = coords.length === 2 ? coords[0] : coords[midIdx - 1] || coords[0];
        const p2 = coords.length === 2 ? coords[1] : coords[midIdx + 1] || coords[coords.length - 1];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.sqrt(dx * dx + dy * dy);
        const offsetDistance = 0.00006; // Small offset in degrees
        const labelPoint: [number, number] = len > 0
          ? [midPoint[0] + (-dy / len) * offsetDistance, midPoint[1] + (dx / len) * offsetDistance]
          : midPoint;

        // Calculate distance
        const distance = calculateLineLength(coords, units);
        const unitLabel = units === 'meters' ? 'm' : 'ft';
        const labelColor = getFeatureColor(feature);
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <div key={`flight-line-group-${feature.properties.id}`}>
            {/* Distance label */}
            <Marker
              key={`label-${feature.properties.id}`}
              longitude={labelPoint[0]}
              latitude={labelPoint[1]}
              anchor="center"
            >
              <div
                className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-md border-2 cursor-pointer ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                style={{
                  backgroundColor: 'white',
                  borderColor: labelColor,
                  color: labelColor,
                }}
                onClick={() => setSelectedFeature(feature.properties.id)}
              >
                {distance}{unitLabel}
              </div>
            </Marker>

            {/* Vertex handles when selected */}
            {isSelected && coords.map((coord, idx) => {
              const isEndpoint = idx === 0 || idx === coords.length - 1;
              return (
                <Marker
                  key={`vertex-${feature.properties.id}-${idx}`}
                  longitude={coord[0]}
                  latitude={coord[1]}
                  anchor="center"
                  draggable
                  onDragEnd={(e) => onVertexDrag(feature.properties.id, feature.properties.holeId, idx, e)}
                >
                  <div
                    className={`rounded-full border-2 cursor-move shadow-md hover:scale-125 transition-transform ${isEndpoint ? 'w-5 h-5' : 'w-4 h-4'}`}
                    style={{
                      backgroundColor: 'white',
                      borderColor: labelColor,
                    }}
                    title={idx === 0 ? 'Start (Tee)' : idx === coords.length - 1 ? 'End (Basket)' : `Point ${idx + 1} (double-click to remove)`}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!isEndpoint) {
                        onRemoveNode(feature.properties.id, feature.properties.holeId, idx);
                      }
                    }}
                  />
                </Marker>
              );
            })}

            {/* Add node buttons between vertices when selected */}
            {isSelected && coords.slice(0, -1).map((coord, idx) => {
              const nextCoord = coords[idx + 1];
              const midpoint: [number, number] = [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2];
              return (
                <Marker
                  key={`add-node-${feature.properties.id}-${idx}`}
                  longitude={midpoint[0]}
                  latitude={midpoint[1]}
                  anchor="center"
                >
                  <button
                    className="w-5 h-5 rounded-full border-2 bg-white hover:bg-gray-100 flex items-center justify-center shadow-md hover:scale-125 transition-transform opacity-60 hover:opacity-100"
                    style={{ borderColor: labelColor, color: labelColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNode(feature.properties.id, feature.properties.holeId, idx);
                    }}
                    title="Add node"
                  >
                    <span className="text-xs font-bold leading-none">+</span>
                  </button>
                </Marker>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
