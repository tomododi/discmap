import { useTranslation } from 'react-i18next';
import { Trash2, X, Trees } from 'lucide-react';
import { useCourseStore, useEditorStore, useSettingsStore } from '../../stores';
import { calculateDistance, formatDistance, calculateLineLength } from '../../utils/geo';
import type { DiscGolfFeature, TeeFeature, BasketFeature, DropzoneFeature, DropzoneAreaFeature, FlightLineFeature, AnnotationFeature, OBLineFeature, TerrainFeature, PathFeature } from '../../types/course';
import { DEFAULT_TEE_COLORS } from '../../types/course';
import { TERRAIN_PATTERNS, type TerrainType } from '../../types/terrain';
import { Button } from '../common/Button';
import { RotationKnob } from '../common/RotationKnob';
import { getTerrainName } from '../../utils/i18nHelpers';

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
  const updateTerrainFeature = useCourseStore((s) => s.updateTerrainFeature);
  const deleteTerrainFeature = useCourseStore((s) => s.deleteTerrainFeature);
  const updatePathFeature = useCourseStore((s) => s.updatePathFeature);
  const deletePathFeature = useCourseStore((s) => s.deletePathFeature);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);

  if (!course || !selectedFeatureId) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>{t('editor.noFeatureSelected')}</p>
        <p className="mt-1 text-xs">{t('editor.clickToSelect')}</p>
      </div>
    );
  }

  // Find feature in active hole first, then search all holes, then course-level features
  let hole = activeHoleId ? course.holes.find((h) => h.id === activeHoleId) : null;
  let feature: DiscGolfFeature | TerrainFeature | PathFeature | undefined = hole?.features.find((f) => f.properties.id === selectedFeatureId);
  let isTerrainFeature = false;
  let isPathFeature = false;

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

  // If still not found, search course-level terrain features
  if (!feature && course.terrainFeatures) {
    const terrainFound = course.terrainFeatures.find((f) => f.properties.id === selectedFeatureId);
    if (terrainFound) {
      feature = terrainFound;
      isTerrainFeature = true;
    }
  }

  // If still not found, search course-level path features
  if (!feature && course.pathFeatures) {
    const pathFound = course.pathFeatures.find((f) => f.properties.id === selectedFeatureId);
    if (pathFound) {
      feature = pathFound;
      isPathFeature = true;
    }
  }

  const isCourseLevel = isTerrainFeature || isPathFeature;

  if (!feature || (!hole && !isCourseLevel)) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>{t('editor.noFeatureSelected')}</p>
      </div>
    );
  }

  const featureHoleId = hole?.id;

  const handleUpdate = (updates: Partial<DiscGolfFeature['properties']> | Partial<TerrainFeature['properties']> | Partial<PathFeature['properties']>) => {
    saveSnapshot(course.id);
    if (isTerrainFeature) {
      updateTerrainFeature(course.id, selectedFeatureId, updates as Partial<TerrainFeature['properties']>);
    } else if (isPathFeature) {
      updatePathFeature(course.id, selectedFeatureId, updates as Partial<PathFeature['properties']>);
    } else if (featureHoleId) {
      updateFeature(course.id, featureHoleId, selectedFeatureId, updates as Partial<DiscGolfFeature['properties']>);
    }
  };

  const handleDelete = () => {
    saveSnapshot(course.id);
    if (isTerrainFeature) {
      deleteTerrainFeature(course.id, selectedFeatureId);
    } else if (isPathFeature) {
      deletePathFeature(course.id, selectedFeatureId);
    } else if (featureHoleId) {
      deleteFeature(course.id, featureHoleId, selectedFeatureId);
    }
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
                    ${(feature.properties as TeeFeature['properties']).color === color
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
                  value={(feature.properties as TeeFeature['properties']).color || course?.style.defaultTeeColor || '#dc2626'}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                  className="w-12 h-12 cursor-pointer"
                />
              </label>
            </div>
          </div>
          {/* Rotation control */}
          <div className="border-t border-gray-200 pt-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t('tee.rotation')}
            </label>
            <div className="flex justify-center">
              <RotationKnob
                value={(feature.properties as TeeFeature['properties']).rotation ?? 0}
                onChange={(rotation) => handleUpdate({ rotation })}
                color={feature.properties.color || course?.style.defaultTeeColor || '#dc2626'}
                size={90}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">{t('tee.scrollToRotate')}</p>
          </div>
        </div>
      )}

      {/* Dropzone-specific properties */}
      {feature.properties.type === 'dropzone' && (
        <div className="space-y-3">
          {/* Rotation control */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              {t('dropzone.rotation')}
            </label>
            <div className="flex justify-center">
              <RotationKnob
                value={(feature.properties as DropzoneFeature['properties']).rotation ?? 0}
                onChange={(rotation) => handleUpdate({ rotation })}
                color="#f59e0b"
                size={90}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">{t('dropzone.scrollToRotate')}</p>
          </div>
        </div>
      )}

      {/* OB Zone properties */}
      {feature.properties.type === 'obZone' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('obZone.penalty')}</label>
            <select
              value={(feature.properties as { penalty: string }).penalty}
              onChange={(e) => handleUpdate({ penalty: e.target.value as 'stroke' | 'rethrow' | 'drop' })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="stroke">{t('obZone.stroke')}</option>
              <option value="rethrow">{t('obZone.rethrow')}</option>
              <option value="drop">{t('obZone.drop')}</option>
            </select>
          </div>
        </div>
      )}

      {/* OB Line properties */}
      {feature.properties.type === 'obLine' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">{t('obLine.fairwaySide')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate({ fairwaySide: 'left' })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as OBLineFeature).properties.fairwaySide === 'left'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('obLine.left')}
              </button>
              <button
                onClick={() => handleUpdate({ fairwaySide: 'right' })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as OBLineFeature).properties.fairwaySide === 'right'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('obLine.right')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('obLine.hint')}
            </p>
          </div>
        </div>
      )}

      {/* Dropzone Area properties */}
      {feature.properties.type === 'dropzoneArea' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">{t('dropzoneArea.fairwayPosition')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate({ fairwayInside: true })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as DropzoneAreaFeature).properties.fairwayInside !== false
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('dropzoneArea.inside')}
              </button>
              <button
                onClick={() => handleUpdate({ fairwayInside: false })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  (feature as DropzoneAreaFeature).properties.fairwayInside === false
                    ? 'bg-red-100 border-red-500 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('dropzoneArea.outside')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('dropzoneArea.hint')}
            </p>
          </div>
        </div>
      )}

      {/* Mandatory properties */}
      {feature.properties.type === 'mandatory' && (
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
                value={(feature.properties as { rotation: number }).rotation ?? 0}
                onChange={(rotation) => handleUpdate({ rotation })}
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
                value={(feature.properties as { lineAngle?: number }).lineAngle ?? 270}
                onChange={(lineAngle) => handleUpdate({ lineAngle })}
                color="#dc2626"
                size={80}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">{t('mandatory.scrollToRotate')}</p>
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
                    ${(feature.properties as FlightLineFeature['properties']).color === color
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
                  value={(feature.properties as FlightLineFeature['properties']).color || course?.style.defaultFlightLineColor || '#3b82f6'}
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

      {/* Terrain properties (course-level) */}
      {feature.properties.type === 'terrain' && (
        <div className="space-y-3">
          {/* Current terrain type display */}
          <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: TERRAIN_PATTERNS[(feature.properties as TerrainFeature['properties']).terrainType]?.defaultColors.primary || '#22c55e',
              }}
            >
              <Trees size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-emerald-600 font-medium">{t('terrain.types', 'Terrain Type')}</div>
              <div className="text-lg font-bold text-emerald-700">
                {getTerrainName(t, (feature.properties as TerrainFeature['properties']).terrainType)}
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
                const isActive = (feature.properties as TerrainFeature['properties']).terrainType === terrainType;
                return (
                  <button
                    key={terrainType}
                    onClick={() => handleUpdate({ terrainType, label: getTerrainName(t, terrainType) })}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
                      ${isActive ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500' : 'hover:bg-gray-100 text-gray-700'}
                    `}
                  >
                    <div
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: pattern.defaultColors.primary }}
                    />
                    <span className="text-xs truncate">{getTerrainName(t, terrainType)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opacity slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('style.obOpacity', 'Opacity')} ({Math.round(((feature.properties as TerrainFeature['properties']).opacity ?? 0.9) * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={(feature.properties as TerrainFeature['properties']).opacity ?? 0.9}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Vertex info */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <p className="font-medium text-gray-700">{((feature.geometry as { coordinates: number[][][] }).coordinates[0]?.length ?? 0) - 1} {t('terrain.vertices', 'vertices')}</p>
            <p className="mt-1">{t('terrain.editHint', 'Drag vertices to reshape. Click + to add. Double-click to remove.')}</p>
          </div>

          {/* Custom colors */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              {t('terrain.customColors')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-16">{t('terrain.fill')}</span>
              <input
                type="color"
                value={(feature.properties as TerrainFeature['properties']).customColors?.primary ||
                  TERRAIN_PATTERNS[(feature.properties as TerrainFeature['properties']).terrainType]?.defaultColors.primary || '#22c55e'}
                onChange={(e) => handleUpdate({
                  customColors: {
                    ...(feature.properties as TerrainFeature['properties']).customColors,
                    primary: e.target.value
                  }
                })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <button
                onClick={() => handleUpdate({
                  customColors: {
                    ...(feature.properties as TerrainFeature['properties']).customColors,
                    primary: undefined
                  }
                })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('actions.reset')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-16">{t('terrain.border')}</span>
              <input
                type="color"
                value={(feature.properties as TerrainFeature['properties']).customColors?.secondary ||
                  TERRAIN_PATTERNS[(feature.properties as TerrainFeature['properties']).terrainType]?.defaultColors.secondary || '#16a34a'}
                onChange={(e) => handleUpdate({
                  customColors: {
                    ...(feature.properties as TerrainFeature['properties']).customColors,
                    secondary: e.target.value
                  }
                })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <button
                onClick={() => handleUpdate({
                  customColors: {
                    ...(feature.properties as TerrainFeature['properties']).customColors,
                    secondary: undefined
                  }
                })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('actions.reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Path properties (course-level) */}
      {feature.properties.type === 'path' && (
        <div className="space-y-3">
          {/* Current path display */}
          <div className="bg-stone-50 rounded-lg p-3 flex items-center gap-3">
            <div
              className="w-10 h-2 rounded-full"
              style={{
                backgroundColor: (feature.properties as PathFeature['properties']).color || '#a8a29e',
              }}
            />
            <div>
              <div className="text-xs text-stone-600 font-medium">{t('features.path', 'Path')}</div>
              <div className="text-sm font-medium text-stone-700">
                {(feature.properties as PathFeature['properties']).label || t('features.path', 'Path')}
              </div>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('style.lineColor', 'Line Color')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(feature.properties as PathFeature['properties']).color || '#a8a29e'}
                onChange={(e) => handleUpdate({ color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-500">
                {(feature.properties as PathFeature['properties']).color || '#a8a29e'}
              </span>
            </div>
          </div>

          {/* Stroke width slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('path.strokeWidth', 'Line Width')} ({(feature.properties as PathFeature['properties']).strokeWidth || 4}px)
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={(feature.properties as PathFeature['properties']).strokeWidth || 4}
              onChange={(e) => handleUpdate({ strokeWidth: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-stone-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1px</span>
              <span>10px</span>
              <span>20px</span>
            </div>
          </div>

          {/* Opacity slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('style.obOpacity', 'Opacity')} ({Math.round(((feature.properties as PathFeature['properties']).opacity ?? 1) * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={(feature.properties as PathFeature['properties']).opacity ?? 1}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-stone-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
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
