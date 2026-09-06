"""Extract bike infrastructure for the configured comune from OSM Overpass.

Genera un file statico per il submodulo Cyclability/Bike infra:
- public/data/outdoor/bike_infra.geojson
"""

from __future__ import annotations

import json
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
    return {
        "type": "Feature",
        "properties": {
            "class": class_name,
            "name": tags.get("name"),
            "name:it": tags.get("name:it"),
            "source": "overpass",
            "osm_id": element.get("id"),
            "amenity": tags.get("amenity"),
            "bicycle": tags.get("bicycle"),
            "operator": tags.get("operator"),
            "capacity": tags.get("capacity"),
        },
        "geometry": {
            "type": "Point",
            "coordinates": [element["lon"], element["lat"]],
        },
    }


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    out_dir = repo_root / "public" / "data" / "outdoor"
    out_dir.mkdir(parents=True, exist_ok=True)

    query = f"""
    [out:json][timeout:180];
    area({AREA_ID})->.a;
    (
      node(area.a)["amenity"="bicycle_parking"];
      node(area.a)["amenity"="bicycle_rental"];
      node(area.a)["amenity"="bicycle_repair_station"];
      node(area.a)["amenity"="charging_station"]["bicycle"~"yes|designated|permissive"];
    );
    out geom;
    """

    try:
        data = overpass(query)
    except Exception:
        fallback_path = out_dir / "bike_infra.geojson"
        if not fallback_path.exists():
            raise

        data = json.loads(fallback_path.read_text())

    features = []
    for element in data.get("elements", []) if "elements" in data else data.get("features", []):
        if "elements" in data:
            tags = element.get("tags", {})
            amenity = tags.get("amenity")
            bicycle = tags.get("bicycle")

            if amenity == "bicycle_parking":
                features.append(feature_from_element(element, "bike_parking"))
            elif amenity == "bicycle_rental":
                features.append(feature_from_element(element, "bike_rental"))
            elif amenity == "bicycle_repair_station":
                features.append(feature_from_element(element, "bike_repair"))
            elif amenity == "charging_station" and bicycle in {"yes", "designated", "permissive"}:
                features.append(feature_from_element(element, "ebike_charging"))
        else:
            features.append(element)

    features = [feature for feature in features if not geometry_is_excluded(shape(feature["geometry"]))]

    geojson = {"type": "FeatureCollection", "features": features}
    (out_dir / "bike_infra.geojson").write_text(json.dumps(geojson, ensure_ascii=False))

    print(f"[OK] bike_infra.geojson: {len(features)} features")


if __name__ == "__main__":
    main()
