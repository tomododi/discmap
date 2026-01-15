import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseStyle } from '../types/course';

export type Units = 'meters' | 'feet';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'pl';

interface AppSettings {
  units: Units;
  autoSave: boolean;
  autoSaveInterval: number;
  mapboxAccessToken: string;
  defaultMapStyle: CourseStyle['mapStyle'];
  sidebarPosition: 'left' | 'right';
  showToolTips: boolean;
  theme: Theme;
  language: Language;
}

interface SettingsActions {
  setUnits: (units: Units) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  setMapboxAccessToken: (token: string) => void;
  setDefaultMapStyle: (style: CourseStyle['mapStyle']) => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  setShowToolTips: (show: boolean) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  resetSettings: () => void;
}

type SettingsStore = AppSettings & SettingsActions;

const DEFAULT_SETTINGS: AppSettings = {
  units: 'meters',
  autoSave: true,
  autoSaveInterval: 5000,
  mapboxAccessToken: '',
  defaultMapStyle: 'satellite',
  sidebarPosition: 'left',
  showToolTips: true,
  theme: 'system',
  language: 'pl',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setUnits: (units) => set({ units }),
      setAutoSave: (enabled) => set({ autoSave: enabled }),
      setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
      setMapboxAccessToken: (token) => set({ mapboxAccessToken: token }),
      setDefaultMapStyle: (style) => set({ defaultMapStyle: style }),
      setSidebarPosition: (position) => set({ sidebarPosition: position }),
      setShowToolTips: (show) => set({ showToolTips: show }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'discmap-settings',
    }
  )
);
