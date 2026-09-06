# Progress

Curated history and architecture decision records (ADRs) for `mappa-civica`. Newest entries first.

---

## 2026-09-06 — Data pipeline: its own directory, PMTiles for the cadastre only, and two new scripts

**Context:** The Vite prototype had a Python GIS pipeline that read curated inputs and raw satellite/DEM scenes and wrote GeoJSON to `frontend/public/data/`. The Next.js repo shipped those output files (copied off the old data disk, never through a script) but not the pipeline. Porting it raised three questions worth recording.

**Decision — the pipeline lives in `pipeline/`, separate from `app/`, `components/`, `lib/`.** It is a Python ecosystem with its own dependencies, style and CI, not covered by `pnpm check:paths` / `eslint` / `tsc`. Three data roots, kept distinct: `data/` = curated, versioned inputs (`comune.config.json`, `boundary.geojson`, curated rescue/peaks lists, `community/reports.csv`); `public/data/` = generated output served to the browser; `data/raw/` = large un-versioned raw inputs (`.SAFE`, `.tif`, `dem.tif`), gitignored. This separation is what lets another comune reconfigure the platform by editing `data/` and `public/data/` only — see `SETUP.md`.

**Decision — `catasto` moves to PMTiles, `transport` stays GeoJSON.** `catasto.geojson` (1.9 MB) is a rendered MapLibre source: it benefits from viewport tiling, and the click-identify / Segnala parcel lookup work fine against `querySourceFeatures` on loaded tiles. `catasto.pmtiles` is ~210 KB, built by `tippecanoe` from a gitignored intermediate. `transport.geojson` (1.7 MB) is consumed **only** by `lib/routing/graph.ts` to build the in-memory Dijkstra graph — it is never a MapLibre source, never rendered, and every route calculation needs the whole graph. Vector tiles optimise per-viewport queries and would solve nothing here, so it stays as committed GeoJSON.

**Decision — `peaks` and `hospital` are new scripts with no old-repo equivalent.** Both layers were added to the Next.js repo directly, as committed output with no generator. `build_peaks_geojson.py` reads every OSM `natural=peak` inside the boundary (plus an optional `data/peaks_curated.json` supplement). `build_hospital_geojson.py` finds the nearest `amenity=hospital` and **also** emits `hospital_roads.geojson`: the nearest hospital is in a neighbouring comune and `transport.geojson` is clipped to this comune, so the in-browser router needs a dedicated driving network that spans comune + hospital, loaded via `loadDrivingGraph()`.

**Consequence:** `.github/workflows/refresh-data.yml` regenerates the API-only layers on a schedule (weekly rescue/fire/catasto/cyclepaths/peaks/hospital, monthly base/community) and commits to `main`; Vercel deploys from there. The catasto step builds `tippecanoe` from source first (not packaged for Ubuntu). The satellite/DEM scripts (`process_green_layers`, `process_nbr`, `process_lst`, `process_shade_corridors`) stay out of CI - they need `data/raw/` scenes.

**Status:** Ported and pushed. The CI-safe targets reproduce their committed outputs byte-for-byte; the satellite/DEM ones and `rii` can't be verified here because the raw scenes / source package weren't provided.

---

## 2026-09-06 — Segnala: curated CSV → DuckDB snapshot, shaped to swap for a real backend

**Context:** The "official" side of Segnala (reports the comune has validated, read by `lib/duckdb.ts`) had no write path. The old repo had three disconnected pieces - a `repository_dispatch` contract never sent, an `init_duckdb.py` that only created empty tables, a workflow that ignored its own event - and `community_data.duckdb` shipped with zero rows, so `loadCommunityReports()` always returned `[]`.

**Decision:** Manual ingestion + static rebuild. The comune curates `data/community/reports.csv` by hand from the emails citizens send; `build_community_duckdb.py` (replacing `init_duckdb.py`) bakes it into `public/data/community_data.duckdb`; commit + push deploys it. Chosen over a real backend because the rest of the platform is deliberately backend-free and the report volume for a comune this size is a handful a month.

**Why the CSV is shaped like an API:** its columns (`id, category, title, description, lon, lat, created_at, status, foglio, particella, photo`) match what a future `/api/reports` route would return. Only `lib/duckdb.ts` and `community-panel.tsx` touch this data, so if a city with real volume adopts the platform, adding `app/api/reports/route.ts` + a database means changing one function body, not the app - and the CSV becomes the seed/export.

**Consequence:** `reports.csv` and its full git history are public. Removed rows persist in history, so the CSV must never carry personal data - only category, title, description, location, date (`data/community/README.md` says so). Photos are copied by hand into `public/data/community/`.

**Status:** Done. `select count(*) from reports` returns the curated rows; a sample report renders in `/community` alongside the localStorage-pending ones.

---

## 2026-09-04 — Port map/PDF/DuckDB dependencies from the Vite prototype instead of superseding with Next.js equivalents

**Context:** An earlier prototype (`montereale-valcellina-frontend`) was a Vite + React 18 SPA with map/data tooling: `maplibre-gl`, `pmtiles`, `@mapbox/vector-tile`, `@turf/buffer`, `@turf/helpers`, `@duckdb/duckdb-wasm`, `jspdf`, `bootstrap-icons`. The project moved to Next.js 16 (`mappa-civica`) with shadcn/Base UI already set up.

**Decision:** Keep the domain-specific dependencies from the prototype (map rendering, geo ops, in-browser DuckDB, PDF export, icon set) and drop everything the prototype needed only because it was a bare Vite SPA: `vite`, `@vitejs/plugin-react`, and the prototype's own `react`/`react-dom`/`@types/react*`/`typescript` (Next.js already provides newer, compatible versions of all of these — React 19.2.8 vs. the prototype's React 18.3.1).

**Why:** Next.js is staying as the framework (confirmed — not switching to Vite). None of the map/data libraries are Vite-specific; they're plain browser/WASM packages that work under any bundler. Re-adding Vite's own tooling would have meant running two bundlers in one project for no benefit.

**Consequence:** `maplibre-gl`, `@duckdb/duckdb-wasm`, `pmtiles`, `@mapbox/vector-tile`, and `jspdf` all touch browser-only APIs (WebGL, WASM, Canvas, `window`). This Next.js version only allows `next/dynamic`'s `ssr: false` option inside Client Components (confirmed against `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` — it errors if used from a Server Component). Any component wrapping these libraries needs a `'use client'` boundary before disabling SSR for it.

**Status:** Dependencies installed and `pnpm build` passes (none are wired into components yet, so the Client Component requirement above hasn't been exercised in code).
