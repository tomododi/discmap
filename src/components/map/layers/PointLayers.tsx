import { Marker } from 'react-map-gl/maplibre';
import type { MarkerDragEvent } from 'react-map-gl/maplibre';
import type { 
  TeeFeature, 
  BasketFeature, 
  DropzoneFeature, 
  MandatoryFeature, 
  AnnotationFeature, 
  CourseStyle,
  Hole
} from '../../../types/course';
import type { TreeFeature } from '../../../types/trees';
import { TeeMarker } from '../markers/TeeMarker';
import { BasketMarker } from '../markers/BasketMarker';
import { DropzoneMarker } from '../markers/DropzoneMarker';
import { MandatoryMarker } from '../markers/MandatoryMarker';
import { TreeMarker } from '../markers/TreeMarker';

interface PointLayersProps {
  tees: TeeFeature[];
  baskets: BasketFeature[];
  dropzones: DropzoneFeature[];
  mandatories: MandatoryFeature[];
  annotations: AnnotationFeature[];
  treeFeatures: TreeFeature[];
  style: CourseStyle;
  holes: Hole[];
  selectedFeatureId: string | null;
  setSelectedFeature: (id: string | null) => void;
  drawMode: string;
  pendingFlightLine: any;
  mapBearing: number;
  
  // Handlers
  onDragEnd: (featureId: string, holeId: string, e: MarkerDragEvent, type?: 'tee' | 'basket' | 'dropzone') => void;
  onRotate: (featureId: string, holeId: string, rotation: number) => void;
  onTreeDragEnd: (featureId: string, e: MarkerDragEvent) => void;
  onTreeRotate: (featureId: string, rotation: number) => void;
  onFlightLineStart: (featureId: string, type: 'tee' | 'dropzone', coords: [number, number], color: string) => void;
  onFlightLineEnd: (coords: [number, number], holeId: string) => void;
}

export function PointLayers({
  tees,
  baskets,
  dropzones,
  mandatories,
  annotations,
  treeFeatures,
  style,
  holes,
  selectedFeatureId,
  setSelectedFeature,
  drawMode,
  pendingFlightLine,
  mapBearing,
  onDragEnd,
  onRotate,
  onTreeDragEnd,
  onTreeRotate,
  onFlightLineStart,
  onFlightLineEnd
}: PointLayersProps) {
  
  const basketColors = {
    top: style.basketTopColor,
    body: style.basketBodyColor,
    chains: style.basketChainColor,
    pole: style.basketPoleColor,
  };

  return (
    <>
      {/* Tree markers (before other point markers for proper z-order) */}
      {treeFeatures.map((feature) => {
        const coords: [number, number] = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
        const isSelected = selectedFeatureId === feature.properties.id;

        return (
          <Marker
            key={feature.properties.id}
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="center"
            rotationAlignment="viewport"
            draggable
            onDragEnd={(e) => onTreeDragEnd(feature.properties.id, e)}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFeature(feature.properties.id);
            }}
          >
            <TreeMarker
              treeType={feature.properties.treeType}
              size={feature.properties.size}
              rotation={feature.properties.rotation}
              opacity={feature.properties.opacity}
              selected={isSelected}
              customColors={feature.properties.customColors}
              mapBearing={mapBearing}
              onRotate={(newRotation) => onTreeRotate(feature.properties.id, newRotation)}
            />
          </Marker>
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
            rotationAlignment="viewport"
            draggable={!isFlightLineMode}
            onDragEnd={(e) => onDragEnd(feature.properties.id, feature.properties.holeId, e, 'dropzone')}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (isFlightLineMode) {
                onFlightLineStart(feature.properties.id, 'dropzone', coords, dzColor);
              } else {
                setSelectedFeature(feature.properties.id);
              }
            }}
          >
            <DropzoneMarker
              selected={isSelected || isPendingStart}
              color={dzColor}
              rotation={feature.properties.rotation ?? 0}
              onRotate={(newRotation) => onRotate(feature.properties.id, feature.properties.holeId, newRotation)}
              mapBearing={mapBearing}
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
          rotationAlignment="viewport"
          draggable
          onDragEnd={(e) => onDragEnd(feature.properties.id, feature.properties.holeId, e)}
        >
          <MandatoryMarker
            rotation={feature.properties.rotation ?? 0}
            lineAngle={feature.properties.lineAngle ?? 270}
            selected={selectedFeatureId === feature.properties.id}
            color={style.mandatoryColor}
            onRotate={(newRotation) => onRotate(feature.properties.id, feature.properties.holeId, newRotation)}
            onClick={() => setSelectedFeature(feature.properties.id)}
            mapBearing={mapBearing}
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
            rotationAlignment="viewport"
            draggable={!isFlightLineMode}
            onDragEnd={(e) => onDragEnd(feature.properties.id, feature.properties.holeId, e, 'tee')}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (isFlightLineMode) {
                onFlightLineStart(feature.properties.id, 'tee', coords, teeColor);
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
              mapBearing={mapBearing}
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
            offset={[0, 6]}
            rotationAlignment="viewport"
            draggable={!isFlightLineMode}
            onDragEnd={(e) => onDragEnd(feature.properties.id, feature.properties.holeId, e, 'basket')}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (canEndFlightLine) {
                onFlightLineEnd(coords, feature.properties.holeId);
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
            rotationAlignment="viewport"
            draggable
            onDragEnd={(e) => onDragEnd(feature.properties.id, feature.properties.holeId, e)}
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
    </>
  );
}
