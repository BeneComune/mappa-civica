# Mappa Civica

[![Deploy: Vercel](https://img.shields.io/badge/deploy-Vercel-000?logo=vercel)](https://mappa-civica.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An open-source, serverless civic-tech platform for sustainable mobility,
environmental monitoring, territorial resilience and community reporting.
Published at near-zero hosting cost as a static site on Vercel, currently live
for the comune of Montereale Valcellina (PN, Italy) and built to be reused for
any other comune — see [Reusing this for another comune](#reusing-this-for-another-comune).

Porting in progress from the Vite + React 18 prototype
(`montereale-valcellina-frontend`) to Next.js 16.

## Modules

- **Outdoor** — bike traffic-stress map, cycling infrastructure, trails and water
  points, slope, main peaks, and a route planner (bike / on foot) with an
  elevation profile.
- **Soccorso ed Emergenza** — flood-prone streams census (Censimento RII), forest
  fire perimeters (perimeters, danger class, NBR index), defibrillators /
  helipads / hydrants / assembly points, and the nearest hospital.
- **Verde** — vegetation (NDVI), vegetation health (NBR), land surface
  temperature (LST), and natural shade over roads and trails.
- **Segnala** — community reporting: drop a pin on the map, describe the issue,
  send it as a pre-filled email to the municipality.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19
- [MapLibre GL](https://maplibre.org/) for the map; live vector basemaps from
  Maptoolkit (light / summer / cycling / dark), 3D terrain from Mapterhorn
- Data served as **static GeoJSON**; only the cadastre is **PMTiles** (vector
  tiles), served through the `pmtiles://` protocol
- [DuckDB-Wasm](https://duckdb.org/docs/api/wasm/overview) for in-browser reads
  of the official community reports
- [shadcn/ui](https://ui.shadcn.com) (Base UI) + Tailwind CSS

## Architecture

100% Jamstack, no application server:

- **Frontend** — Next.js App Router, a single persistent map mounted in the root
  layout, legend panels rendered as route children.
- **Static data layer** — GeoJSON / PMTiles produced offline by the Python
  pipeline (`pipeline/`) and served as assets from `public/data/`.
- **Reports** — the ones the comune has validated live in
  `public/data/community_data.duckdb` (read-only, via DuckDB-Wasm); unsent ones
  stay in the browser's `localStorage` and go out via `mailto:`, no server
  round-trip.
- **CI/CD** — Vercel deploys on every push to `main`; a scheduled workflow
  regenerates the API-derived layers and commits them (see
  [Deployment & data refresh](#deployment--data-refresh)).

## Project structure

```
app/           routes and pages (Next.js App Router)
components/    React components (map, panels, Segnala drawer, ...)
lib/          shared logic (comune config, routing, map overlays, DuckDB)
public/data/   static data served to the browser (GeoJSON, catasto.pmtiles, .duckdb)
data/          curated, versioned inputs (comune config, boundary, curated lists)
data/raw/      large un-versioned raw inputs (.SAFE Sentinel-2, DEM) — gitignored
pipeline/      Python GIS pipeline (OSM, Sentinel-2, Landsat -> GeoJSON)
docs/         extended documentation and ADRs
```

## Getting started

Prerequisites: Node 20+, and Python ≥ 3.11 for the data pipeline only.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). All map data ships
pre-built in `public/data/`, so the frontend runs standalone without executing
the pipeline.

Other commands:

```bash
pnpm build          # production build
pnpm test           # tests (vitest)
pnpm lint           # eslint
```

## Data

The Python pipeline in [`pipeline/`](pipeline/README.md) regenerates the GeoJSON
in `public/data/` from OpenStreetMap, IRDAT FVG, ISTAT SDMX, Sentinel-2 and
Landsat. Each layer is independent (`make <target>`); the targets that need no
local raw data also run in CI. See [`pipeline/README.md`](pipeline/README.md) for
the target list and [`public/data/rescue/README.md`](public/data/rescue/README.md)
for the provenance of the rescue layers.

### Data sources

| Layer | Source | Licence |
|---|---|---|
| Road network, trails, POIs, services, peaks | OpenStreetMap / Nominatim | ODbL |
| Demographic and statistical data | ISTAT, esploradati.istat.it SDMX REST | CC BY |
| NDVI, NBR | Sentinel-2 L2A (ESA / Copernicus) | Free / Open |
| LST (surface temperature) | Landsat 8/9 Collection 2 L2 (USGS) | Public domain |
| Flood-prone streams (Censimento RII) | Gruppo Comunale di Protezione Civile, volunteer field survey (2013, 2024) | provided by the comune |
| Forest fire perimeters | Regione FVG, IRDAT dataset 1232 (Fogli Notizie Incendi Boschivi), WFS | regional open data |
| Elevation / slope | DEM / LiDAR | Open Data |
| Live basemap tiles/styles | Maptoolkit (`styles.maptoolkit.org`) | provider terms |
| LTS (traffic stress) map | stressinbici.it / [LTSBikePlan](https://github.com/dclfbk/LTSBikePlan) (iframe embed) | project's own licence |
| 3D terrain DEM | Mapterhorn (terrarium-encoded DEM) | Free / Open |
| Cadastral parcels (particelle) | onData / dati_catastali (Agenzia delle Entrate) | CC BY 4.0 |
| Current weather | Open-Meteo forecast API | CC BY 4.0 / free |

## Reusing this for another comune

Everything comune-specific (name, OSM area, ISTAT code, boundary, frazioni, map
view) lives in one config file and a handful of data files, not scattered across
the codebase. [`SETUP.md`](SETUP.md) lists what to configure and which raw data
(satellite imagery, DEM) to source yourself — without touching `app/`,
`components/` or `lib/`.

## Deployment & data refresh

The site runs on **Vercel**, which deploys on every push to `main` — no base
path, no GitHub Pages, nothing comune-specific to configure.

`.github/workflows/refresh-data.yml` regenerates the API-derived layers and
commits them to `main` (the commit triggers a Vercel deploy):

- **weekly** — `make rescue fire catasto cyclepaths peaks hospital`
- **monthly** — `make base community`
- **manual** — any single target via *Run workflow*

## Documentation

- [`SETUP.md`](SETUP.md) — configuring the platform for another comune
- [`pipeline/README.md`](pipeline/README.md) — data pipeline, targets, raw data
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — project history and architecture
  decision records (ADR style)

## License

[MIT](LICENSE) — Leonardo Venturoso and Emanuele Nardi.
