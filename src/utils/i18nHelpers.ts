// Helper functions for i18n translations of dynamic content
import type { TFunction } from 'i18next';
import type { TerrainType } from '../types/terrain';
import type { TreeType } from '../types/trees';

// Terrain type to translation key mapping
const TERRAIN_TRANSLATION_KEYS: Record<TerrainType, string> = {
  grass: 'terrain.grass',
  roughGrass: 'terrain.roughGrass',
  forest: 'terrain.forest',
  water: 'terrain.waterPond',
  sand: 'terrain.sand',
  concrete: 'terrain.concrete',
};

// Tree type to translation key mapping
const TREE_TRANSLATION_KEYS: Record<TreeType, string> = {
  oak: 'tree.oak',
  maple: 'tree.maple',
  pine: 'tree.pine',
  spruce: 'tree.spruce',
  birch: 'tree.birch',
};

// Get translated terrain name
export function getTerrainName(t: TFunction, terrainType: TerrainType): string {
  return t(TERRAIN_TRANSLATION_KEYS[terrainType]) || terrainType;
}

// Get translated terrain category name
export function getTerrainCategoryName(t: TFunction, category: string): string {
  return t(`terrain.categories.${category}`) || category;
}

// Get translated tree name
export function getTreeName(t: TFunction, treeType: TreeType): string {
  // Fallback to oak if tree type is unknown
  const key = TREE_TRANSLATION_KEYS[treeType] ?? TREE_TRANSLATION_KEYS.oak;
  return t(key) || treeType;
}

// Get translated tree category name
export function getTreeCategoryName(t: TFunction, category: string): string {
  return t(`tree.categories.${category}`) || category;
}
