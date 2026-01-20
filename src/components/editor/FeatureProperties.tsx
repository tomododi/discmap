import { useTranslation } from 'react-i18next';
import { Trash2, X } from 'lucide-react';
import { useCourseStore, useEditorStore, useSettingsStore } from '../../stores';
import { calculateDistance, formatDistance } from '../../utils/geo';
import type { DiscGolfFeature, TeeFeature, BasketFeature, DropzoneFeature, DropzoneAreaFeature, FlightLineFeature, AnnotationFeature, OBLineFeature, TerrainFeature, PathFeature, MandatoryFeature } from '../../types/course';
import type { TreeFeature } from '../../types/trees';
import { Button } from '../common/Button';
import { TeeProperties } from './properties/TeeProperties';
import { DropzoneProperties } from './properties/DropzoneProperties';
import { ObZoneProperties } from './properties/ObZoneProperties';
import { ObLineProperties } from './properties/ObLineProperties';
import { DropzoneAreaProperties } from './properties/DropzoneAreaProperties';
import { MandatoryProperties } from './properties/MandatoryProperties';
import { FlightLineProperties } from './properties/FlightLineProperties';
import { AnnotationProperties } from './properties/AnnotationProperties';
import { TerrainProperties } from './properties/TerrainProperties';
import { PathProperties } from './properties/PathProperties';
import { TreeProperties } from './properties/TreeProperties';

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
  const updateTreeFeature = useCourseStore((s) => s.updateTreeFeature);
  const deleteTreeFeature = useCourseStore((s) => s.deleteTreeFeature);
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
  let feature: DiscGolfFeature | TerrainFeature | PathFeature | TreeFeature | undefined = hole?.features.find((f) => f.properties.id === selectedFeatureId);
  let isTerrainFeature = false;
  let isPathFeature = false;
  let isTreeFeature = false;

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

  // If still not found, search course-level tree features
  if (!feature && course.treeFeatures) {
    const treeFound = course.treeFeatures.find((f) => f.properties.id === selectedFeatureId);
    if (treeFound) {
      feature = treeFound;
      isTreeFeature = true;
    }
  }

  const isCourseLevel = isTerrainFeature || isPathFeature || isTreeFeature;

  if (!feature || (!hole && !isCourseLevel)) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>{t('editor.noFeatureSelected')}</p>
      </div>
    );
  }

  const featureHoleId = hole?.id;

  const handleUpdate = (updates: Partial<DiscGolfFeature['properties']> | Partial<TerrainFeature['properties']> | Partial<PathFeature['properties']> | Partial<TreeFeature['properties']>) => {
    saveSnapshot(course.id);
    if (isTerrainFeature) {
      updateTerrainFeature(course.id, selectedFeatureId, updates as Partial<TerrainFeature['properties']>);
    } else if (isPathFeature) {
      updatePathFeature(course.id, selectedFeatureId, updates as Partial<PathFeature['properties']>);
    } else if (isTreeFeature) {
      updateTreeFeature(course.id, selectedFeatureId, updates as Partial<TreeFeature['properties']>);
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
    } else if (isTreeFeature) {
      deleteTreeFeature(course.id, selectedFeatureId);
    } else if (featureHoleId) {
      deleteFeature(course.id, featureHoleId, selectedFeatureId);
    }
    setSelectedFeature(null);
  };

  const handleClose = () => {
    setSelectedFeature(null);
  };

  // Calculate distance for tee (to basket) - helper for distance display logic kept in main component if specific to layout context
  // But actually TeeProperties doesn't need it inside the component if we pass it or if we keep the "header" logic here.
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

      {/* Distance display for tee - kept here as common layout element */}
      {feature.properties.type === 'tee' && distanceToBasket !== null && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">{t('hole.distance')}</div>
          <div className="text-2xl font-bold text-blue-700">
            {formatDistance(distanceToBasket, units)}
          </div>
        </div>
      )}

      {/* Render specific properties based on type */}
      {feature.properties.type === 'tee' && (
        <TeeProperties feature={feature as TeeFeature} onUpdate={handleUpdate} courseStyle={course.style} />
      )}
      {feature.properties.type === 'dropzone' && (
        <DropzoneProperties feature={feature as DropzoneFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'obZone' && (
        <ObZoneProperties feature={feature as DiscGolfFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'obLine' && (
        <ObLineProperties feature={feature as OBLineFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'dropzoneArea' && (
        <DropzoneAreaProperties feature={feature as DropzoneAreaFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'mandatory' && (
        <MandatoryProperties feature={feature as MandatoryFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'flightLine' && (
        <FlightLineProperties feature={feature as FlightLineFeature} onUpdate={handleUpdate} courseStyle={course.style} />
      )}
      {feature.properties.type === 'annotation' && (
        <AnnotationProperties feature={feature as AnnotationFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'terrain' && (
        <TerrainProperties feature={feature as TerrainFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'path' && (
        <PathProperties feature={feature as PathFeature} onUpdate={handleUpdate} />
      )}
      {feature.properties.type === 'tree' && (
        <TreeProperties feature={feature as TreeFeature} onUpdate={handleUpdate} />
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