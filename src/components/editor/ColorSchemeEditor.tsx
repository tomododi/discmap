import { useTranslation } from 'react-i18next';
import { useCourseStore, useEditorStore } from '../../stores';
import type { CourseStyle } from '../../types/course';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border border-gray-300 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
        />
      </div>
    </div>
  );
}

interface OpacityInputProps {
  label: string;
  value: number;
  onChange: (opacity: number) => void;
}

function OpacityInput({ label, value, onChange }: OpacityInputProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-500 w-8 text-right">
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  );
}

interface WidthInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (width: number) => void;
}

function WidthInput({ label, value, min, max, onChange }: WidthInputProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-500 w-8 text-right">
          {value}px
        </span>
      </div>
    </div>
  );
}

export function ColorSchemeEditor() {
  const { t } = useTranslation();
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const updateStyle = useCourseStore((s) => s.updateStyle);
  const saveSnapshot = useCourseStore((s) => s.saveSnapshot);

  if (!course) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        {t('editor.noFeatureSelected')}
      </div>
    );
  }

  const style = course.style;

  const handleStyleChange = (updates: Partial<CourseStyle>) => {
    saveSnapshot(course.id);
    updateStyle(course.id, updates);
  };

  return (
    <div className="p-3 space-y-5 overflow-y-auto">
      {/* Default Tee Color Section */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('style.teeColor')}
        </h4>
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <ColorInput
            label={t('features.tee')}
            value={style.defaultTeeColor}
            onChange={(color) => handleStyleChange({ defaultTeeColor: color })}
          />
          <p className="text-xs text-gray-500 mt-2">
            Individual tees can have custom colors set in their properties.
          </p>
        </div>
      </section>

      {/* Basket Colors Section */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('features.basket')}
        </h4>
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <ColorInput
            label={t('style.basketTop')}
            value={style.basketTopColor}
            onChange={(color) => handleStyleChange({ basketTopColor: color })}
          />
          <ColorInput
            label={t('style.basketBody')}
            value={style.basketBodyColor}
            onChange={(color) => handleStyleChange({ basketBodyColor: color })}
          />
          <ColorInput
            label={t('style.basketChains')}
            value={style.basketChainColor}
            onChange={(color) => handleStyleChange({ basketChainColor: color })}
          />
          <ColorInput
            label={t('style.basketPole')}
            value={style.basketPoleColor}
            onChange={(color) => handleStyleChange({ basketPoleColor: color })}
          />
        </div>
      </section>

      {/* Zones Section */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('style.zones')}
        </h4>
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <ColorInput
            label={t('features.obZone')}
            value={style.obZoneColor}
            onChange={(color) => handleStyleChange({ obZoneColor: color })}
          />
          <OpacityInput
            label={t('style.obOpacity')}
            value={style.obZoneOpacity}
            onChange={(opacity) => handleStyleChange({ obZoneOpacity: opacity })}
          />
          <div className="border-t border-gray-200 my-2" />
          <ColorInput
            label={t('features.fairway')}
            value={style.fairwayColor}
            onChange={(color) => handleStyleChange({ fairwayColor: color })}
          />
          <OpacityInput
            label={t('style.fairwayOpacity')}
            value={style.fairwayOpacity}
            onChange={(opacity) => handleStyleChange({ fairwayOpacity: opacity })}
          />
        </div>
      </section>

      {/* Flight Line Section */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('features.flightLine')}
        </h4>
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <ColorInput
            label={t('style.lineColor')}
            value={style.defaultFlightLineColor}
            onChange={(color) => handleStyleChange({ defaultFlightLineColor: color })}
          />
          <WidthInput
            label={t('style.lineWidth')}
            value={style.flightLineWidth}
            min={1}
            max={6}
            onChange={(width) => handleStyleChange({ flightLineWidth: width })}
          />
          <p className="text-xs text-gray-500 mt-2">
            Flight lines inherit color from their starting tee/dropzone.
          </p>
        </div>
      </section>

      {/* Other Markers Section */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t('style.otherMarkers')}
        </h4>
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          <ColorInput
            label={t('features.dropzone')}
            value={style.dropzoneColor}
            onChange={(color) => handleStyleChange({ dropzoneColor: color })}
          />
          <ColorInput
            label={t('features.mandatory')}
            value={style.mandatoryColor}
            onChange={(color) => handleStyleChange({ mandatoryColor: color })}
          />
        </div>
      </section>
    </div>
  );
}
