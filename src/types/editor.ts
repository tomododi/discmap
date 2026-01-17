import type { Course } from './course';
import type { TerrainType } from './terrain';

export type DrawMode = 'select' | 'tee' | 'basket' | 'dropzone' | 'dropzoneArea' | 'mandatory' | 'flightLine' | 'obZone' | 'obLine' | 'fairway' | 'annotation' | 'infrastructure' | 'path';

export interface LayerVisibility {
  tees: boolean;
  baskets: boolean;
  flightLines: boolean;
  obZones: boolean;
  obLines: boolean;
  fairways: boolean;
  dropzones: boolean;
  dropzoneAreas: boolean;
  mandatories: boolean;
  annotations: boolean;
  infrastructure: boolean;
  paths: boolean;
}

export interface PendingFlightLine {
  startFeatureId: string;
  startType: 'tee' | 'dropzone';
  startCoords: [number, number];
  startColor: string;
}

export interface EditorState {
  activeCourseId: string | null;
  activeHoleId: string | null;
  selectedFeatureId: string | null;
  isDrawing: boolean;
  drawMode: DrawMode;
  showLayers: LayerVisibility;
  showAllHoles: boolean;
  sidebarCollapsed: boolean;
  pendingFlightLine: PendingFlightLine | null;
  activeTerrainType: TerrainType;
}

export interface CourseSnapshot {
  courseId: string;
  data: Course;
  timestamp: string;
}

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  tees: true,
  baskets: true,
  flightLines: true,
  obZones: true,
  obLines: true,
  fairways: true,
  dropzones: true,
  dropzoneAreas: true,
  mandatories: true,
  annotations: true,
  infrastructure: true,
  paths: true,
};

export const DEFAULT_EDITOR_STATE: EditorState = {
  activeCourseId: null,
  activeHoleId: null,
  selectedFeatureId: null,
  isDrawing: false,
  drawMode: 'select',
  showLayers: { ...DEFAULT_LAYER_VISIBILITY },
  showAllHoles: false,
  sidebarCollapsed: false,
  pendingFlightLine: null,
  activeTerrainType: 'forest',
};
