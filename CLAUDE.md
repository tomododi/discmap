# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DiscMap is a React + TypeScript web application for creating professional disc golf course maps with satellite imagery backgrounds, SVG export, and tournament support.

## Commands

```bash
npm run dev      # Start dev server (Vite, port 5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite 7
- **Maps**: MapLibre GL JS + react-map-gl (no API keys required)
- **Drawing**: @mapbox/mapbox-gl-draw
- **State**: Zustand with Immer middleware
- **Storage**: IndexedDB via idb-keyval
- **Styling**: Tailwind CSS 4
- **i18n**: react-i18next (PL/EN)
- **Geo calculations**: @turf/turf

## Architecture

### State Management (Zustand + Immer)

Four stores in `src/stores/`:

| Store | Purpose |
|-------|---------|
| `courseStore` | Course data, holes, features, undo/redo (main persistence) |
| `editorStore` | UI state: active selections, draw mode, layer visibility |
| `settingsStore` | User preferences: language, units, auto-save settings |
| `mapStore` | Map viewport state |

All stores use Immer middleware for immutable updates. Import via barrel export: `import { useCourseStore, useEditorStore } from './stores'`.

Key courseStore actions for feature manipulation:
- `addFeature(courseId, holeId, feature)` - Add new feature to hole
- `updateFeature(courseId, holeId, featureId, updates)` - Update feature properties
- `updateFeatureGeometry(courseId, holeId, featureId, coordinates)` - Update feature position/geometry
- `deleteFeature(courseId, holeId, featureId)` - Remove feature

### Data Model Hierarchy

```
Course
├── id, name, location, style (CourseStyle)
├── holes[] (Hole)
│   ├── id, number, par, distances (HoleDistances)
│   └── features[] (DiscGolfFeature)
└── layouts[] (TournamentLayout)
```

**DiscGolfFeature** is a discriminated union based on `properties.type`:
- Point features: `tee`, `basket`, `dropzone`, `mandatory`, `annotation`, `landmark`
- Line features: `flightLine`, `obLine`
- Polygon features: `obZone`, `fairway`, `dropzoneArea`, `infrastructure`

Each feature is a GeoJSON Feature with typed properties. See `src/types/course.ts` for complete type definitions.

### Component Architecture

```
App.tsx
├── MapContainer (MapLibre + react-map-gl)
│   ├── DrawControls (mapbox-gl-draw integration)
│   └── FeatureLayers (renders all course features)
│       └── markers/ (TeeMarker, BasketMarker, DropzoneMarker, MandatoryMarker, LandmarkMarker)
├── Toolbar (drawing tools, navigation, export button)
│   └── ExportDialog (Radix UI Dialog for SVG export)
└── Sidebar (collapsible, left/right position configurable)
    ├── HoleList (hole navigation)
    ├── HoleEditor (par, name, notes)
    ├── FeatureProperties (edit selected feature)
    ├── LandmarkEditor (place decorative elements)
    ├── ColorSchemeEditor (course style colors)
    ├── TerrainEditor (default terrain for export)
    └── LayerControls (12 layer visibility toggles)
```

### Map & Feature Rendering

- Point features (tee, basket, dropzone, mandatory, landmarks) use custom SVG React components via `react-map-gl/Marker`
- Line/polygon features use MapLibre's `Source`/`Layer` for GeoJSON rendering
- Feature selection flows through `editorStore.selectedFeatureId`
- Layers are filtered by `editorStore.showLayers` visibility flags

### Persistence

- Auto-save to IndexedDB every 5 seconds (configurable in settings)
- Storage keys prefixed with `discmap_course_`
- Load on mount, save on course change via `src/utils/storage.ts`

## Key Patterns

### Adding a New Feature Type

1. Add type to `FeatureType` union in `src/types/course.ts`
2. Create properties interface extending `BaseFeatureProperties`
3. Add to `DiscGolfFeature` union
4. Create marker component in `src/components/map/markers/`
5. Add rendering logic to `FeatureLayers.tsx`
6. Add layer visibility toggle to `LayerControls.tsx`
7. Add SVG generator function in `src/utils/svgExport.ts`

### Tee Position System

Three tee positions with distinct colors (configurable in CourseStyle):
- Pro (default red): Professional/advanced
- Amateur (default orange): Intermediate
- Recreational (default green): Beginner

Tee position is stored in `TeeProperties.position` and `FlightLineProperties.position`. The active tee position for drawing is in `editorStore.activeTeePosition`.

### Distance Calculation

Distance calculations use `@turf/turf` in `src/utils/geo.ts`:
- `calculateDistance(from, to, units)` - Point-to-point distance
- `calculateLineLength(coordinates, units)` - Flight line total length
- Units can be 'meters' or 'feet' (from settingsStore)

Hole distances are stored in `Hole.distances` with separate values for each tee position.

### SVG Export System

Export functionality in `src/utils/svgExport.ts`:

- **generateCourseSVG**: Full course map with terrain background, all features
- **generatePrintLayoutSVG**: Print-ready layout with header, map, and hole info table
- **generateHolePageSVG**: Individual hole pages with detailed info

Coordinate transformation: GeoJSON `[lng, lat]` → SVG viewport `[x, y]` using bounds calculation with aspect ratio preservation.

Export options include:
- Terrain & styled background (uses `CourseStyle.defaultTerrain`)
- Compass rose and scale bar
- Infrastructure zones
- Title and legend

### Marker Sizing

All markers use consistent core shape dimensions:

| Marker | Core Shape | React Canvas | Notes |
|--------|-----------|--------------|-------|
| Tee | rect 32×20 | 36×28 | +padding for selection effects |
| Basket | 32×44 | 32×44 | Anchored at bottom |
| Dropzone | rect 32×20 | 36×24 | +padding for selection effects |
| Mandatory | circle r=14 | 32×32 | Includes boundary line |
| Landmarks | varies | dynamic | Uses `defaultSize * 1.5 * size` |

SVG export functions use the same core dimensions with a `scale` parameter for zoom-level adjustments.

## Feature Details

### Draggable Markers
All point features (tees, baskets, dropzones, mandatories, landmarks) are draggable on the map. When a tee or basket is dragged, associated flight lines automatically update their endpoints and recalculate distances.

### Flight Lines
- Auto-created from tee to basket when clicking "Draw Flight Line" (if both exist)
- Colored by tee position (pro/amateur/recreational)
- Distance label displayed at midpoint with tee position color
- Click the distance label to select the flight line
- Endpoints update automatically when tees or baskets are moved

### Flight Line Editing
When a flight line is selected:
- Drag vertices (circles) to reshape the line
- Click the "+" buttons between vertices to add new nodes
- Double-click intermediate vertices to remove them (endpoints cannot be removed)
- Minimum 2 vertices required (start and end)

### Mandatory Markers
- Rotation stored as angle in degrees (0-359, where 0 = right, 90 = down, 180 = left, 270 = up)
- Scroll wheel rotates in 15-degree increments when marker is selected
- Properties panel includes rotation slider and preset direction buttons
- Boundary line extends from center in perpendicular direction

### Terrain System

Defined in `src/types/terrain.ts`:

**10 Terrain Types** with SVG patterns:
- **Ground**: grass, roughGrass, sand
- **Vegetation**: forest, marsh
- **Water**: water
- **Surface**: path, concrete, gravel, rocks

Each terrain has:
- SVG pattern generator with primary/secondary/accent colors
- Default colors from `TERRAIN_PATTERNS`
- Opacity and corner radius options

**Infrastructure Features**: Polygon zones drawn on map with terrain type, exported with styled patterns.

**Default Terrain**: Set in `CourseStyle.defaultTerrain`, used as background in SVG exports.

### Landmark System

Landmarks are decorative point features. See `src/types/landmarks.ts` for the full type catalog (24 types across 5 categories). Each has `defaultSize`, `defaultColor`, and per-instance `size`, `rotation`, `color` overrides.

Components: `LandmarkMarker.tsx` (React) and `landmarkSvg.ts` (export).

### Layer Visibility

12 toggleable layers stored in `editorStore.showLayers`. See `LayerControls.tsx` for the complete list.

## Notes

- Map uses free Esri World Imagery tiles (no API key required)
- Coordinates are `[longitude, latitude]` (GeoJSON standard)
- All marker colors are configurable via CourseStyle (in Style tab)
- Feature creation flow: DrawControls handles mapbox-gl-draw events → creates DiscGolfFeature → adds to courseStore
- Sidebar tabs have horizontal scroll for narrow screens

## Important Implementation Notes

- Marker core shapes are **consistent** between React components (`src/components/map/markers/`) and SVG export (`src/utils/svgExport.ts`). React components add canvas padding for selection/hover effects; export functions use identical shape dimensions with a `scale` parameter.

- When modifying flight lines or tee/basket positions, remember that `FeatureLayers.tsx` handles automatic flight line endpoint updates when tees/baskets are dragged.

- All terrain types are defined in `src/types/terrain.ts` with corresponding SVG pattern generators in `src/utils/svgPatterns.ts`.

- All landmark types are defined in `src/types/landmarks.ts` with SVG generators in `src/utils/landmarkSvg.ts`.
