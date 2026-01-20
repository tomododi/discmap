import { useTranslation } from 'react-i18next';
import type { AnnotationFeature } from '../../../types/course';
import type { FeaturePropertyProps } from './types';

export function AnnotationProperties({ feature, onUpdate }: FeaturePropertyProps<AnnotationFeature>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Text input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('annotation.text')}
        </label>
        <textarea
          value={feature.properties.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder={t('annotation.textPlaceholder')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
        />
      </div>

      {/* Font size slider */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('annotation.fontSize')} ({feature.properties.fontSize || 14}px)
        </label>
        <input
          type="range"
          min="10"
          max="32"
          step="1"
          value={feature.properties.fontSize || 14}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
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
          value={feature.properties.fontFamily || 'sans-serif'}
          onChange={(e) => onUpdate({ fontFamily: e.target.value as 'sans-serif' | 'serif' | 'monospace' })}
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
            onClick={() => onUpdate({ fontWeight: 'normal' })}
            className={`
              flex-1 py-1.5 px-2 text-sm rounded-lg transition-colors
              ${feature.properties.fontWeight !== 'bold'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {t('annotation.normal')}
          </button>
          <button
            onClick={() => onUpdate({ fontWeight: 'bold' })}
            className={`
              flex-1 py-1.5 px-2 text-sm font-bold rounded-lg transition-colors
              ${feature.properties.fontWeight === 'bold'
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
            value={feature.properties.textColor || '#000000'}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
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
            value={feature.properties.backgroundColor || '#ffffff'}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
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
            value={feature.properties.borderColor || '#000000'}
            onChange={(e) => onUpdate({ borderColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
