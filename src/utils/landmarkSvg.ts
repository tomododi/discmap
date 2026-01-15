// ============ LANDMARK SVG GENERATORS ============
// Beautiful, detailed SVG icons for disc golf course landmarks

import type { LandmarkType } from '../types/landmarks';
import { LANDMARK_DEFINITIONS } from '../types/landmarks';

interface LandmarkSVGOptions {
  x: number;
  y: number;
  size?: number;
  rotation?: number;
  color?: string;
}

// Helper to darken color
function darkenColor(hex: string, amount: number = 0.2): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Helper to lighten color
function lightenColor(hex: string, amount: number = 0.2): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// ============ AMENITIES ============

function generateParkingSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#3b82f6' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Parking sign background -->
      <rect x="${-12 * s}" y="${-12 * s}" width="${24 * s}" height="${24 * s}" rx="${4 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1.5 * s}" />
      <!-- P letter -->
      <text x="0" y="${6 * s}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${18 * s}" fill="white">P</text>
      <!-- Shadow -->
      <rect x="${-12 * s}" y="${10 * s}" width="${24 * s}" height="${4 * s}" rx="${0 * s}" fill="${darkenColor(color)}" opacity="0.3" />
    </g>
  `;
}

function generateRestroomSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#6366f1' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Background -->
      <rect x="${-14 * s}" y="${-12 * s}" width="${28 * s}" height="${24 * s}" rx="${3 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1.5 * s}" />
      <!-- Male figure -->
      <circle cx="${-5 * s}" cy="${-5 * s}" r="${3 * s}" fill="white" />
      <rect x="${-7 * s}" y="${-1 * s}" width="${4 * s}" height="${8 * s}" rx="${1 * s}" fill="white" />
      <rect x="${-8 * s}" y="${7 * s}" width="${2.5 * s}" height="${5 * s}" rx="${1 * s}" fill="white" />
      <rect x="${-4.5 * s}" y="${7 * s}" width="${2.5 * s}" height="${5 * s}" rx="${1 * s}" fill="white" />
      <!-- Female figure -->
      <circle cx="${5 * s}" cy="${-5 * s}" r="${3 * s}" fill="white" />
      <path d="M ${2 * s} ${-1 * s} L ${8 * s} ${-1 * s} L ${9 * s} ${7 * s} L ${6.5 * s} ${7 * s} L ${6.5 * s} ${12 * s} L ${3.5 * s} ${12 * s} L ${3.5 * s} ${7 * s} L ${1 * s} ${7 * s} Z" fill="white" />
    </g>
  `;
}

function generateBenchSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#78716c' } = opts;
  const s = size;
  const wood = '#a16207';
  const woodDark = '#78350f';
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Bench top planks -->
      <rect x="${-14 * s}" y="${-6 * s}" width="${28 * s}" height="${4 * s}" rx="${1 * s}" fill="${wood}" stroke="${woodDark}" stroke-width="${0.5 * s}" />
      <rect x="${-14 * s}" y="${-1 * s}" width="${28 * s}" height="${4 * s}" rx="${1 * s}" fill="${wood}" stroke="${woodDark}" stroke-width="${0.5 * s}" />
      <!-- Legs -->
      <rect x="${-10 * s}" y="${4 * s}" width="${3 * s}" height="${6 * s}" rx="${0.5 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <rect x="${7 * s}" y="${4 * s}" width="${3 * s}" height="${6 * s}" rx="${0.5 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <!-- Wood grain lines -->
      <line x1="${-12 * s}" y1="${-4 * s}" x2="${12 * s}" y2="${-4 * s}" stroke="${woodDark}" stroke-width="${0.3 * s}" opacity="0.3" />
      <line x1="${-12 * s}" y1="${1 * s}" x2="${12 * s}" y2="${1 * s}" stroke="${woodDark}" stroke-width="${0.3 * s}" opacity="0.3" />
    </g>
  `;
}

function generatePicnicTableSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#a16207' } = opts;
  const s = size;
  const woodDark = darkenColor(color);
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Table top -->
      <rect x="${-16 * s}" y="${-4 * s}" width="${32 * s}" height="${8 * s}" rx="${1 * s}" fill="${color}" stroke="${woodDark}" stroke-width="${1 * s}" />
      <!-- Benches -->
      <rect x="${-14 * s}" y="${-10 * s}" width="${28 * s}" height="${4 * s}" rx="${1 * s}" fill="${lightenColor(color, 0.1)}" stroke="${woodDark}" stroke-width="${0.5 * s}" />
      <rect x="${-14 * s}" y="${6 * s}" width="${28 * s}" height="${4 * s}" rx="${1 * s}" fill="${lightenColor(color, 0.1)}" stroke="${woodDark}" stroke-width="${0.5 * s}" />
      <!-- Legs (A-frame style) -->
      <line x1="${-8 * s}" y1="${-10 * s}" x2="${-10 * s}" y2="${12 * s}" stroke="${woodDark}" stroke-width="${2 * s}" />
      <line x1="${8 * s}" y1="${-10 * s}" x2="${10 * s}" y2="${12 * s}" stroke="${woodDark}" stroke-width="${2 * s}" />
      <!-- Cross beams -->
      <line x1="${-12 * s}" y1="${2 * s}" x2="${12 * s}" y2="${2 * s}" stroke="${woodDark}" stroke-width="${1.5 * s}" />
    </g>
  `;
}

function generateTrashCanSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#52525b' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Can body -->
      <path d="M ${-8 * s} ${-6 * s} L ${-10 * s} ${10 * s} L ${10 * s} ${10 * s} L ${8 * s} ${-6 * s} Z" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1 * s}" />
      <!-- Lid -->
      <ellipse cx="0" cy="${-6 * s}" rx="${10 * s}" ry="${3 * s}" fill="${lightenColor(color, 0.1)}" stroke="${darkenColor(color)}" stroke-width="${1 * s}" />
      <!-- Handle -->
      <path d="M ${-3 * s} ${-9 * s} Q 0 ${-14 * s} ${3 * s} ${-9 * s}" fill="none" stroke="${darkenColor(color)}" stroke-width="${1.5 * s}" />
      <!-- Ridges -->
      <line x1="${-7 * s}" y1="${0 * s}" x2="${7 * s}" y2="${0 * s}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" opacity="0.3" />
      <line x1="${-8 * s}" y1="${4 * s}" x2="${8 * s}" y2="${4 * s}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" opacity="0.3" />
    </g>
  `;
}

function generateWaterFountainSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#0ea5e9' } = opts;
  const s = size;
  const metal = '#94a3b8';
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Base pedestal -->
      <rect x="${-6 * s}" y="${2 * s}" width="${12 * s}" height="${10 * s}" rx="${1 * s}" fill="${metal}" stroke="${darkenColor(metal)}" stroke-width="${1 * s}" />
      <!-- Bowl -->
      <ellipse cx="0" cy="${-2 * s}" rx="${10 * s}" ry="${5 * s}" fill="${lightenColor(metal, 0.1)}" stroke="${darkenColor(metal)}" stroke-width="${1 * s}" />
      <!-- Water stream -->
      <path d="M ${-2 * s} ${-4 * s} Q ${2 * s} ${-10 * s} ${6 * s} ${-4 * s}" fill="none" stroke="${color}" stroke-width="${2 * s}" stroke-linecap="round" />
      <!-- Water drops -->
      <circle cx="${4 * s}" cy="${-6 * s}" r="${1 * s}" fill="${color}" opacity="0.7" />
      <circle cx="${6 * s}" cy="${-3 * s}" r="${0.8 * s}" fill="${color}" opacity="0.5" />
    </g>
  `;
}

// ============ NATURE ============

function generateTreeSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#16a34a' } = opts;
  const s = size;
  const trunk = '#78350f';
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Trunk -->
      <rect x="${-3 * s}" y="${2 * s}" width="${6 * s}" height="${10 * s}" rx="${1 * s}" fill="${trunk}" stroke="${darkenColor(trunk)}" stroke-width="${0.5 * s}" />
      <!-- Foliage layers -->
      <circle cx="0" cy="${-8 * s}" r="${12 * s}" fill="${color}" />
      <circle cx="${-6 * s}" cy="${-4 * s}" r="${8 * s}" fill="${darkenColor(color, 0.1)}" />
      <circle cx="${6 * s}" cy="${-4 * s}" r="${8 * s}" fill="${darkenColor(color, 0.1)}" />
      <circle cx="0" cy="${-12 * s}" r="${8 * s}" fill="${lightenColor(color, 0.1)}" />
      <!-- Highlight -->
      <circle cx="${-4 * s}" cy="${-12 * s}" r="${4 * s}" fill="${lightenColor(color, 0.2)}" opacity="0.5" />
    </g>
  `;
}

function generateTreeGroupSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#15803d' } = opts;
  const s = size;
  const trunk = '#78350f';
  const color2 = lightenColor(color, 0.15);
  const color3 = darkenColor(color, 0.1);
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Back tree -->
      <rect x="${-12 * s}" y="${0 * s}" width="${4 * s}" height="${8 * s}" fill="${trunk}" />
      <circle cx="${-10 * s}" cy="${-6 * s}" r="${10 * s}" fill="${color3}" />
      <!-- Middle tree -->
      <rect x="${6 * s}" y="${2 * s}" width="${4 * s}" height="${8 * s}" fill="${trunk}" />
      <circle cx="${8 * s}" cy="${-4 * s}" r="${9 * s}" fill="${color2}" />
      <!-- Front tree -->
      <rect x="${-3 * s}" y="${4 * s}" width="${5 * s}" height="${10 * s}" fill="${trunk}" stroke="${darkenColor(trunk)}" stroke-width="${0.5 * s}" />
      <circle cx="0" cy="${-6 * s}" r="${12 * s}" fill="${color}" />
      <circle cx="${-3 * s}" cy="${-10 * s}" r="${5 * s}" fill="${lightenColor(color, 0.15)}" opacity="0.6" />
    </g>
  `;
}

function generateBushSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#22c55e' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Bush body -->
      <ellipse cx="0" cy="${2 * s}" rx="${12 * s}" ry="${8 * s}" fill="${color}" />
      <ellipse cx="${-6 * s}" cy="${0 * s}" rx="${7 * s}" ry="${6 * s}" fill="${darkenColor(color, 0.1)}" />
      <ellipse cx="${6 * s}" cy="${0 * s}" rx="${7 * s}" ry="${6 * s}" fill="${darkenColor(color, 0.1)}" />
      <ellipse cx="0" cy="${-3 * s}" rx="${8 * s}" ry="${5 * s}" fill="${lightenColor(color, 0.1)}" />
      <!-- Highlight spots -->
      <circle cx="${-4 * s}" cy="${-4 * s}" r="${2 * s}" fill="${lightenColor(color, 0.2)}" opacity="0.5" />
    </g>
  `;
}

function generateFlowerSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#ec4899' } = opts;
  const s = size;
  const center = '#fbbf24';
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Petals -->
      <ellipse cx="0" cy="${-6 * s}" rx="${3 * s}" ry="${5 * s}" fill="${color}" />
      <ellipse cx="${5 * s}" cy="${-3 * s}" rx="${3 * s}" ry="${5 * s}" fill="${lightenColor(color, 0.1)}" transform="rotate(72 ${5 * s} ${-3 * s})" />
      <ellipse cx="${4 * s}" cy="${4 * s}" rx="${3 * s}" ry="${5 * s}" fill="${color}" transform="rotate(144 ${4 * s} ${4 * s})" />
      <ellipse cx="${-4 * s}" cy="${4 * s}" rx="${3 * s}" ry="${5 * s}" fill="${lightenColor(color, 0.1)}" transform="rotate(-144 ${-4 * s} ${4 * s})" />
      <ellipse cx="${-5 * s}" cy="${-3 * s}" rx="${3 * s}" ry="${5 * s}" fill="${color}" transform="rotate(-72 ${-5 * s} ${-3 * s})" />
      <!-- Center -->
      <circle cx="0" cy="0" r="${4 * s}" fill="${center}" stroke="${darkenColor(center)}" stroke-width="${0.5 * s}" />
      <!-- Center dots -->
      <circle cx="${-1 * s}" cy="${-1 * s}" r="${1 * s}" fill="${darkenColor(center)}" opacity="0.5" />
      <circle cx="${1 * s}" cy="${1 * s}" r="${0.8 * s}" fill="${darkenColor(center)}" opacity="0.4" />
    </g>
  `;
}

function generateRockSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#71717a' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Main rock shape -->
      <path d="M ${-10 * s} ${4 * s} L ${-8 * s} ${-4 * s} L ${-2 * s} ${-8 * s} L ${6 * s} ${-6 * s} L ${10 * s} ${-2 * s} L ${8 * s} ${6 * s} L ${0 * s} ${8 * s} Z"
            fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1 * s}" />
      <!-- Highlight -->
      <path d="M ${-6 * s} ${-2 * s} L ${-2 * s} ${-6 * s} L ${4 * s} ${-4 * s} L ${2 * s} ${0 * s} Z"
            fill="${lightenColor(color, 0.15)}" opacity="0.6" />
      <!-- Shadow details -->
      <line x1="${-4 * s}" y1="${2 * s}" x2="${4 * s}" y2="${4 * s}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" opacity="0.3" />
    </g>
  `;
}

function generateStumpSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#92400e' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Stump body -->
      <ellipse cx="0" cy="${6 * s}" rx="${10 * s}" ry="${4 * s}" fill="${darkenColor(color)}" />
      <rect x="${-10 * s}" y="${-2 * s}" width="${20 * s}" height="${8 * s}" fill="${color}" />
      <!-- Top surface -->
      <ellipse cx="0" cy="${-2 * s}" rx="${10 * s}" ry="${4 * s}" fill="${lightenColor(color, 0.2)}" stroke="${color}" stroke-width="${1 * s}" />
      <!-- Tree rings -->
      <ellipse cx="0" cy="${-2 * s}" rx="${7 * s}" ry="${2.8 * s}" fill="none" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" opacity="0.5" />
      <ellipse cx="0" cy="${-2 * s}" rx="${4 * s}" ry="${1.6 * s}" fill="none" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" opacity="0.5" />
      <circle cx="0" cy="${-2 * s}" r="${1.5 * s}" fill="${darkenColor(color)}" opacity="0.3" />
    </g>
  `;
}

// ============ SIGNAGE ============

function generateInfoSignSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#0284c7' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Post -->
      <rect x="${-1.5 * s}" y="${0 * s}" width="${3 * s}" height="${12 * s}" fill="#78716c" stroke="${darkenColor('#78716c')}" stroke-width="${0.5 * s}" />
      <!-- Sign board -->
      <rect x="${-10 * s}" y="${-12 * s}" width="${20 * s}" height="${14 * s}" rx="${2 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1 * s}" />
      <!-- Info "i" symbol -->
      <circle cx="0" cy="${-8 * s}" r="${2 * s}" fill="white" />
      <rect x="${-1.5 * s}" y="${-5 * s}" width="${3 * s}" height="${6 * s}" rx="${1 * s}" fill="white" />
    </g>
  `;
}

function generateHoleSignSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#dc2626' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Post -->
      <rect x="${-1 * s}" y="${2 * s}" width="${2 * s}" height="${10 * s}" fill="#78716c" />
      <!-- Sign board -->
      <rect x="${-8 * s}" y="${-10 * s}" width="${16 * s}" height="${14 * s}" rx="${2 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1 * s}" />
      <!-- Number placeholder -->
      <text x="0" y="${0 * s}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${12 * s}" fill="white">#</text>
    </g>
  `;
}

function generateDirectionSignSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#f59e0b' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Post -->
      <rect x="${-1.5 * s}" y="${-2 * s}" width="${3 * s}" height="${14 * s}" fill="#78716c" stroke="${darkenColor('#78716c')}" stroke-width="${0.5 * s}" />
      <!-- Arrow sign -->
      <path d="M ${-12 * s} ${-10 * s} L ${8 * s} ${-10 * s} L ${14 * s} ${-5 * s} L ${8 * s} ${0 * s} L ${-12 * s} ${0 * s} Z"
            fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1 * s}" />
    </g>
  `;
}

function generateWarningSignSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#eab308' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Post -->
      <rect x="${-1 * s}" y="${2 * s}" width="${2 * s}" height="${10 * s}" fill="#78716c" />
      <!-- Triangle sign -->
      <path d="M 0 ${-14 * s} L ${12 * s} ${4 * s} L ${-12 * s} ${4 * s} Z"
            fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1.5 * s}" />
      <!-- Exclamation mark -->
      <rect x="${-1.5 * s}" y="${-8 * s}" width="${3 * s}" height="${7 * s}" rx="${1 * s}" fill="#1f2937" />
      <circle cx="0" cy="${1 * s}" r="${1.5 * s}" fill="#1f2937" />
    </g>
  `;
}

// ============ HAZARDS ============

function generateFenceSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#a1a1aa' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Post -->
      <rect x="${-3 * s}" y="${-10 * s}" width="${6 * s}" height="${20 * s}" rx="${1 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <!-- Cap -->
      <rect x="${-4 * s}" y="${-12 * s}" width="${8 * s}" height="${3 * s}" rx="${1 * s}" fill="${lightenColor(color, 0.1)}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
    </g>
  `;
}

function generatePostSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#71717a' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Pole -->
      <rect x="${-2 * s}" y="${-12 * s}" width="${4 * s}" height="${24 * s}" rx="${2 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <!-- Top cap -->
      <circle cx="0" cy="${-12 * s}" r="${3 * s}" fill="${lightenColor(color, 0.1)}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
    </g>
  `;
}

function generateElectricBoxSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#22c55e' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Box body -->
      <rect x="${-8 * s}" y="${-10 * s}" width="${16 * s}" height="${20 * s}" rx="${2 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${1 * s}" />
      <!-- Door lines -->
      <line x1="0" y1="${-8 * s}" x2="0" y2="${8 * s}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <!-- Warning label -->
      <rect x="${-5 * s}" y="${-6 * s}" width="${10 * s}" height="${8 * s}" fill="#fbbf24" rx="${1 * s}" />
      <!-- Lightning bolt -->
      <path d="M ${-1 * s} ${-5 * s} L ${2 * s} ${-2 * s} L ${0 * s} ${-1 * s} L ${2 * s} ${1 * s} L ${-1 * s} ${-2 * s} L ${1 * s} ${-3 * s} Z" fill="#1f2937" />
    </g>
  `;
}

// ============ STRUCTURES ============

function generateShelterSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#b45309' } = opts;
  const s = size;
  const roof = '#78350f';
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Roof -->
      <path d="M ${-18 * s} ${-4 * s} L 0 ${-16 * s} L ${18 * s} ${-4 * s} Z"
            fill="${roof}" stroke="${darkenColor(roof)}" stroke-width="${1 * s}" />
      <!-- Pillars -->
      <rect x="${-14 * s}" y="${-4 * s}" width="${4 * s}" height="${16 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <rect x="${10 * s}" y="${-4 * s}" width="${4 * s}" height="${16 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <!-- Floor -->
      <rect x="${-16 * s}" y="${10 * s}" width="${32 * s}" height="${4 * s}" fill="#78716c" opacity="0.5" />
    </g>
  `;
}

function generateBridgeSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#78716c' } = opts;
  const s = size;
  const wood = '#a16207';
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Bridge deck -->
      <rect x="${-16 * s}" y="${-2 * s}" width="${32 * s}" height="${6 * s}" rx="${1 * s}" fill="${wood}" stroke="${darkenColor(wood)}" stroke-width="${1 * s}" />
      <!-- Railings -->
      <rect x="${-16 * s}" y="${-10 * s}" width="${2 * s}" height="${8 * s}" fill="${color}" />
      <rect x="${14 * s}" y="${-10 * s}" width="${2 * s}" height="${8 * s}" fill="${color}" />
      <rect x="${-16 * s}" y="${-10 * s}" width="${32 * s}" height="${2 * s}" rx="${1 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <!-- Planks -->
      <line x1="${-10 * s}" y1="${-1 * s}" x2="${-10 * s}" y2="${3 * s}" stroke="${darkenColor(wood)}" stroke-width="${0.5 * s}" />
      <line x1="${0 * s}" y1="${-1 * s}" x2="${0 * s}" y2="${3 * s}" stroke="${darkenColor(wood)}" stroke-width="${0.5 * s}" />
      <line x1="${10 * s}" y1="${-1 * s}" x2="${10 * s}" y2="${3 * s}" stroke="${darkenColor(wood)}" stroke-width="${0.5 * s}" />
    </g>
  `;
}

function generateStairsSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#a1a1aa' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Steps -->
      <rect x="${-10 * s}" y="${6 * s}" width="${20 * s}" height="${4 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <rect x="${-8 * s}" y="${2 * s}" width="${16 * s}" height="${4 * s}" fill="${lightenColor(color, 0.05)}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <rect x="${-6 * s}" y="${-2 * s}" width="${12 * s}" height="${4 * s}" fill="${lightenColor(color, 0.1)}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
      <rect x="${-4 * s}" y="${-6 * s}" width="${8 * s}" height="${4 * s}" fill="${lightenColor(color, 0.15)}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" />
    </g>
  `;
}

function generatePathMarkerSVG(opts: LandmarkSVGOptions): string {
  const { x, y, size = 1, rotation = 0, color = '#d6d3d1' } = opts;
  const s = size;
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Footprints -->
      <ellipse cx="${-3 * s}" cy="${-4 * s}" rx="${3 * s}" ry="${5 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" transform="rotate(-15 ${-3 * s} ${-4 * s})" />
      <ellipse cx="${3 * s}" cy="${4 * s}" rx="${3 * s}" ry="${5 * s}" fill="${color}" stroke="${darkenColor(color)}" stroke-width="${0.5 * s}" transform="rotate(15 ${3 * s} ${4 * s})" />
      <!-- Toes -->
      <circle cx="${-5 * s}" cy="${-9 * s}" r="${1 * s}" fill="${color}" />
      <circle cx="${-3 * s}" cy="${-10 * s}" r="${1 * s}" fill="${color}" />
      <circle cx="${-1 * s}" cy="${-9.5 * s}" r="${1 * s}" fill="${color}" />
      <circle cx="${1 * s}" cy="${-0.5 * s}" r="${1 * s}" fill="${color}" />
      <circle cx="${3 * s}" cy="${-1 * s}" r="${1 * s}" fill="${color}" />
      <circle cx="${5 * s}" cy="${-0.5 * s}" r="${1 * s}" fill="${color}" />
    </g>
  `;
}

// ============ MAIN GENERATOR ============

const generators: Record<LandmarkType, (opts: LandmarkSVGOptions) => string> = {
  // Amenities
  parking: generateParkingSVG,
  restroom: generateRestroomSVG,
  bench: generateBenchSVG,
  picnicTable: generatePicnicTableSVG,
  trashCan: generateTrashCanSVG,
  waterFountain: generateWaterFountainSVG,
  // Nature
  tree: generateTreeSVG,
  treeGroup: generateTreeGroupSVG,
  bush: generateBushSVG,
  flower: generateFlowerSVG,
  rock: generateRockSVG,
  stump: generateStumpSVG,
  // Signage
  infoSign: generateInfoSignSVG,
  holeSign: generateHoleSignSVG,
  directionSign: generateDirectionSignSVG,
  warningSign: generateWarningSignSVG,
  // Hazards
  fence: generateFenceSVG,
  post: generatePostSVG,
  electricBox: generateElectricBoxSVG,
  // Structures
  shelter: generateShelterSVG,
  bridge: generateBridgeSVG,
  stairs: generateStairsSVG,
  path: generatePathMarkerSVG,
};

export function generateLandmarkSVG(
  landmarkType: LandmarkType,
  x: number,
  y: number,
  options?: { size?: number; rotation?: number; color?: string }
): string {
  const def = LANDMARK_DEFINITIONS[landmarkType];
  const generator = generators[landmarkType];

  if (!generator) {
    console.warn(`No SVG generator for landmark type: ${landmarkType}`);
    return '';
  }

  return generator({
    x,
    y,
    size: options?.size ?? 1,
    rotation: options?.rotation ?? 0,
    color: options?.color ?? def.defaultColor,
  });
}
