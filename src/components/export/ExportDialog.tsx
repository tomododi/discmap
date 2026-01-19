import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, FileImage, Loader2, FileArchive, Map, Upload, Trash2 } from 'lucide-react';
import { useCourseStore, useEditorStore, useSettingsStore } from '../../stores';
import { generateCourseSVG, downloadSVG, generateTeeSignsZip, downloadZip } from '../../utils/svgExport';
import { TERRAIN_PATTERNS } from '../../types/terrain';
import type { TerrainType } from '../../types/terrain';
import { Button } from '../common/Button';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SizePreset = 'a4-landscape' | 'a4-portrait' | 'hd' | 'square';
type ExportType = 'course' | 'teeSigns';

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
  const units = useSettingsStore((s) => s.units);

  const [exportType, setExportType] = useState<ExportType>('course');
  const [sizePreset, setSizePreset] = useState<SizePreset>('a4-landscape');
  const [isExporting, setIsExporting] = useState(false);

  // Tee sign options
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeRules, setIncludeRules] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [includeCourseName, setIncludeCourseName] = useState(true);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setLogoDataUrl(undefined);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

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
      const courseName = course.name.replace(/\s+/g, '_');

      if (exportType === 'teeSigns') {
        // Generate tee signs ZIP
        const blob = await generateTeeSignsZip(course, {
          course,
          units,
          includeNotes,
          includeRules,
          includeLegend,
          includeCourseName,
          logoDataUrl,
        });
        await downloadZip(blob, `${courseName}_teesigns.zip`);
      } else {
        // Generate course map SVG
        const { width, height } = sizePresets[sizePreset];
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
      }
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  if (!course) return null;

  const hasHoles = course.holes.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-[420px] max-h-[90vh] overflow-y-auto z-50">
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

          {/* Export Type Selector */}
          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('export.exportType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportType('course')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  exportType === 'course'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Map size={18} />
                <span className="font-medium">{t('export.fullCourse')}</span>
              </button>
              <button
                onClick={() => setExportType('teeSigns')}
                disabled={!hasHoles}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  exportType === 'teeSigns'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                } ${!hasHoles ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileArchive size={18} />
                <span className="font-medium">{t('export.teeSigns', 'Tee Signs')}</span>
              </button>
            </div>
            {exportType === 'teeSigns' && (
              <p className="text-xs text-gray-500 mt-2">
                {t('export.teeSignsHint', 'Generate individual tee signs for each hole as a ZIP file')}
              </p>
            )}
          </section>

          {/* Default Terrain (shown for both export types) */}
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

          {/* Size (only for course export) */}
          {exportType === 'course' && (
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
          )}

          {/* Tee Sign Options */}
          {exportType === 'teeSigns' && (
            <>
            <section className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('export.options')}
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCourseName}
                    onChange={(e) => setIncludeCourseName(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t('export.includeCourseName', 'Include course name')}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t('export.includeNotes', 'Include hole notes')}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRules}
                    onChange={(e) => setIncludeRules(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t('export.includeRules', 'Include local rules')}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLegend}
                    onChange={(e) => setIncludeLegend(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t('export.includeLegend')}
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {t('export.teeSignFormat', 'Each tee sign is A4 portrait format (794×1123px)')}
              </p>
            </section>

            {/* Logo Upload Section */}
            <section className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('export.clubLogo', 'Club Logo')}
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              {logoDataUrl ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={logoDataUrl}
                    alt="Club logo"
                    className="h-12 w-auto max-w-[120px] object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {t('export.logoSelected', 'Logo selected')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('export.logoHint', 'Will appear at the bottom of the sidebar')}
                    </p>
                  </div>
                  <button
                    onClick={handleLogoRemove}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title={t('export.removeLogo', 'Remove logo')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                >
                  <Upload size={18} />
                  <span className="text-sm font-medium">
                    {t('export.uploadLogo', 'Upload club logo')}
                  </span>
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {t('export.logoOptional', 'Optional - PNG or JPG recommended')}
              </p>
            </section>
            </>
          )}

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
              disabled={isExporting || !hasHoles}
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {exportType === 'teeSigns'
                    ? t('export.creatingZip', 'Creating ZIP...')
                    : t('export.exporting', 'Exporting...')}
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  {exportType === 'teeSigns'
                    ? t('export.downloadZip', 'Download ZIP')
                    : t('export.download')}
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
