# The map

One MapLibre map serves every route. Pages never create their own map; they show, hide and filter
layers on the shared one. Route inventory: [`routes.md`](routes.md).

## Lifecycle

```
app/layout.tsx
└─ MapProvider (components/map-provider)        ← holds the map in a ref, exposes the API below
   ├─ MapShell (components/map-shell.tsx)       ← next/dynamic, ssr: false
   │  └─ MapView (components/map-view.tsx)      ← createBaseMap() once, registerMap(map)
   └─ PanelFrame → {children}                   ← route pages: legend panels, filters, forms
```

- `MapView` creates the map once and keeps it across client-side navigation. Its cleanup only runs
  when the root layout unmounts.
- Route children mount and run their effects **before** the dynamically imported `MapView`
  registers the map. `mapReady` flips to `true` on registration; anything that wires listeners
  (`attach*`) gates on it and re-runs when it changes.

## Base map (`lib/map/base/`)

| Piece | File | Notes |
|---|---|---|
| Basemap styles | `styles.ts` | Maptoolkit live styles: light, summer, cycling, dark (default dark) |
| 3D terrain | `index.ts` | Mapterhorn terrarium DEM (`raster-dem`), exaggeration 1.3 |
| Style switcher ("Legenda") | `style-control.ts` | `map.setStyle()` - wipes every overlay, see below |
| Search | `search-control.ts` | Nominatim, Italy only, drops out-of-order responses |
| Terrain toggle | `terrain-control.ts` | Re-applies terrain + pitch |
| Print to PDF | `print-control.ts`, `pdf-export.ts` | jsPDF, A4, real scale from zoom/latitude; desktop only |
| PMTiles protocol | `index.ts` | Only the cadastre (`pmtiles:///data/catasto.pmtiles`) |
| Worker | `index.ts` | `public/maplibre-gl/` - re-copy from `node_modules` on a maplibre upgrade |

Below `md` the map opens flat (pitch 0, terrain off), drops Fullscreen and Print, and starts with
attribution and Legenda collapsed. See [`mobile.md`](mobile.md).

## Overlays: added once per style load, shown per route

`setStyle()` (the basemap switcher) replaces the whole style document, dropping every overlay
source and layer. So `onStyleReady(map, fn)` runs `fn` now if the style is loaded, and again on
every `style.load`. `MapView`'s `fn` calls every overlay's `add(map)`, then
`syncOverlayVisibility(map, pathname)`.

`ROUTE_OVERLAYS` in `lib/map/index.ts` is the table that drives this:

```ts
{ path: "/rescue/fire", add: addFireOverlay, layerIds: FIRE_LAYER_IDS }
{ path: ["/outdoor/cyclability/routing", "/outdoor/trails/routing", "/rescue/hospital"], ... }
```

`syncOverlayVisibility` sets `visibility` to `visible` on the layers whose `path` matches the
current pathname, `none` on the rest. `MapView` re-runs it on every pathname change.

Rules for an overlay file (`lib/map/overlays/<name>.ts`):

- Export `add<Name>Overlay(map)` and its layer-id array.
- `add` is idempotent: `if (!map.getSource(...))`, `if (!map.getLayer(...))`.
- Every layer starts with `layout: { visibility: "none" }`.
- Import only maplibre-gl **types**. `lib/map/index.ts` and `lib/map/base/**` are the only runtime
  importers, so `lib/map/index.ts` is client-only: a Server Component that imports it breaks the
  build. Server pages import layer ids from `@/lib/map/overlays/<name>` directly.
- Colors come from `lib/colors.ts`, so legend swatches and paint can't disagree.
- Hover highlight uses feature-state, so features need a stable top-level `id` (or
  `generateId: true` on the source).

**Choropleths.** The Green module's class-coloured polygons (`vegetation.ts`,
`vegetation-health.ts`, `soil-temperature.ts`) share `addChoroplethOverlay` (`choropleth.ts`): one
source, a fill, a thin white outline. Most paint the `color` property the pipeline bakes into each
feature. NDVI passes its own `match` built from `NDVI_CLASS_CONFIG` (`lib/green-classes.ts`).

**Optional sub-layers.** Some overlays add layers that `ROUTE_OVERLAYS` never shows; the page turns
them on through a toggle. Example: fire danger, ignition points and the NBR index on
`/rescue/fire`. Its `rescue-nbr-*` layers read the same `nbr` source as `/green/nbr`, under
different ids, so the two pages toggle independently.

### Data per overlay

| Overlay | Data |
|---|---|
| `home` | `boundary.geojson`, `catasto.pmtiles` |
| `rii` | `rescue/rii.geojson` |
| `fire` | `rescue/fire_perimeters.geojson`, `fire_danger.geojson`, `fire_ignition_points.geojson`, `nbr.geojson` |
| `assets` | `rescue/aed.geojson`, `hems.geojson`, `fire_hydrants.geojson`, `emergency_assembly_points.geojson` |
| `hospital` | `rescue/hospital.geojson` |
| `landslide` | `rescue/landslide_hazard.geojson` |
| `trails-water` | `outdoor/trails_shaded.geojson`, `outdoor/water.geojson` |
| `bike-infra` | `outdoor/bike_cyclepaths.geojson`, `outdoor/bike_infra.geojson` |
| `slope` | `outdoor/trails_routing.geojson` |
| `peaks` | `outdoor/peaks.geojson`, `outdoor/peaks_poles.geojson` |
| `vegetation` | `greenery.geojson` |
| `vegetation-health` | `nbr.geojson` |
| `soil-temperature` | `lst.geojson` |
| `natural-shade` | `shade_corridors.geojson` |
| `route` | none - an empty source the planners fill with `setData` |

All paths are under `public/data/`. How they're produced: [`data-pipeline.md`](data-pipeline.md).

## The MapProvider API

Route components never touch the map directly when one of these fits:

| Method | Use |
|---|---|
| `setLayersVisible(ids, visible)` | Toggle layers (`OverlayToggleBadge`, `CatastoToggle`) |
| `setLayersFilter(ids, filter)` | Filter by property (`FilterBadgeGroup`, `ClassesTogglePanel`, `RiiRecencyFilter`) |
| `setSourceData(id, url)` | Swap a GeoJSON source's data (no caller today) |
| `subscribeMapClick(handler)` | Map clicks as `LngLat` (point pickers) |
| `setPinMarker(lngLat \| null)` | The single location pin (Segnala) |
| `flyTo(center, zoom)` | Camera moves (frazioni, report list) |
| `attachHoverPopup(layerId, render)` | Cursor-following popup from `render(props)` → HTML |
| `attachFeatureSelect(layerId, onSelect)` | Click a feature → its properties (`MapFeatureDetail`) |
| `attachHoverHighlight(sourceId, layerIds)` | feature-state `hover` for highlight paint |
| `getMap()` | Escape hatch for interactions too specific to generalize (catasto identify, route markers) |

The `attach*` recipes live in `components/map-provider/interactions.ts` and are unit-tested
(`interactions.test.ts`).

`setLayersVisible`, `setLayersFilter` and `MapView`'s route-change sync check `map.style`, not
`map.isStyleLoaded()`. The latter is also false while any source is still loading, so a call made
while a just-added overlay's GeoJSON is in flight would be dropped silently, with no retry.

## Panel building blocks

| Component | What it does |
|---|---|
| `OverlayToggleBadge` | One chip toggling a set of layers; turns them off again on unmount |
| `FilterBadgeGroup` | Multi-select chips filtering layers on one property |
| `ClassesTogglePanel` | Class chips with live area %, hover popup, satellite scene date (flagged after 45 days) |
| `MapFeatureDetail` | Click-a-feature detail card, driven by resolvers in `lib/rescue-details.ts` |
| `HoverPopupLayer` / `HoverHighlightLayer` | Declarative wrappers over the `attach*` methods |
| `InfoNote` / `Faq` | Collapsed explanatory text |
