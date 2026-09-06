# GIS data pipeline

Python scripts that produce the platform's static assets (Jamstack).

To run this pipeline for a comune other than Montereale Valcellina, see
[SETUP.md](../SETUP.md) at the repo root - it lists the config files to fill in
and the raw data to source. Every script reads the comune-specific values from
`pipeline/lib/comune_config.py`, which in turn reads `data/comune.config.json`.

## Setup

Requires **Python >= 3.11** (CI uses 3.11).

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt      # or requirements-ci.txt for the CI-safe targets only
```

## Running

Use the Makefile from the `pipeline/` directory:

```bash
make help       # list every target
make all        # full pipeline
make outdoor    # Outdoor module only (trails, water, cycleways)
make green      # Verde module only (NDVI, NBR, LST, shade)
make rescue     # Soccorso ed Emergenza module only
make base       # ISTAT statistics (frazioni are a curated input, not regenerated)
make catasto    # cadastral parcels -> catasto.pmtiles (needs tippecanoe)
make community  # build community_data.duckdb from data/community/reports.csv
make basemap    # self-hosted dark vector basemap (planetiler + OpenMapTiles, ~450MB, Java 21+)
```

`make basemap` is a documented alternative that is not used in production: the
frontend uses Maptoolkit's hosted live styles (`styles.maptoolkit.org`), not
this self-hosted basemap.

Every target is independent: you can run them one at a time without rerunning
the whole pipeline.

## Structure

```
pipeline/
├── lib/                    # Shared modules imported by the scripts
│   ├── comune_config.py    # Reads data/comune.config.json - see SETUP.md
│   ├── dem_slope.py        # DEM sampling and slope computation
│   └── exclusions.py       # Geometries to exclude (optional, see SETUP.md)
├── scripts/                # One script per app target
│   ├── fetch_istat_stats.py
│   ├── build_outdoor_geojson.py
│   ├── build_bike_infra_geojson.py
│   ├── build_bike_cyclepaths_geojson.py
│   ├── build_rescue_geojson.py
│   ├── build_fire_geojson.py
│   ├── build_catasto_geojson.py
│   ├── build_peaks_geojson.py
│   ├── build_hospital_geojson.py
│   ├── build_rii_geojson.py
│   ├── build_community_duckdb.py
│   ├── process_green_layers.py
│   ├── process_nbr.py
│   ├── process_lst.py
│   └── process_shade_corridors.py
├── data/                   # Intermediates and sources (gitignored)
├── tools/                  # planetiler.jar (gitignored)
├── Makefile
├── requirements.txt
├── requirements-ci.txt
└── README.md
```

## Scripts and output

| Script | Module | Output |
|---|---|---|
| `fetch_istat_stats.py` | Base | `public/data/municipality_stats.json` (ISTAT fields only) |
| `build_outdoor_geojson.py` | Outdoor | `public/data/outdoor/trails_routing.geojson`, `public/data/outdoor/water.geojson`, `pipeline/data/outdoor/trails.geojson` (intermediate) |
| `build_bike_infra_geojson.py` | Outdoor | `public/data/outdoor/bike_infra.geojson` |
| `build_bike_cyclepaths_geojson.py` | Outdoor | `public/data/outdoor/bike_cyclepaths.geojson` |
| `build_rescue_geojson.py` | Soccorso | `public/data/rescue/aed.geojson`, `hems.geojson`, `fire_hydrants.geojson`, `emergency_assembly_points.geojson` |
| `build_fire_geojson.py` | Soccorso | `public/data/rescue/fire_perimeters.geojson`, `fire_danger.geojson`, `fire_ignition_points.geojson` |
| `build_catasto_geojson.py` | Home | `public/data/catasto.pmtiles` (via tippecanoe; intermediate GeoJSON stays in `pipeline/data/`) |
| `build_peaks_geojson.py` | Outdoor | `public/data/outdoor/peaks.geojson`, `peaks_poles.geojson` |
| `build_hospital_geojson.py` | Soccorso | `public/data/rescue/hospital.geojson`, `hospital_roads.geojson` |
| `build_rii_geojson.py` | Soccorso | `public/data/rescue/rii.geojson` + photos in `public/data/rescue/rii/` |
| `build_community_duckdb.py` | Segnala | `public/data/community_data.duckdb` (from `data/community/reports.csv`) |
| `process_green_layers.py` | Verde | `public/data/greenery.geojson` |
| `process_nbr.py` | Verde | `public/data/nbr.geojson` |
| `process_lst.py` | Verde | `public/data/lst.geojson` |
| `process_shade_corridors.py` | Verde | `public/data/shade_corridors.geojson`, `public/data/outdoor/trails_shaded.geojson` |

## Required local data (gitignored)

These files must be present locally but are not versioned:

- `data/raw/*.SAFE` - Sentinel-2 L2A scene for `process_green_layers.py` and `process_nbr.py`
- `data/raw/*_lwir11.TIF` - Landsat 8/9 C2 L2 thermal band for `process_lst.py`
- `data/raw/dem.tif` - DEM/LiDAR for the outdoor scripts
- `data/sources/output_rii_protezione_civile.zip` - rii census for `build_rii_geojson.py`
- `pipeline/data/*.osm.pbf` - OSM dump for the basemap
- `pipeline/tools/planetiler.jar` - for the basemap
