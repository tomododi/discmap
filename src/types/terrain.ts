// ============ TERRAIN TYPES ============
// Extensible terrain and infrastructure system for SVG export

export type TerrainType =
  | 'grass'
  | 'roughGrass'
  | 'forest'
  | 'water'
  | 'sand'
  | 'path'
  | 'concrete'
  | 'gravel'
  | 'marsh'
  | 'rocks';

export interface TerrainPattern {
  id: TerrainType;
  name: string;
  category: 'ground' | 'vegetation' | 'water' | 'surface';
  defaultColors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
}

// Registry of all terrain patterns - extensible
export const TERRAIN_PATTERNS: Record<TerrainType, TerrainPattern> = {
  grass: {
    id: 'grass',
    name: 'Grass',
    category: 'ground',
    defaultColors: {
      primary: '#4ade80',
      secondary: '#22c55e',
      accent: '#86efac',
    },
  },
  roughGrass: {
    id: 'roughGrass',
    name: 'Rough Grass',
    category: 'ground',
    defaultColors: {
      primary: '#84cc16',
      secondary: '#65a30d',
      accent: '#bef264',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest / Trees',
    category: 'vegetation',
    defaultColors: {
      primary: '#166534',
      secondary: '#14532d',
      accent: '#22c55e',
    },
  },
  water: {
    id: 'water',
    name: 'Water / Pond',
    category: 'water',
    defaultColors: {
      primary: '#38bdf8',
      secondary: '#0ea5e9',
      accent: '#7dd3fc',
    },
  },
  sand: {
    id: 'sand',
    name: 'Sand / Bunker',
    category: 'surface',
    defaultColors: {
      primary: '#fcd34d',
      secondary: '#fbbf24',
      accent: '#fef3c7',
    },
  },
  path: {
    id: 'path',
    name: 'Walking Path',
    category: 'surface',
    defaultColors: {
      primary: '#d6d3d1',
      secondary: '#a8a29e',
      accent: '#f5f5f4',
    },
  },
  concrete: {
    id: 'concrete',
    name: 'Concrete / Paved',
    category: 'surface',
    defaultColors: {
      primary: '#9ca3af',
      secondary: '#6b7280',
      accent: '#d1d5db',
    },
  },
  gravel: {
    id: 'gravel',
    name: 'Gravel',
    category: 'surface',
    defaultColors: {
      primary: '#78716c',
      secondary: '#57534e',
      accent: '#a8a29e',
    },
  },
  marsh: {
    id: 'marsh',
    name: 'Marsh / Wetland',
    category: 'water',
    defaultColors: {
      primary: '#5eead4',
      secondary: '#2dd4bf',
      accent: '#99f6e4',
    },
  },
  rocks: {
    id: 'rocks',
    name: 'Rocky Area',
    category: 'surface',
    defaultColors: {
      primary: '#71717a',
      secondary: '#52525b',
      accent: '#a1a1aa',
    },
  },
};

// ============ INFRASTRUCTURE FEATURE ============

export interface InfrastructureProperties {
  id: string;
  type: 'infrastructure';
  terrainType: TerrainType;
  holeId?: string; // Optional - can be course-level
  label?: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  opacity?: number;
  createdAt: string;
  updatedAt: string;
}

// ============ MAP BACKGROUND CONFIG ============

export type BackgroundType =
  | 'solid'
  | 'gradient'
  | 'terrain'
  | 'satellite-style';

export interface BackgroundGradient {
  type: 'linear' | 'radial';
  angle?: number; // For linear gradients
  stops: Array<{
    offset: number;
    color: string;
  }>;
}

export interface MapBackgroundConfig {
  type: BackgroundType;
  solidColor?: string;
  gradient?: BackgroundGradient;
  terrainBaseColor?: string;
  // Atmospheric effects
  enableVignette?: boolean;
  vignetteColor?: string;
  vignetteOpacity?: number;
  // Texture overlay
  enableNoiseTexture?: boolean;
  noiseOpacity?: number;
  // Border/frame
  enableFrame?: boolean;
  frameColor?: string;
  frameWidth?: number;
}

export const DEFAULT_BACKGROUND_CONFIG: MapBackgroundConfig = {
  type: 'terrain',
  terrainBaseColor: '#4ade80', // Grass green
  gradient: {
    type: 'radial',
    stops: [
      { offset: 0, color: '#86efac' },
      { offset: 0.6, color: '#4ade80' },
      { offset: 1, color: '#22c55e' },
    ],
  },
  enableVignette: true,
  vignetteColor: '#166534',
  vignetteOpacity: 0.12,
  enableNoiseTexture: true,
  noiseOpacity: 0.04,
  enableFrame: true,
  frameColor: '#166534',
  frameWidth: 3,
};

// ============ PRESET THEMES ============

export interface TerrainTheme {
  id: string;
  name: string;
  description: string;
  background: MapBackgroundConfig;
  terrainColors: Partial<Record<TerrainType, { primary: string; secondary: string; accent?: string }>>;
}

export const TERRAIN_THEMES: TerrainTheme[] = [
  {
    id: 'forest-park',
    name: 'Forest Park',
    description: 'Lush green forest aesthetic',
    background: {
      type: 'gradient',
      gradient: {
        type: 'radial',
        stops: [
          { offset: 0, color: '#e8f5e9' },
          { offset: 0.6, color: '#c8e6c9' },
          { offset: 1, color: '#81c784' },
        ],
      },
      enableVignette: true,
      vignetteColor: '#1b5e20',
      vignetteOpacity: 0.2,
      enableNoiseTexture: true,
      noiseOpacity: 0.04,
      enableFrame: true,
      frameColor: '#2e7d32',
      frameWidth: 4,
    },
    terrainColors: {
      grass: { primary: '#66bb6a', secondary: '#4caf50', accent: '#a5d6a7' },
      forest: { primary: '#2e7d32', secondary: '#1b5e20', accent: '#4caf50' },
    },
  },
  {
    id: 'coastal',
    name: 'Coastal Course',
    description: 'Ocean-side with sandy dunes',
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        angle: 180,
        stops: [
          { offset: 0, color: '#e0f7fa' },
          { offset: 0.5, color: '#b2ebf2' },
          { offset: 1, color: '#80deea' },
        ],
      },
      enableVignette: true,
      vignetteColor: '#006064',
      vignetteOpacity: 0.15,
      enableNoiseTexture: true,
      noiseOpacity: 0.05,
      enableFrame: true,
      frameColor: '#00838f',
      frameWidth: 3,
    },
    terrainColors: {
      grass: { primary: '#aed581', secondary: '#9ccc65' },
      sand: { primary: '#fff8e1', secondary: '#ffe082', accent: '#ffecb3' },
      water: { primary: '#4dd0e1', secondary: '#26c6da', accent: '#80deea' },
    },
  },
  {
    id: 'autumn',
    name: 'Autumn Colors',
    description: 'Warm fall palette',
    background: {
      type: 'gradient',
      gradient: {
        type: 'radial',
        stops: [
          { offset: 0, color: '#fff8e1' },
          { offset: 0.5, color: '#ffe0b2' },
          { offset: 1, color: '#ffcc80' },
        ],
      },
      enableVignette: true,
      vignetteColor: '#bf360c',
      vignetteOpacity: 0.18,
      enableNoiseTexture: true,
      noiseOpacity: 0.04,
      enableFrame: true,
      frameColor: '#e65100',
      frameWidth: 4,
    },
    terrainColors: {
      grass: { primary: '#c5e1a5', secondary: '#aed581' },
      forest: { primary: '#ff8a65', secondary: '#d84315', accent: '#ffab91' },
      roughGrass: { primary: '#dce775', secondary: '#cddc39' },
    },
  },
  {
    id: 'tournament',
    name: 'Tournament Pro',
    description: 'Clean professional look',
    background: {
      type: 'solid',
      solidColor: '#fafafa',
      enableVignette: false,
      enableNoiseTexture: false,
      enableFrame: true,
      frameColor: '#212121',
      frameWidth: 2,
    },
    terrainColors: {
      grass: { primary: '#81c784', secondary: '#66bb6a' },
      forest: { primary: '#388e3c', secondary: '#2e7d32' },
      water: { primary: '#64b5f6', secondary: '#42a5f5' },
    },
  },
  {
    id: 'vintage-map',
    name: 'Vintage Map',
    description: 'Classic cartographic style',
    background: {
      type: 'gradient',
      gradient: {
        type: 'radial',
        stops: [
          { offset: 0, color: '#fef9e7' },
          { offset: 0.6, color: '#f5ecd7' },
          { offset: 1, color: '#e8dcc8' },
        ],
      },
      enableVignette: true,
      vignetteColor: '#5d4037',
      vignetteOpacity: 0.25,
      enableNoiseTexture: true,
      noiseOpacity: 0.08,
      enableFrame: true,
      frameColor: '#795548',
      frameWidth: 5,
    },
    terrainColors: {
      grass: { primary: '#aed581', secondary: '#9ccc65', accent: '#c5e1a5' },
      forest: { primary: '#6b8e23', secondary: '#556b2f', accent: '#8fbc8f' },
      water: { primary: '#87ceeb', secondary: '#6bb3d9', accent: '#b0e0e6' },
      path: { primary: '#d7ccc8', secondary: '#bcaaa4' },
    },
  },
];

// ============ UTILITY FUNCTIONS ============

export function getTerrainColors(
  terrainType: TerrainType,
  customColors?: InfrastructureProperties['customColors'],
  theme?: TerrainTheme
): { primary: string; secondary: string; accent: string } {
  const defaults = TERRAIN_PATTERNS[terrainType].defaultColors;
  const themeColors = theme?.terrainColors[terrainType];

  return {
    primary: customColors?.primary ?? themeColors?.primary ?? defaults.primary,
    secondary: customColors?.secondary ?? themeColors?.secondary ?? defaults.secondary,
    accent: customColors?.accent ?? themeColors?.accent ?? defaults.accent ?? defaults.primary,
  };
}

export function getAllTerrainTypes(): TerrainType[] {
  return Object.keys(TERRAIN_PATTERNS) as TerrainType[];
}

export function getTerrainByCategory(category: TerrainPattern['category']): TerrainType[] {
  return getAllTerrainTypes().filter(t => TERRAIN_PATTERNS[t].category === category);
}
