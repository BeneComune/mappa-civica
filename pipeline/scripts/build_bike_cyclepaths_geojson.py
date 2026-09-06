"""Extract cyclepaths from the committed transport GeoJSON.

Genera un file statico per il submodulo Cyclability/Bike infra:
- public/data/outdoor/bike_cyclepaths.geojson
"""

from __future__ import annotations

import json
import re
from pathlib import Path


NAME_PATTERNS = [re.compile(r"MV\s*06", re.IGNORECASE), re.compile(r"Itinerario pedemontano pordenonese", re.IGNORECASE)]


def matches_cyclepath_name(value: object) -> bool:
    if not isinstance(value, str) or not value:
        return False

    return any(pattern.search(value) for pattern in NAME_PATTERNS)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    input_path = repo_root / "public" / "data" / "transport.geojson"
    out_dir = repo_root / "public" / "data" / "outdoor"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise FileNotFoundError(f"GeoJSON non trovato: {input_path}")

    data = json.loads(input_path.read_text())
    features = []

    for feature in data.get("features", []):
        properties = feature.get("properties", {})
        highway = properties.get("highway")

        if highway == "cycleway":
            features.append(feature)
            continue

        if highway != "path":
            continue

        if matches_cyclepath_name(properties.get("name")) or matches_cyclepath_name(properties.get("name:it")) or matches_cyclepath_name(properties.get("ref")):
            features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}
    (out_dir / "bike_cyclepaths.geojson").write_text(json.dumps(geojson, ensure_ascii=False))

    print(f"[OK] bike_cyclepaths.geojson: {len(features)} features")


if __name__ == "__main__":
    main()
