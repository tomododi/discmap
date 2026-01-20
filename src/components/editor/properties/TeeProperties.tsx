import { useTranslation } from 'react-i18next';
import { RotationKnob } from '../../common/RotationKnob';
import type { TeeFeature } from '../../../types/course';
import { DEFAULT_TEE_COLORS } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function TeeProperties({ feature, onUpdate, courseStyle }: FeaturePropertyProps<TeeFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Name input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('editor.teeName')}
        </label>
        <input
          type="text"
          value={feature.properties.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder={t('editor.teeNamePlaceholder')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('style.teeColor')}
        </label>
        <div className="flex gap-1 flex-wrap">
          {DEFAULT_TEE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onUpdate({ color })}
              className={`
                w-8 h-8 rounded-lg border-2 transition-all
                ${feature.properties.color === color
                  ? 'border-gray-900 scale-110'
                  : 'border-transparent hover:border-gray-400'
                }
              `}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <label className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex items-center justify-center overflow-hidden">
            <input
              type="color"
              value={feature.properties.color || courseStyle?.defaultTeeColor || '#dc2626'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-12 h-12 cursor-pointer"
            />
          </label>
        </div>
      </div>
      {/* Rotation control */}
      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {t('tee.rotation')}
        </label>
        <div className="flex justify-center">
          <RotationKnob
            value={feature.properties.rotation ?? 0}
            onChange={(rotation) => onUpdate({ rotation })}
            color={feature.properties.color || courseStyle?.defaultTeeColor || '#dc2626'}
            size={90}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">{t('tee.scrollToRotate')}</p>
      </div>
    </div>
  );
}
