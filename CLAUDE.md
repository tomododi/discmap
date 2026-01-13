# DiscMap - Disc Golf Course Mapping Platform

## Project Overview
React + TypeScript aplikacja do tworzenia profesjonalnych map pól disc golfowych z satelitarnym podkładem (Esri), eksportem SVG i wsparciem turniejowym.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite 6
- **Maps**: MapLibre GL JS + react-map-gl (darmowe, bez tokenów)
- **Drawing**: @mapbox/mapbox-gl-draw
- **State**: Zustand + Immer
- **Storage**: IndexedDB (idb-keyval)
- **Styling**: Tailwind CSS 4
- **i18n**: react-i18next (PL/EN)
- **Geo**: @turf/turf (distance calculations)

## Project Structure
```
src/
├── components/
│   ├── common/          # Button, Toolbar, Sidebar
│   ├── map/             # MapContainer, DrawControls, FeatureLayers
│   │   └── markers/     # TeeMarker, BasketMarker, DropzoneMarker, MandatoryMarker
│   └── editor/          # HoleList, HoleEditor, LayerControls, FeatureProperties
├── stores/              # courseStore, editorStore, settingsStore, mapStore
├── types/               # course.ts, editor.ts, export.ts
├── utils/               # geo.ts, storage.ts
├── lib/                 # mapbox.ts (MapLibre config)
└── i18n/                # en.json, pl.json
```

## Current Status: Phase 2 COMPLETED

### Completed Features:
- [x] Phase 1: Foundation
  - Vite + React + TypeScript + Tailwind setup
  - MapLibre GL JS with free Esri satellite imagery
  - Basic mapbox-gl-draw integration
  - Zustand stores (course, editor, settings, map)
  - IndexedDB storage layer with auto-save
  - i18n setup (PL/EN)
  - Basic layout (sidebar + map + toolbar)

- [x] Phase 2: Course Editor Core
  - Custom SVG markers (tee, basket, dropzone, mandatory)
  - Feature property panel (edit selected features)
  - Automatic distance calculation (tee-to-basket via Turf.js)
  - Hole editor (par, name, notes)
  - Tee position selector (Pro/Am/Rec)
  - Hole navigation with fly-to

### Next: Phase 3 - Styling & Export
- [ ] Color scheme editor per course
- [ ] SVG export functionality
- [ ] GeoJSON to SVG coordinate transformation
- [ ] Legend generation
- [ ] Print-ready layout template

### Future Phases:
- Phase 4: Tournament features (multiple tee positions, layouts, scorecards)
- Phase 5: Polish (keyboard shortcuts, undo/redo improvements)

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/stores/courseStore.ts` | Main state - courses, holes, features, undo/redo |
| `src/components/map/MapContainer.tsx` | Map component with MapLibre |
| `src/components/map/DrawControls.tsx` | Drawing integration |
| `src/components/map/FeatureLayers.tsx` | Renders features + custom markers |
| `src/types/course.ts` | All TypeScript interfaces |
| `src/lib/mapbox.ts` | MapLibre style configuration |
| `src/utils/geo.ts` | Distance calculations with Turf.js |
| `src/utils/storage.ts` | IndexedDB operations |

## Data Model Summary
```typescript
Course {
  id, name, location, holes[], style, layouts[]
}

Hole {
  id, number, par, distances, features[], notes, rules
}

DiscGolfFeature = TeeFeature | BasketFeature | FlightLineFeature | OBZoneFeature | FairwayFeature | DropzoneFeature | MandatoryFeature
```

## Commands
```bash
npm run dev      # Start dev server (port 5173/5174)
npm run build    # Production build
npm run preview  # Preview production build
```

## Notes
- Map uses free Esri World Imagery tiles (no API key needed)
- Data persists to IndexedDB automatically every 5 seconds
- Language can be switched via settings store (default: English)
- Tee positions: Pro (red), Amateur (orange), Recreational (green)
