import type { Course } from './course';
import type { TerrainType } from './terrain';
import type { TreeType } from './trees';

export type DrawMode = 'select' | 'tee' | 'basket' | 'dropzone' | 'dropzoneArea' | 'mandatory' | 'flightLine' | 'obZone' | 'obLine' | 'fairway' | 'annotation' | 'infrastructure' | 'path' | 'tree';

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
  trees: boolean;
}

export interface PendingFlightLine {
  startFeatureId: string;
  startType: 'tee' | 'dropzone';
  startCoords: [number, number];
  startColor: string;
}

export interface TreeBrushSettings {
  density: number;      // Spacing between trees in pixels (20-100)
  sizeVariation: number; // Random size variation (0-0.5)
  enabled: boolean;     // Whether brush mode is active
  eraserEnabled: boolean; // Whether eraser mode is active
  eraserRadius: number;  // Eraser radius in pixels (20-100)
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
  activeTreeType: TreeType;
  treeBrushSettings: TreeBrushSettings;
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
  trees: true,
};

export const DEFAULT_TREE_BRUSH_SETTINGS: TreeBrushSettings = {
  density: 50,
  sizeVariation: 0.3,
  enabled: false,
  eraserEnabled: false,
  eraserRadius: 40,
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
  activeTreeType: 'tree1',
  treeBrushSettings: { ...DEFAULT_TREE_BRUSH_SETTINGS },
};
