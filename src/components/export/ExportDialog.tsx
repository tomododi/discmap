import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, FileImage, Loader2 } from 'lucide-react';
import { useCourseStore, useEditorStore } from '../../stores';
import { generateCourseSVG, downloadSVG } from '../../utils/svgExport';
import { TERRAIN_PATTERNS } from '../../types/terrain';
import type { TerrainType } from '../../types/terrain';
import { Button } from '../common/Button';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SizePreset = 'a4-landscape' | 'a4-portrait' | 'hd' | 'square';

const sizePresets: Record<SizePreset, { width: number; height: number; label: string }> = {
  'a4-landscape': { width: 1123, height: 794, label: 'A4' },
  'a4-portrait': { width: 794, height: 1123, label: 'A4 Portrait' },
  'hd': { width: 1920, height: 1080, label: 'HD 1920×1080' },
  'square': { width: 1200, height: 1200, label: 'Square' },
};

const terrainOptions: { id: TerrainType; label: string; color: string }[] = [
  { id: 'grass', label: 'Grass', color: TERRAIN_PATTERNS.grass.defaultColors.primary },
  { id: 'forest', label: 'Forest', color: TERRAIN_PATTERNS.forest.defaultColors.primary },
  { id: 'sand', label: 'Sand', color: TERRAIN_PATTERNS.sand.defaultColors.primary },
  { id: 'roughGrass', label: 'Rough', color: TERRAIN_PATTERNS.roughGrass.defaultColors.primary },
];

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { t } = useTranslation();
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const updateCourseStyle = useCourseStore((s) => s.updateCourseStyle);

  const [sizePreset, setSizePreset] = useState<SizePreset>('a4-landscape');
  const [isExporting, setIsExporting] = useState(false);

  const selectedTerrain = course?.style.defaultTerrain ?? 'grass';

  const handleTerrainChange = (terrain: TerrainType) => {
    if (activeCourseId) {
      updateCourseStyle(activeCourseId, { defaultTerrain: terrain });
    }
  };

  const handleExport = async () => {
    if (!course) return;

    setIsExporting(true);
    try {
      const { width, height } = sizePresets[sizePreset];
      const courseName = course.name.replace(/\s+/g, '_');

      const svg = generateCourseSVG({
        course,
        width,
        height,
        format: 'svg',
        dpi: 96,
        includeLegend: true,
        includeTitle: true,
        includeHoleNumbers: true,
        includeDistances: true,
        holes: 'all',
        includeTerrain: true,
        includeCompass: true,
        includeScaleBar: true,
        includeInfrastructure: true,
      });
      downloadSVG(svg, `${courseName}_map.svg`);
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-[400px] z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileImage size={24} className="text-blue-600" />
              {t('export.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* Default Terrain */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('export.defaultTerrain', 'Default Terrain')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {terrainOptions.map((terrain) => (
                <button
                  key={terrain.id}
                  onClick={() => handleTerrainChange(terrain.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    selectedTerrain === terrain.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: terrain.color }}
                  />
                  <span className="text-xs font-medium text-gray-700">{terrain.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('export.defaultTerrainHint', 'This terrain will fill the entire map background')}
            </p>
          </section>

          {/* Size */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('export.size')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(sizePresets) as SizePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSizePreset(preset)}
                  className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                    sizePreset === preset
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sizePresets[preset].label}
                </button>
              ))}
            </div>
          </section>

          {/* Export Button */}
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <Button variant="secondary" className="flex-1">
                {t('export.cancel')}
              </Button>
            </Dialog.Close>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t('export.exporting', 'Exporting...')}
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  {t('export.download')}
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
