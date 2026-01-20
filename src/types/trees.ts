// ============ TREE TYPES ============
// Tree patterns using PNG images (top-down view)

import type { Feature, Point } from 'geojson';

export type TreeType = 'tree1' | 'tree2' | 'tree3' | 'tree4';

export interface TreePattern {
  id: TreeType;
  name: string;
  imagePath: string;       // Path to PNG image
  defaultSize: number;     // Default size in pixels
  aspectRatio: number;     // width/height ratio for proper scaling
}

// Registry of all tree patterns
export const TREE_PATTERNS: Record<TreeType, TreePattern> = {
  tree1: {
    id: 'tree1',
    name: 'Tree 1',
    imagePath: '/tree1.png',
    defaultSize: 48,
    aspectRatio: 771 / 799, // ~0.965
  },
  tree2: {
    id: 'tree2',
    name: 'Tree 2',
    imagePath: '/tree2.png',
    defaultSize: 40,
    aspectRatio: 400 / 400, // 1.0
  },
  tree3: {
    id: 'tree3',
    name: 'Tree 3',
    imagePath: '/tree3.png',
    defaultSize: 44,
    aspectRatio: 800 / 600, // ~1.33
  },
  tree4: {
    id: 'tree4',
    name: 'Tree 4',
    imagePath: '/tree4.png',
    defaultSize: 50,
    aspectRatio: 850 / 852, // ~0.998
  },
};

// ============ TREE FEATURE PROPERTIES ============

export interface TreeFeatureProperties {
  id: string;
  type: 'tree';
  treeType: TreeType;
  size: number;         // Scale multiplier (0.5 - 2.0), default 1
  rotation: number;     // Degrees (0-359), default 0
  opacity: number;      // 0.0 - 1.0, default 1
  label?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TreeFeature = Feature<Point, TreeFeatureProperties>;

// ============ UTILITY FUNCTIONS ============

export function getAllTreeTypes(): TreeType[] {
  return Object.keys(TREE_PATTERNS) as TreeType[];
}

export function getDefaultTreeSize(treeType: TreeType): number {
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.tree1;
  return pattern.defaultSize;
}

export function getTreeImagePath(treeType: TreeType): string {
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.tree1;
  return pattern.imagePath;
}

// Map old tree types to new ones (for migration)
export function migrateTreeType(oldType: string): TreeType {
  const migrationMap: Record<string, TreeType> = {
    'oak': 'tree1',
    'maple': 'tree2',
    'pine': 'tree3',
    'spruce': 'tree4',
    'birch': 'tree1', // Map to tree1 as fallback
    'palm': 'tree2',  // Map to tree2 as fallback
  };
  return migrationMap[oldType] || (TREE_PATTERNS[oldType as TreeType] ? oldType as TreeType : 'tree1');
}
