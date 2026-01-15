import { useCallback } from 'react';
import { Source, Layer, Marker } from 'react-map-gl/maplibre';
import type { MarkerDragEvent } from 'react-map-gl/maplibre';
import { useCourseStore, useEditorStore } from '../../stores';
import { useSettingsStore } from '../../stores/settingsStore';
import type { TeeFeature, BasketFeature, DropzoneFeature, MandatoryFeature, FlightLineFeature, AnnotationFeature, FlightLineProperties, DiscGolfFeature, InfrastructureFeature, OBLineFeature, LandmarkFeature } from '../../types/course';
import { TERRAIN_PATTERNS } from '../../types/terrain';
import { TeeMarker } from './markers/TeeMarker';
import { BasketMarker } from './markers/BasketMarker';
import { DropzoneMarker } from './markers/DropzoneMarker';
import { MandatoryMarker } from './markers/MandatoryMarker';
import { LandmarkMarker } from './markers/LandmarkMarker';
import { calculateLineLength } from '../../utils/geo';

export function FeatureLayers() {
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const showLayers = useEditorStore((s) => s.showLayers);
  const selectedFeatureId = useEditorStore((s) => s.selectedFeatureId);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const drawMode = useEditorStore((s) => s.drawMode);
  const pendingFlightLine = useEditorStore((s) => s.pendingFlightLine);
  const setPendingFlightLine = useEditorStore((s) => s.setPendingFlightLine);
  const clearPendingFlightLine = useEditorStore((s) => s.clearPendingFlightLine);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const addFeature = useCourseStore((s) => s.addFeature);
  const updateFeatureGeometry = useCourseStore((s) => s.updateFeatureGeometry);
  const updateFeature = useCourseStore((s) => s.updateFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);
  const units = useSettingsStore((s) => s.units);

  // Update flight lines when tee or basket position changes
  const updateFlightLinesForHole = useCallback(
    (holeId: string, featureType: 'tee' | 'basket', newCoords: [number, number], teeId?: string) => {
      if (!activeCourseId || !course) return;

      const hole = course.holes.find((h) => h.id === holeId);
      if (!hole) return;

      if (featureType === 'tee' && teeId) {
        // Find flight lines that start from this tee
        const flightLines = hole.features.filter(
          (f) => f.properties.type === 'flightLine' && f.properties.startFeatureId === teeId
        ) as FlightLineFeature[];

        flightLines.forEach((flightLine) => {
          const coords = flightLine.geometry.coordinates as [number, number][];
          // Update the start point (tee position)
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
    (featureId: string, holeId: string, event: MarkerDragEvent, featureType?: 'tee' | 'basket') => {
      if (!activeCourseId) return;
      saveSnapshot(activeCourseId);
      const newCoords: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      updateFeatureGeometry(activeCourseId, holeId, featureId, newCoords);

      // Update flight lines if tee or basket was moved
      if (featureType === 'tee') {
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
      updateFeature(activeCourseId, holeId, featureId, { rotation: newRotation });
    },
    [activeCourseId, updateFeature]
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

  // Handler for clicking on tee/dropzone to start flight line
  const handleFlightLineStart = useCallback(
    (featureId: string, startType: 'tee' | 'dropzone', coords: [number, number], color: string) => {
      if (drawMode !== 'flightLine') return;
      setPendingFlightLine({
        startFeatureId: featureId,
        startType,
        startCoords: coords,
        startColor: color,
      });
    },
    [drawMode, setPendingFlightLine]
  );

  // Handler for clicking on basket to finish flight line
  const handleFlightLineEnd = useCallback(
    (basketCoords: [number, number], holeId: string) => {
      if (drawMode !== 'flightLine' || !pendingFlightLine || !activeCourseId) return;

      const now = new Date().toISOString();
      const flightLineFeature: DiscGolfFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
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
        } as FlightLineProperties,
      };

      saveSnapshot(activeCourseId);
      addFeature(activeCourseId, holeId, flightLineFeature);
      clearPendingFlightLine();
      setDrawMode('select');
    },
    [drawMode, pendingFlightLine, activeCourseId, saveSnapshot, addFeature, clearPendingFlightLine, setDrawMode]
  );

  if (!course) return null;

  const { style } = course;

  const basketColors = {
    top: style.basketTopColor,
    body: style.basketBodyColor,
    chains: style.basketChainColor,
    pole: style.basketPoleColor,
  };

  // Get features from active hole or all holes
  const holes = activeHoleId
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
  const infrastructure = features.filter((f) => f.properties.type === 'infrastructure' && showLayers.infrastructure) as InfrastructureFeature[];
  const landmarks = features.filter((f) => f.properties.type === 'landmark' && showLayers.landmarks) as LandmarkFeature[];

  // Get color for a feature (uses feature's color or falls back to style default)
  const getFeatureColor = (feature: FlightLineFeature) => {
    return feature.properties.color || style.defaultFlightLineColor;
  };

  const createFeatureCollection = (featureList: typeof features) => ({
    type: 'FeatureCollection' as const,
    features: featureList,
  });

  return (
    <>
      {/* Infrastructure/Terrain (bottom-most layer) */}
      {infrastructure.map((feature) => {
        const terrainType = feature.properties.terrainType;
        const pattern = TERRAIN_PATTERNS[terrainType];
        const colors = feature.properties.customColors || {};
        const fillColor = colors.primary || pattern.defaultColors.primary;
        const strokeColor = colors.secondary || pattern.defaultColors.secondary;
        const opacity = feature.properties.opacity ?? 0.7;
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Source
            key={feature.properties.id}
            id={`infrastructure-${feature.properties.id}`}
            type="geojson"
            data={feature}
          >
            <Layer
              id={`infrastructure-fill-${feature.properties.id}`}
              type="fill"
              paint={{
                'fill-color': fillColor,
                'fill-opacity': opacity,
              }}
            />
            <Layer
              id={`infrastructure-outline-${feature.properties.id}`}
              type="line"
              paint={{
                'line-color': strokeColor,
                'line-width': isSelected ? 3 : 1.5,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        );
      })}

      {/* Infrastructure labels */}
      {infrastructure.map((feature) => {
        const coords = feature.geometry.coordinates[0] as [number, number][];
        // Get centroid of polygon
        const centroid = coords.reduce(
          (acc, coord) => [acc[0] + coord[0] / coords.length, acc[1] + coord[1] / coords.length],
          [0, 0] as [number, number]
        );
        const terrainType = feature.properties.terrainType;
        const pattern = TERRAIN_PATTERNS[terrainType];
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Marker
            key={`label-${feature.properties.id}`}
            longitude={centroid[0]}
            latitude={centroid[1]}
            anchor="center"
          >
            <div
              className={`
                px-2 py-1 rounded-lg text-xs font-medium shadow-md cursor-pointer
                transition-all hover:scale-105
                ${isSelected ? 'ring-2 ring-blue-400' : ''}
              `}
              style={{
                backgroundColor: `${pattern.defaultColors.primary}ee`,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
              onClick={() => setSelectedFeature(feature.properties.id)}
            >
              {pattern.name}
            </div>
          </Marker>
        );
      })}

      {/* Fairways (bottom layer) */}
      <Source id="fairways" type="geojson" data={createFeatureCollection(fairways)}>
        <Layer
          id="fairways"
          type="fill"
          paint={{
            'fill-color': course.style.fairwayColor,
            'fill-opacity': course.style.fairwayOpacity,
          }}
        />
      </Source>

      {/* Dropzone Areas - flippable inside/outside */}
      <Source id="dropzoneAreas" type="geojson" data={createFeatureCollection(dropzoneAreas)}>
        {/* Green fade on fairway side */}
        <Layer
          id="dropzoneAreas-fairway-fade"
          type="line"
          paint={{
            'line-color': '#22c55e',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.4,
            // If fairwayInside is true (or undefined), green is inside (-8), otherwise outside (+8)
            'line-offset': ['case', ['coalesce', ['get', 'fairwayInside'], true], -8, 8],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
        {/* Red fade on OB side */}
        <Layer
          id="dropzoneAreas-ob-fade"
          type="line"
          paint={{
            'line-color': '#dc2626',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.4,
            // If fairwayInside is true (or undefined), red is outside (+8), otherwise inside (-8)
            'line-offset': ['case', ['coalesce', ['get', 'fairwayInside'], true], 8, -8],
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
        {/* Invisible fill for click detection */}
        <Layer
          id="dropzoneAreas-fill"
          type="fill"
          paint={{
            'fill-color': '#000000',
            'fill-opacity': 0,
          }}
        />
        {/* Main boundary line */}
        <Layer
          id="dropzoneAreas-outline"
          type="line"
          paint={{
            'line-color': course.style.dropzoneAreaBorderColor,
            'line-width': 3,
          }}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
        />
      </Source>

      {/* OB Zones */}
      <Source id="obZones" type="geojson" data={createFeatureCollection(obZones)}>
        <Layer
          id="obZones"
          type="fill"
          paint={{
            'fill-color': course.style.obZoneColor,
            'fill-opacity': course.style.obZoneOpacity,
          }}
        />
        <Layer
          id="obZones-outline"
          type="line"
          paint={{
            'line-color': course.style.obZoneColor,
            'line-width': 3,
          }}
        />
      </Source>

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
            'line-width': course.style.flightLineWidth,
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
          <>
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
                  onDragEnd={(e) => handleFlightLineVertexDrag(feature.properties.id, feature.properties.holeId, idx, e)}
                >
                  <div
                    className={`rounded-full border-2 cursor-move shadow-md hover:scale-125 transition-transform ${isEndpoint ? 'w-5 h-5' : 'w-4 h-4'}`}
                    style={{
                      backgroundColor: 'white',
                      borderColor: labelColor,
                    }}
                    title={idx === 0 ? 'Start (Tee)' : idx === coords.length - 1 ? 'End (Basket)' : `Point ${idx + 1} (double-click to remove)`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!isEndpoint) {
                        handleRemoveFlightLineNode(feature.properties.id, feature.properties.holeId, idx);
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
                    onClick={() => handleAddFlightLineNode(feature.properties.id, feature.properties.holeId, idx)}
                    title="Add node"
                  >
                    <span className="text-xs font-bold leading-none">+</span>
                  </button>
                </Marker>
              );
            })}
          </>
        );
      })}

      {/* Custom Markers for point features */}
      {dropzones.map((feature) => {
        const dzColor = feature.properties.color || style.dropzoneColor;
        const coords: [number, number] = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
        const isFlightLineMode = drawMode === 'flightLine';
        const isPendingStart = pendingFlightLine?.startFeatureId === feature.properties.id;
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Marker
            key={feature.properties.id}
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="center"
            draggable={!isFlightLineMode}
            onDragEnd={(e) => handleDragEnd(feature.properties.id, feature.properties.holeId, e)}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (isFlightLineMode) {
                handleFlightLineStart(feature.properties.id, 'dropzone', coords, dzColor);
              } else {
                setSelectedFeature(feature.properties.id);
              }
            }}
          >
            <DropzoneMarker
              selected={isSelected || isPendingStart}
              color={dzColor}
              rotation={feature.properties.rotation ?? 0}
              onRotate={(newRotation) => handleFeatureRotate(feature.properties.id, feature.properties.holeId, newRotation)}
            />
          </Marker>
        );
      })}

      {mandatories.map((feature) => (
        <Marker
          key={feature.properties.id}
          longitude={feature.geometry.coordinates[0]}
          latitude={feature.geometry.coordinates[1]}
          anchor="center"
          draggable
          onDragEnd={(e) => handleDragEnd(feature.properties.id, feature.properties.holeId, e)}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedFeature(feature.properties.id);
          }}
        >
          <MandatoryMarker
            rotation={feature.properties.rotation}
            lineAngle={feature.properties.lineAngle ?? 270}
            lineLength={feature.properties.lineLength ?? 60}
            selected={selectedFeatureId === feature.properties.id}
            color={style.mandatoryColor}
            onRotate={(newRotation) => handleFeatureRotate(feature.properties.id, feature.properties.holeId, newRotation)}
          />
        </Marker>
      ))}

      {tees.map((feature) => {
        const teeColor = feature.properties.color || style.defaultTeeColor;
        const coords: [number, number] = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
        const isFlightLineMode = drawMode === 'flightLine';
        const isPendingStart = pendingFlightLine?.startFeatureId === feature.properties.id;
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Marker
            key={feature.properties.id}
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="center"
            draggable={!isFlightLineMode}
            onDragEnd={(e) => handleDragEnd(feature.properties.id, feature.properties.holeId, e, 'tee')}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (isFlightLineMode) {
                handleFlightLineStart(feature.properties.id, 'tee', coords, teeColor);
              } else {
                setSelectedFeature(feature.properties.id);
              }
            }}
          >
            <TeeMarker
              selected={isSelected || isPendingStart}
              holeNumber={holes.find(h => h.id === feature.properties.holeId)?.number}
              color={teeColor}
              name={feature.properties.name}
              rotation={feature.properties.rotation ?? 0}
              onRotate={(newRotation) => handleFeatureRotate(feature.properties.id, feature.properties.holeId, newRotation)}
            />
          </Marker>
        );
      })}

      {baskets.map((feature) => {
        const coords: [number, number] = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
        const isFlightLineMode = drawMode === 'flightLine';
        const canEndFlightLine = isFlightLineMode && pendingFlightLine !== null;

        return (
          <Marker
            key={feature.properties.id}
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="bottom"
            draggable={!isFlightLineMode}
            onDragEnd={(e) => handleDragEnd(feature.properties.id, feature.properties.holeId, e, 'basket')}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (canEndFlightLine) {
                handleFlightLineEnd(coords, feature.properties.holeId);
              } else {
                setSelectedFeature(feature.properties.id);
              }
            }}
          >
            <BasketMarker
              selected={selectedFeatureId === feature.properties.id}
              holeNumber={holes.find(h => h.id === feature.properties.holeId)?.number}
              colors={basketColors}
              highlighted={canEndFlightLine}
            />
          </Marker>
        );
      })}

      {/* Annotation markers */}
      {annotations.map((feature) => {
        const props = feature.properties;
        const fontSize = props.fontSize || style.annotationFontSize;
        const textColor = props.textColor || style.annotationTextColor;
        const backgroundColor = props.backgroundColor || style.annotationBackgroundColor;
        const borderColor = props.borderColor || textColor;
        const fontFamily = props.fontFamily || 'sans-serif';
        const fontWeight = props.fontWeight || 'normal';
        const rotation = props.rotation || 0;
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Marker
            key={feature.properties.id}
            longitude={feature.geometry.coordinates[0]}
            latitude={feature.geometry.coordinates[1]}
            anchor="center"
            draggable
            onDragEnd={(e) => handleDragEnd(feature.properties.id, feature.properties.holeId, e)}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature(feature.properties.id);
            }}
          >
            <div
              className={`px-2 py-1 rounded shadow-md border cursor-pointer transition-transform hover:scale-105 ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
              style={{
                backgroundColor,
                borderColor,
                color: textColor,
                fontSize: `${fontSize}px`,
                fontFamily,
                fontWeight,
                transform: rotation ? `rotate(${rotation}deg)` : undefined,
                whiteSpace: 'nowrap',
              }}
            >
              {props.text}
            </div>
          </Marker>
        );
      })}

      {/* Landmark markers */}
      {landmarks.map((feature) => {
        const props = feature.properties;
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Marker
            key={feature.properties.id}
            longitude={feature.geometry.coordinates[0]}
            latitude={feature.geometry.coordinates[1]}
            anchor="center"
            draggable
            onDragEnd={(e) => handleDragEnd(feature.properties.id, feature.properties.holeId, e)}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature(feature.properties.id);
            }}
          >
            <LandmarkMarker
              landmarkType={props.landmarkType}
              selected={isSelected}
              size={props.size ?? 1}
              rotation={props.rotation ?? 0}
              color={props.color}
              onRotate={(newRotation) => handleFeatureRotate(feature.properties.id, feature.properties.holeId, newRotation)}
            />
          </Marker>
        );
      })}
    </>
  );
}
