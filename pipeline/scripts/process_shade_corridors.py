"""Identify natural shade corridors along roads and trails.

Method:
  1. Load roads from public/data/transport.geojson and trails from
     pipeline/data/outdoor/trails.geojson (the gitignored intermediate
     build_outdoor_geojson.py writes).
  2. Buffer each segment (ROAD_BUFFER_M for roads, TRAIL_BUFFER_M for trails) in UTM.
  3. Intersect buffers with dense/very_dense vegetation from greenery.geojson.
  4. Compute shade coverage % per segment.

Outputs:
  public/data/shade_corridors.geojson          - segments with >= MIN_SHADE_PCT (Green module)
  public/data/outdoor/trails_shaded.geojson    - ALL trail segments with shade_pct property

Not CI-safe: greenery.geojson comes from the raw Sentinel-2 pipeline, and
trails.geojson from `make outdoor` (needs the DEM). `make green`.
"""

from __future__ import annotations

import json
from pathlib import Path

from rasterio.crs import CRS
from rasterio.warp import transform_geom
from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from shapely.validation import make_valid

ROAD_BUFFER_M = 15
TRAIL_BUFFER_M = 8
MIN_SHADE_PCT = 20.0

SHADE_CLASSES = {'dense', 'very_dense'}

UTM_CRS = CRS.from_epsg(32633)
WGS84 = CRS.from_epsg(4326)


def load_vegetation_union(greenery_path: Path) -> object:
    """Union of dense/very_dense vegetation polygons in UTM."""
    with greenery_path.open() as fh:
        fc = json.load(fh)

    polys = []
    for f in fc.get('features', []):
        if f['properties'].get('ndvi_class') not in SHADE_CLASSES:
            continue
        geom_utm = shape(transform_geom(WGS84, UTM_CRS, f['geometry']))
        geom_utm = make_valid(geom_utm)
        if not geom_utm.is_empty:
            polys.append(geom_utm)

    print(f'[INFO] {len(polys)} dense/very_dense vegetation polygons loaded')
    return make_valid(unary_union(polys))


def compute_shade_pct(geom_wgs84: dict, buffer_m: float, vegetation_union: object) -> float:
    """Return shade coverage percentage (0-100) for a WGS84 LineString geometry."""
    geom_utm = shape(transform_geom(WGS84, UTM_CRS, geom_wgs84))
    if geom_utm.is_empty or geom_utm.length < 10:
        return 0.0
    buffer_geom = geom_utm.buffer(buffer_m, cap_style='flat')
    if buffer_geom.is_empty or buffer_geom.area == 0:
        return 0.0
    try:
        shaded_area = buffer_geom.intersection(vegetation_union)
    except Exception:
        return 0.0
    return (shaded_area.area / buffer_geom.area) * 100


def build_shade_corridors(roads_path: Path, trails_path: Path, vegetation_union: object) -> list[dict]:
    """Return features for shade_corridors.geojson (segments with shade_pct >= MIN_SHADE_PCT)."""
    features = []

    for source_path, way_type, buffer_m in [
        (roads_path, 'road', ROAD_BUFFER_M),
        (trails_path, 'trail', TRAIL_BUFFER_M),
    ]:
        with source_path.open() as fh:
            fc = json.load(fh)

        for f in fc.get('features', []):
            geom = f.get('geometry')
            if not geom or geom['type'] != 'LineString':
                continue

            shade_pct = compute_shade_pct(geom, buffer_m, vegetation_union)
            if shade_pct < MIN_SHADE_PCT:
                continue

            props = f.get('properties', {})
            geom_utm = shape(transform_geom(WGS84, UTM_CRS, geom))

            features.append({
                'type': 'Feature',
                'geometry': transform_geom(UTM_CRS, WGS84, mapping(geom_utm)),
                'properties': {
                    'type': way_type,
                    'highway': props.get('highway', ''),
                    'name': props.get('name') or props.get('name:it') or '',
                    'shade_pct': round(shade_pct, 1),
                    'length_m': round(geom_utm.length),
                },
            })

    return features


def build_trails_shaded(trails_path: Path, vegetation_union: object) -> list[dict]:
    """Return all trail features with shade_pct added (0 for unshaded), preserving all properties."""
    with trails_path.open() as fh:
        fc = json.load(fh)

    features = []
    for f in fc.get('features', []):
        geom = f.get('geometry')
        if not geom or geom['type'] != 'LineString':
            continue

        shade_pct = compute_shade_pct(geom, TRAIL_BUFFER_M, vegetation_union)
        props = dict(f.get('properties', {}))
        props['shade_pct'] = round(shade_pct, 1)

        features.append({
            'type': 'Feature',
            'geometry': geom,
            'properties': props,
        })

    return features


def write_geojson(path: Path, features: list[dict]) -> None:
    path.write_text(
        json.dumps(
            {'type': 'FeatureCollection', 'features': features},
            separators=(',', ':'),
            ensure_ascii=False,
        )
    )
    print(f'[OK] {path.name}: {len(features)} features')


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    data_dir = repo_root / 'public' / 'data'

    greenery_path = data_dir / 'greenery.geojson'
    roads_path = data_dir / 'transport.geojson'
    trails_path = repo_root / 'pipeline' / 'data' / 'outdoor' / 'trails.geojson'

    for p in (greenery_path, roads_path, trails_path):
        if not p.exists():
            raise FileNotFoundError(f'{p} not found.')

    vegetation_union = load_vegetation_union(greenery_path)

    print('[INFO] Computing shade corridors (roads + trails >= 20%)...')
    corridors = build_shade_corridors(roads_path, trails_path, vegetation_union)
    write_geojson(data_dir / 'shade_corridors.geojson', corridors)

    print('[INFO] Enriching all trails with shade_pct...')
    trails_shaded = build_trails_shaded(trails_path, vegetation_union)
    write_geojson(data_dir / 'outdoor' / 'trails_shaded.geojson', trails_shaded)


if __name__ == '__main__':
    main()
