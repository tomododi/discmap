// ============ TREE TYPES ============
// Tree crown patterns for decorative tree placement (top-down view)

import type { Feature, Point } from 'geojson';

export type TreeType = 'oak' | 'maple' | 'pine' | 'spruce' | 'birch';

export type TreeCategory = 'deciduous' | 'conifer';

export interface TreePattern {
  id: TreeType;
  name: string;
  category: TreeCategory;
  defaultSize: number;  // Default size in pixels
  defaultColors: {
    primary: string;    // Main crown color
    secondary: string;  // Shadow/depth color
    accent: string;     // Highlight color
  };
}

// Registry of all tree patterns
export const TREE_PATTERNS: Record<TreeType, TreePattern> = {
  oak: {
    id: 'oak',
    name: 'Oak',
    category: 'deciduous',
    defaultSize: 48,
    defaultColors: {
      primary: '#228b22',    // Forest green
      secondary: '#1a6b1a',  // Darker green for shadow
      accent: '#32cd32',     // Lime green highlights
    },
  },
  maple: {
    id: 'maple',
    name: 'Maple',
    category: 'deciduous',
    defaultSize: 40,
    defaultColors: {
      primary: '#2e8b57',    // Sea green
      secondary: '#1e5f3a',  // Darker shade
      accent: '#3cb371',     // Medium sea green
    },
  },
  pine: {
    id: 'pine',
    name: 'Pine',
    category: 'conifer',
    defaultSize: 36,
    defaultColors: {
      primary: '#0d5524',    // Dark pine green
      secondary: '#073d18',  // Very dark green
      accent: '#2d7d46',     // Lighter pine
    },
  },
  spruce: {
    id: 'spruce',
    name: 'Spruce',
    category: 'conifer',
    defaultSize: 32,
    defaultColors: {
      primary: '#1e4d2b',    // Dark spruce
      secondary: '#143d1f',  // Very dark
      accent: '#2d6b3f',     // Lighter spruce
    },
  },
  birch: {
    id: 'birch',
    name: 'Birch',
    category: 'deciduous',
    defaultSize: 28,
    defaultColors: {
      primary: '#6b8e23',    // Olive drab
      secondary: '#556b2f',  // Dark olive
      accent: '#9acd32',     // Yellow green
    },
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
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  label?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TreeFeature = Feature<Point, TreeFeatureProperties>;

// ============ UTILITY FUNCTIONS ============

export function getTreeColors(
  treeType: TreeType,
  customColors?: TreeFeatureProperties['customColors']
): { primary: string; secondary: string; accent: string } {
  // Fallback to oak if tree type is unknown (e.g., removed palm)
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.oak;
  const defaults = pattern.defaultColors;
  return {
    primary: customColors?.primary ?? defaults.primary,
    secondary: customColors?.secondary ?? defaults.secondary,
    accent: customColors?.accent ?? defaults.accent,
  };
}

export function getAllTreeTypes(): TreeType[] {
  return Object.keys(TREE_PATTERNS) as TreeType[];
}

export function getTreesByCategory(category: TreeCategory): TreeType[] {
  return getAllTreeTypes().filter(t => TREE_PATTERNS[t].category === category);
}

export function getDefaultTreeSize(treeType: TreeType): number {
  // Fallback to oak if tree type is unknown
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.oak;
  return pattern.defaultSize;
}
