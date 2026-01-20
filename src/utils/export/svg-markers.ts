import type { CourseStyle } from '../../types/course';

export function darkenColor(hex: string): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - 40);
  const b = Math.max(0, (num & 0x0000ff) - 40);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export function getTextColor(hex: string): string {
  const num = parseInt(hex.slice(1), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

export function generateTeeSVG(
  x: number,
  y: number,
  color: string,
  holeNumber: number | undefined,
  teeName: string | undefined,
  scale: number = 1,
  rotation: number = 0
): string {
  const bgColor = color;
  const borderColor = darkenColor(bgColor);
  const textColor = getTextColor(bgColor);

  const w = 32 * scale;
  const h = 20 * scale;
  const rx = 3 * scale;

  const displayText = holeNumber ?? teeName ?? '';

  // The tee pad shape rotates, but the text stays upright
  return `
    <g transform="translate(${x}, ${y})">
      <!-- Rotated tee pad shape -->
      <g transform="rotate(${rotation})">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${2 * scale}" />
        <rect x="${-w / 2 + 4 * scale}" y="${-h / 2 + 4 * scale}" width="${24 * scale}" height="${12 * scale}" rx="${2 * scale}" fill="${borderColor}" opacity="0.2" />
        <!-- Direction arrow -->
        <polygon points="${w / 2 - 6 * scale},0 ${w / 2 - 10 * scale},${-3 * scale} ${w / 2 - 10 * scale},${3 * scale}" fill="${textColor}" opacity="0.6" />
      </g>
      <!-- Text stays upright -->
      ${displayText ? `<text x="0" y="${4 * scale}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${12 * scale}" fill="${textColor}">${displayText}</text>` : ''}
    </g>
  `;
}

export function generateBasketSVG(
  x: number,
  y: number,
  style: CourseStyle,
  scale: number = 1,
  rotation: number = 0
): string {
  const topColor = style.basketTopColor;
  const bodyColor = style.basketBodyColor;
  const chainColor = style.basketChainColor;
  const poleColor = style.basketPoleColor;
  const topBorder = darkenColor(topColor);
  const bodyBorder = darkenColor(bodyColor);

  // Basket is drawn centered at origin, then translated to position
  // rotation is applied around the basket's center
  const s = scale;
  const basketWidth = 32 * s;
  const basketHeight = 44 * s;
  const cx = basketWidth / 2;  // center x of basket
  const cy = basketHeight / 2; // center y of basket

  return `
    <g transform="translate(${x}, ${y})">
      <g transform="rotate(${rotation})">
        <g transform="translate(${-cx}, ${-cy})">
          <!-- Pole -->
          <rect x="${15 * s}" y="${28 * s}" width="${2 * s}" height="${14 * s}" fill="${poleColor}" />
          <!-- Base -->
          <ellipse cx="${16 * s}" cy="${42 * s}" rx="${6 * s}" ry="${2 * s}" fill="${poleColor}" />
          <!-- Basket body -->
          <path d="M${6 * s} ${18 * s} L${26 * s} ${18 * s} L${24 * s} ${28 * s} L${8 * s} ${28 * s} Z" fill="${bodyColor}" stroke="${bodyBorder}" stroke-width="${1.5 * s}" />
          <!-- Chains -->
          <path d="M${8 * s} ${10 * s} L${8 * s} ${18 * s} M${12 * s} ${8 * s} L${12 * s} ${18 * s} M${16 * s} ${6 * s} L${16 * s} ${18 * s} M${20 * s} ${8 * s} L${20 * s} ${18 * s} M${24 * s} ${10 * s} L${24 * s} ${18 * s}" stroke="${chainColor}" stroke-width="${1.5 * s}" stroke-linecap="round" />
          <!-- Top band -->
          <ellipse cx="${16 * s}" cy="${6 * s}" rx="${10 * s}" ry="${3 * s}" fill="${topColor}" stroke="${topBorder}" stroke-width="${1.5 * s}" />
          <!-- Inner ring -->
          <ellipse cx="${16 * s}" cy="${18 * s}" rx="${8 * s}" ry="${2 * s}" fill="none" stroke="${bodyBorder}" stroke-width="${s}" />
        </g>
      </g>
    </g>
  `;
}

export function generateDropzoneSVG(
  x: number,
  y: number,
  color: string,
  scale: number = 1,
  rotation: number = 0,
  showLabel: boolean = true
): string {
  const borderColor = darkenColor(color);
  const textColor = getTextColor(color);

  const w = 32 * scale;
  const h = 20 * scale;
  const rx = 4 * scale;

  // The dropzone shape rotates, but the text stays upright
  return `
    <g transform="translate(${x}, ${y})">
      <!-- Rotated dropzone shape -->
      <g transform="rotate(${rotation})">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" fill="${color}" stroke="${borderColor}" stroke-width="${2 * scale}" />
        <rect x="${-w / 2 + 4 * scale}" y="${-h / 2 + 4 * scale}" width="${24 * scale}" height="${12 * scale}" rx="${2 * scale}" fill="none" stroke="${borderColor}" stroke-width="${scale}" opacity="0.4" />
        <!-- Direction arrow -->
        <polygon points="${w / 2 - 6 * scale},0 ${w / 2 - 10 * scale},${-3 * scale} ${w / 2 - 10 * scale},${3 * scale}" fill="${textColor}" opacity="0.6" />
      </g>
      ${showLabel ? `<!-- Text stays upright -->
      <text x="0" y="${4 * scale}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${10 * scale}" fill="${textColor}">DZ</text>` : ''}
    </g>
  `;
}

export function generateMandatorySVG(
  x: number,
  y: number,
  rotation: number,
  color: string,
  scale: number = 1,
  lineAngle: number = 270,
  lineColor: string = '#dc2626'
): string {
  const borderColor = darkenColor(color);
  const s = scale;

  // Canvas size matching React component
  const cx = 32 * s;
  const cy = 32 * s;

  // Boundary line length with arrowhead
  const boundaryLineLength = 24 * s;
  const arrowheadSize = 6 * s;

  // Calculate boundary line end point and arrowhead
  // lineAngle is used directly (no offset) - 0=right, 90=down, 180=left, 270=up
  const lineRad = (lineAngle * Math.PI) / 180;
  const lineEndX = cx + Math.cos(lineRad) * boundaryLineLength;
  const lineEndY = cy + Math.sin(lineRad) * boundaryLineLength;

  // Arrowhead points
  const arrowAngle1 = lineRad + Math.PI * 0.8;
  const arrowAngle2 = lineRad - Math.PI * 0.8;
  const arrow1X = lineEndX + Math.cos(arrowAngle1) * arrowheadSize;
  const arrow1Y = lineEndY + Math.sin(arrowAngle1) * arrowheadSize;
  const arrow2X = lineEndX + Math.cos(arrowAngle2) * arrowheadSize;
  const arrow2Y = lineEndY + Math.sin(arrowAngle2) * arrowheadSize;

  // Direction arrow path (centered, pointing right at 0 degrees)
  const arrowPath = `
    M${cx - 10 * s} ${cy - 2 * s}
    L${cx + 2 * s} ${cy - 2 * s}
    L${cx + 2 * s} ${cy - 6 * s}
    L${cx + 12 * s} ${cy}
    L${cx + 2 * s} ${cy + 6 * s}
    L${cx + 2 * s} ${cy + 2 * s}
    L${cx - 10 * s} ${cy + 2 * s}
    Z
  `;

  return `
    <g transform="translate(${x - cx}, ${y - cy})">
      <!-- Boundary line with arrowhead -->
      <line x1="${cx}" y1="${cy}" x2="${lineEndX.toFixed(2)}" y2="${lineEndY.toFixed(2)}" stroke="${lineColor}" stroke-width="${2.5 * s}" stroke-linecap="round" />
      <path d="M${lineEndX.toFixed(2)},${lineEndY.toFixed(2)} L${arrow1X.toFixed(2)},${arrow1Y.toFixed(2)} L${arrow2X.toFixed(2)},${arrow2Y.toFixed(2)} Z" fill="${lineColor}" />
      <!-- Direction arrow -->
      <g transform="rotate(${rotation} ${cx} ${cy})">
        <path d="${arrowPath}" fill="${color}" stroke="${borderColor}" stroke-width="${1.5 * s}" stroke-linejoin="round" />
      </g>
    </g>
  `;
}

export function generateAnnotationSVG(
  x: number,
  y: number,
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
  textColor: string,
  backgroundColor: string,
  borderColor: string,
  scale: number = 1
): string {
  const scaledFontSize = fontSize * scale;
  const padding = 8 * scale;
  // Approximate text width (rough estimate)
  const textWidth = text.length * scaledFontSize * 0.6;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = scaledFontSize + padding * 2;

  return `
    <g transform="translate(${x - boxWidth / 2}, ${y - boxHeight / 2})">
      <rect width="${boxWidth}" height="${boxHeight}" rx="${4 * scale}" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="${scale}" />
      <text x="${boxWidth / 2}" y="${boxHeight / 2 + scaledFontSize / 3}" text-anchor="middle" font-family="${fontFamily}" font-weight="${fontWeight}" font-size="${scaledFontSize}" fill="${textColor}">${text}</text>
    </g>
  `;
}
