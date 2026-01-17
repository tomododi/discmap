import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, ChevronDown } from 'lucide-react';
import { useEditorStore } from '../../stores';
import type { LayerVisibility } from '../../types/editor';

interface LayerToggleProps {
  name: keyof LayerVisibility;
  label: string;
  color: string;
  visible: boolean;
  onToggle: () => void;
}

function LayerToggle({ label, color, visible, onToggle }: LayerToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all
        ${visible ? 'bg-white hover:bg-gray-50' : 'bg-gray-100/50 opacity-60 hover:opacity-80'}
      `}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: visible ? color : 'transparent',
            borderColor: color,
          }}
        />
        <span className={`text-sm ${visible ? 'text-gray-800' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      {/* Modern sliding toggle */}
      <div
        className={`
          w-9 h-5 rounded-full transition-colors relative flex-shrink-0
          ${visible ? 'bg-blue-500' : 'bg-gray-300'}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform
            ${visible ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </div>
    </button>
  );
}

interface LayerGroupProps {
  title: string;
  layers: { name: keyof LayerVisibility; labelKey: string; color: string }[];
  showLayers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  defaultOpen?: boolean;
}

function LayerGroup({ title, layers, showLayers, toggleLayer, defaultOpen = true }: LayerGroupProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const allVisible = layers.every(l => showLayers[l.name]);
  const someVisible = layers.some(l => showLayers[l.name]);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              allVisible ? 'bg-green-500' : someVisible ? 'bg-yellow-500' : 'bg-gray-300'
            }`}
          />
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-1 mt-1">
          {layers.map((layer) => (
            <LayerToggle
              key={layer.name}
              name={layer.name}
              label={t(layer.labelKey)}
              color={layer.color}
              visible={showLayers[layer.name]}
              onToggle={() => toggleLayer(layer.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LayerControls() {
  const { t } = useTranslation();
  const showLayers = useEditorStore((s) => s.showLayers);
  const toggleLayer = useEditorStore((s) => s.toggleLayer);
  const toggleAllLayers = useEditorStore((s) => s.toggleAllLayers);
  const showAllHoles = useEditorStore((s) => s.showAllHoles);
  const setShowAllHoles = useEditorStore((s) => s.setShowAllHoles);

  // Group layers by category
  const layerGroups = [
    {
      title: t('layers.groupMarkers', 'Markers'),
      layers: [
        { name: 'tees' as const, labelKey: 'layers.tees', color: '#22c55e' },
        { name: 'baskets' as const, labelKey: 'layers.baskets', color: '#ef4444' },
        { name: 'dropzones' as const, labelKey: 'layers.dropzones', color: '#f59e0b' },
        { name: 'mandatories' as const, labelKey: 'layers.mandatories', color: '#8b5cf6' },
      ],
    },
    {
      title: t('layers.groupLines', 'Lines'),
      layers: [
        { name: 'flightLines' as const, labelKey: 'layers.flightLines', color: '#3b82f6' },
        { name: 'obLines' as const, labelKey: 'layers.obLines', color: '#dc2626' },
      ],
    },
    {
      title: t('layers.groupZones', 'Zones'),
      layers: [
        { name: 'fairways' as const, labelKey: 'layers.fairways', color: '#86efac' },
        { name: 'obZones' as const, labelKey: 'layers.obZones', color: '#dc2626' },
        { name: 'dropzoneAreas' as const, labelKey: 'layers.dropzoneAreas', color: '#fbbf24' },
      ],
    },
    {
      title: t('layers.groupEnvironment', 'Environment'),
      layers: [
        { name: 'infrastructure' as const, labelKey: 'layers.infrastructure', color: '#16a34a' },
        { name: 'trees' as const, labelKey: 'layers.trees', color: '#228b22' },
        { name: 'paths' as const, labelKey: 'layers.paths', color: '#a8a29e' },
      ],
    },
    {
      title: t('layers.groupOther', 'Other'),
      layers: [
        { name: 'annotations' as const, labelKey: 'layers.annotations', color: '#6b7280' },
      ],
    },
  ];

  const allVisible = Object.values(showLayers).every((v) => v);
  const noneVisible = Object.values(showLayers).every((v) => !v);

  return (
    <div className="p-3 space-y-3">
      {/* Show all holes toggle - prominent card style */}
      <div
        className={`
          rounded-xl p-3 transition-all cursor-pointer
          ${showAllHoles
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm'
            : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}
        `}
        onClick={() => setShowAllHoles(!showAllHoles)}
        title={t('layers.showAllHolesHint')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${showAllHoles ? 'bg-blue-100' : 'bg-gray-200'}`}>
              <Layers size={18} className={showAllHoles ? 'text-blue-600' : 'text-gray-500'} />
            </div>
            <div>
              <span className={`text-sm font-medium ${showAllHoles ? 'text-blue-800' : 'text-gray-700'}`}>
                {t('layers.showAllHoles')}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('layers.showAllHolesHint')}
              </p>
            </div>
          </div>
          <div
            className={`
              w-11 h-6 rounded-full transition-colors relative
              ${showAllHoles ? 'bg-blue-500' : 'bg-gray-300'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform
                ${showAllHoles ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </div>
        </div>
      </div>

      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* Quick toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleAllLayers(true)}
          disabled={allVisible}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-green-200"
        >
          {t('layers.showAll')}
        </button>
        <button
          onClick={() => toggleAllLayers(false)}
          disabled={noneVisible}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-gray-200"
        >
          {t('layers.hideAll')}
        </button>
      </div>

      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* Layer groups */}
      <div className="bg-gray-50/50 rounded-xl p-2">
        {layerGroups.map((group) => (
          <LayerGroup
            key={group.title}
            title={group.title}
            layers={group.layers}
            showLayers={showLayers}
            toggleLayer={toggleLayer}
          />
        ))}
      </div>
    </div>
  );
}
