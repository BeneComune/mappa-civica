"""Compute NDVI from Sentinel-2 L2A imagery, clipped to the configured comune.

Reads B04 (Red) and B08 (NIR) at 10 m from a *.SAFE directory in
data/raw/, clips to the municipal boundary, classifies NDVI
into vegetation categories, vectorises the result at 50 m resolution,
and writes a GeoJSON ready for direct use in the frontend map.

Inputs  (gitignored - must be present locally before running):
  data/raw/*.SAFE        one Sentinel-2 L2A .SAFE directory

Output:
  public/data/greenery.geojson

Not CI-safe: needs the raw Sentinel-2 scene. `make green`.
"""

from __future__ import annotations

import glob
import json
from pathlib import Path

import numpy as np
import rasterio
import rasterio.warp
from rasterio.crs import CRS
from rasterio.enums import Resampling
from rasterio.features import shapes as rio_shapes
from rasterio.mask import mask as rio_mask
from rasterio.transform import array_bounds, from_bounds
from rasterio.warp import reproject as rio_reproject
from rasterio.warp import transform_geom
from shapely.geometry import mapping, shape
from shapely.ops import orient
from shapely.validation import make_valid

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import BOUNDARY_PATH


# NDVI classification: (low_inclusive, high_exclusive, label, hex_color)
NDVI_CLASSES = [
    (float('-inf'), 0.00, 'water',      '#2166ac'),
    (0.00,          0.15, 'bare',       '#d9d9d9'),
    (0.15,          0.30, 'sparse',     '#c7e9c0'),
    (0.30,          0.50, 'moderate',   '#74c476'),
    (0.50,          0.65, 'dense',      '#238b45'),
    (0.65,  float('inf'), 'very_dense', '#00441b'),
]

# Output pixel size for vectorisation - larger means a smaller, less-detailed file.
OUTPUT_RESOLUTION_M = 50

# Drop polygons below this area (m²) - removes pixel-sized noise.
MIN_AREA_M2 = 2_500

# Polygon simplification tolerance in the projected CRS (metres).
SIMPLIFY_TOLERANCE_M = 25


def find_safe_dir(repo_root: Path) -> Path:
    pattern = str(repo_root / 'data' / 'raw' / '*.SAFE')
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError(
            'No .SAFE directory found under data/raw/.\n'
            'Download a Sentinel-2 L2A scene (tile T33TUM) and unzip it there.\n'
            'The directory is gitignored and must be present locally to run this script.'
        )
    return Path(matches[-1])


def find_band_jp2(safe_dir: Path, band_id: str, resolution: str = 'R10m') -> Path:
    res_suffix = resolution.lstrip('R')  # 'R10m' → '10m'
    pattern = str(
        safe_dir / 'GRANULE' / '*' / 'IMG_DATA' / resolution
        / f'*_{band_id}_{res_suffix}.jp2'
    )
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError(
            f'Band {band_id} at {resolution} not found in {safe_dir}'
        )
    return Path(matches[0])


def load_boundary_in_crs(dst_crs: CRS) -> list[dict]:
    """Return a list of valid geometry dicts in dst_crs suitable for rio_mask."""
    with BOUNDARY_PATH.open() as fh:
        geojson = json.load(fh)
    src_crs = CRS.from_epsg(4326)
    geom_utm = shape(transform_geom(src_crs, dst_crs, geojson['geometry']))
    # The municipal boundary has a self-intersection and mixed winding orders
    # (some rings CW, some CCW). make_valid repairs the self-intersection;
    # orient enforces CCW exterior rings so GDAL/rio_mask treats every
    # sub-polygon as a filled area, not a hole.
    geom_valid = orient(make_valid(geom_utm), sign=1.0)
    # Flatten to individual Polygon/MultiPolygon - rio_mask wants a list of geoms.
    if geom_valid.geom_type == 'GeometryCollection':
        parts = [g for g in geom_valid.geoms if not g.is_empty]
    else:
        parts = [geom_valid]
    return [mapping(p) for p in parts]


def classify_ndvi(ndvi: np.ndarray) -> np.ndarray:
    """Return a uint8 raster of class indices (1-indexed; 0 = nodata)."""
    out = np.zeros(ndvi.shape, dtype=np.uint8)
    for idx, (low, high, *_) in enumerate(NDVI_CLASSES, start=1):
        out[np.isfinite(ndvi) & (ndvi >= low) & (ndvi < high)] = idx
    return out


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    out_path = repo_root / 'public' / 'data' / 'greenery.geojson'
    out_path.parent.mkdir(parents=True, exist_ok=True)

    safe_dir = find_safe_dir(repo_root)
    print(f'[INFO] Scene: {safe_dir.name}')

    b04_path = find_band_jp2(safe_dir, 'B04')
    b08_path = find_band_jp2(safe_dir, 'B08')
    print(f'[INFO] B04: {b04_path.name}')
    print(f'[INFO] B08: {b08_path.name}')

    # Read both bands clipped to the municipal boundary.
    with rasterio.open(b04_path) as src:
        scene_crs = src.crs
        boundary_geoms = load_boundary_in_crs(scene_crs)
        b04_arr, native_transform = rio_mask(src, boundary_geoms, crop=True, nodata=0)
        b04 = b04_arr[0].astype(np.float32)

    with rasterio.open(b08_path) as src:
        b08_arr, _ = rio_mask(src, boundary_geoms, crop=True, nodata=0)
        b08 = b08_arr[0].astype(np.float32)

    # Pixels where both bands are 0 are outside the scene or boundary.
    nodata_mask = (b04 == 0) & (b08 == 0)

    denom = b08 + b04
    with np.errstate(invalid='ignore', divide='ignore'):
        ndvi = np.where(denom > 0, (b08 - b04) / denom, np.nan)
    ndvi[nodata_mask] = np.nan

    # Downsample to OUTPUT_RESOLUTION_M via bilinear resampling before vectorisation.
    native_res_m = abs(native_transform.a)
    scale = native_res_m / OUTPUT_RESOLUTION_M
    h, w = ndvi.shape
    new_h = max(1, round(h * scale))
    new_w = max(1, round(w * scale))

    bounds = array_bounds(h, w, native_transform)
    vec_transform = from_bounds(*bounds, new_w, new_h)

    ndvi_resampled = np.empty((new_h, new_w), dtype=np.float32)
    rio_reproject(
        source=ndvi,
        destination=ndvi_resampled,
        src_transform=native_transform,
        src_crs=scene_crs,
        dst_transform=vec_transform,
        dst_crs=scene_crs,
        resampling=Resampling.bilinear,
        src_nodata=float('nan'),
        dst_nodata=float('nan'),
    )

    classified = classify_ndvi(ndvi_resampled)

    # Vectorise in the projected CRS, then reproject each polygon to WGS84.
    wgs84 = CRS.from_epsg(4326)
    features = []

    for geom_dict, pixel_val in rio_shapes(classified, transform=vec_transform):
        class_index = int(pixel_val)
        if class_index == 0:
            continue

        geom_utm = shape(geom_dict)
        if geom_utm.area < MIN_AREA_M2:
            continue

        geom_utm = make_valid(geom_utm.simplify(SIMPLIFY_TOLERANCE_M, preserve_topology=True))
        if geom_utm.is_empty:
            continue

        _, _, label, color = NDVI_CLASSES[class_index - 1]
        geom_wgs84 = transform_geom(scene_crs, wgs84, mapping(geom_utm))

        features.append({
            'type': 'Feature',
            'geometry': geom_wgs84,
            'properties': {
                'ndvi_class': label,
                'color': color,
                'area_m2': round(geom_utm.area),
            },
        })

    out_path.write_text(
        json.dumps({'type': 'FeatureCollection', 'features': features},
                   separators=(',', ':'), ensure_ascii=False)
    )
    print(f'[OK] {out_path.name}: {len(features)} features')


if __name__ == '__main__':
    main()
