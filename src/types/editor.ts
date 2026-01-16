import type { Course } from './course';
import type { TerrainType } from './terrain';
import type { LandmarkType } from './landmarks';

export type DrawMode = 'select' | 'tee' | 'basket' | 'dropzone' | 'dropzoneArea' | 'mandatory' | 'flightLine' | 'obZone' | 'obLine' | 'fairway' | 'annotation' | 'infrastructure' | 'path' | 'landmark';

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
  landmarks: boolean;
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
  sidebarCollapsed: boolean;
  pendingFlightLine: PendingFlightLine | null;
  activeTerrainType: TerrainType;
  activeLandmarkType: LandmarkType;
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
  landmarks: true,
};

export const DEFAULT_EDITOR_STATE: EditorState = {
  activeCourseId: null,
  activeHoleId: null,
  selectedFeatureId: null,
  isDrawing: false,
  drawMode: 'select',
  showLayers: { ...DEFAULT_LAYER_VISIBILITY },
  sidebarCollapsed: false,
  pendingFlightLine: null,
  activeTerrainType: 'forest',
  activeLandmarkType: 'tree',
};
