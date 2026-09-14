"""Fetch the most recent, mostly-clear Sentinel-2 L2A scene over the comune.

Searches the Copernicus Data Space Ecosystem (CDSE) catalogue for the newest
scene covering the municipal boundary, walking backward from today until one
passes the cloud-cover threshold (never uses a cloudy scene, never overwrites
existing local data on failure). Downloads only the bands process_green_layers.py
and process_nbr.py actually need (B04/B08 at 10m, B8A/B12/SCL at 20m) via
CDSE's S3-compatible object storage, and reconstructs a minimal local
`.SAFE`-shaped directory tree so those scripts need no changes at all.

Credentials (CDSE account, see SETUP.md):
  CDSE_USERNAME, CDSE_PASSWORD           - catalogue search/auth
  CDSE_S3_ACCESS_KEY, CDSE_S3_SECRET_KEY - eodata object storage (generated
                                            separately from your CDSE dashboard)

Output:
  data/raw/<product_name>.SAFE/GRANULE/<granule>/IMG_DATA/R10m/*_B04_10m.jp2, *_B08_10m.jp2
  data/raw/<product_name>.SAFE/GRANULE/<granule>/IMG_DATA/R20m/*_B8A_20m.jp2, *_B12_20m.jp2, *_SCL_20m.jp2

Not run by `make green` directly - `make green-refresh` runs this first, then
`make green`. Requires the credentials above as environment variables.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import boto3
import requests
from shapely.geometry import shape

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import BOUNDARY_PATH  # noqa: E402

IDENTITY_TOKEN_URL = (
    'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
)
CATALOGUE_URL = 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products'
S3_ENDPOINT = 'https://eodata.dataspace.copernicus.eu'
S3_REGION = 'default'

CLOUD_COVER_MAX_PCT = 20
LOOKBACK_DAYS = 90
CANDIDATES_PER_PAGE = 20

# (band_id, resolution folder, resolution suffix) - union of what
# process_green_layers.py (B04/B08 @ 10m) and process_nbr.py
# (B8A/B12/SCL @ 20m) read via find_band_jp2().
BANDS = [
    ('B04', 'R10m', '10m'),
    ('B08', 'R10m', '10m'),
    ('B8A', 'R20m', '20m'),
    ('B12', 'R20m', '20m'),
    ('SCL', 'R20m', '20m'),
]


def get_access_token() -> str:
    username = os.environ['CDSE_USERNAME']
    password = os.environ['CDSE_PASSWORD']
    resp = requests.post(
        IDENTITY_TOKEN_URL,
        data={
            'client_id': 'cdse-public',
            'grant_type': 'password',
            'username': username,
            'password': password,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()['access_token']


def boundary_bbox_wkt() -> str:
    data = json.loads(BOUNDARY_PATH.read_text())
    geom = data['geometry'] if data.get('type') == 'Feature' else (
        data['features'][0]['geometry'] if data.get('features') else data)
    minx, miny, maxx, maxy = shape(geom).bounds
    return (
        f'POLYGON(({minx} {miny},{maxx} {miny},{maxx} {maxy},{minx} {maxy},{minx} {miny}))'
    )


def search_candidates(token: str) -> list[dict]:
    since = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).strftime('%Y-%m-%dT%H:%M:%SZ')
    filter_expr = (
        "Collection/Name eq 'SENTINEL-2' and "
        "contains(Name,'MSIL2A') and "
        f"OData.CSC.Intersects(area=geography'SRID=4326;{boundary_bbox_wkt()}') and "
        f"ContentDate/Start gt {since}"
    )
    resp = requests.get(
        CATALOGUE_URL,
        params={
            '$filter': filter_expr,
            '$orderby': 'ContentDate/Start desc',
            '$top': CANDIDATES_PER_PAGE,
            '$expand': 'Attributes',
        },
        headers={'Authorization': f'Bearer {token}'},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json().get('value', [])


def cloud_cover_pct(product: dict) -> float | None:
    for attr in product.get('Attributes', []):
        if attr.get('Name') == 'cloudCover':
            return float(attr['Value'])
    return None


def s3_client():
    return boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.environ['CDSE_S3_ACCESS_KEY'],
        aws_secret_access_key=os.environ['CDSE_S3_SECRET_KEY'],
        region_name=S3_REGION,
    )


def s3_key_prefix(product_name: str, sensing_start: str) -> str:
    # sensing_start looks like "2023-09-18T10:00:31.024Z"
    dt = datetime.fromisoformat(sensing_start.replace('Z', '+00:00'))
    return f'Sentinel-2/MSI/L2A/{dt:%Y}/{dt:%m}/{dt:%d}/{product_name}'


def find_granule_dir(client, bucket: str, prefix: str) -> str:
    resp = client.list_objects_v2(Bucket=bucket, Prefix=f'{prefix}/GRANULE/', Delimiter='/')
    granules = [p['Prefix'] for p in resp.get('CommonPrefixes', [])]
    if not granules:
        raise FileNotFoundError(f'No GRANULE directory found under {prefix}')
    return granules[0].rstrip('/').rsplit('/', 1)[-1]


def download_scene(client, product_name: str, sensing_start: str, out_dir: Path) -> None:
    bucket = 'eodata'
    prefix = s3_key_prefix(product_name, sensing_start)
    granule = find_granule_dir(client, bucket, prefix)
    print(f'[INFO] Granule: {granule}')

    safe_dir = out_dir / product_name
    for band_id, res_dir, res_suffix in BANDS:
        remote_dir = f'{prefix}/GRANULE/{granule}/IMG_DATA/{res_dir}/'
        resp = client.list_objects_v2(Bucket=bucket, Prefix=remote_dir)
        matches = [o['Key'] for o in resp.get('Contents', []) if f'_{band_id}_{res_suffix}.jp2' in o['Key']]
        if not matches:
            raise FileNotFoundError(f'Band {band_id} at {res_dir} not found under {remote_dir}')
        remote_key = matches[0]
        local_path = safe_dir / 'GRANULE' / granule / 'IMG_DATA' / res_dir / Path(remote_key).name
        local_path.parent.mkdir(parents=True, exist_ok=True)
        print(f'[INFO] Downloading {remote_key} -> {local_path}')
        client.download_file(bucket, remote_key, str(local_path))


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    raw_dir = repo_root / 'data' / 'raw'

    token = get_access_token()
    candidates = search_candidates(token)
    if not candidates:
        print(f'[ERROR] No Sentinel-2 scenes found in the last {LOOKBACK_DAYS} days.', file=sys.stderr)
        sys.exit(1)

    chosen = None
    for product in candidates:
        cloud = cloud_cover_pct(product)
        print(f"[INFO] Candidate: {product['Name']} - cloud cover: {cloud}")
        if cloud is not None and cloud <= CLOUD_COVER_MAX_PCT:
            chosen = product
            break

    if chosen is None:
        print(
            f'[ERROR] No scene under {CLOUD_COVER_MAX_PCT}% cloud cover in the last '
            f'{LOOKBACK_DAYS} days - leaving data/raw/ untouched.',
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"[INFO] Selected: {chosen['Name']} (cloud cover {cloud_cover_pct(chosen)}%)")
    client = s3_client()
    download_scene(client, chosen['Name'], chosen['ContentDate']['Start'], raw_dir)
    print(f"[OK] {chosen['Name']} downloaded to {raw_dir}")


if __name__ == '__main__':
    main()
