import { useTranslation } from 'react-i18next';
import type { DiscGolfFeature } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

// Using generic DiscGolfFeature but expecting OB zone properties
export function ObZoneProperties({ feature, onUpdate }: FeaturePropertyProps<DiscGolfFeature>) {
  const { t } = useTranslation();
  const props = feature.properties as { penalty: string };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{t('obZone.penalty')}</label>
        <select
          value={props.penalty}
          onChange={(e) => onUpdate({ penalty: e.target.value as 'stroke' | 'rethrow' | 'drop' })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="stroke">{t('obZone.stroke')}</option>
          <option value="rethrow">{t('obZone.rethrow')}</option>
          <option value="drop">{t('obZone.drop')}</option>
        </select>
      </div>
    </div>
  );
}
