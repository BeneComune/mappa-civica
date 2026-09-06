"""Optional GIS exclusion geometries used by the build pipeline.

Some datasets need a manual exclusion zone (e.g. a private area OSM tags
inconsistently, or a known bad stretch of data). This is entirely optional
and comune-specific: if data/exclusions.json doesn't exist,
nothing is excluded - geometry_is_excluded() just returns False for
everything. See SETUP.md.
"""

from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import shape
from shapely.ops import unary_union

REPO_ROOT = Path(__file__).resolve().parents[2]
EXCLUSIONS_PATH = REPO_ROOT / 'data' / 'exclusions.json'


def _load_exclusion_polygon():
    if not EXCLUSIONS_PATH.exists():
        return None

    with EXCLUSIONS_PATH.open(encoding='utf-8') as f:
        geojson = json.load(f)

    polygons = [shape(feature['geometry']) for feature in geojson.get('features', [])]
    if not polygons:
        return None

    return unary_union(polygons)


# Loaded once at import time - same lifetime as the old hardcoded constant.
EXCLUSION_POLYGON = _load_exclusion_polygon()


def geometry_is_excluded(geometry) -> bool:
    if EXCLUSION_POLYGON is None or geometry is None or geometry.is_empty:
        return False

    if geometry.geom_type in {'Point', 'MultiPoint'}:
        return geometry.within(EXCLUSION_POLYGON)

    return geometry.intersects(EXCLUSION_POLYGON)
