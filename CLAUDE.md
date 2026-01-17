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

Course-level features (terrain, paths, trees) have separate actions:
- `addTerrainFeature/updateTerrainFeature/deleteTerrainFeature` - Course-level terrain polygons
- `addPathFeature/updatePathFeature/deletePathFeature` - Course-level path lines
- `addTreeFeature/updateTreeFeature/deleteTreeFeature` - Course-level tree markers

### Data Model Hierarchy

```
Course
├── id, name, location, style (CourseStyle)
├── holes[] (Hole)
│   ├── id, number, par
│   └── features[] (DiscGolfFeature)
├── terrainFeatures[] (TerrainFeature) - Course-level polygons
├── pathFeatures[] (PathFeature) - Course-level lines
├── treeFeatures[] (TreeFeature) - Course-level tree markers
└── layouts[] (TournamentLayout)
```

**DiscGolfFeature** is a discriminated union based on `properties.type`:
- Point features: `tee`, `basket`, `dropzone`, `mandatory`, `annotation`
- Line features: `flightLine`, `obLine`
- Polygon features: `obZone`, `fairway`, `dropzoneArea`, `infrastructure`

Each feature is a GeoJSON Feature with typed properties. See `src/types/course.ts` for complete type definitions.

### Component Architecture

```
App.tsx
├── MapContainer (MapLibre + react-map-gl)
│   ├── DrawControls (mapbox-gl-draw integration)
│   └── FeatureLayers (renders all course features)
│       └── markers/ (TeeMarker, BasketMarker, DropzoneMarker, MandatoryMarker, TreeMarker)
├── Toolbar (drawing tools, navigation, export button)
│   └── ExportDialog / ImportDialog
└── Sidebar (collapsible)
    ├── HoleList (hole navigation)
    ├── HoleEditor (par, name, notes)
    ├── FeatureProperties (edit selected feature)
    ├── ColorSchemeEditor (course style colors)
    ├── TerrainEditor (default terrain for export)
    └── LayerControls (13 layer visibility toggles)
```

### Map & Feature Rendering

- Point features (tee, basket, dropzone, mandatory, trees) use custom SVG React components via `react-map-gl/Marker`
- Line/polygon features use MapLibre's `Source`/`Layer` for GeoJSON rendering
- Feature selection flows through `editorStore.selectedFeatureId`
- Layers are filtered by `editorStore.showLayers` visibility flags

### Persistence

- Auto-save to IndexedDB every 5 seconds (configurable in settings)
- Storage keys prefixed with `discmap_course_`
- Active course ID persisted to localStorage (`discmap_activeCourseId`)
- Load on mount, save on course change via `src/utils/storage.ts`
- **JSON Import/Export**: Courses can be exported to JSON files and imported back
  - Export via `downloadCourseJSON(course)` - downloads `{course-name}.json`
  - Import via `importCourseFromJSON(json)` - generates new UUID to avoid conflicts
  - Validation via `validateCourseJSON(json)` - checks required fields
- **Data Migration**: `migrateCourse()` in storage.ts ensures older saved courses get new style properties from `DEFAULT_COURSE_STYLE` and converts invalid tree types

## Key Patterns

### Adding a New Feature Type

1. Add type to `FeatureType` union in `src/types/course.ts`
2. Create properties interface extending `BaseFeatureProperties`
3. Add to `DiscGolfFeature` union
4. Create marker component in `src/components/map/markers/`
5. Add rendering logic to `FeatureLayers.tsx`
6. Add layer visibility toggle to `LayerControls.tsx` and `LayerVisibility` in `src/types/editor.ts`
7. Add SVG generator function in `src/utils/svgExport.ts`

### Tee Colors

Tees use configurable colors from `DEFAULT_TEE_COLORS` array (red, amber, green, blue, purple, pink). Each tee can have its own color, and flight lines inherit the color from their starting tee.

### Distance Calculation

Distance calculations use `@turf/turf` in `src/utils/geo.ts`:
- `calculateDistance(from, to, units)` - Point-to-point distance
- `calculateLineLength(coordinates, units)` - Flight line total length
- Units can be 'meters' or 'feet' (from settingsStore)

### SVG Export System

Export functionality in `src/utils/svgExport.ts`:

- **generateCourseSVG**: Full course map with terrain background, all features
- **generatePrintLayoutSVG**: Print-ready layout with header, map, and hole info table
- **generateHolePageSVG**: Individual hole pages with detailed info

Coordinate transformation: GeoJSON `[lng, lat]` → SVG viewport `[x, y]` using bounds calculation with aspect ratio preservation.

### Marker Sizing

All markers use consistent core shape dimensions:

| Marker | Core Shape | React Canvas | Notes |
|--------|-----------|--------------|-------|
| Tee | rect 32×20 | 36×28 | +padding for selection effects |
| Basket | 32×44 | 32×44 | Anchored at bottom |
| Dropzone | rect 32×20 | 36×24 | +padding for selection effects |
| Mandatory | circle r=14 | 32×32 | Includes boundary line |
| Trees | varies | dynamic | Uses `defaultSize * size` from TreePattern |

SVG export functions use the same core dimensions with a `scale` parameter for zoom-level adjustments.

## Feature Details

### Draggable Markers
All point features (tees, baskets, dropzones, mandatories, trees) are draggable on the map. When a tee or basket is dragged, associated flight lines automatically update their endpoints and recalculate distances.

### Flight Lines
- Created by selecting a tee or dropzone, then clicking a basket
- `FlightLineProperties.startFrom` indicates whether line starts from 'tee' or 'dropzone'
- `FlightLineProperties.startFeatureId` links to the starting feature
- Distance label displayed at midpoint
- Endpoints update automatically when tees or baskets are moved

### Mandatory Markers
- Two independent rotations: `rotation` (arrow direction) and `lineAngle` (boundary line direction)
- Arrow rotation: 0 = right, 90 = down, 180 = left, 270 = up
- Scroll wheel rotates arrow in 15-degree increments when marker is selected
- Properties panel includes rotation controls and preset direction buttons

### Terrain System

Defined in `src/types/terrain.ts`:

**10 Terrain Types** with SVG patterns:
- **Ground**: grass, roughGrass, sand
- **Vegetation**: forest, marsh
- **Water**: water
- **Surface**: path, concrete, gravel, rocks

Each terrain has SVG pattern generator with primary/secondary/accent colors in `src/utils/svgPatterns.ts`.

**Default Terrain**: Set in `CourseStyle.defaultTerrain`, used as background in SVG exports.

### Tree System

Defined in `src/types/trees.ts`:

**5 Tree Types** (deciduous: oak, maple, birch; conifer: pine, spruce)

Each tree has:
- `defaultSize` and `defaultColors` (primary, secondary, accent)
- Per-instance `size`, `rotation`, `opacity`, `customColors` overrides

Tree brush mode allows painting multiple trees with configurable density and size variation.

Components: `TreeMarker.tsx` (React) and `treeSvg.ts` (SVG export).

### Layer Visibility

13 toggleable layers stored in `editorStore.showLayers`:
infrastructure, trees, tees, baskets, flightLines, fairways, obZones, obLines, dropzoneAreas, dropzones, mandatories, annotations, paths

## Notes

- Map uses free Esri World Imagery tiles (no API key required)
- Coordinates are `[longitude, latitude]` (GeoJSON standard)
- All marker colors are configurable via CourseStyle (in Style tab)
- Feature creation flow: DrawControls handles mapbox-gl-draw events → creates DiscGolfFeature → adds to courseStore
- Onboarding system in `src/components/onboarding/` guides new users

## Implementation Notes

- Marker core shapes are **consistent** between React components (`src/components/map/markers/`) and SVG export (`src/utils/svgExport.ts`). React components add canvas padding for selection/hover effects; export functions use identical shape dimensions with a `scale` parameter.

- When modifying flight lines or tee/basket positions, remember that `FeatureLayers.tsx` handles automatic flight line endpoint updates when tees/baskets are dragged.

- All terrain types are defined in `src/types/terrain.ts` with corresponding SVG pattern generators in `src/utils/svgPatterns.ts`.

- All tree types are defined in `src/types/trees.ts` with SVG generators in `src/utils/treeSvg.ts`.
