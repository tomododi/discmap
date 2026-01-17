import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores';
import type { CourseStyle } from '../../types/course';

export function MapStyleSwitcher() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const defaultMapStyle = useSettingsStore((s) => s.defaultMapStyle);
  const setDefaultMapStyle = useSettingsStore((s) => s.setDefaultMapStyle);

  const styles: { id: CourseStyle['mapStyle']; label: string; icon: ReactNode }[] = [
    {
      id: 'satellite',
      label: t('mapStyle.satellite'),
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'outdoors',
      label: t('mapStyle.outdoors'),
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M8.157 2.176a1.5 1.5 0 00-1.147 0l-4.084 1.69A1.5 1.5 0 002 5.25v10.877a1.5 1.5 0 002.074 1.386l3.51-1.452 4.26 1.762a1.5 1.5 0 001.146 0l4.083-1.69A1.5 1.5 0 0018 14.75V3.873a1.5 1.5 0 00-2.073-1.386l-3.51 1.452-4.26-1.762zM7.58 5a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 017.58 5zm5.59 2.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  const currentStyle = styles.find((s) => s.id === defaultMapStyle) || styles[0];

  return (
    <div
      className="absolute bottom-44 right-2.5 z-10"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {isExpanded ? (
        <div className="flex flex-col gap-1 bg-white/95 rounded-lg shadow-md p-1 border border-gray-200">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                setDefaultMapStyle(style.id);
                setIsExpanded(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                defaultMapStyle === style.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={style.label}
            >
              {style.icon}
              <span>{style.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          className="flex items-center justify-center w-[29px] h-[29px] bg-white rounded shadow border border-gray-200 text-gray-600 hover:bg-gray-50"
          title={currentStyle.label}
        >
          {currentStyle.icon}
        </button>
      )}
    </div>
  );
}
