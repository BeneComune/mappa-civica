# Pipeline dati GIS

Script Python per produrre gli asset statici della piattaforma (Jamstack).

Per usare questa pipeline su un comune diverso da Montereale Valcellina,
vedi [SETUP.md](../SETUP.md) alla radice del repo - elenca i file di
configurazione da compilare e i dati grezzi da procurarsi. Ogni script legge
i valori specifici del comune da `pipeline/lib/comune_config.py`, che a sua
volta legge `data/comune.config.json`.

## Setup

Richiede **Python >= 3.11** (la CI usa 3.11).

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt      # oppure requirements-ci.txt per i soli target CI-safe
```

## Esecuzione

Usa il Makefile dalla cartella `pipeline/`:

```bash
make help       # mostra tutti i target disponibili
make all        # pipeline completa
make outdoor    # solo modulo Outdoor (trails, acqua, ciclabile)
make green      # solo modulo Ambiente (NDVI, NBR, LST, ombra)
make rescue     # solo modulo Emergenze
make base       # statistiche ISTAT (le frazioni sono un input curato, non rigenerato)
make community  # solo modulo Segnala (inizializza DuckDB)
make tiles      # PMTiles per catasto.geojson (richiede Tippecanoe)
make basemap    # Basemap vettoriale dark self-hosted (planetiler + OpenMapTiles, ~450MB, Java 21+)
```

`make basemap` è un'alternativa documentata ma non usata in produzione: il frontend usa gli stili live hosted di Maptoolkit (`styles.maptoolkit.org`), non questo basemap self-hosted.

Ogni target è indipendente: puoi eseguirli singolarmente senza rieseguire l'intera pipeline.

## Struttura

```
pipeline/
├── lib/                    # Moduli condivisi importati dagli script
│   ├── comune_config.py    # Legge data/comune.config.json - vedi SETUP.md
│   ├── dem_slope.py        # Campionamento DEM e calcolo pendenza
│   └── exclusions.py       # Geometrie da escludere (opzionale, vedi SETUP.md)
├── scripts/                # Uno script per target applicativo
│   ├── fetch_istat_stats.py
│   ├── build_outdoor_geojson.py
│   ├── build_bike_infra_geojson.py
│   ├── build_bike_cyclepaths_geojson.py
│   ├── build_rescue_geojson.py
│   ├── build_fire_geojson.py
│   ├── build_catasto_geojson.py
│   ├── build_rii_geojson.py
│   ├── process_green_layers.py
│   ├── process_nbr.py
│   ├── process_lst.py
│   └── process_shade_corridors.py
├── data/                   # Intermedi e sorgenti (gitignored)
├── tools/                  # planetiler.jar (gitignored)
├── Makefile
├── requirements.txt
├── requirements-ci.txt
└── README.md
```

## Script e output

| Script | Modulo | Output |
|---|---|---|
| `fetch_istat_stats.py` | Base | `public/data/municipality_stats.json` (solo campi ISTAT) |
| `build_outdoor_geojson.py` | Outdoor | `public/data/outdoor/trails_routing.geojson`, `public/data/outdoor/water.geojson`, `pipeline/data/outdoor/trails.geojson` (intermedio) |
| `build_bike_infra_geojson.py` | Outdoor | `public/data/outdoor/bike_infra.geojson` |
| `build_bike_cyclepaths_geojson.py` | Outdoor | `public/data/outdoor/bike_cyclepaths.geojson` |
| `build_rescue_geojson.py` | Emergenze | `public/data/rescue/aed.geojson`, `hems.geojson`, `fire_hydrants.geojson`, `emergency_assembly_points.geojson` |
| `build_fire_geojson.py` | Emergenze | `public/data/rescue/fire_perimeters.geojson`, `fire_danger.geojson`, `fire_ignition_points.geojson` |
| `build_catasto_geojson.py` | Home | `public/data/catasto.geojson` (Goal 5: diventa `catasto.pmtiles`) |
| `build_rii_geojson.py` | Emergenze | `public/data/rescue/rii.geojson` + foto in `public/data/rescue/rii/` |
| `process_green_layers.py` | Ambiente | `public/data/greenery.geojson` |
| `process_nbr.py` | Ambiente | `public/data/nbr.geojson` |
| `process_lst.py` | Ambiente | `public/data/lst.geojson` |
| `process_shade_corridors.py` | Ambiente | `public/data/shade_corridors.geojson` |

## Dati locali richiesti (gitignored)

Questi file devono essere presenti localmente ma non sono versionati:

- `data/raw/*.SAFE` - scena Sentinel-2 L2A per `process_green_layers.py` e `process_nbr.py`
- `data/raw/*_lwir11.TIF` - banda termica Landsat 8/9 C2 L2 per `process_lst.py`
- `data/raw/dem.tif` - DEM/LiDAR per gli script outdoor
- `data/sources/output_rii_protezione_civile.zip` - censimento rii per `build_rii_geojson.py`
- `pipeline/data/*.osm.pbf` - dump OSM per il basemap
- `pipeline/tools/planetiler.jar` - per il basemap
