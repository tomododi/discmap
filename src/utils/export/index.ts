import JSZip from 'jszip';
import type { Course } from '../../types/course';
import { generateTeeSignSVG } from './layouts/tee-sign';
import type { TeeSignOptions } from './layouts/tee-sign';

// Layouts
export { generateCourseSVG, generateHoleExportData } from './layouts/course-map';
export { generateTeeSignSVG } from './layouts/tee-sign';
export { generatePrintLayoutSVG, generateHolePageSVG } from './layouts/print-layout';

// Types
export type { SVGExportOptions, HoleExportData } from './layouts/course-map';
export type { TeeSignOptions } from './layouts/tee-sign';
export type { PrintLayoutOptions } from './layouts/print-layout';

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

  // Add grass.jpg if using grass terrain
  const defaultTerrain = course.style.defaultTerrain ?? 'grass';
  if (defaultTerrain === 'grass') {
    try {
      const response = await fetch('/grass.jpg');
      if (response.ok) {
        const grassBlob = await response.blob();
        zip.file('grass.jpg', grassBlob);
      }
    } catch {
      // Grass image not available, skip
    }
  }

  // Add tree images (used by forest terrain and tree features)
  const treeImages = ['tree1.png', 'tree2.png', 'tree3.png', 'tree4.png'];
  for (const treeImage of treeImages) {
    try {
      const response = await fetch(`/${treeImage}`);
      if (response.ok) {
        const treeBlob = await response.blob();
        zip.file(treeImage, treeBlob);
      }
    } catch {
      // Tree image not available, skip
    }
  }

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
