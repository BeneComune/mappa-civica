"""Build the "Rii a rischio esondazione" layer for the Soccorso ed Emergenza module.

Two inputs, merged here:

1. `data/sources/output_rii_protezione_civile.zip` - a manual reconnaissance
   package by the Gruppo Comunale di Protezione Civile ("Censimento RII" 2013 +
   2024 re-survey): one row per rio in `metadata_rii.csv`, plus one photo each.
   A volunteer field survey, NOT a technical study, and comune-specific.

2. `rii_osm_lines.geojson` (next to this script) - the real watercourse
   geometry from OpenStreetMap, keyed by census id. The coordinates in the CSV
   are single EXIF/estimate points and several land far from the actual rio
   (e.g. Ru de Spia). Where OSM has the named stream we draw its line instead of
   a lone point; where it doesn't, we keep a point and flag it approximate.

   OSM matches (ODbL, © OpenStreetMap contributors):
     02 Ru de Spia            -> Rio Spia          way 51873081
     04 Ru de Cjasarile       -> Rio Ciasarile     ways 51873079 + 930646620
     05 Bennata               -> Rio Bennata       ways 51873080 + 930646624
     07 Rio Cao Malnisio      -> unnamed stream    way 355283888 (loc. Cao Malnisio)

Output:
  public/data/rescue/rii.geojson              (LineString / Point mix)
  public/data/rescue/rii/NN.jpg               (web-resized photo)
  public/data/rescue/rii/01_evento.jpg        (8 Oct 2024 flood evidence)

Rii without any usable location (id "06": name unknown, photos dated 2007) are
skipped and reported on stderr - they are mentioned in the module FAQ instead.
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import zipfile
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_ZIP = REPO_ROOT / "data" / "sources" / "output_rii_protezione_civile.zip"
OSM_LINES = Path(__file__).resolve().parent / "rii_osm_lines.geojson"
OUT_DIR = REPO_ROOT / "public" / "data" / "rescue"
IMG_DIR = OUT_DIR / "rii"

PHOTO_LONG_EDGE = 760
PHOTO_QUALITY = 76

# id "06" has no name and no coordinates (photos dated 2007, before the 2013
# census); it cannot be placed on the map.
SKIP_IDS = {"06"}

# Rii the CSV cannot place well and that OSM has no line for. We move the marker
# onto a defensible spot and flag the position as approximate in the popup.
POINT_OVERRIDE = {
    # Ru de Cian: no OSM feature; its waters feed the Cjasarile system. Put the
    # marker at the head of Rio Ciasarile (OSM), not on the far-off CSV point.
    "03": {
        "lon": 12.62783,
        "lat": 46.15447,
        "pos_fonte": "Testa del sistema Rio Ciasarile (OpenStreetMap); "
                     "nessun tracciato dedicato per il Ru de Cian",
        "pos_affidabilita": "approssimata",
    },
}

# Per-id overrides for how we describe the position once snapped to OSM.
OSM_POS_NOTE = {
    "02": "Tracciato OpenStreetMap - Rio Spia (way 51873081)",
    "04": "Tracciato OpenStreetMap - Rio Ciasarile (ways 51873079, 930646620)",
    "05": "Tracciato OpenStreetMap - Rio Bennata (ways 51873080, 930646624)",
    "07": "Tracciato OpenStreetMap - rio senza nome presso loc. Cao Malnisio (way 355283888)",
}

FLOOD_EVIDENCE = "output_rii_protezione_civile/mappe_e_evidenze/FOTO_ALLUVIONE_Povoleit_8ott2024.png"
FLOOD_EVIDENCE_FOR = "01"
FLOOD_EVIDENCE_CAPTION = "Strada allagata a Povoleit, notte dell'8 ottobre 2024"


def classify_stato(row: dict) -> str:
    text = (row.get("stato_aggiornamento_2024") or "").upper()
    if "NON AGGIORNATO" in text:
        return "storico_2007" if "2007" in text else "storico_2013"
    if "NON ASSOCIATE A TESTO DI RISCHIO" in text:
        return "solo_foto_2024"
    if "AGGIORNATO" in text:
        return "aggiornato_2024"
    return "storico_2013"


def classify_affidabilita(row: dict) -> str:
    raw = (row.get("affidabilita_coordinate") or "").strip().upper()
    head = raw.split("-", 1)[0].split("/", 1)[0].strip()
    if head.startswith("BUONA"):
        return "buona"
    if head.startswith("MEDIA"):
        return "media"
    return "approssimata"


def blank_to_none(value: str | None) -> str | None:
    value = (value or "").strip()
    return value or None


def strip_refs(value: str | None) -> str | None:
    """Drop the analyst's internal pointers to source files, photo names and
    other rows so the visible text stays a plain description of the rio."""
    text = (value or "").strip()
    if not text:
        return None
    text = re.sub(r"\s*\((?:IMG_[\w.]+|foto\b[^)]*|\d{1,2}:\d{2}[^)]*)\)", "", text)
    text = re.sub(r"\s*\(vedi[^)]*\)", "", text, flags=re.I)
    text = re.sub(r"[;,.]?\s*vedi\s+[^.;,]*\.(?:pdf|docx)\b", "", text, flags=re.I)
    text = re.sub(r"^(?:Non descritta testualmente[^.]*\.\s*|Non documentata[^.]*\.\s*)", "", text, flags=re.I)
    text = re.sub(r"\bLe foto\b[^.]*\bmostrano\b", "Le foto del sopralluogo mostrano", text)
    text = re.sub(r"\s{2,}", " ", text).strip(" ;,.")
    if not text or re.match(r"^Non disponibile", text, flags=re.I):
        return None
    return text + "." if text and text[-1] not in ".!?" else text or None


def resize_photo(data: bytes, dest: Path) -> None:
    with Image.open(io.BytesIO(data)) as im:
        im = im.convert("RGB")
        long_edge = max(im.size)
        if long_edge > PHOTO_LONG_EDGE:
            scale = PHOTO_LONG_EDGE / long_edge
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, "JPEG", quality=PHOTO_QUALITY, optimize=True, progressive=True)


def load_osm_lines() -> dict[str, dict]:
    if not OSM_LINES.exists():
        return {}
    fc = json.loads(OSM_LINES.read_text(encoding="utf-8"))
    return {f["properties"]["match_id"]: f for f in fc.get("features", [])}


def line_marker_point(geometry: dict) -> list[float]:
    """A representative marker coordinate for a line rio: the southernmost
    vertex, which here is the downstream / valley end nearest the settlement."""
    if geometry["type"] == "LineString":
        coords = geometry["coordinates"]
    else:  # MultiLineString
        coords = [c for line in geometry["coordinates"] for c in line]
    lon, lat = min(coords, key=lambda c: c[1])
    return [round(lon, 6), round(lat, 6)]


def main() -> None:
    if not SOURCE_ZIP.exists():
        sys.exit(f"[skip] source package not found: {SOURCE_ZIP}")

    osm_lines = load_osm_lines()
    features: list[dict] = []

    with zipfile.ZipFile(SOURCE_ZIP) as zf:
        names = {Path(n).name: n for n in zf.namelist()}
        csv_name = next(n for n in zf.namelist() if n.endswith("metadata_rii.csv"))
        rows = list(csv.DictReader(io.StringIO(zf.read(csv_name).decode("utf-8-sig")), delimiter=";"))

        for row in rows:
            rid = (row.get("id") or "").strip()
            if rid in SKIP_IDS:
                print(f"[warn] rio {rid} ({row.get('nome_rio', '')!r}) has no usable "
                      f"location - not placed on the map", file=sys.stderr)
                continue

            override = POINT_OVERRIDE.get(rid)
            osm = osm_lines.get(rid)
            line_geom = None

            if osm:
                line_geom = osm["geometry"]
                marker = line_marker_point(line_geom)
                pos_affidabilita = "buona"
                pos_fonte = OSM_POS_NOTE.get(rid, "Tracciato OpenStreetMap")
                pos_approssimata = False
            elif override:
                marker = [round(override["lon"], 6), round(override["lat"], 6)]
                pos_affidabilita = override["pos_affidabilita"]
                pos_fonte = override["pos_fonte"]
                pos_approssimata = True
            else:
                lat = blank_to_none(row.get("lat"))
                lon = blank_to_none(row.get("lon"))
                if not lat or not lon:
                    print(f"[warn] rio {rid} has no coordinate - skipped", file=sys.stderr)
                    continue
                marker = [round(float(lon), 6), round(float(lat), 6)]
                pos_affidabilita = classify_affidabilita(row)
                pos_fonte = blank_to_none(row.get("fonte_coordinate")) or "GPS foto (EXIF)"
                pos_approssimata = pos_affidabilita == "approssimata"

            photo_rel = None
            src_photo = blank_to_none(row.get("immagine_file"))
            if src_photo and Path(src_photo).name in names:
                resize_photo(zf.read(names[Path(src_photo).name]), IMG_DIR / f"{rid}.jpg")
                photo_rel = f"data/rescue/rii/{rid}.jpg"

            evento_rel = None
            if rid == FLOOD_EVIDENCE_FOR and Path(FLOOD_EVIDENCE).name in names:
                resize_photo(zf.read(names[Path(FLOOD_EVIDENCE).name]), IMG_DIR / f"{rid}_evento.jpg")
                evento_rel = f"data/rescue/rii/{rid}_evento.jpg"

            props = {
                "id": rid,
                "nome": blank_to_none(row.get("nome_rio")),
                "area": blank_to_none(row.get("bacino_area")),
                "quota_m": blank_to_none(row.get("quota_m")),
                "stato": classify_stato(row),
                "anno_rilievo": blank_to_none(row.get("data_rilievo_2024"))
                or blank_to_none(row.get("anno_dati_2013")),
                "pos_affidabilita": pos_affidabilita,
                "pos_fonte": pos_fonte,
                "pos_approssimata": pos_approssimata,
                "descrizione": strip_refs(row.get("descrizione_criticita")),
                "punti_critici": strip_refs(row.get("punti_critici_specifici")),
                "interventi": strip_refs(row.get("interventi_proposti")),
                "eventi_recenti": strip_refs(row.get("eventi_recenti_confermati")),
                "foto": photo_rel,
                "foto_evento": evento_rel,
                "foto_evento_didascalia": FLOOD_EVIDENCE_CAPTION if evento_rel else None,
            }
            props = {k: v for k, v in props.items() if v is not None}

            # Every rio gets a Point marker (the dot people click). Rii that OSM
            # maps also get the LineString for spatial context; it shares the
            # feature id so hover/selection highlight both together.
            if line_geom is not None:
                features.append({
                    "type": "Feature",
                    "id": int(rid),
                    "properties": {**props, "role": "line"},
                    "geometry": line_geom,
                })
            features.append({
                "type": "Feature",
                "id": int(rid),
                "properties": {**props, "role": "marker"},
                "geometry": {"type": "Point", "coordinates": marker},
            })

    features.sort(key=lambda f: (f["id"], f["properties"]["role"]))
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Censimento rii a rischio esondazione",
            "source": "Gruppo Comunale di Protezione Civile - Censimento RII (2013, ri-rilievo 2024); "
                      "tracciati dei corsi d'acqua da OpenStreetMap (ODbL)",
            "disclaimer": "Ricognizione volontaria, non uno studio tecnico. Supporto "
                          "conoscitivo, non un riferimento per decisioni in caso di allerta.",
        },
        "features": features,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "rii.geojson").write_text(
        json.dumps(geojson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    kinds = ", ".join(f"{f['properties']['id']}:{f['geometry']['type']}" for f in features)
    print(f"[OK] rii.geojson: {len(features)} rii ({kinds})")


if __name__ == "__main__":
    main()
