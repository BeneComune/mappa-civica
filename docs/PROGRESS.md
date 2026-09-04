# Progress

Curated history and architecture decision records (ADRs) for `mappa-civica`. Newest entries first.

---

## 2026-09-04 — Port map/PDF/DuckDB dependencies from the Vite prototype instead of superseding with Next.js equivalents

**Context:** An earlier prototype (`montereale-valcellina-frontend`) was a Vite + React 18 SPA with map/data tooling: `maplibre-gl`, `pmtiles`, `@mapbox/vector-tile`, `@turf/buffer`, `@turf/helpers`, `@duckdb/duckdb-wasm`, `jspdf`, `bootstrap-icons`. The project moved to Next.js 16 (`mappa-civica`) with shadcn/Base UI already set up.

**Decision:** Keep the domain-specific dependencies from the prototype (map rendering, geo ops, in-browser DuckDB, PDF export, icon set) and drop everything the prototype needed only because it was a bare Vite SPA: `vite`, `@vitejs/plugin-react`, and the prototype's own `react`/`react-dom`/`@types/react*`/`typescript` (Next.js already provides newer, compatible versions of all of these — React 19.2.8 vs. the prototype's React 18.3.1).

**Why:** Next.js is staying as the framework (confirmed — not switching to Vite). None of the map/data libraries are Vite-specific; they're plain browser/WASM packages that work under any bundler. Re-adding Vite's own tooling would have meant running two bundlers in one project for no benefit.

**Consequence:** `maplibre-gl`, `@duckdb/duckdb-wasm`, `pmtiles`, `@mapbox/vector-tile`, and `jspdf` all touch browser-only APIs (WebGL, WASM, Canvas, `window`). This Next.js version only allows `next/dynamic`'s `ssr: false` option inside Client Components (confirmed against `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` — it errors if used from a Server Component). Any component wrapping these libraries needs a `'use client'` boundary before disabling SSR for it.

**Status:** Dependencies installed and `pnpm build` passes (none are wired into components yet, so the Client Component requirement above hasn't been exercised in code).
