# DiscMap

A web-based disc golf course map editor with satellite imagery, SVG export, and tournament support.

## Features

- **Interactive Map Editor** - Draw courses on satellite imagery (Esri World Imagery, no API key required)
- **Complete Course Elements**
  - Tees with custom colors and rotation
  - Baskets with configurable colors
  - Flight lines with distance calculation
  - Mandatory markers with independent arrow and boundary line rotation
  - OB zones and OB lines with fairway/OB side indicators
  - Dropzones and dropzone areas
  - Annotations with custom fonts and colors
  - Landmarks (24 types: trees, benches, signs, etc.)
  - Infrastructure zones with terrain patterns
- **SVG Export** - Generate print-ready course maps with terrain backgrounds, legends, and scale bars
- **Auto-save** - Automatic saving to browser's IndexedDB
- **Undo/Redo** - Full history support
- **i18n** - English and Polish translations
- **Responsive** - Works on desktop and tablet

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite 7
- **Maps**: MapLibre GL JS + react-map-gl
- **Drawing**: @mapbox/mapbox-gl-draw
- **State**: Zustand with Immer middleware
- **Storage**: IndexedDB via idb-keyval
- **Styling**: Tailwind CSS 4
- **i18n**: react-i18next
- **Geo**: @turf/turf

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/tomododi/discmap.git
cd discmap

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
# Type check and build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Create a course** - Click on the map to set the course location
2. **Add holes** - Use the hole list panel to add and navigate holes
3. **Draw features** - Select tools from the toolbar:
   - Tee, Basket, Dropzone markers
   - Flight lines (click tee → click basket)
   - OB zones, fairways, dropzone areas (polygon drawing)
   - Mandatory markers with rotatable arrow and boundary line
   - Landmarks and annotations
4. **Edit properties** - Click any feature to edit in the properties panel
5. **Export** - Click export button to generate SVG maps

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared UI components
│   ├── editor/          # Sidebar panels (HoleEditor, FeatureProperties, etc.)
│   ├── export/          # Export dialog and options
│   └── map/             # Map components and markers
├── stores/              # Zustand state stores
├── types/               # TypeScript type definitions
├── utils/               # Utilities (geo calculations, SVG export, storage)
└── i18n/                # Translation files (en.json, pl.json)
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Map tiles by [Esri](https://www.esri.com/)
- Icons by [Lucide](https://lucide.dev/)
