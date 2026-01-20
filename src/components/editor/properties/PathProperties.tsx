import { useTranslation } from 'react-i18next';
import type { PathFeature } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function PathProperties({ feature, onUpdate }: FeaturePropertyProps<PathFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Current path display */}
      <div className="bg-stone-50 rounded-lg p-3 flex items-center gap-3">
        <div
          className="w-10 h-2 rounded-full"
          style={{
            backgroundColor: feature.properties.color || '#a8a29e',
          }}
        />
        <div>
          <div className="text-xs text-stone-600 font-medium">{t('features.path', 'Path')}</div>
          <div className="text-sm font-medium text-stone-700">
            {feature.properties.label || t('features.path', 'Path')}
          </div>
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('style.lineColor', 'Line Color')}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={feature.properties.color || '#a8a29e'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
          <span className="text-xs text-gray-500">
            {feature.properties.color || '#a8a29e'}
          </span>
        </div>
      </div>

      {/* Stroke width slider */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('path.strokeWidth', 'Line Width')} ({feature.properties.strokeWidth || 4}px)
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={feature.properties.strokeWidth || 4}
          onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-stone-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1px</span>
          <span>10px</span>
          <span>20px</span>
        </div>
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
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-stone-500"
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
