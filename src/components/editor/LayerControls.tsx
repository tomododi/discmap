import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
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
        w-full flex items-center justify-between p-3 rounded-lg transition-colors
        ${visible ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100 opacity-60 hover:opacity-80'}
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full border-2"
          style={{ backgroundColor: visible ? color : 'transparent', borderColor: color }}
        />
        <span className={`text-sm ${visible ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      {visible ? (
        <Eye size={16} className="text-gray-400" />
      ) : (
        <EyeOff size={16} className="text-gray-400" />
      )}
    </button>
  );
}

export function LayerControls() {
  const { t } = useTranslation();
  const showLayers = useEditorStore((s) => s.showLayers);
  const toggleLayer = useEditorStore((s) => s.toggleLayer);
  const toggleAllLayers = useEditorStore((s) => s.toggleAllLayers);

  const layers: { name: keyof LayerVisibility; labelKey: string; color: string }[] = [
    { name: 'tees', labelKey: 'layers.tees', color: '#22c55e' },
    { name: 'baskets', labelKey: 'layers.baskets', color: '#ef4444' },
    { name: 'flightLines', labelKey: 'layers.flightLines', color: '#3b82f6' },
    { name: 'obZones', labelKey: 'layers.obZones', color: '#dc2626' },
    { name: 'fairways', labelKey: 'layers.fairways', color: '#86efac' },
    { name: 'dropzones', labelKey: 'layers.dropzones', color: '#f59e0b' },
    { name: 'mandatories', labelKey: 'layers.mandatories', color: '#8b5cf6' },
  ];

  const allVisible = Object.values(showLayers).every((v) => v);
  const noneVisible = Object.values(showLayers).every((v) => !v);

  return (
    <div className="p-3 space-y-2">
      {/* Quick toggles */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => toggleAllLayers(true)}
          disabled={allVisible}
          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('layers.showAll')}
        </button>
        <button
          onClick={() => toggleAllLayers(false)}
          disabled={noneVisible}
          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('layers.hideAll')}
        </button>
      </div>

      {/* Individual layers */}
      <div className="space-y-1">
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
    </div>
  );
}
