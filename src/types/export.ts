export type ExportFormat = 'svg' | 'png' | 'pdf';

export interface ExportConfig {
  format: ExportFormat;
  width: number;
  height: number;
  dpi?: number;
  includeLegend: boolean;
  includeTitle: boolean;
  includeHoleNumbers: boolean;
  includeDistances: boolean;
  holes: 'all' | 'current' | number[];
  // Terrain export options
  includeTerrain: boolean;
  includeCompass: boolean;
  includeScaleBar: boolean;
  includeInfrastructure: boolean;
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'svg',
  width: 1920,
  height: 1080,
  dpi: 96,
  includeLegend: true,
  includeTitle: true,
  includeHoleNumbers: true,
  includeDistances: true,
  holes: 'all',
  // Terrain defaults
  includeTerrain: true,
  includeCompass: true,
  includeScaleBar: true,
  includeInfrastructure: true,
};
