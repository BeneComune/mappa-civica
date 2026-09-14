"""Extract the satellite acquisition date from a scene's official filename.

Shared by the fetch_*.py scripts (to name what they download) and the
process_*.py scripts (to embed the date in their output GeoJSON). Both
functions return None instead of raising when the name doesn't match the
official naming convention - e.g. a Landsat band hand-renamed by an older
manual download - so a missing date degrades to "no badge shown" in the
frontend, not a broken pipeline run.
"""

from __future__ import annotations

import re
from pathlib import Path

# Sentinel-2 product naming: S2A_MSIL2A_20230918T100031_N0509_R122_T33TUM_...
_SENTINEL2_RE = re.compile(r'MSIL2A_(\d{4})(\d{2})(\d{2})T\d{6}')

# Landsat Collection 2 naming: LC08_L2SP_193028_20230915_20230920_02_T1_...
_LANDSAT_RE = re.compile(r'L[COTE]0[89]_L2[A-Z0-9]+_\d{6}_(\d{4})(\d{2})(\d{2})_\d{8}')


def sentinel2_scene_date(safe_dir: Path) -> str | None:
    match = _SENTINEL2_RE.search(safe_dir.name)
    if not match:
        return None
    year, month, day = match.groups()
    return f'{year}-{month}-{day}'


def landsat_scene_date(tif_path: Path) -> str | None:
    match = _LANDSAT_RE.search(tif_path.name)
    if not match:
        return None
    year, month, day = match.groups()
    return f'{year}-{month}-{day}'
