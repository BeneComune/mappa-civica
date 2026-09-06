"""Single source of truth for per-deployment municipality settings.

Every pipeline script that needs the OSM area, ISTAT code, or municipal
boundary reads it from here instead of hardcoding its own copy. The frontend
reads the same JSON file directly (see lib/config.ts).

To deploy this for a different comune: edit data/comune.config.json (see
SETUP.md for the full checklist, including which raw data files each value
depends on).
"""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = REPO_ROOT / 'data' / 'comune.config.json'

with CONFIG_PATH.open() as _f:
    COMUNE: dict = json.load(_f)

AREA_ID: int = COMUNE['osmAreaId']
ISTAT_CODE: str = COMUNE['istatCode']
PROVINCE_ISTAT_CODE: str = COMUNE['provinceIstatCode']
BOUNDARY_PATH: Path = REPO_ROOT / COMUNE['boundaryFile']
