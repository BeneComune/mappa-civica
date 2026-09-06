"""Compute NBR (Normalized Burn Ratio) from Sentinel-2 L2A imagery.

Uses B8A (NIR, 20m) and B12 (SWIR, 20m). Shadow and water pixels are masked
using the SCL (Scene Classification Layer, 20m) before computing the index.

NBR = (B8A - B12) / (B8A + B12)

High NBR  → healthy moist vegetation (low fire risk)
Low/neg   → dry, stressed, or burned vegetation (higher risk)

Inputs (gitignored - must be present locally):
  data/raw/*.SAFE    one Sentinel-2 L2A .SAFE directory

Output:
  public/data/nbr.geojson

Not CI-safe: needs the raw Sentinel-2 scene. `make green`.
"""

from __future__ import annotations

import glob
import json
from pathlib import Path

import numpy as np
import rasterio
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

NBR_CLASSES = [
    (0.4,  float('inf'), 'sana',      '#1a9641'),
    (0.2,  0.4,          'moderata',  '#a6d96a'),
    (0.0,  0.2,          'stress',    '#ffffbf'),
    (-0.2, 0.0,          'degradata', '#fdae61'),
    (float('-inf'), -0.2,'bruciata',  '#d7191c'),
]

# SCL values to mask (shadow, cloud shadow, water)
SCL_MASK_VALUES = {2, 3, 6}

OUTPUT_RESOLUTION_M = 60
MIN_AREA_M2 = 3_600
SIMPLIFY_TOLERANCE_M = 30


def find_safe_dir(repo_root: Path) -> Path:
    pattern = str(repo_root / 'data' / 'raw' / '*.SAFE')
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError('No .SAFE directory found under data/raw/.')
    return Path(matches[-1])


def find_band_jp2(safe_dir: Path, band_id: str, resolution: str = 'R20m') -> Path:
    res_suffix = resolution.lstrip('R')
    pattern = str(
        safe_dir / 'GRANULE' / '*' / 'IMG_DATA' / resolution
        / f'*_{band_id}_{res_suffix}.jp2'
    )
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError(f'Band {band_id} at {resolution} not found in {safe_dir}')
    return Path(matches[0])


def load_boundary_in_crs(dst_crs: CRS) -> list[dict]:
    with BOUNDARY_PATH.open() as fh:
        geojson = json.load(fh)
    src_crs = CRS.from_epsg(4326)
    geom_utm = shape(transform_geom(src_crs, dst_crs, geojson['geometry']))
    geom_valid = orient(make_valid(geom_utm), sign=1.0)
    if geom_valid.geom_type == 'GeometryCollection':
        parts = [g for g in geom_valid.geoms if not g.is_empty]
    else:
        parts = [geom_valid]
    return [mapping(p) for p in parts]


def classify_nbr(nbr: np.ndarray) -> np.ndarray:
    out = np.zeros(nbr.shape, dtype=np.uint8)
    for idx, (low, high, *_) in enumerate(NBR_CLASSES, start=1):
        out[np.isfinite(nbr) & (nbr >= low) & (nbr < high)] = idx
    return out


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    out_path = repo_root / 'public' / 'data' / 'nbr.geojson'
    out_path.parent.mkdir(parents=True, exist_ok=True)

    safe_dir = find_safe_dir(repo_root)
    print(f'[INFO] Scene: {safe_dir.name}')

    b8a_path = find_band_jp2(safe_dir, 'B8A', 'R20m')
    b12_path = find_band_jp2(safe_dir, 'B12', 'R20m')
    scl_path = find_band_jp2(safe_dir, 'SCL', 'R20m')
    print(f'[INFO] B8A: {b8a_path.name}')
    print(f'[INFO] B12: {b12_path.name}')
    print(f'[INFO] SCL: {scl_path.name}')

    with rasterio.open(b8a_path) as src:
        scene_crs = src.crs
        boundary_geoms = load_boundary_in_crs(scene_crs)
        b8a_arr, native_transform = rio_mask(src, boundary_geoms, crop=True, nodata=0)
        b8a = b8a_arr[0].astype(np.float32)

    with rasterio.open(b12_path) as src:
        b12_arr, _ = rio_mask(src, boundary_geoms, crop=True, nodata=0)
        b12 = b12_arr[0].astype(np.float32)

    with rasterio.open(scl_path) as src:
        scl_arr, _ = rio_mask(src, boundary_geoms, crop=True, nodata=0)
        scl = scl_arr[0]

    nodata_mask = (b8a == 0) & (b12 == 0)
    shadow_mask = np.isin(scl, list(SCL_MASK_VALUES))

    denom = b8a + b12
    with np.errstate(invalid='ignore', divide='ignore'):
        nbr = np.where(denom > 0, (b8a - b12) / denom, np.nan)
    nbr[nodata_mask | shadow_mask] = np.nan

    valid = nbr[np.isfinite(nbr)]
    print(f'[INFO] NBR range: {valid.min():.3f} - {valid.max():.3f}  mean: {valid.mean():.3f}')

    native_res_m = abs(native_transform.a)
    scale = native_res_m / OUTPUT_RESOLUTION_M
    h, w = nbr.shape
    new_h = max(1, round(h * scale))
    new_w = max(1, round(w * scale))

    bounds = array_bounds(h, w, native_transform)
    vec_transform = from_bounds(*bounds, new_w, new_h)

    nbr_resampled = np.empty((new_h, new_w), dtype=np.float32)
    rio_reproject(
        source=nbr,
        destination=nbr_resampled,
        src_transform=native_transform,
        src_crs=scene_crs,
        dst_transform=vec_transform,
        dst_crs=scene_crs,
        resampling=Resampling.bilinear,
        src_nodata=float('nan'),
        dst_nodata=float('nan'),
    )

    classified = classify_nbr(nbr_resampled)

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

        low, high, label, color = NBR_CLASSES[class_index - 1]
        geom_wgs84 = transform_geom(scene_crs, wgs84, mapping(geom_utm))

        features.append({
            'type': 'Feature',
            'geometry': geom_wgs84,
            'properties': {'nbr_class': label, 'color': color},
        })

    out_path.write_text(
        json.dumps({'type': 'FeatureCollection', 'features': features},
                   separators=(',', ':'), ensure_ascii=False)
    )
    print(f'[OK] {out_path.name}: {len(features)} features')


if __name__ == '__main__':
    main()
