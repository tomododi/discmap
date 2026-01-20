import { useTranslation } from 'react-i18next';
import { RotationKnob } from '../../common/RotationKnob';
import type { DropzoneFeature } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function DropzoneProperties({ feature, onUpdate }: FeaturePropertyProps<DropzoneFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Rotation control */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {t('dropzone.rotation')}
        </label>
        <div className="flex justify-center">
          <RotationKnob
            value={feature.properties.rotation ?? 0}
            onChange={(rotation) => onUpdate({ rotation })}
            color="#f59e0b"
            size={90}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">{t('dropzone.scrollToRotate')}</p>
      </div>
    </div>
  );
}
