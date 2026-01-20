import type { MapRef } from 'react-map-gl/maplibre';
import { useMapboxDraw } from '../../hooks/useMapboxDraw';
import { useTreeBrush } from '../../hooks/useTreeBrush';
import { useTreeEraser } from '../../hooks/useTreeEraser';

interface DrawControlsProps {
  mapRef: React.RefObject<MapRef | null>;
}

export function DrawControls({ mapRef }: DrawControlsProps) {
  // Initialize hooks
  useMapboxDraw(mapRef);
  useTreeBrush(mapRef);
  useTreeEraser(mapRef);

  return null;
}