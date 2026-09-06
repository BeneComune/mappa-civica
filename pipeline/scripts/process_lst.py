"""Compute Land Surface Temperature (LST) from Landsat 8/9 Collection 2 Level-2.

Reads the lwir11 band (ST_B10, scaled DN), clips to the municipal boundary,
converts to Celsius, classifies into heat zones, vectorises at 90 m resolution,
and writes a GeoJSON ready for the frontend.

Inputs (gitignored - must be present locally):
  data/raw/*_lwir11.TIF    Landsat C2 L2 surface temperature band

Output:
  public/data/lst.geojson

Not CI-safe: needs the raw Landsat scene. `make green`.
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

# Landsat C2 L2 scale/offset for ST_B10 → Kelvin
LST_SCALE = 0.00341802
LST_OFFSET = 149.0

# Pixels above this threshold are outliers (bare rock, clouds, artifacts)
LST_MAX_VALID_C = 50.0

# LST classes: (low_inclusive, high_exclusive, label, hex_color)
LST_CLASSES = [
    (float('-inf'), 18.0, 'fresco',        '#4575b4'),
    (18.0,          22.0, 'moderato_fresco','#91bfdb'),
    (22.0,          26.0, 'temperato',      '#fee090'),
    (26.0,          30.0, 'caldo',          '#fc8d59'),
    (30.0,  float('inf'), 'molto_caldo',    '#d73027'),
]

OUTPUT_RESOLUTION_M = 90
MIN_AREA_M2 = 8_100   # 90×90 m²
SIMPLIFY_TOLERANCE_M = 45


def find_lwir_tif(repo_root: Path) -> Path:
    pattern = str(repo_root / 'data' / 'raw' / '*_lwir11.TIF')
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError(
            'No *_lwir11.TIF found under data/raw/.\n'
            'Download a Landsat 8/9 Collection 2 Level-2 scene and unzip it there.'
        )
    return Path(matches[-1])


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


def classify_lst(lst_c: np.ndarray) -> np.ndarray:
    out = np.zeros(lst_c.shape, dtype=np.uint8)
    for idx, (low, high, *_) in enumerate(LST_CLASSES, start=1):
        out[np.isfinite(lst_c) & (lst_c >= low) & (lst_c < high)] = idx
    return out


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    out_path = repo_root / 'public' / 'data' / 'lst.geojson'
    out_path.parent.mkdir(parents=True, exist_ok=True)

    tif_path = find_lwir_tif(repo_root)
    print(f'[INFO] LST file: {tif_path.name}')

    with rasterio.open(tif_path) as src:
        scene_crs = src.crs
        boundary_geoms = load_boundary_in_crs(scene_crs)
        raw_arr, native_transform = rio_mask(src, boundary_geoms, crop=True, nodata=0)
        raw = raw_arr[0].astype(np.float32)

    nodata_mask = raw == 0
    lst_k = raw * LST_SCALE + LST_OFFSET
    lst_c = lst_k - 273.15
    lst_c[nodata_mask] = np.nan
    lst_c[lst_c > LST_MAX_VALID_C] = np.nan

    print(f'[INFO] LST range (clipped): {np.nanmin(lst_c):.1f}°C - {np.nanmax(lst_c):.1f}°C')

    # Downsample to OUTPUT_RESOLUTION_M
    native_res_m = abs(native_transform.a)
    scale = native_res_m / OUTPUT_RESOLUTION_M
    h, w = lst_c.shape
    new_h = max(1, round(h * scale))
    new_w = max(1, round(w * scale))

    bounds = array_bounds(h, w, native_transform)
    vec_transform = from_bounds(*bounds, new_w, new_h)

    lst_resampled = np.empty((new_h, new_w), dtype=np.float32)
    rio_reproject(
        source=lst_c,
        destination=lst_resampled,
        src_transform=native_transform,
        src_crs=scene_crs,
        dst_transform=vec_transform,
        dst_crs=scene_crs,
        resampling=Resampling.bilinear,
        src_nodata=float('nan'),
        dst_nodata=float('nan'),
    )

    classified = classify_lst(lst_resampled)

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

        _, _, label, color = LST_CLASSES[class_index - 1]
        geom_wgs84 = transform_geom(scene_crs, wgs84, mapping(geom_utm))

        features.append({
            'type': 'Feature',
            'geometry': geom_wgs84,
            'properties': {'lst_class': label, 'color': color},
        })

    out_path.write_text(
        json.dumps({'type': 'FeatureCollection', 'features': features},
                   separators=(',', ':'), ensure_ascii=False)
    )
    print(f'[OK] {out_path.name}: {len(features)} features')


if __name__ == '__main__':
    main()
