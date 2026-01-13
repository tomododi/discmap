import { create } from 'zustand';

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface MapState {
  viewState: ViewState;
  isMapLoaded: boolean;
}

interface MapActions {
  setViewState: (viewState: Partial<ViewState>) => void;
  setIsMapLoaded: (loaded: boolean) => void;
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]], padding?: number) => void;
}

type MapStore = MapState & MapActions;

// Default to Warsaw, Poland area as starting point
const DEFAULT_VIEW_STATE: ViewState = {
  longitude: 21.0122,
  latitude: 52.2297,
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

export const useMapStore = create<MapStore>((set) => ({
  viewState: DEFAULT_VIEW_STATE,
  isMapLoaded: false,

  setViewState: (viewState) =>
    set((state) => ({
      viewState: { ...state.viewState, ...viewState },
    })),

  setIsMapLoaded: (loaded) => set({ isMapLoaded: loaded }),

  flyTo: (longitude, latitude, zoom) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        longitude,
        latitude,
        zoom: zoom ?? state.viewState.zoom,
      },
    })),

  fitBounds: (bounds, _padding = 50) => {
    // Calculate center and appropriate zoom from bounds
    const [[west, south], [east, north]] = bounds;
    const centerLng = (west + east) / 2;
    const centerLat = (south + north) / 2;

    // Rough zoom calculation based on bounds extent
    const latDiff = north - south;
    const lngDiff = east - west;
    const maxDiff = Math.max(latDiff, lngDiff);
    const zoom = Math.max(1, Math.min(18, 14 - Math.log2(maxDiff * 100)));

    set((state) => ({
      viewState: {
        ...state.viewState,
        longitude: centerLng,
        latitude: centerLat,
        zoom,
      },
    }));
  },
}));
