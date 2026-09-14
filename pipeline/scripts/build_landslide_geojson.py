"""Landslide hazard zones (PAI) for the Soccorso ed Emergenza module (Rischio frane).

Source: ISPRA's national mosaic of landslide hazard areas from the Piani di
Assetto Idrogeologico (PAI), drawn up by the river-basin authorities - WFS
`nz2:aree_peric_frana_pai` on ISPRA's GeoServer. Unlike the fire layers
(build_fire_geojson.py, FVG-only), this WFS covers the whole country, so
this script works unchanged for any comune.

Each polygon carries a `peric_ita` label ("Moderata P1" .. "Molto elevata
P4", plus "Aree di Attenzione AA" for not-yet-classified zones); this script
simplifies that to a `class` key (p1-p4, aa) the frontend colours by, and
clips every polygon to the municipal boundary.

Re-run with `make landslide`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from shapely import force_2d
from shapely.geometry import mapping, shape

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import BOUNDARY_PATH  # noqa: E402

WFS_URL = "https://sdi.isprambiente.it/geoserver/nz2/wfs"
OUT_PATH = Path(__file__).resolve().parents[2] / "public" / "data" / "rescue" / "landslide_hazard.geojson"

# "Moderata P1" -> "p1", etc. - matches the frontend's LANDSLIDE_CLASS_CONFIG
# (lib/landslide-classes.ts) key for key.
CLASS_MAP = {
    "moderata p1": "p1",
    "media p2": "p2",
    "elevata p3": "p3",
    "molto elevata p4": "p4",
    "aree di attenzione aa": "aa",
}


def load_boundary():
    data = json.loads(BOUNDARY_PATH.read_text())
    geom = data["geometry"] if data.get("type") == "Feature" else (
        data["features"][0]["geometry"] if data.get("features") else data)
    return shape(geom).buffer(0)


def fetch_features(minx: float, miny: float, maxx: float, maxy: float) -> list[dict]:
    params = {
        "service": "WFS", "version": "2.0.0", "request": "GetFeature",
        "typeNames": "nz2:aree_peric_frana_pai", "outputFormat": "application/json",
        "srsName": "EPSG:4326", "bbox": f"{minx},{miny},{maxx},{maxy},EPSG:4326",
        "count": "1000",
    }
    req = Request(f"{WFS_URL}?{urlencode(params)}", headers={"User-Agent": "mappa-civica-pipeline/1.0"})
    with urlopen(req, timeout=120) as response:
        return json.load(response).get("features", [])


def build_hazard_zones(boundary) -> list[dict]:
    minx, miny, maxx, maxy = boundary.bounds
    feats = []
    for i, f in enumerate(fetch_features(minx, miny, maxx, maxy), 1):
        if not f.get("geometry"):
            continue
        clipped = force_2d(shape(f["geometry"]).buffer(0)).intersection(boundary)
        if clipped.is_empty or clipped.area <= 0:
            continue
        label = str(f["properties"].get("peric_ita", "")).strip()
        cls = CLASS_MAP.get(label.lower())
        if cls is None:
            print(f"[warn] unrecognised peric_ita label: {label!r} - skipped", file=sys.stderr)
            continue
        feats.append({
            "type": "Feature", "id": i,
            "properties": {"class": cls, "label": label},
            "geometry": mapping(clipped),
        })
    return feats


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    try:
        boundary = load_boundary()
        zones = build_hazard_zones(boundary)
    except Exception as exc:  # service down: keep the committed file as-is
        print(f"[warn] WFS/boundary step failed: {exc}", file=sys.stderr)
        if OUT_PATH.exists():
            print("[warn] keeping existing landslide_hazard.geojson", file=sys.stderr)
            return
        zones = []

    fc = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Aree a pericolosità da frana (PAI)",
            "source": "ISPRA - mosaicatura nazionale aree a pericolosità da frana (PAI)",
        },
        "features": zones,
    }
    OUT_PATH.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"[OK] {OUT_PATH.name}: {len(zones)} features")


if __name__ == "__main__":
    main()
