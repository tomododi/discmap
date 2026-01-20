// Tree SVG Generators - Using PNG images for export
import type { TreeType } from '../types/trees';
import { TREE_PATTERNS, getTreeImagePath } from '../types/trees';

// Module-level cache for base64 tree images
let treeImageCache: Map<TreeType, string> | null = null;
let cachePromise: Promise<Map<TreeType, string>> | null = null;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Initialize tree image cache - call this early in app lifecycle
// Returns a promise that resolves when all images are loaded
export async function initTreeImageCache(): Promise<Map<TreeType, string>> {
  // Return existing cache if already loaded
  if (treeImageCache) {
    return treeImageCache;
  }

  // Return existing promise if loading is in progress
  if (cachePromise) {
    return cachePromise;
  }

  // Start loading
  cachePromise = (async () => {
    const imageMap = new Map<TreeType, string>();
    const treeTypes: TreeType[] = ['tree1', 'tree2', 'tree3', 'tree4'];

    await Promise.all(treeTypes.map(async (treeType) => {
      const imagePath = getTreeImagePath(treeType);
      try {
        const response = await fetch(imagePath);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        imageMap.set(treeType, base64);
      } catch {
        // If failed, store empty string - will fall back to external reference
        console.warn(`Failed to load tree image: ${imagePath}`);
        imageMap.set(treeType, '');
      }
    }));

    treeImageCache = imageMap;
    return imageMap;
  })();

  return cachePromise;
}

// Get cached base64 image (returns empty string if not cached)
export function getCachedTreeImage(treeType: TreeType): string {
  return treeImageCache?.get(treeType) || '';
}

// Generate tree SVG element
// Uses cached base64 images if available, otherwise falls back to relative paths
export function generateTreeSVG(
  x: number,
  y: number,
  treeType: TreeType,
  size: number,
  rotation: number,
  _customColors?: { primary?: string; secondary?: string; accent?: string }, // Kept for API compatibility
  opacity: number = 1,
  scale: number = 1
): string {
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.tree1;
  const baseSize = pattern.defaultSize * size * scale;

  // Calculate dimensions maintaining aspect ratio
  const width = baseSize * pattern.aspectRatio;
  const height = baseSize;

  // Try to use cached base64 image, fall back to relative path
  const cachedBase64 = getCachedTreeImage(treeType);
  const imageHref = cachedBase64 || getTreeImagePath(treeType).slice(1);

  // Center the image at x, y
  const imgX = x - width / 2;
  const imgY = y - height / 2;

  return `<g transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}">
    <image
      href="${imageHref}"
      x="${imgX.toFixed(2)}"
      y="${imgY.toFixed(2)}"
      width="${width.toFixed(2)}"
      height="${height.toFixed(2)}"
      preserveAspectRatio="xMidYMid meet"
    />
  </g>`;
}

// Generate legend icon for tree type (small preview)
export function generateTreeLegendIcon(
  treeType: TreeType,
  size: number = 24
): string {
  return generateTreeSVG(size / 2, size / 2, treeType, 0.5, 0, undefined, 1, 1);
}

// Preload tree images and return base64 data URLs
// Alias for initTreeImageCache for backwards compatibility
export async function preloadTreeImages(): Promise<Map<TreeType, string>> {
  return initTreeImageCache();
}

// Generate tree SVG using preloaded base64 images
export function generateTreeSVGFromPreloaded(
  x: number,
  y: number,
  treeType: TreeType,
  size: number,
  rotation: number,
  opacity: number = 1,
  scale: number = 1,
  preloadedImages: Map<TreeType, string>
): string {
  const pattern = TREE_PATTERNS[treeType] ?? TREE_PATTERNS.tree1;
  const baseSize = pattern.defaultSize * size * scale;

  const width = baseSize * pattern.aspectRatio;
  const height = baseSize;

  // Get preloaded base64 or fallback to external reference
  const base64 = preloadedImages.get(treeType);
  const imageHref = base64 || getTreeImagePath(treeType).slice(1);

  const imgX = x - width / 2;
  const imgY = y - height / 2;

  return `<g transform="rotate(${rotation} ${x} ${y})" opacity="${opacity}">
    <image
      href="${imageHref}"
      x="${imgX.toFixed(2)}"
      y="${imgY.toFixed(2)}"
      width="${width.toFixed(2)}"
      height="${height.toFixed(2)}"
      preserveAspectRatio="xMidYMid meet"
    />
  </g>`;
}
