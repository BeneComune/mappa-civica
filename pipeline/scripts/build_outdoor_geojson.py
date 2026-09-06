"""Extract outdoor datasets for the configured comune from OSM Overpass.

Genera file statici, gia' limitati al confine comunale:
- public/data/outdoor/trails_routing.geojson
- public/data/outdoor/water.geojson
- pipeline/data/outdoor/trails.geojson  (intermedio, gitignored: input di
  process_shade_corridors.py; nessuna pagina lo serve direttamente)

Fase 0: niente routing, solo dataset puliti per il frontend.
"""

from __future__ import annotations

import json
from pathlib import Path
from urllib.request import Request, urlopen

import geopandas as gpd
from shapely.geometry import shape

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import AREA_ID
from lib.dem_slope import DemSampler, enrich_geodataframe_with_slope
from lib.exclusions import geometry_is_excluded


OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
MIN_TRAIL_LENGTH_M = 75
DEM_PATH = Path(__file__).resolve().parents[2] / "data" / "raw" / "dem.tif"


def overpass(query: str) -> dict:
    last_error = None
    for url in OVERPASS_URLS:
        try:
            req = Request(
                url,
                data=query.encode("utf-8"),
                headers={"User-Agent": "OpenCode/1.0"},
            )
            with urlopen(req, timeout=180) as response:
                return json.load(response)
        except Exception as exc:  # pragma: no cover - network fallback
            last_error = exc
    raise last_error  # type: ignore[misc]


def feature_from_element(element: dict, class_name: str) -> dict:
    geometry_type = element.get("type")
    if geometry_type == "way":
        geometry = element.get("geometry")
        if not geometry:
            raise ValueError(f"Missing geometry for way {element.get('id')}")
        coords = [[node["lon"], node["lat"]] for node in geometry]
        geom = {"type": "LineString", "coordinates": coords}
    elif geometry_type == "node":
        geom = {"type": "Point", "coordinates": [element["lon"], element["lat"]]}
    else:
        raise ValueError(f"Unsupported element type: {geometry_type}")

    tags = element.get("tags", {})
    props = {
        "class": class_name,
        "name": tags.get("name"),
        "name:it": tags.get("name:it"),
        "source": "overpass",
        "osm_id": element.get("id"),
    }
    for key in (
        "highway",
        "amenity",
        "natural",
        "tourism",
        "leisure",
        "route",
        "sac_scale",
        "mtb:scale",
        "surface",
        "smoothness",
        "access",
        "trail_visibility",
        "ref",
        "network",
        "osmc:symbol",
    ):
        if key in tags:
            props[key] = tags[key]
    return {"type": "Feature", "properties": props, "geometry": geom}


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    out_dir = repo_root / "public" / "data" / "outdoor"
    out_dir.mkdir(parents=True, exist_ok=True)
    # trails.geojson is not served by any page (only trails_shaded.geojson is
    # rendered); keep it as a gitignored intermediate for process_shade_corridors.py.
    intermediate_dir = repo_root / "pipeline" / "data" / "outdoor"
    intermediate_dir.mkdir(parents=True, exist_ok=True)

    trails_query = f"""
    [out:json][timeout:180];
    area({AREA_ID})->.a;
    (
      way(area.a)["highway"~"path|track|bridleway|cycleway"];
    );
    out geom;
    """

    water_query = f"""
    [out:json][timeout:180];
    area({AREA_ID})->.a;
    (
      node(area.a)["amenity"="drinking_water"];
      node(area.a)["natural"="spring"];
      node(area.a)["tourism"="picnic_site"];
      node(area.a)["amenity"="picnic_site"];
      node(area.a)["leisure"="picnic_table"];
    );
    out geom;
    """

    trails_data = overpass(trails_query)

    trails_features = []
    for element in trails_data.get("elements", []):
        tags = element.get("tags", {})
        highway = tags.get("highway")
        if highway not in {"path", "track", "bridleway", "cycleway"}:
            continue
        trails_features.append(feature_from_element(element, highway))

    trails_gdf = gpd.GeoDataFrame.from_features(trails_features, crs="EPSG:4326")
    trails_gdf = trails_gdf[~trails_gdf.geometry.apply(geometry_is_excluded)].copy()
    trails_gdf = trails_gdf.to_crs("EPSG:32632")
    dem = DemSampler.from_file(DEM_PATH)
    trails_gdf = enrich_geodataframe_with_slope(trails_gdf, dem)
    trails_gdf["length_m"] = trails_gdf.geometry.length
    trails_routing_geojson = json.loads(trails_gdf.to_crs("EPSG:4326").to_json(drop_id=True))

    trails_display_gdf = trails_gdf[trails_gdf["length_m"] >= MIN_TRAIL_LENGTH_M].copy()
    trails_display_geojson = json.loads(trails_display_gdf.to_crs("EPSG:4326").to_json(drop_id=True))

    water_features = []
    try:
        water_data = overpass(water_query)
        for element in water_data.get("elements", []):
            tags = element.get("tags", {})
            if tags.get("amenity") == "drinking_water":
                water_features.append(feature_from_element(element, "drinking_water"))
            elif tags.get("natural") == "spring":
                water_features.append(feature_from_element(element, "spring"))
            elif tags.get("tourism") == "picnic_site" or tags.get("amenity") == "picnic_site":
                water_features.append(feature_from_element(element, "picnic_site"))
            elif tags.get("leisure") == "picnic_table":
                water_features.append(feature_from_element(element, "picnic_area"))
    except Exception:
        fallback_water_path = out_dir / "water.geojson"
        if fallback_water_path.exists():
            water_features = json.loads(fallback_water_path.read_text()).get("features", [])

    water_features = [feature for feature in water_features if not geometry_is_excluded(shape(feature["geometry"]))]
    water_geojson = {"type": "FeatureCollection", "features": water_features}

    (intermediate_dir / "trails.geojson").write_text(json.dumps(trails_display_geojson, ensure_ascii=False))
    (out_dir / "trails_routing.geojson").write_text(json.dumps(trails_routing_geojson, ensure_ascii=False))
    (out_dir / "water.geojson").write_text(json.dumps(water_geojson, ensure_ascii=False))

    print(f"[OK] trails.geojson: {len(trails_display_geojson['features'])} features")
    print(f"[OK] trails_routing.geojson: {len(trails_routing_geojson['features'])} features")
    print(f"[OK] water.geojson: {len(water_geojson['features'])} features")


if __name__ == "__main__":
    main()
