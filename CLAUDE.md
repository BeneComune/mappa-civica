# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Mappa Civica is a civic platform for the Comune di Montereale Valcellina (PN) — mobility,
environment, territorial resilience, and community reporting — built with Next.js 16 (App Router)
+ React 19, MapLibre GL, DuckDB-Wasm, and shadcn/ui (Base UI). Porting is in progress from an
earlier Vite + React SPA prototype (`montereale-valcellina-frontend`); see `docs/PROGRESS.md` for
the ADR trail of what's been ported and why.

## Commands

```bash
pnpm dev                    # dev server
pnpm build                  # production build
pnpm lint                   # eslint (zero-warning policy — see below)
pnpm test                   # vitest run, whole suite
npx vitest run path/to/file.test.ts   # single test file
npx vitest path/to/file.test.ts       # watch mode for one file
npx tsc --noEmit            # type-check only

pnpm check:paths            # verify every file's leading path comment (see below)
pnpm check:paths:fix        # rewrite/insert those comments in place

pnpm fallow:dead-code        # unused exports/files
pnpm fallow:dupes            # duplicate code
pnpm fallow:audit            # combined static audit
pnpm fallow:health           # score + hotspots + targets
```

Lint and type-check are both treated as zero-warning/zero-error gates — fix everything they
report, including pre-existing issues touched incidentally, not just what you introduced.

## Conventions specific to this repo

- **Leading path comment.** Every `.ts`/`.tsx` file under `app/`, `components/`, `lib/`, `scripts/`
  starts with a comment matching its own path relative to the repo root, backslash-separated
  (e.g. `// lib\map\overlays\fire.ts`), checked by `scripts/check-file-paths.mjs`. `components/ui/**`
  (shadcn-generated) is exempt.
- **No semicolons**, `eqeqeq` (except `== null`/`!= null`, which is the idiom used throughout for
  "null or undefined"), 100-char lines (`ignoreStrings`/`ignoreTemplateLiterals`/Tailwind
  `className` strings are exempt from wrapping).
- `components/ui/**` is shadcn-generated: not lint-formatted, not scanned by fallow, kept intact
  (including unused sub-exports) so `shadcn add` can safely regenerate it.
- `AGENTS.md` (symlinked in as `CLAUDE.md`'s content via `@AGENTS.md` above) is rewritten by
  `next dev` on every run — committing it as part of your other changes is expected, not a stray diff.

## Architecture

### One persistent map, route-driven overlay visibility

There's a single MapLibre `Map` instance, created once in `MapView` (`components/map-view.tsx`)
and kept alive across client-side navigation — pages never mount their own map. Two layers make
this work:

1. **`lib/map/index.ts`** — `ROUTE_OVERLAYS`, an array of `{ path, add, layerIds }`. Every overlay's
   `add(map)` function (in `lib/map/overlays/<name>.ts`) is called once per style load and adds its
   source/layers idempotently, `visibility: "none"` by default. `syncOverlayVisibility(map, pathname)`
   walks the array and shows only the overlay(s) whose `path` matches the current route (`path` can
   be a single string or an array, for overlays shared across routes — e.g. the route-planner line
   on both Cyclability and Trails routing pages, and on the hospital-routing page).
2. **`components/map-provider/index.tsx`** — a React context (`MapProvider`/`useMapContext`)
   holding the map in a `ref` (not state — toggling a layer is an imperative side effect, not a
   reason to re-render). Exposes `setLayersVisible`, `setLayersFilter`, `setSourceData`,
   `attachHoverPopup`/`attachClickPopup`/`attachHoverHighlight` (delegating to
   `components/map-provider/interactions.ts`), `flyTo`, `setPinMarker`, and the low-level `getMap`
   escape hatch. Route-level legend/filter panels (`components/classes-toggle-panel.tsx`,
   `components/overlay-toggle-badge.tsx`, `components/filter-badge-group.tsx`, etc.) call these
   instead of touching the map directly.

Both `setLayersVisible`/`setLayersFilter` (map-provider) and `MapView`'s route-change effect gate
on `map.style` truthiness, not `map.isStyleLoaded()` — the latter also requires every source to have
finished loading, so it goes transiently `false` while a just-added overlay's GeoJSON is still in
flight, silently dropping the call with no retry once the source catches up.

To add a new overlay: write `lib/map/overlays/<name>.ts` exporting an `add<Name>Overlay(map)` and
its layer-id array, then add a row to `ROUTE_OVERLAYS` in `lib/map/index.ts`. Overlay files should
only import maplibre-gl's *types*; only `lib/map/index.ts` and `lib/map/base/**` do a real runtime
`import * as maplibregl`. That matters because `lib/map/index.ts` (the barrel) can only be imported
from Client Components — importing it from a Server Component `page.tsx` breaks the build. Import
from `@/lib/map/overlays/<name>` directly in Server Components instead.

### Choropleth overlays share one shape

The Green module's three class-coloured polygon overlays (`vegetation.ts`, `vegetation-health.ts`,
`soil-temperature.ts`) all go through `lib/map/overlays/choropleth.ts`'s `addChoroplethOverlay`:
one GeoJSON source, a class-coloured fill layer, and a thin white outline layer. Most paint straight
from a `color` property the Python data pipeline bakes into each feature; NDVI is the exception
(passes its own `match` expression built from `NDVI_CLASS_CONFIG`, see `lib/green-classes.ts`), so
the legend swatches and the polygons can't drift apart. `components/classes-toggle-panel.tsx` is the
matching generic UI: per-class toggle chips with live area/percentage stats, reused by the
Vegetazione, Salute vegetazione and Temperatura suolo tabs (and the Rescue fire page's NBR panel,
which shares the same `nbr` source/dataset under differently-named layers so both modules can
toggle it independently).

### Routing (`lib/routing/`)

A Dijkstra-based router over a road/trail graph loaded per-mode (walking/biking/driving), split
into focused modules: `graph.ts` (load + build, `appendEdge`/`finalizeGraph` shared by both mode
builders), `cost.ts` (direction-dependent edge travel time), `min-heap.ts` (priority queue),
`path.ts` (nearest-node + shortest-path), `summary.ts` (route summary accumulation), `geo.ts`
(coordinate helpers). Covered by `lib/routing/routing.test.ts`. `lib/routing/driving.ts` is a
driving-only variant used by the Rescue module's "Ospedale più vicino" feature.

### Community module (`lib/community/`, `app/community/`)

Reports come from two sources merged at read time: a read-only DuckDB snapshot
(`public/data/community_data.duckdb`, queried in-browser via `lib/duckdb.ts` using DuckDB-Wasm) for
already-ingested official reports, and locally-pending unsubmitted reports in `localStorage`
(`lib/community/reports-store.ts`), favoring pending on id collisions.

### Strings and design tokens are centralized

Every Italian UI string lives in `lib/strings.ts` (`STRINGS`) — check there before hardcoding new
text. Colors live in `lib/colors.ts` (`COLORS`), icons in `lib/ICONS.ts` (`ICONS`); overlay paint
expressions and legend components both read from these so they can't disagree with each other.

### Municipality config

`lib/config.ts` is the single source of truth for municipality-specific values (map center/zoom,
name, cadastral code) — it deliberately avoids importing `lib/map` (which pulls in the real
maplibre-gl runtime) so it can be used from anywhere, including Server Components.
