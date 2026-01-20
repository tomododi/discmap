import { useTranslation } from 'react-i18next';
import type { DropzoneAreaFeature } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function DropzoneAreaProperties({ feature, onUpdate }: FeaturePropertyProps<DropzoneAreaFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">{t('dropzoneArea.fairwayPosition')}</label>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ fairwayInside: true })}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              feature.properties.fairwayInside !== false
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('dropzoneArea.inside')}
          </button>
          <button
            onClick={() => onUpdate({ fairwayInside: false })}
            className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              feature.properties.fairwayInside === false
                ? 'bg-red-100 border-red-500 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('dropzoneArea.outside')}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('dropzoneArea.hint')}
        </p>
      </div>
    </div>
  );
}
