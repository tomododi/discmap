import { useTranslation } from 'react-i18next';
import { RotationKnob } from '../../common/RotationKnob';
import type { TreeFeature } from '../../../types/course';
import { TREE_PATTERNS, type TreeType, getTreeImagePath } from '../../../types/trees';
import { getTreeName } from '../../../utils/i18nHelpers';
import type { FeaturePropertyProps } from './types';

export function TreeProperties({ feature, onUpdate }: FeaturePropertyProps<TreeFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Current tree type display with image preview */}
      <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src={getTreeImagePath(feature.properties.treeType)}
            alt={getTreeName(t, feature.properties.treeType)}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div>
          <div className="text-xs text-green-600 font-medium">{t('tree.types', 'Tree Type')}</div>
          <div className="text-lg font-bold text-green-700">
            {getTreeName(t, feature.properties.treeType)}
          </div>
        </div>
      </div>

      {/* Tree type selector with image previews */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {t('tree.changeType', 'Change Tree Type')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TREE_PATTERNS) as TreeType[]).map((treeType) => {
            const isActive = feature.properties.treeType === treeType;
            return (
              <button
                key={treeType}
                onClick={() => onUpdate({ treeType, label: getTreeName(t, treeType) })}
                className={`
                  flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors
                  ${isActive ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'hover:bg-gray-100 text-gray-700 border border-gray-200'}
                `}
              >
                <img
                  src={getTreeImagePath(treeType)}
                  alt={getTreeName(t, treeType)}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xs font-medium">{getTreeName(t, treeType)}</span>
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
            color="#22c55e"
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
    </div>
  );
}
