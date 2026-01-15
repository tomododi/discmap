import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Map, List, Palette, Layers, Settings2, MapPin, Pencil, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useEditorStore, useSettingsStore, useCourseStore } from '../../stores';
import { HoleList } from '../editor/HoleList';
import { HoleEditor } from '../editor/HoleEditor';
import { LayerControls } from '../editor/LayerControls';
import { FeatureProperties } from '../editor/FeatureProperties';
import { ColorSchemeEditor } from '../editor/ColorSchemeEditor';
import { LandmarkEditor } from '../editor/LandmarkEditor';

type Tab = 'holes' | 'style' | 'layers' | 'properties' | 'landmarks';

export function Sidebar() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('holes');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const sidebarCollapsed = useEditorStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const sidebarPosition = useSettingsStore((s) => s.sidebarPosition);
  const selectedFeatureId = useEditorStore((s) => s.selectedFeatureId);
  const activeCourseId = useEditorStore((s) => s.activeCourseId);
  const course = useCourseStore((s) => activeCourseId ? s.courses[activeCourseId] : null);
  const updateCourse = useCourseStore((s) => s.updateCourse);

  // Auto-switch to properties tab when a feature is selected
  useEffect(() => {
    if (selectedFeatureId) {
      setActiveTab('properties');
    }
  }, [selectedFeatureId]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleStartEditing = () => {
    if (course) {
      setEditedName(course.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (activeCourseId && editedName.trim()) {
      updateCourse(activeCourseId, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const tabs: { id: Tab; icon: React.ReactNode; labelKey: string; show?: boolean }[] = [
    { id: 'holes', icon: <List size={18} />, labelKey: 'editor.holes' },
    { id: 'properties', icon: <Settings2 size={18} />, labelKey: 'editor.properties', show: !!selectedFeatureId },
    { id: 'landmarks', icon: <MapPin size={18} />, labelKey: 'editor.landmarks' },
    { id: 'layers', icon: <Layers size={18} />, labelKey: 'editor.layers' },
    { id: 'style', icon: <Palette size={18} />, labelKey: 'editor.style' },
  ];

  const visibleTabs = tabs.filter((tab) => tab.show !== false);

  if (sidebarCollapsed) {
    return (
      <button
        onClick={toggleSidebar}
        className={`
          absolute top-1/2 -translate-y-1/2 z-10
          ${sidebarPosition === 'left' ? 'left-0' : 'right-0'}
          bg-white shadow-lg p-2
          ${sidebarPosition === 'left' ? 'rounded-r-lg' : 'rounded-l-lg'}
        `}
      >
        {sidebarPosition === 'left' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    );
  }

  return (
    <div
      className={`
        absolute top-4 bottom-4 z-10 w-80 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden
        ${sidebarPosition === 'left' ? 'left-4' : 'right-4'}
      `}
    >
      {/* Header with editable course name */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Map size={20} className="text-blue-600 flex-shrink-0" />
          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                ref={nameInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveName}
                className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveName}
                className="p-1 rounded hover:bg-gray-100 text-green-600"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1 min-w-0 group">
              <span
                className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
                onClick={handleStartEditing}
                title={course?.name || t('app.name')}
              >
                {course?.name || t('app.name')}
              </span>
              <button
                onClick={handleStartEditing}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('actions.edit')}
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-100 flex-shrink-0 ml-2"
        >
          {sidebarPosition === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar-x">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
              ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.icon}
            <span className="text-xs">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'holes' && (
          <div className="divide-y divide-gray-100">
            <HoleEditor />
            <HoleList />
          </div>
        )}
        {activeTab === 'properties' && <FeatureProperties />}
        {activeTab === 'landmarks' && (
          <div className="p-3">
            <LandmarkEditor />
          </div>
        )}
        {activeTab === 'style' && <ColorSchemeEditor />}
        {activeTab === 'layers' && <LayerControls />}
      </div>
    </div>
  );
}
