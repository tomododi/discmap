// Helper functions for i18n translations of dynamic content
import type { TFunction } from 'i18next';
import type { TerrainType } from '../types/terrain';

// Terrain type to translation key mapping
const TERRAIN_TRANSLATION_KEYS: Record<TerrainType, string> = {
  grass: 'terrain.grass',
  roughGrass: 'terrain.roughGrass',
  forest: 'terrain.forest',
  water: 'terrain.waterPond',
  sand: 'terrain.sand',
  concrete: 'terrain.concrete',
};

// Get translated terrain name
export function getTerrainName(t: TFunction, terrainType: TerrainType): string {
  return t(TERRAIN_TRANSLATION_KEYS[terrainType]) || terrainType;
}

// Get translated terrain category name
export function getTerrainCategoryName(t: TFunction, category: string): string {
  return t(`terrain.categories.${category}`) || category;
}
