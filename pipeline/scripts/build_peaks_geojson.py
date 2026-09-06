"""Cime principali - the "peaks" overlay for the Outdoor module.

Two files:

  public/data/outdoor/peaks.geojson        summit points  (name, ele)
  public/data/outdoor/peaks_poles.geojson  fill-extrusion "poles" (name, ele, poleHeight)

Every OSM `natural=peak` node inside the municipal boundary that carries a
name and an elevation is shown. data/peaks_curated.json adds any summit OSM
is missing (matched by name) - it is empty by default. See
lib/map/overlays/peaks.ts.

The pole is a stylized relative-elevation marker, not a to-scale one:
`poleHeight` is a linear rescale of the peak's elevation onto
[MIN_POLE, MAX_POLE], between the lowest and highest shown peak. The
footprint is a small (~10 m) axis-aligned box centred on the summit;
BOX_DLON/BOX_DLAT differ so it reads square at this latitude.

Overpass-only, no local data. `make peaks`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import AREA_ID  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
CURATED_PATH = REPO_ROOT / "data" / "peaks_curated.json"
OUT_DIR = REPO_ROOT / "public" / "data" / "outdoor"

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

MIN_POLE = 150
MAX_POLE = 500
BOX_DLON = 0.000065
BOX_DLAT = 0.000045


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


def parse_ele(raw: object) -> int | None:
    """OSM `ele` is a free string ('1471', '1471 m', '1471.0', '1.471')."""
    if raw is None:
        return None
    text = str(raw).strip().split()[0].replace(",", ".")
    try:
        return int(round(float(text)))
    except ValueError:
        return None


def osm_peaks() -> dict[str, tuple[float, float, int | None]] | None:
    """name -> (lon, lat, ele) for every natural=peak inside the boundary,
    or None if Overpass could not be reached."""
    query = f"""
    [out:json][timeout:180];
    area({AREA_ID})->.a;
    (
      node(area.a)["natural"="peak"];
    );
    out tags center;
    """
    try:
        data = overpass(query)
    except Exception as exc:
        print(f"[warn] Overpass unreachable for peaks: {exc}", file=sys.stderr)
        return None
    found: dict[str, tuple[float, float, int | None]] = {}
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        if "lat" in element:
            lon, lat = element["lon"], element["lat"]
        else:
            center = element.get("center", {})
            lon, lat = center.get("lon"), center.get("lat")
        if lon is None or lat is None:
            continue
        found[name] = (lon, lat, parse_ele(tags.get("ele")))
    return found


def resolve_peaks() -> list[dict] | None:
    """The peaks to show, sorted by elevation (desc). None means "Overpass is
    down and a committed file already exists" - the caller should not rewrite."""
    curated = []
    if CURATED_PATH.exists():
        curated = json.loads(CURATED_PATH.read_text(encoding="utf-8")).get("peaks", [])
    curated_ele = {c["name"]: c.get("ele") for c in curated}

    osm = osm_peaks()
    if osm is None:
        if (OUT_DIR / "peaks.geojson").exists():
            print("[skip] keeping committed peaks.geojson", file=sys.stderr)
            return None
        osm = {}

    peaks: list[dict] = []
    seen: set[str] = set()
    for name, (lon, lat, ele) in osm.items():
        if ele is None:
            ele = curated_ele.get(name)
        if ele is None:
            print(f"[warn] peak {name!r} has no elevation - skipped", file=sys.stderr)
            continue
        peaks.append({"name": name, "lon": round(lon, 6), "lat": round(lat, 6), "ele": int(ele)})
        seen.add(name)

    for entry in curated:
        if entry["name"] in seen or entry.get("ele") is None:
            continue
        peaks.append({
            "name": entry["name"],
            "lon": round(entry["lon"], 6),
            "lat": round(entry["lat"], 6),
            "ele": int(entry["ele"]),
        })

    peaks.sort(key=lambda p: (-p["ele"], p["name"]))
    return peaks


def pole_height(ele: int, ele_min: int, ele_max: int) -> int:
    if ele_max == ele_min:
        return MIN_POLE
    ratio = (ele - ele_min) / (ele_max - ele_min)
    return round(MIN_POLE + ratio * (MAX_POLE - MIN_POLE))


def write_summits(peaks: list[dict]) -> None:
    features = []
    for p in peaks:
        features.append(
            "    {\n"
            '      "type": "Feature",\n'
            f'      "properties": {{ "name": {json.dumps(p["name"], ensure_ascii=False)}, "ele": {p["ele"]} }},\n'
            f'      "geometry": {{ "type": "Point", "coordinates": [{p["lon"]}, {p["lat"]}] }}\n'
            "    }"
        )
    text = '{\n  "type": "FeatureCollection",\n  "features": [\n' + ",\n".join(features) + "\n  ]\n}\n"
    (OUT_DIR / "peaks.geojson").write_text(text, encoding="utf-8")
    print(f"[OK] peaks.geojson: {len(peaks)} cime")


def write_poles(peaks: list[dict]) -> None:
    ele_min = min(p["ele"] for p in peaks)
    ele_max = max(p["ele"] for p in peaks)
    features = []
    for p in peaks:
        lon, lat = p["lon"], p["lat"]
        ring = [
            [lon - BOX_DLON, lat - BOX_DLAT],
            [lon + BOX_DLON, lat - BOX_DLAT],
            [lon + BOX_DLON, lat + BOX_DLAT],
            [lon - BOX_DLON, lat + BOX_DLAT],
            [lon - BOX_DLON, lat - BOX_DLAT],
        ]
        features.append({
            "type": "Feature",
            "properties": {"name": p["name"], "ele": p["ele"], "poleHeight": pole_height(p["ele"], ele_min, ele_max)},
            "geometry": {"type": "Polygon", "coordinates": [ring]},
        })
    fc = {"type": "FeatureCollection", "features": features}
    (OUT_DIR / "peaks_poles.geojson").write_text(json.dumps(fc, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] peaks_poles.geojson: {len(peaks)} poli (poleHeight {MIN_POLE}-{MAX_POLE} su {ele_min}-{ele_max} m)")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    peaks = resolve_peaks()
    if peaks is None:
        return
    if not peaks:
        sys.exit("[skip] no named peaks with an elevation found")
    write_summits(peaks)
    write_poles(peaks)


if __name__ == "__main__":
    main()
