# Data and the pipeline

The app has no data server. Everything it shows is a static file under `public/data/`, produced
offline by the Python pipeline in `pipeline/`. This doc covers how the pieces fit together. The
per-target reference (scripts, outputs, setup) is [`pipeline/README.md`](../../pipeline/README.md);
configuring another comune is [`SETUP.md`](../../SETUP.md).

## Three data roots

| Root | Contents | Versioned |
|---|---|---|
| `data/` | Curated inputs: `comune.config.json`, curated lists (peaks, rescue points), `exclusions.json`, `community/reports.csv` | yes |
| `public/data/` | Generated output the browser loads: GeoJSON, `catasto.pmtiles`, `community_data.duckdb`, `municipality_stats.json`, rii photos | yes |
| `data/raw/` | Large raw inputs: Sentinel-2 `.SAFE`, Landsat thermal band, `dem.tif` | no (gitignored) |

Another comune adapts the platform by editing `data/` and `public/data/` only. The exceptions still
left are listed in [`audits/2026-10-23-comune-reusability.md`](../audits/2026-10-23-comune-reusability.md).

## One config, two readers

`data/comune.config.json` is read by the app through `lib/config.ts` (center/zoom, name, cadastral
code, email, LTS embed view) and by every pipeline script through `pipeline/lib/comune_config.py`.
`lib/config.ts` deliberately doesn't import `lib/map`, so Server Components can use it.

## Formats

- **GeoJSON** for every layer, fetched whole by MapLibre or by app code.
- **PMTiles** for the cadastre only (`catasto.pmtiles`, ~210 KB vs 1.9 MB GeoJSON). It's rendered
  and benefits from viewport tiling, and the parcel lookups work on loaded tiles.
  `transport.geojson` stays GeoJSON because the router needs the whole graph
  ([`routing.md`](routing.md)).
- **DuckDB** for published community reports, queried in the browser with DuckDB-Wasm
  ([`community.md`](community.md)).
- **JSON** for `municipality_stats.json` (ISTAT figures + pipeline-derived totals for Home).

Satellite layers (`greenery.geojson`, `nbr.geojson`, `lst.geojson`) carry a top-level `scene_date`.
`ClassesTogglePanel` shows it and flags scenes older than 45 days.

## Refresh

`.github/workflows/refresh-data.yml` runs the API-only targets on a schedule and commits
`public/data/` to `main`, which deploys on Vercel:

| When | Targets |
|---|---|
| Mondays 03:00 UTC | `rescue fire landslide catasto cyclepaths peaks hospital` |
| 1st of the month 03:00 UTC | `base community`, then `green-refresh` (fetch the latest Sentinel-2 and Landsat scenes, then run `green`: NDVI, NBR, LST, shade corridors; this step is allowed to fail) |
| Manual | any single target from the workflow's list |

`green-refresh` needs the `CDSE_*` and `USGS_*` repository secrets. `outdoor` (needs
`data/raw/dem.tif`; it also writes the trails intermediate the shade corridors read) and `rii`
(needs the Protezione Civile census zip) aren't in the workflow and run locally.

## Adding a data layer

1. A script in `pipeline/scripts/`, a Makefile target, a row in `pipeline/README.md`.
2. Output under `public/data/`.
3. If it only needs public APIs, add the target to `refresh-data.yml`.
4. An overlay to render it ([`map.md`](map.md)).
5. If it needs raw data, document where to get it in `SETUP.md`.
