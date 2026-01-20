import type { Course, Hole, TeeProperties, FlightLineProperties, DropzoneProperties, OBLineProperties, DropzoneAreaProperties } from '../../../types/course';
import type { ExportConfig } from '../../../types/export';
import { calculateBounds, geoToSVG, polygonCoordsToSVG, lineStringToSVG } from '../coordinate-transform';
import type { SVGViewport } from '../coordinate-transform';
import { generateTeeSVG, generateBasketSVG, generateDropzoneSVG, generateMandatorySVG, generateAnnotationSVG } from '../svg-markers';
import { generateLegendSVG } from '../svg-legend';

export interface PrintLayoutOptions extends ExportConfig {
  course: Course;
  units: 'meters' | 'feet';
}

export function generatePrintLayoutSVG(options: PrintLayoutOptions): string {
  const { course, width, height, includeLegend } = options;
  const style = course.style;

  // Layout dimensions
  const headerHeight = 60;
  const footerHeight = 120;
  const mapPadding = 20;
  const mapWidth = width - 2 * mapPadding;
  const mapHeight = height - headerHeight - footerHeight - 2 * mapPadding;

  // Get all features
  const allFeatures = course.holes.flatMap((h) => h.features);
  const bounds = calculateBounds(allFeatures);

  if (!bounds) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="50%" y="50%" text-anchor="middle">No features to export</text></svg>`;
  }

  // Add padding to bounds
  const lngPadding = (bounds.maxLng - bounds.minLng) * 0.1;
  const latPadding = (bounds.maxLat - bounds.minLat) * 0.1;
  bounds.minLng -= lngPadding;
  bounds.maxLng += lngPadding;
  bounds.minLat -= latPadding;
  bounds.maxLat += latPadding;

  const mapViewport: SVGViewport = {
    width: mapWidth,
    height: mapHeight,
    padding: 20,
    bounds,
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="white" />`;

  // Header
  svg += `
    <rect x="0" y="0" width="${width}" height="${headerHeight}" fill="#1f2937" />
    <text x="${width / 2}" y="${headerHeight / 2 + 8}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="white">${course.name}</text>
  `;

  if (course.location.name) {
    svg += `<text x="${width / 2}" y="${headerHeight / 2 + 28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">${course.location.name}</text>`;
  }

  // Map area with border
  svg += `
    <g transform="translate(${mapPadding}, ${headerHeight + mapPadding})">
      <rect width="${mapWidth}" height="${mapHeight}" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" rx="4" />
  `;

  // Render features in map area
  const fairways = allFeatures.filter((f) => f.properties.type === 'fairway');
  fairways.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const points = polygonCoordsToSVG(coords, mapViewport);
    svg += `<polygon points="${points}" fill="${style.fairwayColor}" fill-opacity="${style.fairwayOpacity}" />`;
  });

  // Dropzone Areas
  const dropzoneAreas = allFeatures.filter((f) => f.properties.type === 'dropzoneArea');
  dropzoneAreas.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const props = f.properties as DropzoneAreaProperties;
    const fairwayInside = props.fairwayInside ?? true;
    const pathD = lineStringToSVG(coords, mapViewport) + ' Z';
    const greenOffset = fairwayInside ? -4 : 4;
    const redOffset = fairwayInside ? 4 : -4;
    svg += `<path d="${pathD}" fill="none" stroke="#22c55e" stroke-width="8" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" />`;
    svg += `<path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="8" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" />`;
    svg += `<path d="${pathD}" fill="none" stroke="${style.dropzoneAreaBorderColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  // OB Lines
  const obLines = allFeatures.filter((f) => f.properties.type === 'obLine');
  obLines.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][] }).coordinates;
    const props = f.properties as OBLineProperties;
    const path = lineStringToSVG(coords, mapViewport);
    const fairwaySide = props.fairwaySide || 'left';
    const greenOffset = fairwaySide === 'left' ? -4 : 4;
    const redOffset = fairwaySide === 'left' ? 4 : -4;
    svg += `<path d="${path}" fill="none" stroke="#22c55e" stroke-width="8" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" stroke-linecap="round" />`;
    svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="8" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" stroke-linecap="round" />`;
    svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  });

  const obZones = allFeatures.filter((f) => f.properties.type === 'obZone');
  obZones.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
    const points = polygonCoordsToSVG(coords, mapViewport);
    svg += `<polygon points="${points}" fill="${style.obZoneColor}" fill-opacity="${style.obZoneOpacity}" stroke="${style.obZoneColor}" stroke-width="2" stroke-dasharray="8 4" />`;
  });

  const flightLines = allFeatures.filter((f) => f.properties.type === 'flightLine');
  flightLines.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[][] }).coordinates;
    const path = lineStringToSVG(coords, mapViewport);
    const props = f.properties as FlightLineProperties;
    const lineColor = props.color || style.defaultFlightLineColor;
    svg += `<path d="${path}" fill="none" stroke="${lineColor}" stroke-width="${style.flightLineWidth}" stroke-dasharray="8 4" stroke-linecap="round" />`;
  });

  const dropzones = allFeatures.filter((f) => f.properties.type === 'dropzone');
  dropzones.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as DropzoneProperties;
    const dzColor = props.color || style.dropzoneColor;
    svg += generateDropzoneSVG(x, y, dzColor, 0.8, props.rotation ?? 0, false);
  });

  const mandatories = allFeatures.filter((f) => f.properties.type === 'mandatory');
  mandatories.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
    svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 0.8, props.lineAngle ?? 270);
  });

  // Annotations
  const annotations = allFeatures.filter((f) => f.properties.type === 'annotation');
  annotations.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as {
      text: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      textColor?: string;
      backgroundColor?: string;
      borderColor?: string;
    };
    svg += generateAnnotationSVG(
      x, y,
      props.text,
      (props.fontSize || style.annotationFontSize) * 0.8,
      props.fontFamily || 'sans-serif',
      props.fontWeight || 'normal',
      props.textColor || style.annotationTextColor,
      props.backgroundColor || style.annotationBackgroundColor,
      props.borderColor || '#e5e7eb',
      0.8
    );
  });

  const tees = allFeatures.filter((f) => f.properties.type === 'tee');
  tees.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    const props = f.properties as TeeProperties;
    const teeColor = props.color || style.defaultTeeColor;
    const holeId = f.properties.holeId;
    const holeNumber = course.holes.find((h) => h.id === holeId)?.number;
    svg += generateTeeSVG(x, y, teeColor, holeNumber, props.name, 0.8, props.rotation ?? 0);
  });

  const baskets = allFeatures.filter((f) => f.properties.type === 'basket');
  baskets.forEach((f) => {
    const coords = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const [x, y] = geoToSVG(coords, mapViewport);
    svg += generateBasketSVG(x, y, style, 0.8);
  });

  svg += '</g>'; // End map area

  // Footer with hole info table
  const footerY = height - footerHeight;
  svg += `<line x1="0" y1="${footerY}" x2="${width}" y2="${footerY}" stroke="#e2e8f0" stroke-width="1" />`;

  // Hole info table
  const tableStartX = mapPadding;
  const tableStartY = footerY + 20;
  const rowHeight = 20;

  // Table header
  svg += `
    <text x="${tableStartX}" y="${tableStartY}" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#374151">Hole</text>
    <text x="${tableStartX + 60}" y="${tableStartY}" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#374151">Par</text>
  `;

  // Table rows (max 9 holes per row, then wrap)
  const holesPerRow = 9;
  course.holes.forEach((hole, index) => {
    const row = Math.floor(index / holesPerRow);
    const col = index % holesPerRow;
    const x = tableStartX + col * 70;
    const y = tableStartY + (row + 1) * rowHeight;

    svg += `
      <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="9" fill="#374151">${hole.number}</text>
      <text x="${x + 25}" y="${y}" font-family="Arial, sans-serif" font-size="9" fill="#374151">${hole.par}</text>
    `;
  });

  // Legend (if enabled)
  if (includeLegend) {
    const legendX = width - 160;
    const legendY = footerY + 10;
    svg += generateLegendSVG(legendX, legendY, style, options, 0.8);
  }

  // Course totals
  const totalPar = course.holes.reduce((sum, h) => sum + h.par, 0);
  svg += `
    <text x="${width - 100}" y="${footerY + 100}" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#374151">Total Par: ${totalPar}</text>
    <text x="${width - 100}" y="${footerY + 115}" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">${course.holes.length} holes</text>
  `;

  svg += '</svg>';
  return svg;
}

export function generateHolePageSVG(
  hole: Hole,
  course: Course,
  options: PrintLayoutOptions
): string {
  const { width, height } = options;
  const style = course.style;

  const headerHeight = 80;
  const infoHeight = 100;
  const mapHeight = height - headerHeight - infoHeight - 40;

  const holeFeatures = hole.features;
  const bounds = calculateBounds(holeFeatures);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="white" />`;

  // Header
  svg += `
    <rect x="0" y="0" width="${width}" height="${headerHeight}" fill="#1f2937" />
    <text x="30" y="35" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="white">${course.name}</text>
    <text x="30" y="60" font-family="Arial, sans-serif" font-size="28" fill="#60a5fa">Hole ${hole.number}</text>
    <text x="${width - 30}" y="50" text-anchor="end" font-family="Arial, sans-serif" font-weight="bold" font-size="36" fill="white">Par ${hole.par}</text>
  `;

  if (hole.name) {
    svg += `<text x="120" y="60" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">- ${hole.name}</text>`;
  }

  // Map area
  if (bounds) {
    const lngPadding = (bounds.maxLng - bounds.minLng) * 0.15;
    const latPadding = (bounds.maxLat - bounds.minLat) * 0.15;
    bounds.minLng -= lngPadding;
    bounds.maxLng += lngPadding;
    bounds.minLat -= latPadding;
    bounds.maxLat += latPadding;

    const mapViewport: SVGViewport = {
      width: width - 60,
      height: mapHeight,
      padding: 30,
      bounds,
    };

    svg += `<g transform="translate(30, ${headerHeight + 20})">`;
    svg += `<rect width="${width - 60}" height="${mapHeight}" fill="#f8fafc" stroke="#e2e8f0" rx="8" />`;

    // Render hole features
    holeFeatures.filter((f) => f.properties.type === 'fairway').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      svg += `<polygon points="${polygonCoordsToSVG(coords, mapViewport)}" fill="${style.fairwayColor}" fill-opacity="${style.fairwayOpacity}" />`;
    });

    // Dropzone Areas
    holeFeatures.filter((f) => f.properties.type === 'dropzoneArea').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      const props = f.properties as DropzoneAreaProperties;
      const fairwayInside = props.fairwayInside ?? true;
      const pathD = lineStringToSVG(coords, mapViewport) + ' Z';
      const greenOffset = fairwayInside ? -5 : 5;
      const redOffset = fairwayInside ? 5 : -5;
      svg += `<path d="${pathD}" fill="none" stroke="#22c55e" stroke-width="10" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" />`;
      svg += `<path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="10" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" />`;
      svg += `<path d="${pathD}" fill="none" stroke="${style.dropzoneAreaBorderColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    });

    // OB Lines
    holeFeatures.filter((f) => f.properties.type === 'obLine').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][] }).coordinates;
      const props = f.properties as OBLineProperties;
      const path = lineStringToSVG(coords, mapViewport);
      const fairwaySide = props.fairwaySide || 'left';
      const greenOffset = fairwaySide === 'left' ? -5 : 5;
      const redOffset = fairwaySide === 'left' ? 5 : -5;
      svg += `<path d="${path}" fill="none" stroke="#22c55e" stroke-width="10" stroke-opacity="0.4" transform="translate(${greenOffset}, 0)" stroke-linecap="round" />`;
      svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="10" stroke-opacity="0.4" transform="translate(${redOffset}, 0)" stroke-linecap="round" />`;
      svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    });

    holeFeatures.filter((f) => f.properties.type === 'obZone').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][][] }).coordinates[0];
      svg += `<polygon points="${polygonCoordsToSVG(coords, mapViewport)}" fill="${style.obZoneColor}" fill-opacity="${style.obZoneOpacity}" stroke="${style.obZoneColor}" stroke-width="2" stroke-dasharray="8 4" />`;
    });

    holeFeatures.filter((f) => f.properties.type === 'flightLine').forEach((f) => {
      const coords = (f.geometry as { coordinates: number[][] }).coordinates;
      const props = f.properties as FlightLineProperties;
      const lineColor = props.color || style.defaultFlightLineColor;
      svg += `<path d="${lineStringToSVG(coords, mapViewport)}" fill="none" stroke="${lineColor}" stroke-width="${style.flightLineWidth * 1.5}" stroke-dasharray="12 6" stroke-linecap="round" />`;
    });

    holeFeatures.filter((f) => f.properties.type === 'dropzone').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as DropzoneProperties;
      const dzColor = props.color || style.dropzoneColor;
      svg += generateDropzoneSVG(x, y, dzColor, 1.2, props.rotation ?? 0, false);
    });

    holeFeatures.filter((f) => f.properties.type === 'mandatory').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as { rotation: number; lineAngle?: number; lineLength?: number };
      svg += generateMandatorySVG(x, y, props.rotation ?? 0, style.mandatoryColor, 1.2, props.lineAngle ?? 270);
    });

    // Annotations
    holeFeatures.filter((f) => f.properties.type === 'annotation').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as {
        text: string;
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: string;
        textColor?: string;
        backgroundColor?: string;
        borderColor?: string;
      };
      svg += generateAnnotationSVG(
        x, y,
        props.text,
        (props.fontSize || style.annotationFontSize) * 1.2,
        props.fontFamily || 'sans-serif',
        props.fontWeight || 'normal',
        props.textColor || style.annotationTextColor,
        props.backgroundColor || style.annotationBackgroundColor,
        props.borderColor || '#e5e7eb',
        1.2
      );
    });

    holeFeatures.filter((f) => f.properties.type === 'tee').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      const props = f.properties as TeeProperties;
      const teeColor = props.color || style.defaultTeeColor;
      svg += generateTeeSVG(x, y, teeColor, hole.number, props.name, 1.2, props.rotation ?? 0);
    });

    holeFeatures.filter((f) => f.properties.type === 'basket').forEach((f) => {
      const [x, y] = geoToSVG((f.geometry as { coordinates: number[] }).coordinates as [number, number], mapViewport);
      svg += generateBasketSVG(x, y, style, 1.2);
    });

    svg += '</g>';
  }

  // Info section
  const infoY = height - infoHeight;

  svg += `<line x1="0" y1="${infoY}" x2="${width}" y2="${infoY}" stroke="#e2e8f0" stroke-width="1" />`;

  // Notes
  if (hole.notes) {
    const boxY = infoY + 20;
    svg += `
      <text x="30" y="${boxY + 20}" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#374151">Notes:</text>
      <text x="30" y="${boxY + 40}" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">${hole.notes.substring(0, 100)}${hole.notes.length > 100 ? '...' : ''}</text>
    `;
  }

  svg += '</svg>';
  return svg;
}
