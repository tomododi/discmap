import { useTranslation } from 'react-i18next';
import { Trash2, X, Trees } from 'lucide-react';
import { useCourseStore, useEditorStore, useSettingsStore } from '../../stores';
import { calculateDistance, formatDistance, calculateLineLength } from '../../utils/geo';
import type { DiscGolfFeature, TeeFeature, BasketFeature, DropzoneFeature, DropzoneAreaFeature, FlightLineFeature, AnnotationFeature, InfrastructureFeature, OBLineFeature, LandmarkFeature } from '../../types/course';
import { DEFAULT_TEE_COLORS } from '../../types/course';
import { TERRAIN_PATTERNS, type TerrainType } from '../../types/terrain';
import { LANDMARK_DEFINITIONS, LANDMARK_CATEGORIES, getLandmarksByCategory } from '../../types/landmarks';
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

  if (!course || !selectedFeatureId) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>{t('editor.noFeatureSelected')}</p>
        <p className="mt-1 text-xs">{t('editor.clickToSelect')}</p>
      </div>
    );
  }

  // Find feature in active hole first, then search all holes
  let hole = activeHoleId ? course.holes.find((h) => h.id === activeHoleId) : null;
  let feature = hole?.features.find((f) => f.properties.id === selectedFeatureId);

  // If not found in active hole, search all holes
  if (!feature) {
    for (const h of course.holes) {
      const found = h.features.find((f) => f.properties.id === selectedFeatureId);
      if (found) {
        hole = h;
        feature = found;
        break;
      }
    }
  }

  if (!feature || !hole) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>{t('editor.noFeatureSelected')}</p>
      </div>
    );
  }

  const featureHoleId = hole.id;

  const handleUpdate = (updates: Partial<DiscGolfFeature['properties']>) => {
    saveSnapshot(course.id);
    updateFeature(course.id, featureHoleId, selectedFeatureId, updates);
  };

  const handleDelete = () => {
    saveSnapshot(course.id);
    deleteFeature(course.id, featureHoleId, selectedFeatureId);
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
          {/* Name input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('editor.teeName')}
            </label>
            <input
              type="text"
              value={(feature.properties as TeeFeature['properties']).name || ''}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              placeholder={t('editor.teeNamePlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('style.teeColor')}
            </label>
            <div className="flex gap-1 flex-wrap">
              {DEFAULT_TEE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleUpdate({ color })}
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
                  value={feature.properties.color || course?.style.defaultTeeColor || '#dc2626'}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                  className="w-12 h-12 cursor-pointer"
                />
              </label>
            </div>
          </div>
          {/* Rotation control */}
          <div className="border-t border-gray-200 pt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('tee.rotation')} ({(feature.properties as TeeFeature['properties']).rotation ?? 0}°)
            </label>
            <input
              type="range"
              min="0"
              max="359"
              step="15"
              value={(feature.properties as TeeFeature['properties']).rotation ?? 0}
              onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>→ 0°</span>
              <span>↓ 90°</span>
              <span>← 180°</span>
              <span>↑ 270°</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[0, 90, 180, 270].map((angle) => (
                <button
                  key={angle}
                  onClick={() => handleUpdate({ rotation: angle })}
                  className={`
                    flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                    ${(feature.properties as TeeFeature['properties']).rotation === angle
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {angle === 0 ? '→' : angle === 90 ? '↓' : angle === 180 ? '←' : '↑'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('tee.scrollToRotate')}</p>
          </div>
        </div>
      )}

      {/* Dropzone-specific properties */}
      {feature.properties.type === 'dropzone' && (
        <div className="space-y-3">
          {/* Rotation control */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('dropzone.rotation')} ({(feature.properties as DropzoneFeature['properties']).rotation ?? 0}°)
            </label>
            <input
              type="range"
              min="0"
              max="359"
              step="15"
              value={(feature.properties as DropzoneFeature['properties']).rotation ?? 0}
              onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>→ 0°</span>
              <span>↓ 90°</span>
              <span>← 180°</span>
              <span>↑ 270°</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[0, 90, 180, 270].map((angle) => (
                <button
                  key={angle}
                  onClick={() => handleUpdate({ rotation: angle })}
                  className={`
                    flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                    ${(feature.properties as DropzoneFeature['properties']).rotation === angle
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {angle === 0 ? '→' : angle === 90 ? '↓' : angle === 180 ? '←' : '↑'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('dropzone.scrollToRotate')}</p>
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

      {/* OB Line properties */}
      {feature.properties.type === 'obLine' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Fairway Side</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate({ fairwaySide: 'left' })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as OBLineFeature).properties.fairwaySide === 'left'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ← Left
              </button>
              <button
                onClick={() => handleUpdate({ fairwaySide: 'right' })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as OBLineFeature).properties.fairwaySide === 'right'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Right →
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Green = Fairway, Red = OB
            </p>
          </div>
        </div>
      )}

      {/* Dropzone Area properties */}
      {feature.properties.type === 'dropzoneArea' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Fairway Position</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate({ fairwayInside: true })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as DropzoneAreaFeature).properties.fairwayInside !== false
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Inside
              </button>
              <button
                onClick={() => handleUpdate({ fairwayInside: false })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as DropzoneAreaFeature).properties.fairwayInside === false
                    ? 'bg-red-100 border-red-500 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Outside
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Green = Fairway, Red = OB
            </p>
          </div>
        </div>
      )}

      {/* Mandatory properties */}
      {feature.properties.type === 'mandatory' && (
        <div className="space-y-3">
          {/* Arrow rotation */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <span className="inline-block w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#8b5cf6' }} />
              {t('mandatory.rotation')} ({(feature.properties as { rotation: number }).rotation ?? 0}°)
            </label>
            <input
              type="range"
              min="0"
              max="359"
              step="15"
              value={(feature.properties as { rotation: number }).rotation ?? 0}
              onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>→ 0°</span>
              <span>↓ 90°</span>
              <span>← 180°</span>
              <span>↑ 270°</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 90, 180, 270].map((angle) => (
              <button
                key={angle}
                onClick={() => handleUpdate({ rotation: angle })}
                className={`
                  flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                  ${(feature.properties as { rotation: number }).rotation === angle
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {angle === 0 ? '→' : angle === 90 ? '↓' : angle === 180 ? '←' : '↑'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">{t('mandatory.scrollToRotate')}</p>

          {/* Line angle - now absolute 0-360 */}
          <div className="border-t border-gray-200 pt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <span className="inline-block w-3 h-3 mr-1 rounded" style={{ backgroundColor: '#dc2626' }} />
              {t('mandatory.lineAngle')} ({(feature.properties as { lineAngle?: number }).lineAngle ?? 270}°)
            </label>
            <input
              type="range"
              min="0"
              max="359"
              step="15"
              value={(feature.properties as { lineAngle?: number }).lineAngle ?? 270}
              onChange={(e) => handleUpdate({ lineAngle: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>→ 0°</span>
              <span>↓ 90°</span>
              <span>← 180°</span>
              <span>↑ 270°</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[0, 90, 180, 270].map((angle) => (
                <button
                  key={angle}
                  onClick={() => handleUpdate({ lineAngle: angle })}
                  className={`
                    flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                    ${(feature.properties as { lineAngle?: number }).lineAngle === angle
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {angle === 0 ? '→' : angle === 90 ? '↓' : angle === 180 ? '←' : '↑'}
                </button>
              ))}
            </div>
          </div>

          {/* Line length */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('mandatory.lineLength')} ({(feature.properties as { lineLength?: number }).lineLength ?? 50}px)
            </label>
            <input
              type="range"
              min="30"
              max="150"
              step="10"
              value={(feature.properties as { lineLength?: number }).lineLength ?? 60}
              onChange={(e) => handleUpdate({ lineLength: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30</span>
              <span>90</span>
              <span>150</span>
            </div>
          </div>
        </div>
      )}

      {/* Flight Line properties */}
      {feature.properties.type === 'flightLine' && (
        <div className="space-y-3">
          {/* Distance display */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium">{t('hole.distance')}</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatDistance(
                calculateLineLength(
                  (feature as FlightLineFeature).geometry.coordinates as [number, number][],
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
                  onClick={() => handleUpdate({ color })}
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
                  value={feature.properties.color || course?.style.defaultFlightLineColor || '#3b82f6'}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                  className="w-12 h-12 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Node count info */}
          <div className="text-xs text-gray-500">
            {t('flightLine.nodeCount', { count: (feature as FlightLineFeature).geometry.coordinates.length })}
          </div>
          <p className="text-xs text-gray-500">{t('flightLine.editHint')}</p>
        </div>
      )}

      {/* Annotation properties */}
      {feature.properties.type === 'annotation' && (
        <div className="space-y-3">
          {/* Text input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('annotation.text')}
            </label>
            <textarea
              value={(feature.properties as AnnotationFeature['properties']).text || ''}
              onChange={(e) => handleUpdate({ text: e.target.value })}
              placeholder={t('annotation.textPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Font size slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('annotation.fontSize')} ({(feature.properties as AnnotationFeature['properties']).fontSize || 14}px)
            </label>
            <input
              type="range"
              min="10"
              max="32"
              step="1"
              value={(feature.properties as AnnotationFeature['properties']).fontSize || 14}
              onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10px</span>
              <span>32px</span>
            </div>
          </div>

          {/* Font family selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('annotation.fontFamily')}
            </label>
            <select
              value={(feature.properties as AnnotationFeature['properties']).fontFamily || 'sans-serif'}
              onChange={(e) => handleUpdate({ fontFamily: e.target.value as 'sans-serif' | 'serif' | 'monospace' })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>Sans-serif</option>
              <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
              <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
            </select>
          </div>

          {/* Font weight toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('annotation.fontWeight')}
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => handleUpdate({ fontWeight: 'normal' })}
                className={`
                  flex-1 py-1.5 px-2 text-sm rounded-lg transition-colors
                  ${(feature.properties as AnnotationFeature['properties']).fontWeight !== 'bold'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {t('annotation.normal')}
              </button>
              <button
                onClick={() => handleUpdate({ fontWeight: 'bold' })}
                className={`
                  flex-1 py-1.5 px-2 text-sm font-bold rounded-lg transition-colors
                  ${(feature.properties as AnnotationFeature['properties']).fontWeight === 'bold'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {t('annotation.bold')}
              </button>
            </div>
          </div>

          {/* Color pickers */}
          <div className="space-y-2">
            {/* Text color */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 flex-1">
                {t('annotation.textColor')}
              </label>
              <input
                type="color"
                value={(feature.properties as AnnotationFeature['properties']).textColor || '#000000'}
                onChange={(e) => handleUpdate({ textColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
            </div>

            {/* Background color */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 flex-1">
                {t('annotation.backgroundColor')}
              </label>
              <input
                type="color"
                value={(feature.properties as AnnotationFeature['properties']).backgroundColor || '#ffffff'}
                onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
            </div>

            {/* Border color */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 flex-1">
                {t('annotation.borderColor')}
              </label>
              <input
                type="color"
                value={(feature.properties as AnnotationFeature['properties']).borderColor || '#000000'}
                onChange={(e) => handleUpdate({ borderColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure/Terrain properties */}
      {feature.properties.type === 'infrastructure' && (
        <div className="space-y-3">
          {/* Current terrain type display */}
          <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: TERRAIN_PATTERNS[(feature.properties as InfrastructureFeature['properties']).terrainType]?.defaultColors.primary || '#22c55e',
              }}
            >
              <Trees size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-emerald-600 font-medium">{t('terrain.types', 'Terrain Type')}</div>
              <div className="text-lg font-bold text-emerald-700">
                {TERRAIN_PATTERNS[(feature.properties as InfrastructureFeature['properties']).terrainType]?.name || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Terrain type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t('terrain.types', 'Change Terrain Type')}
            </label>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(TERRAIN_PATTERNS) as TerrainType[]).map((terrainType) => {
                const pattern = TERRAIN_PATTERNS[terrainType];
                const isActive = (feature.properties as InfrastructureFeature['properties']).terrainType === terrainType;
                return (
                  <button
                    key={terrainType}
                    onClick={() => handleUpdate({ terrainType, label: pattern.name })}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
                      ${isActive ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500' : 'hover:bg-gray-100 text-gray-700'}
                    `}
                  >
                    <div
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: pattern.defaultColors.primary }}
                    />
                    <span className="text-xs truncate">{pattern.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opacity slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('style.obOpacity', 'Opacity')} ({Math.round(((feature.properties as InfrastructureFeature['properties']).opacity ?? 0.9) * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={(feature.properties as InfrastructureFeature['properties']).opacity ?? 0.9}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Corner radius slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('terrain.cornerRadius', 'Corner Rounding')} ({(feature.properties as InfrastructureFeature['properties']).cornerRadius ?? 0}m)
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={(feature.properties as InfrastructureFeature['properties']).cornerRadius ?? 0}
              onChange={(e) => handleUpdate({ cornerRadius: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('terrain.sharp', 'Sharp')}</span>
              <span>{t('terrain.rounded', 'Rounded')}</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 10, 20, 30].map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleUpdate({ cornerRadius: radius })}
                  className={`
                    flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                    ${(feature.properties as InfrastructureFeature['properties']).cornerRadius === radius
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {radius}m
                </button>
              ))}
            </div>
          </div>

          {/* Node count info */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <p>{t('terrain.nodeCount', { count: ((feature.geometry as { coordinates: number[][][] }).coordinates[0]?.length ?? 0) - 1, defaultValue: `${((feature.geometry as { coordinates: number[][][] }).coordinates[0]?.length ?? 0) - 1} vertices` })}</p>
            <p className="mt-1">{t('terrain.editHint', 'Drag vertices to reshape. Double-click to delete vertex.')}</p>
          </div>

          {/* Custom colors */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              {t('annotation.textColor', 'Custom Colors')} ({t('style.otherMarkers', 'optional')})
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-16">Fill:</span>
              <input
                type="color"
                value={(feature.properties as InfrastructureFeature['properties']).customColors?.primary ||
                  TERRAIN_PATTERNS[(feature.properties as InfrastructureFeature['properties']).terrainType]?.defaultColors.primary || '#22c55e'}
                onChange={(e) => handleUpdate({
                  customColors: {
                    ...(feature.properties as InfrastructureFeature['properties']).customColors,
                    primary: e.target.value
                  }
                })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <button
                onClick={() => handleUpdate({
                  customColors: {
                    ...(feature.properties as InfrastructureFeature['properties']).customColors,
                    primary: undefined
                  }
                })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-16">Border:</span>
              <input
                type="color"
                value={(feature.properties as InfrastructureFeature['properties']).customColors?.secondary ||
                  TERRAIN_PATTERNS[(feature.properties as InfrastructureFeature['properties']).terrainType]?.defaultColors.secondary || '#16a34a'}
                onChange={(e) => handleUpdate({
                  customColors: {
                    ...(feature.properties as InfrastructureFeature['properties']).customColors,
                    secondary: e.target.value
                  }
                })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <button
                onClick={() => handleUpdate({
                  customColors: {
                    ...(feature.properties as InfrastructureFeature['properties']).customColors,
                    secondary: undefined
                  }
                })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landmark properties */}
      {feature.properties.type === 'landmark' && (
        <div className="space-y-3">
          {/* Current landmark display */}
          <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-2xl">
              {LANDMARK_DEFINITIONS[(feature.properties as LandmarkFeature['properties']).landmarkType]?.icon || '📍'}
            </div>
            <div>
              <div className="text-xs text-amber-600 font-medium">{t('landmarks.title', 'Landmark')}</div>
              <div className="text-lg font-bold text-amber-700">
                {LANDMARK_DEFINITIONS[(feature.properties as LandmarkFeature['properties']).landmarkType]?.name || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Landmark type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t('landmarks.changeType', 'Change Landmark Type')}
            </label>
            {LANDMARK_CATEGORIES.map((category) => (
              <div key={category.id} className="mb-2">
                <div className="text-xs text-gray-500 mb-1">{category.name}</div>
                <div className="flex flex-wrap gap-1">
                  {getLandmarksByCategory(category.id).map((landmarkType) => {
                    const def = LANDMARK_DEFINITIONS[landmarkType];
                    const isActive = (feature.properties as LandmarkFeature['properties']).landmarkType === landmarkType;
                    return (
                      <button
                        key={landmarkType}
                        onClick={() => handleUpdate({ landmarkType, label: def.name })}
                        className={`
                          px-2 py-1 rounded-lg text-xs transition-colors flex items-center gap-1
                          ${isActive ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-500' : 'hover:bg-gray-100 text-gray-700'}
                        `}
                        title={def.name}
                      >
                        <span>{def.icon}</span>
                        <span className="hidden sm:inline">{def.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Size slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('landmarks.size', 'Size')} ({((feature.properties as LandmarkFeature['properties']).size ?? 1).toFixed(1)}x)
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={(feature.properties as LandmarkFeature['properties']).size ?? 1}
              onChange={(e) => handleUpdate({ size: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x</span>
              <span>1x</span>
              <span>2x</span>
              <span>3x</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[0.5, 1, 1.5, 2].map((sizeVal) => (
                <button
                  key={sizeVal}
                  onClick={() => handleUpdate({ size: sizeVal })}
                  className={`
                    flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                    ${(feature.properties as LandmarkFeature['properties']).size === sizeVal
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {sizeVal}x
                </button>
              ))}
            </div>
          </div>

          {/* Rotation control */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('landmarks.rotation', 'Rotation')} ({(feature.properties as LandmarkFeature['properties']).rotation ?? 0}°)
            </label>
            <input
              type="range"
              min="0"
              max="359"
              step="15"
              value={(feature.properties as LandmarkFeature['properties']).rotation ?? 0}
              onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0°</span>
              <span>90°</span>
              <span>180°</span>
              <span>270°</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[0, 90, 180, 270].map((angle) => (
                <button
                  key={angle}
                  onClick={() => handleUpdate({ rotation: angle })}
                  className={`
                    flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors
                    ${(feature.properties as LandmarkFeature['properties']).rotation === angle
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {angle}°
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('landmarks.scrollToRotate', 'Use scroll wheel to rotate when selected')}</p>
          </div>

          {/* Custom color */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('landmarks.customColor', 'Custom Color')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(feature.properties as LandmarkFeature['properties']).color ||
                  LANDMARK_DEFINITIONS[(feature.properties as LandmarkFeature['properties']).landmarkType]?.defaultColor || '#3b82f6'}
                onChange={(e) => handleUpdate({ color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <button
                onClick={() => handleUpdate({ color: undefined })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('actions.reset', 'Reset to default')}
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
          placeholder={t('editor.addNotes')}
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
