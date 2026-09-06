"""Cadastral parcels (particelle catastali) for the Home module toggle.

Source: onData - `ondata/dati_catastali`, one representative interior point per
parcel (foglio, particella), republished from the Agenzia delle Entrate INSPIRE
data. Licence CC BY 4.0 (credit onData). One Parquet file per region on GitHub;
DuckDB reads it over HTTP with range requests and filters by the comune's
cadastral code, so the full ~18 MB regional file is never downloaded.

Open cadastral data is geometry + identifiers only: no owner names, no rendita,
no values. It is "catasto terreni" (land parcels), not "fabbricati" (buildings),
and it is non-probatorio (not the centimetre-accurate legal boundary).

Output: public/data/catasto.pmtiles  (vector tiles, one "catasto" layer of
Point features: foglio, particella). The intermediate GeoJSON stays in
pipeline/data/ (gitignored) - the browser only ever loads the .pmtiles.

Needs `duckdb` (in requirements-ci.txt) and `tippecanoe` on PATH. `make catasto`.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import duckdb

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import COMUNE  # noqa: E402

REPO_RAW = "https://raw.githubusercontent.com/ondata/dati_catastali/main/S_0000_ITALIA/anagrafica"
REPO_ROOT = Path(__file__).resolve().parents[2]
GEOJSON_PATH = REPO_ROOT / "pipeline" / "data" / "catasto.geojson"
PMTILES_PATH = REPO_ROOT / "public" / "data" / "catasto.pmtiles"

# onData regional Parquet file names, matched to comune.config.json `region`.
REGION_FILES = [
    "01_Piemonte", "02_ValledAosta", "03_Lombardia", "05_Veneto",
    "06_Friuli-VeneziaGiulia", "07_Liguria", "08_Emilia-Romagna", "09_Toscana",
    "10_Umbria", "11_Marche", "12_Lazio", "13_Abruzzo", "14_Molise",
    "15_Campania", "16_Puglia", "17_Basilicata", "18_Calabria", "19_Sicilia",
    "20_Sardegna",
]


def _norm(text: str) -> str:
    return re.sub(r"[^a-z]", "", text.lower())


def region_file(region: str) -> str | None:
    want = _norm(region)
    for name in REGION_FILES:
        if _norm(name.split("_", 1)[1]) == want:
            return name
    return None


def build_geojson() -> int:
    """Write the intermediate GeoJSON; return the parcel count."""
    code = COMUNE.get("cadastralCode")
    region = COMUNE.get("region", "")
    GEOJSON_PATH.parent.mkdir(parents=True, exist_ok=True)

    fname = region_file(region)
    if not code or not fname:
        print(f"[note] no cadastral code / region file for {COMUNE['name']} - writing empty", file=sys.stderr)
        GEOJSON_PATH.write_text('{"type":"FeatureCollection","features":[]}\n', encoding="utf-8")
        return 0

    url = f"{REPO_RAW}/{fname}.parquet"
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    try:
        rows = con.execute(
            "SELECT foglio, particella, x, y FROM read_parquet(?) WHERE comune = ?",
            [url, code],
        ).fetchall()
    except Exception as exc:  # network down: keep whatever intermediate exists
        print(f"[warn] cadastral fetch failed: {exc}", file=sys.stderr)
        if GEOJSON_PATH.exists():
            print("[warn] keeping existing pipeline/data/catasto.geojson", file=sys.stderr)
            return -1
        rows = []

    features = []
    for foglio, particella, x, y in rows:
        features.append({
            "type": "Feature",
            "properties": {
                # leading zeros dropped for display; particella kept verbatim
                "foglio": str(foglio).lstrip("0") or "0",
                "particella": str(particella),
            },
            "geometry": {"type": "Point", "coordinates": [round(x / 1_000_000, 6), round(y / 1_000_000, 6)]},
        })

    features.sort(key=lambda f: (int(f["properties"]["foglio"] or 0),
                                 f["properties"]["particella"]))
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Particelle catastali",
            "source": f"onData - ondata/dati_catastali (Agenzia delle Entrate), comune {code}",
            "licence": "CC BY 4.0 - credit onData",
            "note": "Un punto per particella (foglio, particella). Solo catasto terreni, "
                    "dati non probatori: nessun proprietario, nessuna rendita.",
        },
        "features": features,
    }
    GEOJSON_PATH.write_text(json.dumps(geojson, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"[OK] pipeline/data/catasto.geojson: {len(features)} particelle (comune {code})")
    return len(features)


def build_pmtiles() -> None:
    if shutil.which("tippecanoe") is None:
        print("[warn] tippecanoe not on PATH - skipping .pmtiles build "
              "(install with `brew install tippecanoe` / apt)", file=sys.stderr)
        if PMTILES_PATH.exists():
            print("[warn] keeping existing catasto.pmtiles", file=sys.stderr)
            return
        sys.exit("[error] no tippecanoe and no committed catasto.pmtiles to fall back on")

    PMTILES_PATH.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "tippecanoe",
            "-o", str(PMTILES_PATH),
            "-l", "catasto",
            "-zg",
            "--drop-densest-as-needed",
            "--extend-zooms-if-still-dropping",
            "--force",
            str(GEOJSON_PATH),
        ],
        check=True,
    )
    print(f"[OK] catasto.pmtiles: {PMTILES_PATH.stat().st_size // 1024} KB")


def main() -> None:
    count = build_geojson()
    if count == -1:  # fetch failed, intermediate kept as-is
        return
    build_pmtiles()


if __name__ == "__main__":
    main()
