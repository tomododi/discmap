import { useTranslation } from 'react-i18next';
import { Trash2, X } from 'lucide-react';
import { useCourseStore, useEditorStore, useSettingsStore } from '../../stores';
import { calculateDistance, formatDistance } from '../../utils/geo';
import type { TeePosition, DiscGolfFeature, TeeFeature, BasketFeature } from '../../types/course';
import { Button } from '../common/Button';

export function FeatureProperties() {
  const { t } = useTranslation();
  const units = useSettingsStore((s) => s.units);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const selectedFeatureId = useEditorStore((s) => s.selectedFeatureId);
  const setSelectedFeature = useEditorStore((s) => s.setSelectedFeature);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const updateFeature = useCourseStore((s) => s.updateFeature);
  const deleteFeature = useCourseStore((s) => s.deleteFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);

  if (!course || !activeHoleId || !selectedFeatureId) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>{t('editor.noFeatureSelected')}</p>
        <p className="mt-1 text-xs">{t('editor.clickToSelect')}</p>
      </div>
    );
  }

  const hole = course.holes.find((h) => h.id === activeHoleId);
  const feature = hole?.features.find((f) => f.properties.id === selectedFeatureId);

  if (!feature) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>{t('editor.noFeatureSelected')}</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<DiscGolfFeature['properties']>) => {
    saveSnapshot(course.id);
    updateFeature(course.id, activeHoleId, selectedFeatureId, updates);
  };

  const handleDelete = () => {
    saveSnapshot(course.id);
    deleteFeature(course.id, activeHoleId, selectedFeatureId);
    setSelectedFeature(null);
  };

  const handleClose = () => {
    setSelectedFeature(null);
  };

  // Calculate distance for tee (to basket)
  let distanceToBasket: number | null = null;
  if (feature.properties.type === 'tee') {
    const basket = hole?.features.find((f) => f.properties.type === 'basket') as BasketFeature | undefined;
    if (basket) {
      const tee = feature as TeeFeature;
      distanceToBasket = calculateDistance(
        tee.geometry.coordinates as [number, number],
        basket.geometry.coordinates as [number, number],
        units
      );
    }
  }

  const featureTypeLabel = t(`features.${feature.properties.type}`);

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{featureTypeLabel}</h3>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-500"
        >
          <X size={16} />
        </button>
      </div>

      {/* Distance display for tee */}
      {feature.properties.type === 'tee' && distanceToBasket !== null && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">{t('hole.distance')}</div>
          <div className="text-2xl font-bold text-blue-700">
            {formatDistance(distanceToBasket, units)}
          </div>
        </div>
      )}

      {/* Tee-specific properties */}
      {feature.properties.type === 'tee' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('teePosition.pro')} / {t('teePosition.amateur')} / {t('teePosition.recreational')}
            </label>
            <div className="flex gap-1">
              {(['pro', 'amateur', 'recreational'] as TeePosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => handleUpdate({ position: pos })}
                  className={`
                    flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                    ${(feature.properties as TeeFeature['properties']).position === pos
                      ? pos === 'pro'
                        ? 'bg-red-500 text-white'
                        : pos === 'amateur'
                        ? 'bg-amber-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {t(`teePosition.${pos}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OB Zone properties */}
      {feature.properties.type === 'obZone' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Penalty</label>
            <select
              value={(feature.properties as { penalty: string }).penalty}
              onChange={(e) => handleUpdate({ penalty: e.target.value as 'stroke' | 'rethrow' | 'drop' })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="stroke">+1 Stroke</option>
              <option value="rethrow">Re-throw</option>
              <option value="drop">Drop Zone</option>
            </select>
          </div>
        </div>
      )}

      {/* Mandatory properties */}
      {feature.properties.type === 'mandatory' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate({ direction: 'left' })}
                className={`
                  flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors
                  ${(feature.properties as { direction: string }).direction === 'left'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                ← Left
              </button>
              <button
                onClick={() => handleUpdate({ direction: 'right' })}
                className={`
                  flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors
                  ${(feature.properties as { direction: string }).direction === 'right'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Right →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes field (for all features) */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('hole.notes')}
        </label>
        <textarea
          value={feature.properties.notes || ''}
          onChange={(e) => handleUpdate({ notes: e.target.value })}
          placeholder="Add notes..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
        />
      </div>

      {/* Delete button */}
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        className="w-full"
      >
        <Trash2 size={14} className="mr-1" />
        {t('actions.delete')} {featureTypeLabel}
      </Button>
    </div>
  );
}
