import type { Feature, Geometry, GeoJsonProperties } from 'geojson';

export interface FeaturePropertyProps<T extends Feature<Geometry, GeoJsonProperties>> {
  feature: T;
  onUpdate: (updates: Partial<T['properties']>) => void;
  courseStyle?: any; // Pass course style for defaults
}
