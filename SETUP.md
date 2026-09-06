# Deploying for another comune

This platform was built for Montereale Valcellina, but the code is not tied to
it: everything territory-specific lives in one config file plus a handful of
data files. To adapt it to another comune, fill in the files listed here and
source your own raw data - you do not need to touch anything under `app/`,
`components/` or `lib/`.

## File checklist

| # | File | Required? | Source |
|---|---|---|---|
| 1 | `data/comune.config.json` | yes | hand-filled |
| 2 | `public/data/boundary.geojson` | yes | OSM / ISTAT boundary export |
| 3 | `public/data/frazioni.geojson` | yes (or empty) | hand-authored |
| 4 | `public/data/municipality_stats.json` | yes | hand-seeded, then `make base` |
| 5 | `data/exclusions.json` | optional | hand-drawn |
| 6 | `data/peaks_curated.json` | optional | hand-filled |
| 7 | `data/rescue/aed_comune.geojson`, `hems_comune.geojson` | optional | comune list, geocoded |
| 8 | `data/community/reports.csv` | starts empty | the comune curates it |
| 9 | `data/sources/output_rii_protezione_civile.zip` | optional | comune Protezione Civile |
| 10 | `data/raw/*.SAFE`, `data/raw/*_lwir11.TIF`, `data/raw/dem.tif` | for the Verde/slope layers | you download (see §10) |

Everything under `data/` and `public/data/` is the whole surface area. `app/`,
`components/`, `lib/` stay untouched.

---

## 1. Configuration - `data/comune.config.json`

The single source of truth, read by the frontend (`lib/config.ts`) and by every
Python pipeline script (`pipeline/lib/comune_config.py`).

```jsonc
{
  "name": "Comune name",
  "province": "Province name",
  "region": "Region name",
  "istatCode": "123456",          // comune ISTAT code
  "provinceIstatCode": "ITDxx",   // province NUTS3 / ISTAT code
  "cadastralCode": "X000",        // codice catastale / Belfiore (parcels layer)
  "osmAreaId": 3600000000,        // OSM relation id + 3600000000, see below
  "email": "info@comune.example.it",
  "boundaryFile": "public/data/boundary.geojson",
  "map": { "center": [lon, lat], "zoom": 12 },
  "ltsEmbedView": { "lat": 0, "lon": 0, "zoom": 12.86 }
}
```

**Finding the values:**
- `osmAreaId` - look the comune up on [openstreetmap.org](https://www.openstreetmap.org),
  open its administrative boundary relation, take the relation id and add
  `3600000000` (the Overpass area-query convention: `relation id + 3600000000`).
- `istatCode` / `provinceIstatCode` - [ISTAT statistical codes of administrative units](https://www.istat.it/it/archivio/6789).
- `cadastralCode` - the codice catastale / codice Belfiore (e.g. `F596`). Used by
  `make catasto`; omit it (or leave a comune the Agenzia delle Entrate open
  cadastre doesn't cover, e.g. Bolzano/Trento) and the parcels layer is simply
  empty. The ISTAT "Codici statistici" table lists it next to the ISTAT code.
- `ltsEmbedView` - lat/lon/zoom of any point inside the comune: the
  [stressinbici.it](https://stressinbici.it) embed swaps to the right comune on
  its own, no slug needed.
- `map.center` / `map.zoom` - the map's opening view.

`boundaryFile` should stay `public/data/boundary.geojson` (see §2) - the curated
boundary and the file the browser loads are the same file, don't duplicate it.

---

## 2. Municipal boundary - `public/data/boundary.geojson`

A single GeoJSON `Feature` (`Polygon`/`MultiPolygon`, EPSG:4326) with the
administrative boundary. Used to clip the NDVI/NBR/LST layers and the fire-danger
overlay, and drawn on the Home map.

**Where to get it:** the comune's OSM relation - e.g.
`https://nominatim.openstreetmap.org/search?q=<comune>&polygon_geojson=1&format=jsonv2`
- or an ISTAT administrative-boundaries export. Keep it to one `Feature`.

---

## 3. Frazioni - `public/data/frazioni.geojson`

A hand-authored GeoJSON: one `Polygon` per frazione/borgata, with `name`,
`type` (`capoluogo` / `frazione` / `borgata`), an optional local/friulian name
`name_fur`, and `centroid_lon` / `centroid_lat`. It cannot be derived reliably
from OSM, so it is curated data, not a download. Copy the structure of the
existing file.

If the comune has no frazioni, ship an empty `FeatureCollection` and the Home
panel simply lists none. (`pipeline/scripts/build_frazioni_geojson.py` from the
old Vite repo is intentionally not ported - this file is richer than what it
produced.)

---

## 4. Municipal statistics - `public/data/municipality_stats.json`

A seed you fill in by hand once. It carries the facts no API provides:
main peaks, pharmacy, schools, nearest emergency room, seismic zone,
hydrogeological risk.

`make base` (`pipeline/scripts/fetch_istat_stats.py`) reads it and updates
**only** the ISTAT SDMX fields (population + trend, households, density, average
age and old-age indices, bank branches), leaving every manual field untouched.
Copy the existing file, blank out the Montereale Valcellina values, fill in your
own. `null` means "still to fill in".

> Note: the population trend before 2019 and the bank-branch count come from the
> legacy `sdmx.istat.it` endpoint, which is currently unreliable; if `make base`
> logs errors for those, the existing values are kept.

---

## 5. Exclusion zones (optional) - `data/exclusions.json`

Only if you need to manually exclude an area from the OSM-derived layers (e.g. a
zone OSM tags inconsistently). If you don't need it, delete the file or leave
`"features": []` - the pipeline then excludes nothing.

---

## 6. Main peaks supplement (optional) - `data/peaks_curated.json`

`make peaks` starts from every OSM `natural=peak` inside the boundary. Add rows
here only for summits OSM is missing (or maps without a name/elevation) - they
are merged in by name. Empty by default.

---

## 7. Rescue assets - curated lists (optional) - `data/rescue/`

If the comune provides its own list of defibrillators (DAE) or helicopter
landing sites, geocode them and drop them in:

- `data/rescue/aed_comune.geojson`
- `data/rescue/hems_comune.geojson`

`make rescue` merges each with OSM: a curated point is added only where OSM has
no equivalent node within ~60 m, so once a device reaches OSM it supersedes the
geocoded point. Mark address-derived points with `"geocoded": true` /
`"geo_precision"` and the popup flags them "da verificare sul posto". Skip these
files entirely and the layers are OSM-only.

---

## 8. Segnalazioni della comunità - `data/community/reports.csv`

The Segnala module has no backend: citizens' reports arrive by email and the
comune decides which to publish. Published rows go in `data/community/reports.csv`
(one per report), then `make community` bakes them into
`public/data/community_data.duckdb`, which the app loads read-only. Photos go
under `public/data/community/`. Starts with a sample row; see
[`data/community/README.md`](data/community/README.md) for the columns and the
ingestion steps.

---

## 9. Rii a rischio esondazione (optional) - `data/sources/output_rii_protezione_civile.zip`

A comune-specific volunteer field survey by the Gruppo Comunale di Protezione
Civile (CSV attributes + one photo per rio). If you have it, place the zip there
and run `make rii`. Without it, ship `public/data/rescue/rii.geojson` as an empty
`FeatureCollection` and the tab shows no points.

---

## 10. Raw satellite and DEM data - `data/raw/` (you download)

Not in the repo (gitignored, too large). Download for the comune's area:

| File | Feeds | Where |
|---|---|---|
| `data/raw/*.SAFE/` - one Sentinel-2 L2A scene | NDVI (`make green`), NBR | [Copernicus Browser](https://browser.dataspace.copernicus.eu/) - pick a recent, low-cloud scene on the tile that covers the comune |
| `data/raw/*_lwir11.TIF` - Landsat 8/9 C2 L2, thermal band ST_B10 | LST / surface temperature (`make green`) | [USGS EarthExplorer](https://earthexplorer.usgs.gov/) - "Landsat Collection 2 Level-2", the path/row over the comune |
| `data/raw/dem.tif` - DEM / LiDAR raster | trail & cycleway slope (`make outdoor`) | your region's LiDAR/DEM portal, or [Copernicus DEM](https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model) |

These four layers (`greenery`, `nbr`, `lst`, `shade_corridors`) plus the slope
layers are the only ones that need local raw data; everything else runs from
public APIs.

---

## 11. Running the pipeline

```bash
cd pipeline
python -m venv .venv && source .venv/bin/activate   # Python >= 3.11
pip install -r requirements.txt                     # or requirements-ci.txt for the API-only targets
make help
```

`make catasto` also needs [`tippecanoe`](https://github.com/felt/tippecanoe) on
`PATH` (`brew install tippecanoe`); CI builds it itself. See
[`pipeline/README.md`](pipeline/README.md) for every target.

---

## 12. Deploy

The site is on **Vercel**, which auto-deploys every push to `main` - there is
nothing comune-specific to configure (no base path, no GitHub Pages). One-time:
connect the repo to a Vercel project.

`.github/workflows/refresh-data.yml` refreshes the API-derived layers on a
schedule and commits them to `main`, which triggers a Vercel deploy. It has
nothing comune-specific - it just runs `make <target>` - so it works unchanged.
