import type { CourseStyle } from '../../types/course';
import type { ExportConfig } from '../../types/export';
import { darkenColor } from './svg-markers';

function generateLegendIconTee(x: number, y: number, color: string, s: number): string {
  const borderColor = darkenColor(color);
  const w = 16 * s, h = 10 * s, rx = 2 * s;
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${color}" stroke="${borderColor}" stroke-width="${s}" />
      <rect x="${2 * s}" y="${2 * s}" width="${12 * s}" height="${6 * s}" rx="${s}" fill="${borderColor}" opacity="0.2" />
    </g>
  `;
}

function generateLegendIconBasket(x: number, y: number, style: CourseStyle, s: number): string {
  const h = 14 * s;
  return `
    <g transform="translate(${x}, ${y - h + 10 * s})">
      <rect x="${5 * s}" y="${9 * s}" width="${s}" height="${5 * s}" fill="${style.basketPoleColor}" />
      <path d="M${2 * s} ${6 * s} L${10 * s} ${6 * s} L${9 * s} ${9 * s} L${3 * s} ${9 * s} Z" fill="${style.basketBodyColor}" stroke="${darkenColor(style.basketBodyColor)}" stroke-width="${0.5 * s}" />
      <path d="M${3 * s} ${3 * s} L${3 * s} ${6 * s} M${5.5 * s} ${2 * s} L${5.5 * s} ${6 * s} M${8 * s} ${3 * s} L${8 * s} ${6 * s}" stroke="${style.basketChainColor}" stroke-width="${0.8 * s}" />
      <ellipse cx="${5.5 * s}" cy="${2 * s}" rx="${4 * s}" ry="${1.2 * s}" fill="${style.basketTopColor}" stroke="${darkenColor(style.basketTopColor)}" stroke-width="${0.5 * s}" />
    </g>
  `;
}

function generateLegendIconDropzone(x: number, y: number, color: string, s: number): string {
  const borderColor = darkenColor(color);
  const w = 16 * s, h = 10 * s, rx = 2 * s;
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${color}" stroke="${borderColor}" stroke-width="${s}" />
      <rect x="${2 * s}" y="${2 * s}" width="${12 * s}" height="${6 * s}" rx="${s}" fill="none" stroke="${borderColor}" stroke-width="${0.5 * s}" opacity="0.4" />
    </g>
  `;
}

function generateLegendIconMandatory(x: number, y: number, color: string, s: number): string {
  const borderColor = darkenColor(color);
  // Arrow shape pointing right
  return `
    <g transform="translate(${x}, ${y})">
      <path d="M0 ${3 * s} L${8 * s} ${3 * s} L${8 * s} ${1 * s} L${12 * s} ${5 * s} L${8 * s} ${9 * s} L${8 * s} ${7 * s} L0 ${7 * s} Z" fill="${color}" stroke="${borderColor}" stroke-width="${0.8 * s}" stroke-linejoin="round" />
    </g>
  `;
}

export function generateLegendSVG(
  x: number,
  y: number,
  style: CourseStyle,
  _config: ExportConfig,
  scale: number = 1
): string {
  const itemHeight = 24 * scale;
  const iconSize = 16 * scale;
  const padding = 12 * scale;
  const width = 140 * scale;
  const itemCount = 7;
  const height = itemCount * itemHeight + 2 * padding + 24 * scale;

  let legendSVG = `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="${4 * scale}" fill="white" stroke="#e5e7eb" stroke-width="${scale}" />
      <text x="${padding}" y="${padding + 14 * scale}" font-family="Arial, sans-serif" font-weight="bold" font-size="${12 * scale}" fill="#374151">Legend</text>
  `;

  const items: { label: string; icon: string }[] = [
    { label: 'Tee', icon: generateLegendIconTee(padding, padding + 24 * scale + 0 * itemHeight, style.defaultTeeColor, scale) },
    { label: 'Basket', icon: generateLegendIconBasket(padding, padding + 24 * scale + 1 * itemHeight, style, scale) },
    { label: 'Flight Line', icon: `<line x1="${padding}" y1="${padding + 24 * scale + 2 * itemHeight + iconSize / 3}" x2="${padding + iconSize}" y2="${padding + 24 * scale + 2 * itemHeight + iconSize / 3}" stroke="${style.defaultFlightLineColor}" stroke-width="${2 * scale}" stroke-dasharray="${4 * scale} ${2 * scale}" />` },
    { label: 'OB Zone', icon: `<rect x="${padding}" y="${padding + 24 * scale + 3 * itemHeight}" width="${iconSize}" height="${iconSize * 0.6}" rx="${2 * scale}" fill="${style.obZoneColor}" fill-opacity="0.5" stroke="${style.obZoneColor}" stroke-width="${scale}" stroke-dasharray="${3 * scale} ${1.5 * scale}" />` },
    { label: 'Fairway', icon: `<rect x="${padding}" y="${padding + 24 * scale + 4 * itemHeight}" width="${iconSize}" height="${iconSize * 0.6}" rx="${2 * scale}" fill="${style.fairwayColor}" fill-opacity="0.7" />` },
    { label: 'Dropzone', icon: generateLegendIconDropzone(padding, padding + 24 * scale + 5 * itemHeight, style.dropzoneColor, scale) },
    { label: 'Mandatory', icon: generateLegendIconMandatory(padding, padding + 24 * scale + 6 * itemHeight, style.mandatoryColor, scale) },
  ];

  items.forEach((item, index) => {
    const itemY = padding + 24 * scale + index * itemHeight;
    const labelX = padding + iconSize + 8 * scale;

    legendSVG += `
      ${item.icon}
      <text x="${labelX}" y="${itemY + iconSize / 2}" font-family="Arial, sans-serif" font-size="${10 * scale}" fill="#374151">${item.label}</text>
    `;
  });

  legendSVG += '</g>';
  return legendSVG;
}
