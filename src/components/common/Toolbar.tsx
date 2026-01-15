import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  MousePointer2,
  RectangleHorizontal,
  Target,
  TrendingUp,
  ArrowRight,
  Type,
  Undo2,
  Redo2,
  FolderOpen,
  Upload,
  Download,
  FileImage,
  SquareDashedBottom,
  Minus,
  Trees,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { useEditorStore, useCourseStore } from '../../stores';
import type { DrawMode } from '../../types/editor';
import { ExportDialog } from '../export/ExportDialog';
import { ImportDialog } from '../export/ImportDialog';
import { downloadCourseJSON } from '../../utils/storage';
import { TERRAIN_PATTERNS, type TerrainType } from '../../types/terrain';

interface ToolConfig {
  mode: DrawMode;
  icon: React.ReactNode;
  labelKey: string;
  descriptionKey: string;
}

interface ToolButtonProps {
  mode: DrawMode;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function ToolButton({ icon, label, active, onClick, onMouseEnter, onMouseLeave }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg transition-colors
        ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
      `}
    >
      {icon}
      <span className="text-xs mt-1 hidden sm:block">{label}</span>
    </button>
  );
}

export function Toolbar() {
  const { t } = useTranslation();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<DrawMode | null>(null);
  const [terrainMenuOpen, setTerrainMenuOpen] = useState(false);
  const terrainMenuRef = useRef<HTMLDivElement>(null);

  const drawMode = useEditorStore((s) => s.drawMode);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const pendingFlightLine = useEditorStore((s) => s.pendingFlightLine);
  const activeTerrainType = useEditorStore((s) => s.activeTerrainType);
  const setActiveTerrainType = useEditorStore((s) => s.setActiveTerrainType);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const undo = useCourseStore((s) => s.undo);
  const redo = useCourseStore((s) => s.redo);
  const undoStack = useCourseStore((s) => s.undoStack);
  const redoStack = useCourseStore((s) => s.redoStack);

  // Close terrain menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (terrainMenuRef.current && !terrainMenuRef.current.contains(e.target as Node)) {
        setTerrainMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tools: ToolConfig[] = [
    { mode: 'select', icon: <MousePointer2 size={20} />, labelKey: 'toolbar.select', descriptionKey: 'toolbarDesc.select' },
    { mode: 'tee', icon: <RectangleHorizontal size={20} />, labelKey: 'toolbar.placeTee', descriptionKey: 'toolbarDesc.tee' },
    { mode: 'basket', icon: <Target size={20} />, labelKey: 'toolbar.placeBasket', descriptionKey: 'toolbarDesc.basket' },
    { mode: 'dropzone', icon: <MapPin size={20} />, labelKey: 'toolbar.placeDropzone', descriptionKey: 'toolbarDesc.dropzone' },
    { mode: 'flightLine', icon: <TrendingUp size={20} />, labelKey: 'toolbar.drawFlightLine', descriptionKey: 'toolbarDesc.flightLine' },
    { mode: 'dropzoneArea', icon: <SquareDashedBottom size={20} />, labelKey: 'toolbar.drawDropzoneArea', descriptionKey: 'toolbarDesc.dropzoneArea' },
    { mode: 'obLine', icon: <Minus size={20} />, labelKey: 'toolbar.drawOBLine', descriptionKey: 'toolbarDesc.obLine' },
    { mode: 'mandatory', icon: <ArrowRight size={20} />, labelKey: 'toolbar.placeMandatory', descriptionKey: 'toolbarDesc.mandatory' },
    { mode: 'annotation', icon: <Type size={20} />, labelKey: 'toolbar.placeAnnotation', descriptionKey: 'toolbarDesc.annotation' },
    { mode: 'infrastructure', icon: <Trees size={20} />, labelKey: 'toolbar.drawTerrain', descriptionKey: 'toolbarDesc.infrastructure' },
  ];

  const handleTerrainSelect = (terrainType: TerrainType) => {
    setActiveTerrainType(terrainType);
    setDrawMode('infrastructure');
    setTerrainMenuOpen(false);
  };

  // Get the description to show - either hovered tool or active tool
  const activeDescription = hoveredTool || drawMode;
  const activeTool = tools.find(t => t.mode === activeDescription);

  // Special status message for flight line mode
  const getFlightLineStatus = () => {
    if (drawMode !== 'flightLine') return null;
    if (pendingFlightLine) {
      return t('toolbarDesc.flightLineStep2');
    }
    return t('toolbarDesc.flightLineStep1');
  };

  const flightLineStatus = getFlightLineStatus();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
      {/* Main toolbar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-1 flex items-center gap-1">
        {tools.map((tool) => (
          tool.mode === 'infrastructure' ? (
            // Special terrain tool with dropdown
            <div key={tool.mode} className="relative" ref={terrainMenuRef}>
              <button
                onClick={() => {
                  if (drawMode === 'infrastructure') {
                    setTerrainMenuOpen(!terrainMenuOpen);
                  } else {
                    setDrawMode('infrastructure');
                    setTerrainMenuOpen(true);
                  }
                }}
                onMouseEnter={() => setHoveredTool(tool.mode)}
                onMouseLeave={() => setHoveredTool(null)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg transition-colors
                  ${drawMode === 'infrastructure' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-0.5">
                  {tool.icon}
                  <ChevronDown size={12} className={`transition-transform ${terrainMenuOpen ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-xs mt-1 hidden sm:block">{t(tool.labelKey)}</span>
              </button>

              {/* Terrain type dropdown */}
              {terrainMenuOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[200px] z-50">
                  <div className="text-xs font-medium text-gray-500 px-2 mb-2">{t('terrain.types', 'Select Terrain')}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {(Object.keys(TERRAIN_PATTERNS) as TerrainType[]).map((terrainType) => {
                      const pattern = TERRAIN_PATTERNS[terrainType];
                      const isActive = activeTerrainType === terrainType;
                      return (
                        <button
                          key={terrainType}
                          onClick={() => handleTerrainSelect(terrainType)}
                          className={`
                            flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors
                            ${isActive ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-100 text-gray-700'}
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
              )}
            </div>
          ) : (
            <ToolButton
              key={tool.mode}
              mode={tool.mode}
              icon={tool.icon}
              label={t(tool.labelKey)}
              active={drawMode === tool.mode}
              onClick={() => setDrawMode(tool.mode)}
              onMouseEnter={() => setHoveredTool(tool.mode)}
              onMouseLeave={() => setHoveredTool(null)}
            />
          )
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

        {/* File Menu Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              title={t('file.menu', 'File')}
            >
              <div className="flex items-center gap-0.5">
                <FolderOpen size={20} />
                <ChevronDown size={12} />
              </div>
              <span className="text-xs mt-1 hidden sm:block">{t('file.menu', 'File')}</span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="bg-white rounded-xl shadow-xl border border-gray-200 p-1 min-w-[180px] z-50"
              sideOffset={8}
            >
              <DropdownMenu.Item
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none"
                onSelect={() => setImportDialogOpen(true)}
              >
                <Upload size={16} />
                {t('file.importJson', 'Import JSON...')}
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                onSelect={() => course && downloadCourseJSON(course)}
                disabled={!course}
              >
                <Download size={16} />
                {t('file.exportJson', 'Export JSON')}
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

              <DropdownMenu.Item
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                onSelect={() => setExportDialogOpen(true)}
                disabled={!course}
              >
                <FileImage size={16} />
                {t('file.exportSvg', 'Export SVG...')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Sliding tooltip */}
      <div
        className={`
          mt-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg
          max-w-md text-center transition-all duration-200 ease-out
          ${(hoveredTool || drawMode !== 'select') ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}
      >
        {flightLineStatus ? (
          <span className="text-yellow-300 font-medium">{flightLineStatus}</span>
        ) : activeTool ? (
          t(activeTool.descriptionKey)
        ) : null}
      </div>

      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
}
