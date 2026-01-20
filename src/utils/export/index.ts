import JSZip from 'jszip';
import type { Course } from '../../types/course';
import { generateTeeSignSVG } from './layouts/tee-sign';
import type { TeeSignOptions } from './layouts/tee-sign';
import { initGrassImageCache, initHighgrassImageCache } from '../svgPatterns';
import { initTreeImageCache } from '../treeSvg';

// Layouts
export { generateCourseSVG, generateHoleExportData } from './layouts/course-map';
export { generateTeeSignSVG } from './layouts/tee-sign';
export { generatePrintLayoutSVG, generateHolePageSVG } from './layouts/print-layout';

// Types
export type { SVGExportOptions, HoleExportData } from './layouts/course-map';
export type { TeeSignOptions } from './layouts/tee-sign';
export type { PrintLayoutOptions } from './layouts/print-layout';

// Re-export cache initialization for use in components
export { initGrassImageCache, initHighgrassImageCache } from '../svgPatterns';

// Helper for download
export function downloadSVG(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate ZIP with all tee signs
export async function generateTeeSignsZip(
  course: Course,
  options: Omit<TeeSignOptions, 'hole'>
): Promise<Blob> {
  // Ensure image caches are loaded before generating SVGs
  await Promise.all([
    initGrassImageCache(),
    initHighgrassImageCache(),
    initTreeImageCache(),
  ]);

  const zip = new JSZip();

  // Generate SVG for each hole
  for (const hole of course.holes) {
    const svg = generateTeeSignSVG({
      ...options,
      hole,
      course,
    });
    const filename = `hole_${String(hole.number).padStart(2, '0')}.svg`;
    zip.file(filename, svg);
  }

  // Note: Grass and tree images are embedded as base64 in SVGs via caching system
  // No need to add external files to ZIP

  return zip.generateAsync({ type: 'blob' });
}

// Download a blob as ZIP
export async function downloadZip(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.zip') ? filename : `${filename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
