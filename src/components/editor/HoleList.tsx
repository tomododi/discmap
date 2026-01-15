import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { useCourseStore, useEditorStore, useSettingsStore, useMapStore } from '../../stores';
import { calculateDistance, formatDistance, getCenter } from '../../utils/geo';
import type { Hole, TeeFeature, BasketFeature } from '../../types/course';

function HoleCard({ hole, isActive }: { hole: Hole; isActive: boolean }) {
  const { t } = useTranslation();
  const units = useSettingsStore((s) => s.units);
  const setActiveHole = useEditorStore((s) => s.setActiveHole);
  const flyTo = useMapStore((s) => s.flyTo);

  // Find first tee and basket for distance calculation
  const tees = hole.features.filter((f) => f.properties.type === 'tee') as TeeFeature[];
  const firstTee = tees[0];
  const basket = hole.features.find((f) => f.properties.type === 'basket') as BasketFeature | undefined;

  // Calculate distance from first tee to basket
  let distance: number | null = null;
  if (firstTee && basket) {
    distance = calculateDistance(
      firstTee.geometry.coordinates as [number, number],
      basket.geometry.coordinates as [number, number],
      units
    );
  }

  const handleClick = () => {
    setActiveHole(hole.id);

    // Fly to hole center
    const center = getCenter(hole.features);
    if (center) {
      flyTo(center[0], center[1], 17);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-3 rounded-lg border transition-colors
        ${isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
          `}>
            {hole.number}
          </span>
          <div>
            <div className="font-medium text-gray-900">
              {hole.name || t('hole.number', { number: hole.number })}
            </div>
            <div className="text-sm text-gray-500">
              Par {hole.par}
              {distance !== null && (
                <span className="ml-2">{formatDistance(distance, units)}</span>
              )}
              {tees.length > 1 && (
                <span className="ml-2 text-xs text-gray-400">({tees.length} tees)</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function HoleList() {
  const { t } = useTranslation();
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const activeHoleId = useEditorStore((s) => s.activeHoleId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const addHole = useCourseStore((s) => s.addHole);
  const deleteHole = useCourseStore((s) => s.deleteHole);
  const setActiveHole = useEditorStore((s) => s.setActiveHole);

  if (!course) {
    return (
      <div className="p-4 text-center text-gray-500">
        {t('home.noCourses')}
      </div>
    );
  }

  const handleAddHole = () => {
    const newHoleId = addHole(course.id);
    setActiveHole(newHoleId);
  };

  const handleDeleteHole = (holeId: string) => {
    if (course.holes.length <= 1) return;
    deleteHole(course.id, holeId);
    if (activeHoleId === holeId) {
      setActiveHole(course.holes[0]?.id || null);
    }
  };

  return (
    <div className="p-3 space-y-2">
      {course.holes.map((hole) => (
        <div key={hole.id} className="relative group">
          <HoleCard hole={hole} isActive={activeHoleId === hole.id} />
          {course.holes.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteHole(hole.id);
              }}
              className="absolute top-2 right-2 p-1.5 rounded bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500"
              title={t('hole.deleteHole')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={handleAddHole}
        className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        {t('hole.addHole')}
      </button>
    </div>
  );
}
