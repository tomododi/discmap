import { useTranslation } from 'react-i18next';
import { TreeDeciduous } from 'lucide-react';
import { RotationKnob } from '../../common/RotationKnob';
import type { TreeFeature } from '../../../types/course';
import { TREE_PATTERNS, type TreeType } from '../../../types/trees';
import { getTreeName } from '../../../utils/i18nHelpers';
import type { FeaturePropertyProps } from './types';

export function TreeProperties({ feature, onUpdate }: FeaturePropertyProps<TreeFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Current tree type display */}
      <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: TREE_PATTERNS[feature.properties.treeType]?.defaultColors.primary || '#228b22',
          }}
        >
          <TreeDeciduous size={20} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-green-600 font-medium">{t('tree.types', 'Tree Type')}</div>
          <div className="text-lg font-bold text-green-700">
            {getTreeName(t, feature.properties.treeType)}
          </div>
        </div>
      </div>

      {/* Tree type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {t('tree.changeType', 'Change Tree Type')}
        </label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(TREE_PATTERNS) as TreeType[]).map((treeType) => {
            const pattern = TREE_PATTERNS[treeType];
            const isActive = feature.properties.treeType === treeType;
            return (
              <button
                key={treeType}
                onClick={() => onUpdate({ treeType, label: getTreeName(t, treeType) })}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
                  ${isActive ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pattern.defaultColors.primary }}
                />
                <span className="text-xs truncate">{getTreeName(t, treeType)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size slider */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('tree.size', 'Size')} ({(feature.properties.size ?? 1).toFixed(1)}x)
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={feature.properties.size ?? 1}
          onChange={(e) => onUpdate({ size: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.5x</span>
          <span>1x</span>
          <span>2x</span>
        </div>
      </div>

      {/* Rotation control */}
      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {t('tree.rotation', 'Rotation')}
        </label>
        <div className="flex justify-center">
          <RotationKnob
            value={feature.properties.rotation ?? 0}
            onChange={(rotation) => onUpdate({ rotation })}
            color={TREE_PATTERNS[feature.properties.treeType]?.defaultColors.primary || '#228b22'}
            size={80}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">{t('tree.scrollToRotate', 'Scroll on tree to rotate')}</p>
      </div>

      {/* Opacity slider */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('style.obOpacity', 'Opacity')} ({Math.round((feature.properties.opacity ?? 1) * 100)}%)
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={feature.properties.opacity ?? 1}
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Custom colors */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          {t('tree.customColors', 'Custom Colors')}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-16">{t('tree.primary', 'Primary')}</span>
          <input
            type="color"
            value={feature.properties.customColors?.primary ||
              TREE_PATTERNS[feature.properties.treeType]?.defaultColors.primary || '#228b22'}
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
          <span className="text-xs text-gray-600 w-16">{t('tree.secondary', 'Shadow')}</span>
          <input
            type="color"
            value={feature.properties.customColors?.secondary ||
              TREE_PATTERNS[feature.properties.treeType]?.defaultColors.secondary || '#1a6b1a'}
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-16">{t('tree.accent', 'Accent')}</span>
          <input
            type="color"
            value={feature.properties.customColors?.accent ||
              TREE_PATTERNS[feature.properties.treeType]?.defaultColors.accent || '#32cd32'}
            onChange={(e) => onUpdate({
              customColors: {
                ...feature.properties.customColors,
                accent: e.target.value
              }
            })}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
          <button
            onClick={() => onUpdate({
              customColors: {
                ...feature.properties.customColors,
                accent: undefined
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
