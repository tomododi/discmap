import { useTranslation } from 'react-i18next';
import type { OBLineFeature } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function ObLineProperties({ feature, onUpdate }: FeaturePropertyProps<OBLineFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">{t('obLine.fairwaySide')}</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ fairwaySide: 'left' })}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              feature.properties.fairwaySide === 'left'
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('obLine.left')}
          </button>
          <button
            onClick={() => onUpdate({ fairwaySide: 'right' })}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              feature.properties.fairwaySide === 'right'
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('obLine.right')}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('obLine.hint')}
        </p>
      </div>
    </div>
  );
}
