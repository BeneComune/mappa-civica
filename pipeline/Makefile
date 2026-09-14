PYTHON := python

SCRIPTS := scripts

.PHONY: help all base outdoor cyclepaths rescue rii fire landslide catasto peaks hospital green green-refresh green-refresh-sentinel2 fetch-sentinel2 fetch-landsat community tiles basemap

help:
	@echo "Montereale Valcellina - pipeline GIS"
	@echo ""
	@echo "Targets (require full requirements.txt + local data files):"
	@echo "  make all        Full pipeline"
	@echo "  make base       ISTAT stats (frazioni are curated, not regenerated - see SETUP.md)"
	@echo "  make outdoor    Trails, water, bike infra (Overpass + DEM .tif)"
	@echo "  make rescue     Emergency assets (Overpass)"
	@echo "  make rii        Rii a rischio esondazione (from data/sources/output_rii_protezione_civile.zip)"
	@echo "  make fire       Perimetri incendi boschivi (IRDAT FVG WFS, solo comuni FVG)"
	@echo "  make landslide  Rischio frane, aree a pericolosita' PAI (ISPRA WFS, copertura nazionale)"
	@echo "  make catasto    Particelle catastali -> catasto.pmtiles (onData; requires tippecanoe)"
	@echo "  make peaks      Cime principali + peaks_poles (Overpass natural=peak + data/peaks_curated.json)"
	@echo "  make hospital   Ospedale piu' vicino (Overpass amenity=hospital)"
	@echo "  make green      NDVI, NBR, LST, shade corridors (Sentinel-2 + LiDAR)"
	@echo "  make green-refresh  Fetch latest Sentinel-2/Landsat via API, then make green"
	@echo "                      (needs CDSE_*/USGS_* credentials, see SETUP.md)"
	@echo "  make green-refresh-sentinel2  Same, NDVI+NBR only (CDSE_* only, no Landsat/USGS needed)"
	@echo "  make community  Build community_data.duckdb from data/community/reports.csv"
	@echo "  make tiles      alias of catasto (the only PMTiles layer)"
	@echo "  make basemap    Dark vector basemap (planetiler + OpenMapTiles, ~450MB, needs Java 21+)"
	@echo ""
	@echo "CI-safe targets (run in GitHub Actions, no local data needed):"
	@echo "  make rescue     Emergency assets (Overpass only)"
	@echo "  make fire       Perimetri incendi boschivi (IRDAT FVG WFS)"
	@echo "  make landslide  Rischio frane, aree a pericolosita' PAI (ISPRA WFS, national)"
	@echo "  make cyclepaths Bike cyclepaths from committed transport.geojson"
	@echo "  make peaks      Cime principali (Overpass only)"
	@echo "  make hospital   Ospedale piu' vicino (Overpass only)"
	@echo "  make base       ISTAT stats (public API)"
	@echo ""
	@echo "Setup: python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"

all: base outdoor cyclepaths rescue fire landslide peaks hospital green community

base:
	$(PYTHON) $(SCRIPTS)/fetch_istat_stats.py

outdoor:
	$(PYTHON) $(SCRIPTS)/build_outdoor_geojson.py
	$(PYTHON) $(SCRIPTS)/build_bike_infra_geojson.py

cyclepaths:
	$(PYTHON) $(SCRIPTS)/build_bike_cyclepaths_geojson.py

rescue:
	$(PYTHON) $(SCRIPTS)/build_rescue_geojson.py

rii:
	$(PYTHON) $(SCRIPTS)/build_rii_geojson.py

fire:
	$(PYTHON) $(SCRIPTS)/build_fire_geojson.py

landslide:
	$(PYTHON) $(SCRIPTS)/build_landslide_geojson.py

catasto:
	$(PYTHON) $(SCRIPTS)/build_catasto_geojson.py

peaks:
	$(PYTHON) $(SCRIPTS)/build_peaks_geojson.py

hospital:
	$(PYTHON) $(SCRIPTS)/build_hospital_geojson.py

# Not CI-safe: needs a Sentinel-2 .SAFE + a Landsat *_lwir11.TIF in data/raw/,
# plus greenery/trails from `make green`/`make outdoor` first for shade corridors.
green:
	$(PYTHON) $(SCRIPTS)/process_green_layers.py
	$(PYTHON) $(SCRIPTS)/process_nbr.py
	$(PYTHON) $(SCRIPTS)/process_lst.py
	$(PYTHON) $(SCRIPTS)/process_shade_corridors.py

# Fetches this month's scenes via API (needs CDSE_*/USGS_* credentials, see
# SETUP.md) instead of a manual data/raw/ download, then runs `green` as
# usual. What the monthly refresh workflow calls. Note: process_shade_corridors.py
# (part of `green`) also needs pipeline/data/outdoor/trails.geojson from
# `make outdoor`, which needs the DEM - not fetched here, so shade corridors
# only regenerate correctly if that intermediate already exists locally.
fetch-sentinel2:
	$(PYTHON) $(SCRIPTS)/fetch_sentinel2_scene.py

fetch-landsat:
	$(PYTHON) $(SCRIPTS)/fetch_landsat_scene.py

green-refresh: fetch-sentinel2 fetch-landsat green

# NDVI+NBR only, for testing/using the Copernicus side before USGS credentials
# are ready - skips process_lst.py (needs Landsat) and process_shade_corridors.py
# (needs the DEM-derived trails.geojson, also not fetched here).
green-refresh-sentinel2: fetch-sentinel2
	$(PYTHON) $(SCRIPTS)/process_green_layers.py
	$(PYTHON) $(SCRIPTS)/process_nbr.py

community:
	$(PYTHON) $(SCRIPTS)/build_community_duckdb.py

# catasto is the only PMTiles layer; build_catasto_geojson.py runs tippecanoe
# itself, so `tiles` is just an alias.
tiles: catasto

basemap:
	$(PYTHON) $(SCRIPTS)/build_basemap.py
