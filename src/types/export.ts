export type ExportFormat = 'svg' | 'png' | 'pdf';

export interface ExportConfig {
  format: ExportFormat;
  width: number;
  height: number;
  dpi?: number;
  includeBackground: boolean;
  backgroundOpacity: number;
  includeLegend: boolean;
  includeTitle: boolean;
  includeHoleNumbers: boolean;
  includeDistances: boolean;
  holes: 'all' | 'current' | number[];
  printColors?: boolean;
  strokeScaleFactor?: number;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'svg',
  width: 1920,
  height: 1080,
  dpi: 300,
  includeBackground: true,
  backgroundOpacity: 0.8,
  includeLegend: true,
  includeTitle: true,
  includeHoleNumbers: true,
  includeDistances: true,
  holes: 'all',
  printColors: false,
  strokeScaleFactor: 1,
};
