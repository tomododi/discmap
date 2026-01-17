import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DrawMode, EditorState, LayerVisibility, PendingFlightLine, TreeBrushSettings } from '../types/editor';
import { DEFAULT_EDITOR_STATE } from '../types/editor';
import type { TerrainType } from '../types/terrain';
import type { TreeType } from '../types/trees';

interface EditorActions {
  setActiveCourse: (courseId: string | null) => void;
  setActiveHole: (holeId: string | null) => void;
  setSelectedFeature: (featureId: string | null) => void;
  setDrawMode: (mode: DrawMode) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setLayerVisibility: (layer: keyof LayerVisibility, visible: boolean) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  toggleAllLayers: (visible: boolean) => void;
  setShowAllHoles: (show: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPendingFlightLine: (pending: PendingFlightLine | null) => void;
  clearPendingFlightLine: () => void;
  setActiveTerrainType: (terrainType: TerrainType) => void;
  setActiveTreeType: (treeType: TreeType) => void;
  setTreeBrushEnabled: (enabled: boolean) => void;
  setTreeBrushSettings: (settings: Partial<TreeBrushSettings>) => void;
  reset: () => void;
}

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
  immer((set) => ({
    ...DEFAULT_EDITOR_STATE,

    setActiveCourse: (courseId) => {
      set((state) => {
        state.activeCourseId = courseId;
        state.activeHoleId = null;
        state.selectedFeatureId = null;
      });
      // Persist to localStorage so it survives page refresh
      if (courseId) {
        localStorage.setItem('discmap_activeCourseId', courseId);
      } else {
        localStorage.removeItem('discmap_activeCourseId');
      }
    },

    setActiveHole: (holeId) => {
      set((state) => {
        state.activeHoleId = holeId;
        state.selectedFeatureId = null;
      });
    },

    setSelectedFeature: (featureId) => {
      set((state) => {
        state.selectedFeatureId = featureId;
      });
    },

    setDrawMode: (mode) => {
      set((state) => {
        state.drawMode = mode;
        state.isDrawing = mode !== 'select';
        // Clear pending flight line when changing draw mode
        state.pendingFlightLine = null;
      });
    },

    setIsDrawing: (isDrawing) => {
      set((state) => {
        state.isDrawing = isDrawing;
      });
    },

    setLayerVisibility: (layer, visible) => {
      set((state) => {
        state.showLayers[layer] = visible;
      });
    },

    toggleLayer: (layer) => {
      set((state) => {
        state.showLayers[layer] = !state.showLayers[layer];
      });
    },

    toggleAllLayers: (visible) => {
      set((state) => {
        Object.keys(state.showLayers).forEach((key) => {
          state.showLayers[key as keyof LayerVisibility] = visible;
        });
      });
    },

    setShowAllHoles: (show) => {
      set((state) => {
        state.showAllHoles = show;
      });
    },

    toggleSidebar: () => {
      set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      });
    },

    setSidebarCollapsed: (collapsed) => {
      set((state) => {
        state.sidebarCollapsed = collapsed;
      });
    },

    setPendingFlightLine: (pending) => {
      set((state) => {
        state.pendingFlightLine = pending;
      });
    },

    clearPendingFlightLine: () => {
      set((state) => {
        state.pendingFlightLine = null;
      });
    },

    setActiveTerrainType: (terrainType) => {
      set((state) => {
        state.activeTerrainType = terrainType;
      });
    },

    setActiveTreeType: (treeType) => {
      set((state) => {
        state.activeTreeType = treeType;
      });
    },

    setTreeBrushEnabled: (enabled) => {
      set((state) => {
        state.treeBrushSettings.enabled = enabled;
      });
    },

    setTreeBrushSettings: (settings) => {
      set((state) => {
        Object.assign(state.treeBrushSettings, settings);
      });
    },

    reset: () => {
      set(() => ({ ...DEFAULT_EDITOR_STATE }));
    },
  }))
);
