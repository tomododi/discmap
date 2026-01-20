import { useTranslation } from 'react-i18next';
import { RotationKnob } from '../../common/RotationKnob';
import type { MandatoryFeature } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function MandatoryProperties({ feature, onUpdate }: FeaturePropertyProps<MandatoryFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Both rotation knobs side by side */}
      <div className="flex justify-center gap-4">
        {/* Arrow rotation */}
        <div className="text-center">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            <span className="inline-block w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#8b5cf6' }} />
            {t('mandatory.rotation')}
          </label>
          <RotationKnob
            value={feature.properties.rotation ?? 0}
            onChange={(rotation) => onUpdate({ rotation })}
            color="#8b5cf6"
            size={80}
          />
        </div>

        {/* Line angle */}
        <div className="text-center">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            <span className="inline-block w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#dc2626' }} />
            {t('mandatory.lineAngle')}
          </label>
          <RotationKnob
            value={feature.properties.lineAngle ?? 270}
            onChange={(lineAngle) => onUpdate({ lineAngle })}
            color="#dc2626"
            size={80}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">{t('mandatory.scrollToRotate')}</p>
    </div>
  );
}
