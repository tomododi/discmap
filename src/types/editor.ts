import type { Course, TeePosition } from './course';

export type DrawMode = 'select' | 'tee' | 'basket' | 'dropzone' | 'mandatory' | 'flightLine' | 'obZone' | 'fairway';

export interface LayerVisibility {
  tees: boolean;
  baskets: boolean;
  flightLines: boolean;
  obZones: boolean;
  fairways: boolean;
  dropzones: boolean;
  mandatories: boolean;
}

export interface EditorState {
  activeCourseId: string | null;
  activeHoleId: string | null;
  selectedFeatureId: string | null;
  isDrawing: boolean;
  drawMode: DrawMode;
  activeTeePosition: TeePosition;
  showLayers: LayerVisibility;
  sidebarCollapsed: boolean;
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
  fairways: true,
  dropzones: true,
  mandatories: true,
};

export const DEFAULT_EDITOR_STATE: EditorState = {
  activeCourseId: null,
  activeHoleId: null,
  selectedFeatureId: null,
  isDrawing: false,
  drawMode: 'select',
  activeTeePosition: 'pro',
  showLayers: { ...DEFAULT_LAYER_VISIBILITY },
  sidebarCollapsed: false,
};
