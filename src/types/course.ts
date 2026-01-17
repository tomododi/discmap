import type { Feature, Point, LineString, Polygon } from 'geojson';
import type { TerrainType, MapBackgroundConfig } from './terrain';
import type { TreeFeature } from './trees';

// ============ CORE TYPES ============

export type FeatureType = 'tee' | 'basket' | 'dropzone' | 'dropzoneArea' | 'mandatory' | 'flightLine' | 'obZone' | 'obLine' | 'fairway' | 'annotation' | 'infrastructure';

// ============ FEATURE PROPERTIES ============

export interface BaseFeatureProperties {
  id: string;
  type: FeatureType;
  holeId: string;
  label?: string;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeeProperties extends BaseFeatureProperties {
  type: 'tee';
  name?: string; // Custom name for this tee (e.g., "Red", "White", "Blue")
  elevation?: number;
  rotation?: number; // Rotation angle in degrees (0 = pointing right, 90 = pointing down, etc.)
}

export interface BasketProperties extends BaseFeatureProperties {
  type: 'basket';
  elevation?: number;
  height?: number;
}

export interface DropzoneProperties extends BaseFeatureProperties {
  type: 'dropzone';
  mandatory?: boolean;
  description?: string;
  rotation?: number; // Rotation angle in degrees (0 = pointing right, 90 = pointing down, etc.)
}

export interface MandatoryProperties extends BaseFeatureProperties {
  type: 'mandatory';
  rotation: number; // Arrow rotation in degrees (absolute: 0 = right, 90 = down, 180 = left, 270 = up)
  lineAngle: number; // Line rotation in degrees (absolute, independent of arrow: 0 = right, 270 = up)
  lineLength: number; // Line length in pixels for display
  penalty?: string;
}

export interface FlightLineProperties extends BaseFeatureProperties {
  type: 'flightLine';
  startFrom: 'tee' | 'dropzone'; // Where the line starts
  startFeatureId?: string; // ID of the tee or dropzone feature
}

export interface OBZoneProperties extends BaseFeatureProperties {
  type: 'obZone';
  penalty: 'stroke' | 'rethrow' | 'drop';
  description?: string;
}

export interface OBLineProperties extends BaseFeatureProperties {
  type: 'obLine';
  fairwaySide: 'left' | 'right'; // Which side of the line is the fairway (looking along the line direction)
  description?: string;
}

export interface FairwayProperties extends BaseFeatureProperties {
  type: 'fairway';
  surfaceType?: 'grass' | 'gravel' | 'concrete' | 'woods';
}

export interface DropzoneAreaProperties extends BaseFeatureProperties {
  type: 'dropzoneArea';
  fairwayInside: boolean; // true = inside is fairway (default), false = inside is OB
  description?: string;
}

export interface AnnotationProperties extends BaseFeatureProperties {
  type: 'annotation';
  text: string;
  fontSize?: number; // Font size in pixels (default 14)
  fontFamily?: 'sans-serif' | 'serif' | 'monospace';
  fontWeight?: 'normal' | 'bold';
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  rotation?: number; // Text rotation in degrees
}

export interface InfrastructureProperties extends BaseFeatureProperties {
  type: 'infrastructure';
  terrainType: TerrainType;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  cornerRadius?: number; // Corner rounding in meters (0 = sharp corners)
}

// Course-level terrain feature (not tied to a specific hole)
export interface TerrainFeatureProperties {
  id: string;
  type: 'terrain';
  terrainType: TerrainType;
  label?: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  opacity?: number;
  cornerRadius?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TerrainFeature = Feature<Polygon, TerrainFeatureProperties>;

// Course-level path feature (LineString with adjustable stroke width)
export interface PathFeatureProperties {
  id: string;
  type: 'path';
  label?: string;
  color?: string;
  strokeWidth?: number; // Line width in pixels (default 4)
  opacity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PathFeature = Feature<LineString, PathFeatureProperties>;

// ============ FEATURE DEFINITIONS ============

export type TeeFeature = Feature<Point, TeeProperties>;
export type BasketFeature = Feature<Point, BasketProperties>;
export type DropzoneFeature = Feature<Point, DropzoneProperties>;
export type MandatoryFeature = Feature<Point, MandatoryProperties>;
export type FlightLineFeature = Feature<LineString, FlightLineProperties>;
export type OBZoneFeature = Feature<Polygon, OBZoneProperties>;
export type OBLineFeature = Feature<LineString, OBLineProperties>;
export type FairwayFeature = Feature<Polygon, FairwayProperties>;
export type DropzoneAreaFeature = Feature<Polygon, DropzoneAreaProperties>;
export type AnnotationFeature = Feature<Point, AnnotationProperties>;
export type InfrastructureFeature = Feature<Polygon, InfrastructureProperties>;

export type DiscGolfFeature =
  | TeeFeature
  | BasketFeature
  | DropzoneFeature
  | DropzoneAreaFeature
  | MandatoryFeature
  | FlightLineFeature
  | OBZoneFeature
  | OBLineFeature
  | FairwayFeature
  | AnnotationFeature
  | InfrastructureFeature;

// ============ HOLE ============

export interface Hole {
  id: string;
  number: number;
  name?: string;
  par: number;
  features: DiscGolfFeature[];
  notes?: string;
  rules?: string[];
  center?: [number, number];
  bounds?: [[number, number], [number, number]];
  createdAt: string;
  updatedAt: string;
}

// ============ COURSE ============

export interface CourseLocation {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates: [number, number];
}

export interface CourseStyle {
  // Default tee color (can be overridden per feature)
  defaultTeeColor: string;
  // Basket marker colors
  basketTopColor: string;
  basketBodyColor: string;
  basketChainColor: string;
  basketPoleColor: string;
  // Zone colors
  obZoneColor: string;
  obZoneOpacity: number;
  fairwayColor: string;
  fairwayOpacity: number;
  dropzoneAreaBorderColor: string;
  dropzoneAreaFillColor: string;
  dropzoneAreaFillOpacity: number;
  // Line styles
  defaultFlightLineColor: string;
  flightLineWidth: number;
  // Other markers
  dropzoneColor: string;
  mandatoryColor: string;
  // Annotation defaults
  annotationFontSize: number;
  annotationTextColor: string;
  annotationBackgroundColor: string;
  // Map
  mapStyle: 'satellite' | 'satellite-streets' | 'outdoors';
  // Export configuration
  defaultTerrain: TerrainType; // Default terrain for entire background
  terrainThemeId?: string; // Selected terrain theme for export
  mapBackground?: MapBackgroundConfig; // Custom map background configuration
}

export interface TournamentLayout {
  id: string;
  name: string;
  description?: string;
  selectedTeeIds?: string[]; // IDs of tees to use for this layout
  holeOrder?: number[];
  excludedHoles?: string[];
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  location: CourseLocation;
  holes: Hole[];
  totalHoles: number;
  style: CourseStyle;
  layouts: TournamentLayout[];
  activeLayoutId?: string;
  designer?: string;
  yearEstablished?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  website?: string;
  terrainFeatures: TerrainFeature[]; // Course-level terrain polygons (not tied to holes)
  pathFeatures: PathFeature[]; // Course-level path lines (not tied to holes)
  treeFeatures: TreeFeature[]; // Course-level tree markers (not tied to holes)
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ============ DEFAULT VALUES ============

export const DEFAULT_COURSE_STYLE: CourseStyle = {
  // Default tee color
  defaultTeeColor: '#dc2626',
  // Basket marker colors
  basketTopColor: '#ef4444',
  basketBodyColor: '#fbbf24',
  basketChainColor: '#a1a1aa',
  basketPoleColor: '#71717a',
  // Zone colors
  obZoneColor: '#dc2626',
  obZoneOpacity: 0.3,
  fairwayColor: '#86efac',
  fairwayOpacity: 0.2,
  dropzoneAreaBorderColor: '#dc2626',
  dropzoneAreaFillColor: '#86efac',
  dropzoneAreaFillOpacity: 0.25,
  // Line styles
  defaultFlightLineColor: '#3b82f6',
  flightLineWidth: 2,
  // Other markers
  dropzoneColor: '#f59e0b',
  mandatoryColor: '#8b5cf6',
  // Annotation defaults
  annotationFontSize: 14,
  annotationTextColor: '#000000',
  annotationBackgroundColor: '#ffffff',
  // Map
  mapStyle: 'satellite',
  // Export configuration
  defaultTerrain: 'grass',
};

// Default colors for new tees/lines
export const DEFAULT_TEE_COLORS = [
  '#dc2626', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function createEmptyHole(number: number): Hole {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    number,
    par: 3,
    features: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyCourse(name: string, coordinates: [number, number]): Course {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    location: {
      name: '',
      coordinates,
    },
    holes: [createEmptyHole(1)],
    totalHoles: 1,
    style: { ...DEFAULT_COURSE_STYLE },
    layouts: [],
    terrainFeatures: [],
    pathFeatures: [],
    treeFeatures: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}
