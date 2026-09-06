"""Forest fire layers for the Soccorso ed Emergenza module (Incendi boschivi).

Source: Regione Autonoma Friuli-Venezia Giulia, IRDAT FVG - regional GeoServer
WFS `ZONE_RISC`. Three layers:

  V_INCENDI_CT            fire perimeters (polygons, 1990-)   -> fire_perimeters.geojson
  SITFOR_PERICOLO_INCENDI regional fire-danger zonation       -> fire_danger.geojson
  V_INCENDI_PUNTOINIZIO   ignition points                     -> fire_ignition_points.geojson

Perimeters are filtered server-side by the COMUNE attribute. The danger zonation
has no COMUNE attribute and covers large areas, so it is clipped to the
municipal boundary here. Ignition points carry only station / year / fire
number, so they are matched to this comune's perimeters by
(SIGLA_STAZ, ANNO_FNIB, NUM_FNIB), plus any point that falls inside the boundary.

Only FVG comuni get data; elsewhere the queries return nothing and empty
FeatureCollections are written. Re-run with `make fire`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from shapely import force_2d
from shapely.geometry import mapping, shape
from shapely.prepared import prep

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import COMUNE, BOUNDARY_PATH  # noqa: E402

WFS_URL = "https://serviziogc.regione.fvg.it/geoserver/ZONE_RISC/wfs"
OUT_DIR = Path(__file__).resolve().parents[2] / "public" / "data" / "rescue"

PERIMETERS_KEEP = {
    "CODICE": "codice", "ANNO_FNIB": "anno", "COMUNE": "comune", "LOCALITA": "localita",
    "DATA_INIZIO_FUOCO": "data_inizio", "DURATA": "durata", "LUOGO_INIZIO": "luogo_inizio",
    "VINCOLI_NATURALI": "vincoli_naturali", "STATO_VEGETAZIONE": "stato_vegetazione",
    "TIPO_CAUSE": "causa",
}
CAUSA_CLASS = {
    "Dolose (volontarie)": "dolosa", "Colpose": "colposa",
    "Naturali (fulmini)": "naturale", "Ignote (non classif.)": "ignota",
}


def wfs_features(layer: str, cql: str | None = None) -> list[dict]:
    params = {
        "service": "WFS", "version": "2.0.0", "request": "GetFeature",
        "typeNames": f"ZONE_RISC:{layer}", "outputFormat": "application/json",
        "srsName": "EPSG:4326",
    }
    if cql:
        params["CQL_FILTER"] = cql
    req = Request(f"{WFS_URL}?{urlencode(params)}", headers={"User-Agent": "mappa-civica-pipeline/1.0"})
    with urlopen(req, timeout=180) as response:
        return json.load(response).get("features", [])


def load_boundary():
    data = json.loads(Path(BOUNDARY_PATH).read_text())
    geom = data["geometry"] if data.get("type") == "Feature" else (
        data["features"][0]["geometry"] if data.get("features") else data)
    return shape(geom).buffer(0)


# --- perimeters --------------------------------------------------------

def clean_perimeter(feature: dict, index: int) -> dict:
    src = feature.get("properties", {})
    props = {out: src[key] for key, out in PERIMETERS_KEEP.items() if src.get(key) not in (None, "")}
    for key in ("durata", "localita", "luogo_inizio", "stato_vegetazione", "vincoli_naturali"):
        if isinstance(props.get(key), str):
            props[key] = props[key].strip()
    if "data_inizio" in props:
        props["data_inizio"] = str(props["data_inizio"]).rstrip("Z")
    props["causa_classe"] = CAUSA_CLASS.get(props.get("causa", ""), "ignota")
    return {"type": "Feature", "id": index, "properties": props, "geometry": feature.get("geometry")}


def build_perimeters(comune: str) -> tuple[list[dict], set[tuple], set[str]]:
    raw = wfs_features("V_INCENDI_CT", f"COMUNE='{comune}'")
    feats, keys, stations = [], set(), set()
    for i, f in enumerate(raw, 1):
        if not f.get("geometry"):
            continue
        feats.append(clean_perimeter(f, i))
        p = f["properties"]
        if p.get("SIGLA_STAZ") and p.get("ANNO_FNIB") is not None and p.get("NUM_FNIB") is not None:
            keys.add((p["SIGLA_STAZ"], int(p["ANNO_FNIB"]), int(p["NUM_FNIB"])))
            stations.add(p["SIGLA_STAZ"])
    feats.sort(key=lambda f: (f["properties"].get("anno", 0), f["properties"].get("codice", "")))
    return feats, keys, stations


# --- danger zonation -------------------------------------------------

def build_danger(boundary) -> list[dict]:
    minx, miny, maxx, maxy = boundary.bounds
    cql = f"BBOX(GEOMETRY,{minx:.5f},{miny:.5f},{maxx:.5f},{maxy:.5f},'EPSG:4326')"
    feats = []
    for i, f in enumerate(wfs_features("SITFOR_PERICOLO_INCENDI", cql), 1):
        if not f.get("geometry"):
            continue
        clipped = force_2d(shape(f["geometry"]).buffer(0)).intersection(boundary)
        if clipped.is_empty or clipped.area <= 0:
            continue
        grado = str(f["properties"].get("GRADOPERICOLOSITA", "")).strip().lower()
        feats.append({
            "type": "Feature", "id": i,
            "properties": {"grado": grado or "n/d"},
            "geometry": mapping(clipped),
        })
    return feats


# --- ignition points ----------------------------------------------

def build_ignition(boundary, keys: set[tuple], stations: set[str]) -> list[dict]:
    if not stations:
        return []
    quoted = ",".join(f"'{s}'" for s in sorted(stations))
    raw = wfs_features("V_INCENDI_PUNTOINIZIO", f"SIGLA_STAZ IN ({quoted})")
    inside = prep(boundary)
    feats = []
    for i, f in enumerate(raw, 1):
        geom = f.get("geometry")
        if not geom or geom.get("type") != "Point":
            continue
        p = f["properties"]
        try:
            key = (p.get("SIGLA_STAZ"), int(p["ANNO_FNIB"]), int(p["NUM_FNIB"]))
        except (TypeError, ValueError, KeyError):
            key = None
        pt = shape(geom)
        if key not in keys and not inside.covers(pt):
            continue
        feats.append({
            "type": "Feature", "id": i,
            "properties": {
                "anno": p.get("ANNO_FNIB"),
                "sigla_staz": p.get("SIGLA_STAZ"),
                "num_fnib": p.get("NUM_FNIB"),
            },
            "geometry": {"type": "Point", "coordinates": geom["coordinates"][:2]},
        })
    feats.sort(key=lambda f: (f["properties"].get("anno") or 0))
    return feats


# --- main --------------------------------------------------------------

def write(name: str, title: str, features: list[dict]) -> None:
    fc = {
        "type": "FeatureCollection",
        "metadata": {
            "title": title,
            "source": "Regione Autonoma Friuli-Venezia Giulia - IRDAT FVG (GeoServer ZONE_RISC)",
        },
        "features": features,
    }
    path = OUT_DIR / name
    path.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"[OK] {name}: {len(features)} feature")


def main() -> None:
    comune = COMUNE["name"]
    region = COMUNE.get("region", "")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        boundary = load_boundary()
        perimeters, keys, stations = build_perimeters(comune)
        danger = build_danger(boundary)
        ignition = build_ignition(boundary, keys, stations)
    except Exception as exc:  # service down: keep committed files as they are
        print(f"[warn] WFS/boundary step failed: {exc}", file=sys.stderr)
        if (OUT_DIR / "fire_perimeters.geojson").exists():
            print("[warn] keeping existing fire_*.geojson", file=sys.stderr)
            return
        perimeters = danger = ignition = []

    if not perimeters and "Friuli" not in region:
        print(f"[note] {comune} is outside FVG - no IRDAT fire data available", file=sys.stderr)

    years = [f["properties"]["anno"] for f in perimeters if "anno" in f["properties"]]
    span = f" ({min(years)}-{max(years)})" if years else ""
    write("fire_perimeters.geojson", "Perimetro degli incendi boschivi", perimeters)
    print(f"       span{span}")
    write("fire_danger.geojson", "Classe di pericolo incendi (SITFOR)", danger)
    write("fire_ignition_points.geojson", "Punti di innesco incendi", ignition)


if __name__ == "__main__":
    main()
