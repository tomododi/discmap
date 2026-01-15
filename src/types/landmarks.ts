// ============ LANDMARK TYPES ============
// Decorative elements for disc golf course maps

export type LandmarkCategory = 'amenities' | 'nature' | 'signage' | 'hazards' | 'structures';

export type LandmarkType =
  // Amenities
  | 'parking'
  | 'restroom'
  | 'bench'
  | 'picnicTable'
  | 'trashCan'
  | 'waterFountain'
  // Nature
  | 'tree'
  | 'treeGroup'
  | 'bush'
  | 'flower'
  | 'rock'
  | 'stump'
  // Signage
  | 'infoSign'
  | 'holeSign'
  | 'directionSign'
  | 'warningSign'
  // Hazards
  | 'fence'
  | 'post'
  | 'electricBox'
  // Structures
  | 'shelter'
  | 'bridge'
  | 'stairs'
  | 'path';

export interface LandmarkDefinition {
  id: LandmarkType;
  name: string;
  category: LandmarkCategory;
  icon: string; // Emoji for toolbar
  defaultColor: string;
  defaultSize: number; // Base size in pixels
}

export const LANDMARK_DEFINITIONS: Record<LandmarkType, LandmarkDefinition> = {
  // Amenities
  parking: {
    id: 'parking',
    name: 'Parking',
    category: 'amenities',
    icon: '🅿️',
    defaultColor: '#3b82f6',
    defaultSize: 24,
  },
  restroom: {
    id: 'restroom',
    name: 'Restroom',
    category: 'amenities',
    icon: '🚻',
    defaultColor: '#6366f1',
    defaultSize: 24,
  },
  bench: {
    id: 'bench',
    name: 'Bench',
    category: 'amenities',
    icon: '🪑',
    defaultColor: '#78716c',
    defaultSize: 20,
  },
  picnicTable: {
    id: 'picnicTable',
    name: 'Picnic Table',
    category: 'amenities',
    icon: '🏕️',
    defaultColor: '#a16207',
    defaultSize: 28,
  },
  trashCan: {
    id: 'trashCan',
    name: 'Trash Can',
    category: 'amenities',
    icon: '🗑️',
    defaultColor: '#52525b',
    defaultSize: 18,
  },
  waterFountain: {
    id: 'waterFountain',
    name: 'Water Fountain',
    category: 'amenities',
    icon: '🚰',
    defaultColor: '#0ea5e9',
    defaultSize: 20,
  },

  // Nature
  tree: {
    id: 'tree',
    name: 'Tree',
    category: 'nature',
    icon: '🌳',
    defaultColor: '#16a34a',
    defaultSize: 28,
  },
  treeGroup: {
    id: 'treeGroup',
    name: 'Tree Group',
    category: 'nature',
    icon: '🌲',
    defaultColor: '#15803d',
    defaultSize: 36,
  },
  bush: {
    id: 'bush',
    name: 'Bush',
    category: 'nature',
    icon: '🌿',
    defaultColor: '#22c55e',
    defaultSize: 18,
  },
  flower: {
    id: 'flower',
    name: 'Flowers',
    category: 'nature',
    icon: '🌸',
    defaultColor: '#ec4899',
    defaultSize: 16,
  },
  rock: {
    id: 'rock',
    name: 'Rock',
    category: 'nature',
    icon: '🪨',
    defaultColor: '#71717a',
    defaultSize: 22,
  },
  stump: {
    id: 'stump',
    name: 'Tree Stump',
    category: 'nature',
    icon: '🪵',
    defaultColor: '#92400e',
    defaultSize: 18,
  },

  // Signage
  infoSign: {
    id: 'infoSign',
    name: 'Info Sign',
    category: 'signage',
    icon: 'ℹ️',
    defaultColor: '#0284c7',
    defaultSize: 22,
  },
  holeSign: {
    id: 'holeSign',
    name: 'Hole Sign',
    category: 'signage',
    icon: '🔢',
    defaultColor: '#dc2626',
    defaultSize: 20,
  },
  directionSign: {
    id: 'directionSign',
    name: 'Direction Sign',
    category: 'signage',
    icon: '➡️',
    defaultColor: '#f59e0b',
    defaultSize: 22,
  },
  warningSign: {
    id: 'warningSign',
    name: 'Warning Sign',
    category: 'signage',
    icon: '⚠️',
    defaultColor: '#eab308',
    defaultSize: 22,
  },

  // Hazards
  fence: {
    id: 'fence',
    name: 'Fence Post',
    category: 'hazards',
    icon: '🚧',
    defaultColor: '#a1a1aa',
    defaultSize: 16,
  },
  post: {
    id: 'post',
    name: 'Post/Pole',
    category: 'hazards',
    icon: '🔩',
    defaultColor: '#71717a',
    defaultSize: 14,
  },
  electricBox: {
    id: 'electricBox',
    name: 'Electric Box',
    category: 'hazards',
    icon: '⚡',
    defaultColor: '#22c55e',
    defaultSize: 20,
  },

  // Structures
  shelter: {
    id: 'shelter',
    name: 'Shelter/Pavilion',
    category: 'structures',
    icon: '🏠',
    defaultColor: '#b45309',
    defaultSize: 36,
  },
  bridge: {
    id: 'bridge',
    name: 'Bridge',
    category: 'structures',
    icon: '🌉',
    defaultColor: '#78716c',
    defaultSize: 32,
  },
  stairs: {
    id: 'stairs',
    name: 'Stairs',
    category: 'structures',
    icon: '🪜',
    defaultColor: '#a1a1aa',
    defaultSize: 24,
  },
  path: {
    id: 'path',
    name: 'Path Marker',
    category: 'structures',
    icon: '👣',
    defaultColor: '#d6d3d1',
    defaultSize: 16,
  },
};

export const LANDMARK_CATEGORIES: { id: LandmarkCategory; name: string; icon: string }[] = [
  { id: 'amenities', name: 'Amenities', icon: '🏛️' },
  { id: 'nature', name: 'Nature', icon: '🌳' },
  { id: 'signage', name: 'Signage', icon: '🪧' },
  { id: 'hazards', name: 'Hazards', icon: '⚠️' },
  { id: 'structures', name: 'Structures', icon: '🏗️' },
];

export function getLandmarksByCategory(category: LandmarkCategory): LandmarkType[] {
  return (Object.keys(LANDMARK_DEFINITIONS) as LandmarkType[]).filter(
    (type) => LANDMARK_DEFINITIONS[type].category === category
  );
}

export function getAllLandmarkTypes(): LandmarkType[] {
  return Object.keys(LANDMARK_DEFINITIONS) as LandmarkType[];
}
