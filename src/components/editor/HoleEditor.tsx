import { useTranslation } from 'react-i18next';
import { useCourseStore, useEditorStore, useSettingsStore } from '../../stores';
import { calculateDistance, formatDistance } from '../../utils/geo';
import type { TeeFeature, BasketFeature, TeePosition } from '../../types/course';

export function HoleEditor() {
  const { t } = useTranslation();
  const units = useSettingsStore((s) => s.units);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const activeTeePosition = useEditorStore((s) => s.activeTeePosition);
  const setActiveTeePosition = useEditorStore((s) => s.setActiveTeePosition);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const updateHole = useCourseStore((s) => s.updateHole);

  if (!course || !activeHoleId) {
    return null;
  }

  const hole = course.holes.find((h) => h.id === activeHoleId);
  if (!hole) return null;

  // Find tee and basket for the active tee position
  const tee = hole.features.find(
    (f) => f.properties.type === 'tee' && (f.properties as TeeFeature['properties']).position === activeTeePosition
  ) as TeeFeature | undefined;

  const basket = hole.features.find((f) => f.properties.type === 'basket') as BasketFeature | undefined;

  // Calculate distance
  let distance: number | null = null;
  if (tee && basket) {
    distance = calculateDistance(
      tee.geometry.coordinates as [number, number],
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

      {/* Tee position selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Tee Position
        </label>
        <div className="flex gap-1">
          {(['pro', 'amateur', 'recreational'] as TeePosition[]).map((pos) => {
            const hasTee = hole.features.some(
              (f) => f.properties.type === 'tee' && (f.properties as TeeFeature['properties']).position === pos
            );
            return (
              <button
                key={pos}
                onClick={() => setActiveTeePosition(pos)}
                className={`
                  flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors relative
                  ${activeTeePosition === pos
                    ? pos === 'pro'
                      ? 'bg-red-500 text-white'
                      : pos === 'amateur'
                      ? 'bg-amber-500 text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {t(`teePosition.${pos}`)}
                {hasTee && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
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
