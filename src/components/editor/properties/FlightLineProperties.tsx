import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../../stores';
import { calculateLineLength, formatDistance } from '../../../utils/geo';
import type { FlightLineFeature } from '../../../types/course';
import { DEFAULT_TEE_COLORS } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function FlightLineProperties({ feature, onUpdate, courseStyle }: FeaturePropertyProps<FlightLineFeature>) {
  const { t } = useTranslation();
  const units = useSettingsStore((s) => s.units);

  return (
    <div className="space-y-3">
      {/* Distance display */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-xs text-blue-600 font-medium">{t('hole.distance')}</div>
        <div className="text-2xl font-bold text-blue-700">
          {formatDistance(
            calculateLineLength(
              feature.geometry.coordinates as [number, number][],
              units
            ),
            units
          )}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('style.lineColor')}
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
              value={feature.properties.color || courseStyle?.defaultFlightLineColor || '#3b82f6'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-12 h-12 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Node count info */}
      <div className="text-xs text-gray-500">
        {t('flightLine.nodeCount', { count: feature.geometry.coordinates.length })}
      </div>
      <p className="text-xs text-gray-500">{t('flightLine.editHint')}</p>
    </div>
  );
}
