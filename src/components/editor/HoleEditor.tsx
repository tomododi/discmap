import { useTranslation } from 'react-i18next';
import { useCourseStore, useEditorStore, useSettingsStore } from '../../stores';
import { calculateDistance, formatDistance } from '../../utils/geo';
import type { TeeFeature, BasketFeature } from '../../types/course';

export function HoleEditor() {
  const { t } = useTranslation();
  const units = useSettingsStore((s) => s.units);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const updateHole = useCourseStore((s) => s.updateHole);

  if (!course || !activeHoleId) {
    return null;
  }

  const hole = course.holes.find((h) => h.id === activeHoleId);
  if (!hole) return null;

  // Find tees and basket
  const tees = hole.features.filter((f) => f.properties.type === 'tee') as TeeFeature[];
  const basket = hole.features.find((f) => f.properties.type === 'basket') as BasketFeature | undefined;

  // Calculate distance from first tee to basket
  const firstTee = tees[0];
  let distance: number | null = null;
  if (firstTee && basket) {
    distance = calculateDistance(
      firstTee.geometry.coordinates as [number, number],
      basket.geometry.coordinates as [number, number],
      units
    );
  }

  const handleParChange = (par: number) => {
    updateHole(course.id, hole.id, { par });
  };

  const handleNameChange = (name: string) => {
    updateHole(course.id, hole.id, { name: name || undefined });
  };

  const handleNotesChange = (notes: string) => {
    updateHole(course.id, hole.id, { notes: notes || undefined });
  };

  return (
    <div className="p-3 space-y-4 bg-gray-50">
      {/* Hole header with number and distance */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {hole.name || t('hole.number', { number: hole.number })}
          </h2>
          <input
            type="text"
            value={hole.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Hole name (optional)"
            className="text-xs text-gray-500 bg-transparent border-none p-0 focus:ring-0 w-full"
          />
        </div>
        {distance !== null && (
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatDistance(distance, units)}
            </div>
            <div className="text-xs text-gray-500">{t('hole.distance')}</div>
          </div>
        )}
      </div>

      {/* Tee info */}
      {tees.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('layers.tees')} ({tees.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {tees.map((tee, index) => (
              <div
                key={tee.properties.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md border border-gray-200"
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: tee.properties.color || course.style.defaultTeeColor }}
                />
                <span className="text-xs text-gray-700">
                  {tee.properties.name || `Tee ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Par selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('hole.par')}
        </label>
        <div className="flex gap-1">
          {[2, 3, 4, 5].map((par) => (
            <button
              key={par}
              onClick={() => handleParChange(par)}
              className={`
                flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors
                ${hole.par === par
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {par}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('hole.notes')}
        </label>
        <textarea
          value={hole.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add hole notes, local rules..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
          rows={2}
        />
      </div>
    </div>
  );
}
