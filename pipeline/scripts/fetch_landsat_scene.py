"""Fetch the most recent, mostly-clear Landsat 8/9 thermal band over the comune.

Searches the USGS M2M API for the newest Collection 2 Level-2 scene covering
the municipal boundary, walking backward from today until one passes the
cloud-cover threshold (never uses a cloudy scene, never overwrites existing
local data on failure). Downloads only the ST_B10 (surface temperature) band
- not the full SR+ST product bundle - so process_lst.py needs no changes.

Credentials (USGS EROS account with M2M access, see SETUP.md):
  USGS_USERNAME - your USGS profile username
  USGS_TOKEN    - an "application token" generated from your USGS profile
                  (M2M no longer accepts your raw account password)

Output:
  data/raw/<official_product_id>_ST_B10.TIF

Not run by `make green` directly - `make green-refresh` runs this first, then
`make green`. Requires the credentials above as environment variables.
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from shapely.geometry import shape

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import BOUNDARY_PATH  # noqa: E402

M2M_BASE = 'https://m2m.cr.usgs.gov/api/api/json/stable'
DATASET_NAME = 'landsat_ot_c2_l2'

CLOUD_COVER_MAX_PCT = 20
LOOKBACK_DAYS = 90
MAX_RESULTS = 20

# Poll interval/timeout while USGS prepares a download URL for a scene that
# isn't already staged (download-request can return it immediately, or make
# us wait and poll download-retrieve).
DOWNLOAD_POLL_SECONDS = 10
DOWNLOAD_POLL_TIMEOUT_SECONDS = 300


def m2m_post(endpoint: str, api_key: str | None, payload: dict) -> dict:
    headers = {'X-Auth-Token': api_key} if api_key else {}
    resp = requests.post(f'{M2M_BASE}/{endpoint}', json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    body = resp.json()
    if body.get('errorCode'):
        raise RuntimeError(f"M2M {endpoint} error: {body['errorCode']} - {body.get('errorMessage')}")
    return body['data']


def get_api_key() -> str:
    return m2m_post('login-token', None, {
        'username': os.environ['USGS_USERNAME'],
        'token': os.environ['USGS_TOKEN'],
    })


def boundary_bbox() -> tuple[float, float, float, float]:
    data = json.loads(BOUNDARY_PATH.read_text())
    geom = data['geometry'] if data.get('type') == 'Feature' else (
        data['features'][0]['geometry'] if data.get('features') else data)
    return shape(geom).bounds  # (minx, miny, maxx, maxy)


def search_scenes(api_key: str) -> list[dict]:
    minx, miny, maxx, maxy = boundary_bbox()
    since = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    result = m2m_post('scene-search', api_key, {
        'datasetName': DATASET_NAME,
        'maxResults': MAX_RESULTS,
        'sceneFilter': {
            'spatialFilter': {
                'filterType': 'mbr',
                'lowerLeft': {'latitude': miny, 'longitude': minx},
                'upperRight': {'latitude': maxy, 'longitude': maxx},
            },
            'acquisitionFilter': {
                'start': since.strftime('%Y-%m-%d'),
                'end': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            },
        },
    })
    scenes = result.get('results', [])
    scenes.sort(key=lambda s: s.get('temporalCoverage', {}).get('startDate', ''), reverse=True)
    return scenes


def scene_cloud_cover(scene: dict) -> float | None:
    value = scene.get('cloudCover')
    return float(value) if value is not None else None


def find_st_b10_product_id(api_key: str, entity_id: str) -> tuple[str, str]:
    """Returns (entityId, productId) for the ST_B10 download-request call.

    A secondary download nested under a bundle carries its own entityId,
    distinct from the parent scene's - download-request needs that pair,
    not the parent's entityId with the secondary's id (confirmed live: the
    latter comes back as an invalid scene with no explanation).
    """
    options = m2m_post('download-options', api_key, {
        'datasetName': DATASET_NAME,
        'entityIds': [entity_id],
    })
    # The standalone ST_B10 band isn't always a top-level download option -
    # for bundled products it's nested under a bundle's secondaryDownloads.
    # Search both levels. productName is often a generic "Band File" label
    # here (not the band id) - check every string field on the option for
    # "ST_B10", not just productName, since the real discriminator (seen on
    # a live run) turned out not to be productName at all.
    candidates = list(options)
    for option in options:
        candidates.extend(option.get('secondaryDownloads') or [])

    for option in candidates:
        haystack = ' '.join(str(v) for v in option.values() if isinstance(v, str)).upper()
        if 'ST_B10' in haystack:
            print(f'[INFO] Matched download option: {json.dumps(option, default=str)}')
            return option.get('entityId') or entity_id, option['id']

    print(f'[ERROR] No ST_B10 option found among {len(candidates)} candidates.', file=sys.stderr)
    print('[ERROR] Full option objects (deduplicated by id):', file=sys.stderr)
    seen: set[str] = set()
    for option in candidates:
        opt_id = str(option.get('id'))
        if opt_id in seen:
            continue
        seen.add(opt_id)
        print(f'  {json.dumps(option, default=str)}', file=sys.stderr)
    raise FileNotFoundError(f'No ST_B10 download option found for entity {entity_id}')


def request_download_url(api_key: str, entity_id: str, product_id: str) -> str:
    # `label` identifies this download batch - required for the request to
    # actually queue anything, and it's what download-retrieve is later
    # polled with (not the downloadId - that only identifies one item
    # *within* a label's batch).
    label = f'mappa-civica-{entity_id}'
    result = m2m_post('download-request', api_key, {
        'downloads': [{'entityId': entity_id, 'productId': product_id}],
        'label': label,
    })
    for item in result.get('availableDownloads', []):
        return item['url']

    preparing = result.get('preparingDownloads', [])
    if not preparing:
        print(f'[ERROR] download-request response: {json.dumps(result, default=str)}', file=sys.stderr)
        raise RuntimeError('download-request returned no available or preparing downloads')
    download_id = preparing[0]['downloadId']

    deadline = time.monotonic() + DOWNLOAD_POLL_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        time.sleep(DOWNLOAD_POLL_SECONDS)
        retrieve = m2m_post('download-retrieve', api_key, {'label': label})
        for item in retrieve.get('available', []):
            if item.get('downloadId') == download_id:
                return item['url']
    raise TimeoutError(f'Download for entity {entity_id} did not become ready in time')


def download_file(url: str, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True, timeout=300) as resp:
        resp.raise_for_status()
        with out_path.open('wb') as fh:
            for chunk in resp.iter_content(chunk_size=1024 * 1024):
                fh.write(chunk)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    raw_dir = repo_root / 'data' / 'raw'

    api_key = get_api_key()
    scenes = search_scenes(api_key)
    if not scenes:
        print(f'[ERROR] No Landsat scenes found in the last {LOOKBACK_DAYS} days.', file=sys.stderr)
        sys.exit(1)

    chosen = None
    for scene in scenes:
        cloud = scene_cloud_cover(scene)
        print(f"[INFO] Candidate: {scene.get('displayId')} - cloud cover: {cloud}")
        if cloud is not None and cloud <= CLOUD_COVER_MAX_PCT:
            chosen = scene
            break

    if chosen is None:
        print(
            f'[ERROR] No scene under {CLOUD_COVER_MAX_PCT}% cloud cover in the last '
            f'{LOOKBACK_DAYS} days - leaving data/raw/ untouched.',
            file=sys.stderr,
        )
        sys.exit(1)

    display_id = chosen['displayId']
    print(f'[INFO] Selected: {display_id} (cloud cover {scene_cloud_cover(chosen)}%)')

    download_entity_id, product_id = find_st_b10_product_id(api_key, chosen['entityId'])
    url = request_download_url(api_key, download_entity_id, product_id)

    out_path = raw_dir / f'{display_id}_ST_B10.TIF'
    download_file(url, out_path)
    print(f'[OK] {out_path.name} downloaded to {raw_dir}')


if __name__ == '__main__':
    main()
