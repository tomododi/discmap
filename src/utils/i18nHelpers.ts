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
  tree1: 'tree.tree1',
  tree2: 'tree.tree2',
  tree3: 'tree.tree3',
  tree4: 'tree.tree4',
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
  const key = TREE_TRANSLATION_KEYS[treeType] ?? TREE_TRANSLATION_KEYS.tree1;
  return t(key) || `Tree ${treeType.replace('tree', '')}`;
}

// Get translated tree category name
export function getTreeCategoryName(t: TFunction, category: string): string {
  return t(`tree.categories.${category}`) || category;
}
