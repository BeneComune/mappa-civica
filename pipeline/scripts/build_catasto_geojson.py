"""Cadastral parcels (particelle catastali) for the Home module toggle.

Source: onData - `ondata/dati_catastali`, one representative interior point per
parcel (foglio, particella), republished from the Agenzia delle Entrate INSPIRE
data. Licence CC BY 4.0 (credit onData). One Parquet file per region on GitHub;
DuckDB reads it over HTTP with range requests and filters by the comune's
cadastral code, so the full ~18 MB regional file is never downloaded.

Open cadastral data is geometry + identifiers only: no owner names, no rendita,
no values. It is "catasto terreni" (land parcels), not "fabbricati" (buildings),
and it is non-probatorio (not the centimetre-accurate legal boundary).

Output: public/data/catasto.geojson  (Point features: foglio, particella)

Needs `duckdb` (already in requirements-ci.txt). `make catasto`.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import duckdb

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import COMUNE  # noqa: E402

REPO_RAW = "https://raw.githubusercontent.com/ondata/dati_catastali/main/S_0000_ITALIA/anagrafica"
OUT_PATH = Path(__file__).resolve().parents[2] / "public" / "data" / "catasto.geojson"

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


def main() -> None:
    code = COMUNE.get("cadastralCode")
    region = COMUNE.get("region", "")
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    fname = region_file(region)
    if not code or not fname:
        print(f"[note] no cadastral code / region file for {COMUNE['name']} - writing empty", file=sys.stderr)
        OUT_PATH.write_text('{"type":"FeatureCollection","features":[]}\n', encoding="utf-8")
        return

    url = f"{REPO_RAW}/{fname}.parquet"
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    try:
        rows = con.execute(
            "SELECT foglio, particella, x, y FROM read_parquet(?) WHERE comune = ?",
            [url, code],
        ).fetchall()
    except Exception as exc:  # network down: keep the committed file
        print(f"[warn] cadastral fetch failed: {exc}", file=sys.stderr)
        if OUT_PATH.exists():
            print("[warn] keeping existing catasto.geojson", file=sys.stderr)
            return
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
    OUT_PATH.write_text(json.dumps(geojson, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"[OK] catasto.geojson: {len(features)} particelle (comune {code})")


if __name__ == "__main__":
    main()
