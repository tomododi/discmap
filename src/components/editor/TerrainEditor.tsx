import { useTranslation } from 'react-i18next';
import { Trees, Waves, Mountain, Footprints, MapPin, Info } from 'lucide-react';
import { useCourseStore, useEditorStore } from '../../stores';
import { TERRAIN_PATTERNS, getTerrainByCategory } from '../../types/terrain';
import type { TerrainType, TerrainPattern } from '../../types/terrain';
import { getTerrainName } from '../../utils/i18nHelpers';

const categoryIcons: Record<TerrainPattern['category'], React.ReactNode> = {
  ground: <Mountain size={14} />,
  vegetation: <Trees size={14} />,
  water: <Waves size={14} />,
  surface: <Footprints size={14} />,
};

// Category labels use t('terrain.categories.{category}')

// Main terrain options for default background
const defaultTerrainOptions: TerrainType[] = ['grass', 'roughGrass', 'forest', 'sand'];

export function TerrainEditor() {
  const { t } = useTranslation();
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const updateCourseStyle = useCourseStore((s) => s.updateCourseStyle);

  if (!course || !activeCourseId) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        {t('editor.noCourse')}
      </div>
    );
  }

  const currentDefaultTerrain = course.style.defaultTerrain ?? 'grass';

  const handleDefaultTerrainChange = (terrainType: TerrainType) => {
    updateCourseStyle(activeCourseId, { defaultTerrain: terrainType });
  };

  return (
    <div className="space-y-4">
      {/* Default Terrain Selection */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-800">
            {t('terrain.defaultTerrain', 'Default Background')}
          </h3>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {t('terrain.defaultTerrainHint', 'This terrain will fill the entire map background when exporting.')}
        </p>

        <div className="space-y-2">
          {defaultTerrainOptions.map((terrainType) => {
            const pattern = TERRAIN_PATTERNS[terrainType];
            const isActive = currentDefaultTerrain === terrainType;

            return (
              <button
                key={terrainType}
                onClick={() => handleDefaultTerrainChange(terrainType)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all
                  ${isActive
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: pattern.defaultColors.primary }}
                />
                <div className="font-medium text-gray-900">{getTerrainName(t, terrainType)}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Available Terrains for Drawing */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Trees size={16} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-800">
            {t('terrain.availableTerrains', 'Drawable Terrains')}
          </h3>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {t('terrain.drawHint', 'Select a terrain from the toolbar, then draw polygons on the map. These will appear on top of the default background.')}
        </p>

        {(['vegetation', 'water', 'ground', 'surface'] as const).map((category) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500">{categoryIcons[category]}</span>
              <span className="text-sm font-medium text-gray-700">{t(`terrain.categories.${category}`)}</span>
            </div>

            <div className="space-y-1">
              {getTerrainByCategory(category).map((terrainType) => {
                const pattern = TERRAIN_PATTERNS[terrainType];

                return (
                  <div
                    key={terrainType}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700"
                  >
                    <div
                      className="w-5 h-5 rounded flex-shrink-0"
                      style={{ backgroundColor: pattern.defaultColors.primary }}
                    />
                    <span>{getTerrainName(t, terrainType)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Info Box */}
      <section className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium text-blue-800 mb-1">
              {t('terrain.layeringTitle', 'How terrain layering works:')}
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>{t('terrain.layer1', 'Default terrain fills the entire background')}</li>
              <li>{t('terrain.layer2', 'Drawn terrain polygons appear on top')}</li>
              <li>{t('terrain.layer3', 'Game features (tees, baskets, etc.) are on top')}</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
