import type { Feature, Point, LineString, Polygon } from 'geojson';

// ============ CORE TYPES ============

export type TeePosition = 'pro' | 'amateur' | 'recreational';
export type FeatureType = 'tee' | 'basket' | 'dropzone' | 'mandatory' | 'flightLine' | 'obZone' | 'fairway';

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
  position: TeePosition;
  elevation?: number;
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
}

export interface MandatoryProperties extends BaseFeatureProperties {
  type: 'mandatory';
  direction: 'left' | 'right';
  penalty?: string;
}

export interface FlightLineProperties extends BaseFeatureProperties {
  type: 'flightLine';
  discType?: 'driver' | 'midrange' | 'putter';
  flightDescription?: string;
  position: TeePosition;
  curve?: 'straight' | 'hyzer' | 'anhyzer';
}

export interface OBZoneProperties extends BaseFeatureProperties {
  type: 'obZone';
  penalty: 'stroke' | 'rethrow' | 'drop';
  description?: string;
}

export interface FairwayProperties extends BaseFeatureProperties {
  type: 'fairway';
  surfaceType?: 'grass' | 'gravel' | 'concrete' | 'woods';
}

// ============ FEATURE DEFINITIONS ============

export type TeeFeature = Feature<Point, TeeProperties>;
export type BasketFeature = Feature<Point, BasketProperties>;
export type DropzoneFeature = Feature<Point, DropzoneProperties>;
export type MandatoryFeature = Feature<Point, MandatoryProperties>;
export type FlightLineFeature = Feature<LineString, FlightLineProperties>;
export type OBZoneFeature = Feature<Polygon, OBZoneProperties>;
export type FairwayFeature = Feature<Polygon, FairwayProperties>;

export type DiscGolfFeature =
  | TeeFeature
  | BasketFeature
  | DropzoneFeature
  | MandatoryFeature
  | FlightLineFeature
  | OBZoneFeature
  | FairwayFeature;

// ============ HOLE ============

export interface HoleDistances {
  pro?: number;
  amateur?: number;
  recreational?: number;
}

export interface Hole {
  id: string;
  number: number;
  name?: string;
  par: number;
  distances: HoleDistances;
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
  teeColor: string;
  basketColor: string;
  obZoneColor: string;
  obZoneOpacity: number;
  fairwayColor: string;
  fairwayOpacity: number;
  flightLineColor: string;
  flightLineWidth: number;
  dropzoneColor: string;
  mandatoryColor: string;
  mapStyle: 'satellite' | 'satellite-streets' | 'outdoors';
}

export interface TournamentLayout {
  id: string;
  name: string;
  description?: string;
  teePosition: TeePosition;
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
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ============ DEFAULT VALUES ============

export const DEFAULT_COURSE_STYLE: CourseStyle = {
  teeColor: '#22c55e',
  basketColor: '#ef4444',
  obZoneColor: '#dc2626',
  obZoneOpacity: 0.3,
  fairwayColor: '#86efac',
  fairwayOpacity: 0.2,
  flightLineColor: '#3b82f6',
  flightLineWidth: 2,
  dropzoneColor: '#f59e0b',
  mandatoryColor: '#8b5cf6',
  mapStyle: 'satellite',
};

export function createEmptyHole(number: number): Hole {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    number,
    par: 3,
    distances: {},
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
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}
