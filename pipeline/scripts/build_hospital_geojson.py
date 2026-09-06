"""Ospedale piu' vicino - the fixed destination for the Rescue module, plus
the road network the driving route to it is computed over.

Two files:

  public/data/rescue/hospital.geojson        one Point (name, address)
  public/data/rescue/hospital_roads.geojson  driving edges (u, v, length,
                                             highway, maxspeed)

lib/map/overlays/hospital.ts and components/nearest-hospital.tsx expect a
single hospital, not a list. The nearest one usually sits in a neighbouring
comune, and public/data/transport.geojson is clipped to this comune's
boundary, so the in-browser router would stop the route at the border. This
script therefore also exports a road graph covering the comune *and* the
hospital (bounding box of the two, padded), in the same schema
buildTransportRoutingGraph() reads - see lib/routing/graph.ts.

Query OSM `amenity=hospital` in a growing radius from the town centre
(data/comune.config.json -> map.center) until at least one turns up, then
keep only the closest, with its address rebuilt from the addr:* tags.
Coordinates are the raw OSM node position (not rounded).

Overpass-only, no local data. `make hospital`.
"""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import COMUNE, BOUNDARY_PATH  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[2] / "public" / "data" / "rescue"
POINT_PATH = OUT_DIR / "hospital.geojson"
ROADS_PATH = OUT_DIR / "hospital_roads.geojson"

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
SEARCH_RADII_M = [3000, 6000, 10000, 20000, 40000]

# Padding around the comune+hospital bounding box, in degrees (~1 km), so the
# hospital and its access roads aren't flush against the query edge.
BBOX_PAD_DEG = 0.01

# Drivable OSM highway classes for the hospital route graph. `service` is left
# out on purpose: parking aisles and driveways roughly triple the edge count
# and the route only needs to reach a public road near the hospital.
DRIVABLE_HIGHWAYS = (
    "motorway|trunk|primary|secondary|tertiary|unclassified|residential|"
    "living_street|road|motorway_link|trunk_link|primary_link|"
    "secondary_link|tertiary_link"
)


def overpass(query: str) -> dict:
    last_error = None
    for url in OVERPASS_URLS:
        try:
            req = Request(url, data=query.encode("utf-8"), headers={"User-Agent": "mappa-civica-pipeline/1.0"})
            with urlopen(req, timeout=180) as response:
                return json.load(response)
        except Exception as exc:  # pragma: no cover - network fallback
            last_error = exc
    raise last_error  # type: ignore[misc]


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    r = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def element_point(element: dict) -> tuple[float, float] | None:
    if "lat" in element:
        return element["lon"], element["lat"]
    center = element.get("center", {})
    if "lon" in center and "lat" in center:
        return center["lon"], center["lat"]
    return None


def format_address(tags: dict) -> str:
    street = tags.get("addr:street")
    housenumber = tags.get("addr:housenumber")
    city_line = " ".join(x for x in (tags.get("addr:postcode"), tags.get("addr:city")) if x)
    parts = []
    if street:
        parts.append(f"{street}, {housenumber}" if housenumber else street)
    if city_line:
        parts.append(city_line)
    return ", ".join(parts) or tags.get("addr:full", "")


def find_nearest(lon: float, lat: float) -> tuple[dict, float, float] | None:
    for radius in SEARCH_RADII_M:
        query = f"""
        [out:json][timeout:180];
        (
          nwr(around:{radius},{lat},{lon})["amenity"="hospital"];
        );
        out tags center;
        """
        elements = overpass(query).get("elements", [])
        candidates = []
        for element in elements:
            point = element_point(element)
            if point is None:
                continue
            tags = element.get("tags", {})
            distance = haversine_m(lon, lat, point[0], point[1])
            # Nearest wins; ties break towards the better-tagged node so a bare
            # duplicate of the same hospital can't shadow the addressed one.
            sort_key = (round(distance), not tags.get("addr:street"), not tags.get("name"), element.get("id", 0))
            candidates.append((sort_key, element, point))
        if candidates:
            candidates.sort(key=lambda c: c[0])
            _, element, point = candidates[0]
            return element, point[0], point[1]
    return None


def boundary_bbox() -> tuple[float, float, float, float]:
    data = json.loads(Path(BOUNDARY_PATH).read_text(encoding="utf-8"))
    geom = data["geometry"] if data.get("type") == "Feature" else (
        data["features"][0]["geometry"] if data.get("features") else data)
    lons: list[float] = []
    lats: list[float] = []

    def walk(coords: object) -> None:
        if isinstance(coords, (list, tuple)):
            if len(coords) >= 2 and isinstance(coords[0], (int, float)) and isinstance(coords[1], (int, float)):
                lons.append(coords[0])
                lats.append(coords[1])
            else:
                for item in coords:
                    walk(item)

    walk(geom["coordinates"])
    return min(lons), min(lats), max(lons), max(lats)


def parse_maxspeed(raw: object) -> int | None:
    if raw is None:
        return None
    match = re.match(r"\s*(\d+)", str(raw))
    return int(match.group(1)) if match else None


def build_road_graph(bbox: tuple[float, float, float, float]) -> list[dict]:
    """Driving edges inside bbox (west, south, east, north). Each OSM way is cut
    into edges only at real junctions (nodes shared by more than one way, plus
    the way's own endpoints) - the OSMnx-style topology transport.geojson uses,
    keyed by OSM node id via the u/v properties."""
    west, south, east, north = bbox
    query = f"""
    [out:json][timeout:180];
    way["highway"~"^({DRIVABLE_HIGHWAYS})$"]({south},{west},{north},{east});
    out geom;
    """
    ways = [w for w in overpass(query).get("elements", [])
            if len(w.get("nodes") or []) == len(w.get("geometry") or []) >= 2]

    node_way_count: dict[int, int] = {}
    for way in ways:
        for node_id in set(way["nodes"]):
            node_way_count[node_id] = node_way_count.get(node_id, 0) + 1

    features: list[dict] = []
    seen: set[tuple[int, int]] = set()
    for way in ways:
        nodes = way["nodes"]
        geometry = way["geometry"]
        tags = way.get("tags", {})
        highway = tags.get("highway")
        maxspeed = parse_maxspeed(tags.get("maxspeed"))

        start = 0
        for end in range(1, len(nodes)):
            if end != len(nodes) - 1 and node_way_count.get(nodes[end], 0) <= 1:
                continue
            u, v = nodes[start], nodes[end]
            coords = [[round(geometry[k]["lon"], 6), round(geometry[k]["lat"], 6)]
                      for k in range(start, end + 1)]
            start = end
            key = (u, v) if u < v else (v, u)
            if u == v or key in seen:
                continue
            seen.add(key)
            length = round(sum(
                haversine_m(coords[k][0], coords[k][1], coords[k + 1][0], coords[k + 1][1])
                for k in range(len(coords) - 1)
            ), 3)
            if length <= 0:
                continue
            props = {"u": u, "v": v, "length": length, "highway": highway}
            if maxspeed is not None:
                props["maxspeed"] = maxspeed
            features.append({
                "type": "Feature",
                "properties": props,
                "geometry": {"type": "LineString", "coordinates": coords},
            })
    return features


def write_point(name: str, address: str, lon: float, lat: float) -> None:
    text = (
        "{\n"
        '  "type": "FeatureCollection",\n'
        '  "features": [\n'
        "    {\n"
        '      "type": "Feature",\n'
        '      "properties": {\n'
        f'        "name": {json.dumps(name, ensure_ascii=False)},\n'
        f'        "address": {json.dumps(address, ensure_ascii=False)}\n'
        "      },\n"
        f'      "geometry": {{ "type": "Point", "coordinates": [{lon}, {lat}] }}\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )
    POINT_PATH.write_text(text, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    lon, lat = COMUNE["map"]["center"]

    try:
        result = find_nearest(lon, lat)
    except Exception as exc:  # service down: keep the committed files
        print(f"[warn] Overpass unreachable: {exc}", file=sys.stderr)
        if POINT_PATH.exists():
            print("[warn] keeping existing hospital.geojson / hospital_roads.geojson", file=sys.stderr)
            return
        result = None

    if not result:
        print("[note] no amenity=hospital found within "
              f"{SEARCH_RADII_M[-1] // 1000} km - writing empty", file=sys.stderr)
        POINT_PATH.write_text('{"type":"FeatureCollection","features":[]}\n', encoding="utf-8")
        ROADS_PATH.write_text('{"type":"FeatureCollection","features":[]}\n', encoding="utf-8")
        return

    element, h_lon, h_lat = result
    tags = element.get("tags", {})
    name = tags.get("name", "Ospedale")
    address = format_address(tags)
    write_point(name, address, h_lon, h_lat)
    print(f"[OK] hospital.geojson: {name} ({haversine_m(lon, lat, h_lon, h_lat) / 1000:.1f} km)")

    w, s, e, n = boundary_bbox()
    bbox = (
        min(w, h_lon) - BBOX_PAD_DEG,
        min(s, h_lat) - BBOX_PAD_DEG,
        max(e, h_lon) + BBOX_PAD_DEG,
        max(n, h_lat) + BBOX_PAD_DEG,
    )
    try:
        edges = build_road_graph(bbox)
    except Exception as exc:
        print(f"[warn] road graph fetch failed: {exc}", file=sys.stderr)
        if ROADS_PATH.exists():
            print("[warn] keeping existing hospital_roads.geojson", file=sys.stderr)
            return
        edges = []

    fc = {"type": "FeatureCollection", "features": edges}
    ROADS_PATH.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"[OK] hospital_roads.geojson: {len(edges)} edges")


if __name__ == "__main__":
    main()
