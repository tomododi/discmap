import { useTranslation } from 'react-i18next';
import { MapPin, Trees, Building2, AlertTriangle, Signpost } from 'lucide-react';
import { useEditorStore } from '../../stores';
import { LANDMARK_DEFINITIONS, LANDMARK_CATEGORIES, getLandmarksByCategory } from '../../types/landmarks';
import type { LandmarkType, LandmarkCategory } from '../../types/landmarks';

const categoryIcons: Record<LandmarkCategory, React.ReactNode> = {
  amenities: <Building2 size={14} />,
  nature: <Trees size={14} />,
  signage: <Signpost size={14} />,
  hazards: <AlertTriangle size={14} />,
  structures: <Building2 size={14} />,
};

export function LandmarkEditor() {
  const { t } = useTranslation();
  const drawMode = useEditorStore((s) => s.drawMode);
  const activeLandmarkType = useEditorStore((s) => s.activeLandmarkType);
  const setActiveLandmarkType = useEditorStore((s) => s.setActiveLandmarkType);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);

  const isLandmarkMode = drawMode === 'landmark';

  const handleLandmarkSelect = (type: LandmarkType) => {
    setActiveLandmarkType(type);
    setDrawMode('landmark');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-800">
            {t('landmarks.title', 'Landmarks')}
          </h3>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {t('landmarks.hint', 'Select a landmark and click on the map to place it.')}
        </p>

        {isLandmarkMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{LANDMARK_DEFINITIONS[activeLandmarkType].icon}</span>
              <div>
                <div className="text-sm font-medium text-amber-800">
                  {LANDMARK_DEFINITIONS[activeLandmarkType].name}
                </div>
                <div className="text-xs text-amber-600">
                  {t('landmarks.clickToPlace', 'Click on map to place')}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Landmark Categories */}
      {LANDMARK_CATEGORIES.map((category) => (
        <section key={category.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500">{categoryIcons[category.id]}</span>
            <span className="text-xs font-medium text-gray-600">{category.name}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {getLandmarksByCategory(category.id).map((type) => {
              const def = LANDMARK_DEFINITIONS[type];
              const isActive = isLandmarkMode && activeLandmarkType === type;

              return (
                <button
                  key={type}
                  onClick={() => handleLandmarkSelect(type)}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center
                    ${isActive
                      ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  title={def.name}
                >
                  <span className="text-xl">{def.icon}</span>
                  <span className="text-[10px] text-gray-600 leading-tight truncate w-full">
                    {def.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Info */}
      <section className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
        <p className="font-medium text-gray-700 mb-1">
          {t('landmarks.tipsTitle', 'Tips:')}
        </p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>{t('landmarks.tip1', 'Landmarks are decorative elements')}</li>
          <li>{t('landmarks.tip2', 'Drag to reposition after placing')}</li>
          <li>{t('landmarks.tip3', 'Use scroll wheel to rotate (when selected)')}</li>
        </ul>
      </section>
    </div>
  );
}
