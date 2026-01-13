import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Map, List, Palette, Layers, Settings2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEditorStore, useSettingsStore } from '../../stores';
import { HoleList } from '../editor/HoleList';
import { HoleEditor } from '../editor/HoleEditor';
import { LayerControls } from '../editor/LayerControls';
import { FeatureProperties } from '../editor/FeatureProperties';

type Tab = 'holes' | 'style' | 'layers' | 'properties';

export function Sidebar() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('holes');
  const sidebarCollapsed = useEditorStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const sidebarPosition = useSettingsStore((s) => s.sidebarPosition);
  const selectedFeatureId = useEditorStore((s) => s.selectedFeatureId);

  // Auto-switch to properties tab when a feature is selected
  useEffect(() => {
    if (selectedFeatureId) {
      setActiveTab('properties');
    }
  }, [selectedFeatureId]);

  const tabs: { id: Tab; icon: React.ReactNode; labelKey: string; show?: boolean }[] = [
    { id: 'holes', icon: <List size={18} />, labelKey: 'editor.holes' },
    { id: 'properties', icon: <Settings2 size={18} />, labelKey: 'editor.properties', show: !!selectedFeatureId },
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Map size={20} className="text-blue-600" />
          <span className="font-semibold text-gray-900">{t('app.name')}</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-100"
        >
          {sidebarPosition === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.icon}
            <span className="hidden lg:inline text-xs">{t(tab.labelKey)}</span>
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
        {activeTab === 'style' && (
          <div className="p-4 text-gray-500 text-sm">
            {t('editor.style')} - Coming soon
          </div>
        )}
        {activeTab === 'layers' && <LayerControls />}
      </div>
    </div>
  );
}
