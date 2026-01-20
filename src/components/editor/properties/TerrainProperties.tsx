import { useTranslation } from 'react-i18next';
import { Trees } from 'lucide-react';
import type { TerrainFeature } from '../../../types/course';
import { TERRAIN_PATTERNS, type TerrainType } from '../../../types/terrain';
import { getTerrainName } from '../../../utils/i18nHelpers';
import type { FeaturePropertyProps } from './types';

export function TerrainProperties({ feature, onUpdate }: FeaturePropertyProps<TerrainFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Current terrain type display */}
      <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: TERRAIN_PATTERNS[feature.properties.terrainType]?.defaultColors.primary || '#22c55e',
          }}
        >
          <Trees size={20} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-emerald-600 font-medium">{t('terrain.types', 'Terrain Type')}</div>
          <div className="text-lg font-bold text-emerald-700">
            {getTerrainName(t, feature.properties.terrainType)}
          </div>
        </div>
      </div>

      {/* Terrain type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {t('terrain.types', 'Change Terrain Type')}
        </label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(TERRAIN_PATTERNS) as TerrainType[]).map((terrainType) => {
            const pattern = TERRAIN_PATTERNS[terrainType];
            const isActive = feature.properties.terrainType === terrainType;
            return (
              <button
                key={terrainType}
                onClick={() => onUpdate({ terrainType, label: getTerrainName(t, terrainType) })}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
                  ${isActive ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500' : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                <div
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: pattern.defaultColors.primary }}
                />
                <span className="text-xs truncate">{getTerrainName(t, terrainType)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opacity slider */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('style.obOpacity', 'Opacity')} ({Math.round((feature.properties.opacity ?? 0.9) * 100)}%)
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={feature.properties.opacity ?? 0.9}
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Vertex info */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
        <p className="font-medium text-gray-700">{(feature.geometry.coordinates[0]?.length ?? 0) - 1} {t('terrain.vertices', 'vertices')}</p>
        <p className="mt-1">{t('terrain.editHint', 'Drag vertices to reshape. Click + to add. Double-click to remove.')}</p>
      </div>

      {/* Custom colors */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          {t('terrain.customColors')}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-16">{t('terrain.fill')}</span>
          <input
            type="color"
            value={feature.properties.customColors?.primary ||
              TERRAIN_PATTERNS[feature.properties.terrainType]?.defaultColors.primary || '#22c55e'}
            onChange={(e) => onUpdate({
              customColors: {
                ...feature.properties.customColors,
                primary: e.target.value
              }
            })}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
          <button
            onClick={() => onUpdate({
              customColors: {
                ...feature.properties.customColors,
                primary: undefined
              }
            })}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {t('actions.reset')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-16">{t('terrain.border')}</span>
          <input
            type="color"
            value={feature.properties.customColors?.secondary ||
              TERRAIN_PATTERNS[feature.properties.terrainType]?.defaultColors.secondary || '#16a34a'}
            onChange={(e) => onUpdate({
              customColors: {
                ...feature.properties.customColors,
                secondary: e.target.value
              }
            })}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
          <button
            onClick={() => onUpdate({
              customColors: {
                ...feature.properties.customColors,
                secondary: undefined
              }
            })}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {t('actions.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
