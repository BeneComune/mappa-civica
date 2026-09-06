"""Build rescue/operational assets from OSM when available.

Fallback strategy:
- try to fetch real OSM features for AED, HEMS, fire hydrants and assembly points
- if OSM returns nothing or the request fails, keep the existing placeholder files
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from urllib.request import Request, urlopen

from shapely.geometry import shape

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import AREA_ID
from lib.exclusions import geometry_is_excluded


OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]


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
    tags = element.get("tags", {})
    if element.get("type") == "node":
        geometry = {"type": "Point", "coordinates": [element["lon"], element["lat"]]}
    else:
        center = element.get("center")
        if center:
            geometry = {"type": "Point", "coordinates": [center["lon"], center["lat"]]}
        else:
            geometry = {"type": "Point", "coordinates": [0.0, 0.0]}

    properties = {
        "class": class_name,
        "name": tags.get("name"),
        "name:it": tags.get("name:it"),
        "source": "overpass",
        "osm_id": element.get("id"),
    }

    for key in (
        "amenity",
        "emergency",
        "aeroway",
        "access",
        "indoor",
        "opening_hours",
        "operator",
        "capacity",
        "defibrillator:location",
        "level",
        "phone",
        "fixme",
        "fire_hydrant:type",
        "fire_hydrant:position",
        "ref",
        "description",
    ):
        if key in tags:
            properties[key] = tags[key]

    return {"type": "Feature", "properties": properties, "geometry": geometry}


def overpass_features(query: str, class_name: str) -> list[dict] | None:
    """OSM features for the query, or None if Overpass could not be reached
    (so the caller can leave the committed file untouched)."""
    try:
        data = overpass(query)
    except Exception as exc:
        print(f"[warn] Overpass unreachable for {class_name}: {exc}", file=sys.stderr)
        return None
    features = [feature_from_element(e, class_name) for e in data.get("elements", [])]
    return [f for f in features if not geometry_is_excluded(shape(f["geometry"]))]


def fetch_feature_collection(query: str, class_name: str, fallback_path: Path) -> list[dict]:
    features = overpass_features(query, class_name)
    if features:
        return features
    if fallback_path.exists():
        return json.loads(fallback_path.read_text()).get("features", [])
    return []


def _point(feature: dict) -> tuple[float, float]:
    lon, lat = feature["geometry"]["coordinates"][:2]
    return lon, lat


def _rough_metres(a: tuple[float, float], b: tuple[float, float]) -> float:
    # good enough for a "same device?" check at this latitude
    dx = (a[0] - b[0]) * 111_320 * math.cos(math.radians(a[1]))
    dy = (a[1] - b[1]) * 110_540
    return math.hypot(dx, dy)


def merge_curated(osm_features: list[dict], curated_path: Path, dedupe_m: float = 60.0) -> list[dict]:
    """OSM wins; add curated (comune-provided) features only where OSM has
    nothing nearby, so hand-mapped nodes fold in without duplicating."""
    if not curated_path.exists():
        return osm_features
    curated = json.loads(curated_path.read_text()).get("features", [])
    osm_pts = [_point(f) for f in osm_features]
    merged = list(osm_features)
    for feature in curated:
        pt = _point(feature)
        if any(_rough_metres(pt, o) <= dedupe_m for o in osm_pts):
            continue
        merged.append(feature)
    return merged


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    out_dir = repo_root / "public" / "data" / "rescue"
    out_dir.mkdir(parents=True, exist_ok=True)

    queries = {
        "aed": f"""
        [out:json][timeout:180];
        area({AREA_ID})->.a;
        (
          nwr(area.a)[emergency=defibrillator];
          nwr(area.a)[amenity=defibrillator];
        );
        out tags center;
        """,
        "hems": f"""
        [out:json][timeout:180];
        area({AREA_ID})->.a;
        (
          nwr(area.a)[aeroway=helipad];
          nwr(area.a)[emergency=helipad];
          nwr(area.a)[emergency=landing_site];
        );
        out tags center;
        """,
        "fire_hydrants": f"""
        [out:json][timeout:180];
        area({AREA_ID})->.a;
        (
          node(area.a)[emergency=fire_hydrant];
          way(area.a)[emergency=fire_hydrant];
          relation(area.a)[emergency=fire_hydrant];
        );
        out tags center;
        """,
        "emergency_assembly_points": f"""
        [out:json][timeout:180];
        area({AREA_ID})->.a;
        (
          node(area.a)[emergency=assembly_point];
          way(area.a)[emergency=assembly_point];
          relation(area.a)[emergency=assembly_point];
        );
        out tags center;
        """,
    }

    outputs = {
        "aed": ("aed.geojson", "defibrillator"),
        "hems": ("hems.geojson", "hems"),
        "fire_hydrants": ("fire_hydrants.geojson", "fire_hydrant"),
        "emergency_assembly_points": ("emergency_assembly_points.geojson", "assembly_point"),
    }

    for key, (filename, class_name) in outputs.items():
        out_path = out_dir / filename
        # Optional comune-provided list, kept in <name>_comune.geojson so a
        # pipeline run can't wipe it. OSM features take precedence; curated
        # points only fill gaps where OSM has nothing nearby.
        curated = out_dir / f"{Path(filename).stem}_comune.geojson"

        if curated.exists():
            osm_features = overpass_features(queries[key], class_name)
            if osm_features is None:
                # Overpass down: never regress the committed file to curated-only.
                print(f"[skip] {filename}: Overpass unreachable, kept as-is")
                continue
            features = merge_curated(osm_features, curated)
        else:
            features = fetch_feature_collection(queries[key], class_name, out_path)

        geojson = {"type": "FeatureCollection", "features": features}
        out_path.write_text(json.dumps(geojson, ensure_ascii=False))
        print(f"[OK] {filename}: {len(features)} features")


if __name__ == "__main__":
    main()
