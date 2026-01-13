import { useTranslation } from 'react-i18next';
import {
  MousePointer2,
  Circle,
  Target,
  TrendingUp,
  Square,
  Hexagon,
  MapPin,
  ArrowRight,
  Undo2,
  Redo2,
  Download,
} from 'lucide-react';
import { useEditorStore, useCourseStore } from '../../stores';
import type { DrawMode } from '../../types/editor';

interface ToolButtonProps {
  mode: DrawMode;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg transition-colors
        ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
      `}
      title={label}
    >
      {icon}
      <span className="text-xs mt-1 hidden sm:block">{label}</span>
    </button>
  );
}

export function Toolbar() {
  const { t } = useTranslation();
  const drawMode = useEditorStore((s) => s.drawMode);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const undo = useCourseStore((s) => s.undo);
  const redo = useCourseStore((s) => s.redo);
  const undoStack = useCourseStore((s) => s.undoStack);
  const redoStack = useCourseStore((s) => s.redoStack);

  const tools: { mode: DrawMode; icon: React.ReactNode; labelKey: string }[] = [
    { mode: 'select', icon: <MousePointer2 size={20} />, labelKey: 'toolbar.select' },
    { mode: 'tee', icon: <Circle size={20} />, labelKey: 'toolbar.placeTee' },
    { mode: 'basket', icon: <Target size={20} />, labelKey: 'toolbar.placeBasket' },
    { mode: 'flightLine', icon: <TrendingUp size={20} />, labelKey: 'toolbar.drawFlightLine' },
    { mode: 'obZone', icon: <Square size={20} />, labelKey: 'toolbar.drawOB' },
    { mode: 'fairway', icon: <Hexagon size={20} />, labelKey: 'toolbar.drawFairway' },
    { mode: 'dropzone', icon: <MapPin size={20} />, labelKey: 'toolbar.placeDropzone' },
    { mode: 'mandatory', icon: <ArrowRight size={20} />, labelKey: 'toolbar.placeMandatory' },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-1 flex items-center gap-1">
      {tools.map((tool) => (
        <ToolButton
          key={tool.mode}
          mode={tool.mode}
          icon={tool.icon}
          label={t(tool.labelKey)}
          active={drawMode === tool.mode}
          onClick={() => setDrawMode(tool.mode)}
        />
      ))}

      <div className="w-px h-8 bg-gray-200 mx-2" />

      <button
        onClick={undo}
        disabled={undoStack.length === 0}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        title={t('toolbar.undo')}
      >
        <Undo2 size={20} />
      </button>

      <button
        onClick={redo}
        disabled={redoStack.length === 0}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        title={t('toolbar.redo')}
      >
        <Redo2 size={20} />
      </button>

      <div className="w-px h-8 bg-gray-200 mx-2" />

      <button
        onClick={() => {/* TODO: Open export dialog */}}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        title={t('toolbar.export')}
      >
        <Download size={20} />
      </button>
    </div>
  );
}
