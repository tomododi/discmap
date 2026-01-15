// Helper functions for i18n translations of dynamic content
import type { TFunction } from 'i18next';
import type { TerrainType } from '../types/terrain';
import type { LandmarkType, LandmarkCategory } from '../types/landmarks';

// Terrain type to translation key mapping
const TERRAIN_TRANSLATION_KEYS: Record<TerrainType, string> = {
  grass: 'terrain.grass',
  roughGrass: 'terrain.roughGrass',
  forest: 'terrain.forest',
  water: 'terrain.waterPond',
  sand: 'terrain.sand',
  path: 'terrain.path',
  concrete: 'terrain.concrete',
  gravel: 'terrain.gravel',
  marsh: 'terrain.marsh',
  rocks: 'terrain.rocks',
};

// Get translated terrain name
export function getTerrainName(t: TFunction, terrainType: TerrainType): string {
  return t(TERRAIN_TRANSLATION_KEYS[terrainType]) || terrainType;
}

// Get translated terrain category name
export function getTerrainCategoryName(t: TFunction, category: string): string {
  return t(`terrain.categories.${category}`) || category;
}

// Get translated landmark name
export function getLandmarkName(t: TFunction, landmarkType: LandmarkType): string {
  return t(`landmarks.types.${landmarkType}`) || landmarkType;
}

// Get translated landmark category name
export function getLandmarkCategoryName(t: TFunction, category: LandmarkCategory): string {
  return t(`landmarks.categories.${category}`) || category;
}
