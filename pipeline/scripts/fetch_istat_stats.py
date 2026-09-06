"""
Fetch ISTAT data for the configured comune (see comune_config.py) via
esploradati.istat.it SDMX REST API and merge into
public/data/municipality_stats.json.

Reference: https://github.com/ondata/guida-api-istat

Rate limit: 5 queries/minute - script stays well below that.

Datasets used:
  22_289  - Popolazione residente al 1° gennaio (comunale)
  164_164 - Popolazione residente ricostruita 2002-2019 (comunale, via old API)
  22_315  - Bilancio demografico: famiglie, densità (comunale)
  22_293_DF_DCIS_INDDEMOG1_1 - Indicatori demografici (provinciale PN)
  117_1035 - Servizi bancari per comune (comunale, via old API)

  [ECONOMIA - to be verified when esploradati.istat.it is accessible]
  DCCV_TAXOCCU1 - Tasso di occupazione (provinciale PN = ITD41)
    key: A.ITD41.... (DATA_TYPE=OCCUP15_64 or TAXOCCU)
  DCCV_PENDOLARIT or census 2021 - Pendolari per comune
    Note: municipal-level commuter data typically comes from Censimento 2021
    and may not be available via SDMX; check esploradati.istat.it manually.

  [TOURISM - municipal data not available for small comuni via SDMX]
  DCSC_CAPTUR2 - Capacità degli esercizi ricettivi (municipal, if available)
    key: A.093027.... - returns empty for MV (too small for dataset)

Still manual (not available at municipal level via SDMX):
  - Seismic zone: zone 1 (from DPC national classification, hardcoded)
  - Hydrogeological risk: PAI Regione FVG / ISPRA IdroGEO
  - Services (scuole, farmacia): OpenStreetMap (not yet mapped for MV)
  - Nearest ER: Ospedale 'Immacolata Concezione', Maniago/Manià (~6 km, ~13 min)
"""

import io
import json
from pathlib import Path

import pandas as pd
import requests
from istatapi import discovery, retrieval

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib.comune_config import ISTAT_CODE, PROVINCE_ISTAT_CODE

REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = REPO_ROOT / 'public' / 'data' / 'municipality_stats.json'

NEW_BASE = 'https://esploradati.istat.it/SDMXWS/rest'
OLD_BASE = 'https://sdmx.istat.it/SDMXWS/rest'
CSV_HEADERS = {'Accept': 'application/vnd.sdmx.data+csv;version=1.0.0'}

MV = ISTAT_CODE            # comune ISTAT code
PN = PROVINCE_ISTAT_CODE   # province ISTAT code (provincial fallback data)


def get_csv(flow: str, key: str = '....', base: str = NEW_BASE, **params) -> pd.DataFrame | None:
    url = f'{base}/data/{flow}/{key}'
    r = requests.get(url, headers=CSV_HEADERS, timeout=20, params=params)
    if r.status_code == 200 and len(r.text) > 50:
        return pd.read_csv(io.StringIO(r.text))
    return None


def fetch_population_trend() -> list[dict]:
    """Full population trend 2001-2026 merging two datasets."""
    print('  Fetching population 2019-2026 (22_289, new endpoint)...')
    df_new = get_csv('22_289', f'A.{MV}....')
    if df_new is None:
        raise RuntimeError('22_289 failed')
    new_series = (
        df_new[(df_new['SEX'] == 9) & (df_new['DATA_TYPE'] == 'JAN')]
        [['TIME_PERIOD', 'OBS_VALUE']].copy()
    )

    print('  Fetching population 2001-2019 (164_164, old endpoint)...')
    ds = discovery.DataSet(dataflow_identifier='164_164')
    ds.set_filters(ITTER107=MV, CITTADINANZA='TOTAL', CLASSE_ETA='TOTAL', SESSO='9', TIPO_DATO='JAN')
    df_old = retrieval.get_data(ds)
    df_old['TIME_PERIOD'] = pd.to_datetime(df_old['TIME_PERIOD']).dt.year
    old_series = df_old[['TIME_PERIOD', 'OBS_VALUE']].rename(columns={'TIME_PERIOD': 'TIME_PERIOD'})
    old_series.columns = ['TIME_PERIOD', 'OBS_VALUE']

    # Merge: old covers 2001-2018, new covers 2019-2026
    combined = (
        pd.concat([
            old_series[old_series['TIME_PERIOD'] < 2019],
            new_series.rename(columns={'TIME_PERIOD': 'TIME_PERIOD'}),
        ])
        .drop_duplicates('TIME_PERIOD')
        .sort_values('TIME_PERIOD')
    )
    return [{'year': int(r.TIME_PERIOD), 'value': int(r.OBS_VALUE)} for _, r in combined.iterrows()]


def fetch_demographic_balance() -> dict:
    """Households, density, births, deaths from bilancio demografico (22_315)."""
    print('  Fetching bilancio demografico (22_315)...')
    df = get_csv('22_315', f'A.{MV}....')
    if df is None:
        return {}
    latest = df[df['SEX'] == 9].groupby('DATA_TYPE')['OBS_VALUE'].last()
    return {
        'households': int(latest.get('NUMPRHO_CP', 0)) or None,
        'avg_household_size': float(latest.get('AVNUHM_CP', 0)) or None,
        'population_density_km2': float(latest.get('POPCOM_CP', 0)) or None,
    }


def fetch_demographic_indicators_provincial() -> dict:
    """Average age, old-age index etc. at provincial level (PN)."""
    print('  Fetching indicatori demografici provinciali (22_293)...')
    df = get_csv('22_293_DF_DCIS_INDDEMOG1_1', f'A.{PN}....')
    if df is None:
        return {}
    latest = df.groupby('DATA_TYPE')['OBS_VALUE'].last()
    return {
        'avg_age': float(latest.get('MEANAGEP', 0)) or None,
        'old_age_index': float(latest.get('AGEINDEX', 0)) or None,
        'pct_pop_65_over': float(latest.get('POP65OVER', 0)) or None,
        'pct_pop_0_14': float(latest.get('POP014', 0)) or None,
    }


def fetch_bank_branches() -> int | None:
    """Bank branches in municipality (117_1035, old endpoint)."""
    print('  Fetching sportelli bancari (117_1035)...')
    try:
        ds = discovery.DataSet(dataflow_identifier='117_1035')
        ds.set_filters(ITTER107=MV, TIPO_DATO='BANK_BRN')
        df = retrieval.get_data(ds)
        df['year'] = pd.to_datetime(df['TIME_PERIOD']).dt.year
        return int(df.sort_values('year').iloc[-1].OBS_VALUE)
    except Exception as e:
        print(f'    WARNING: {e}')
        return None


def main():
    with OUTPUT_PATH.open() as f:
        stats = json.load(f)

    print('Fetching population trend...')
    try:
        trend = fetch_population_trend()
        stats['demographic']['population_trend'] = trend
        latest_pop = next((t['value'] for t in reversed(trend) if t['year'] <= 2024), None)
        stats['demographic']['population'] = latest_pop
        stats['demographic']['population_year'] = 2024
        print(f'  Trend: {trend[0]["value"]} ({trend[0]["year"]}) → {trend[-1]["value"]} ({trend[-1]["year"]})')
    except Exception as e:
        print(f'  ERROR: {e}')

    print('Fetching bilancio demografico...')
    try:
        bal = fetch_demographic_balance()
        stats['demographic'].update(bal)
        print(f'  Famiglie: {bal.get("households")}, densità: {bal.get("population_density_km2")} ab/km²')
    except Exception as e:
        print(f'  ERROR: {e}')

    print('Fetching indicatori demografici (provinciali)...')
    try:
        dem = fetch_demographic_indicators_provincial()
        stats['demographic'].update(dem)
        print(f'  Età media: {dem.get("avg_age")}, Indice vecchiaia: {dem.get("old_age_index")}')
    except Exception as e:
        print(f'  ERROR: {e}')

    print('Fetching sportelli bancari...')
    try:
        branches = fetch_bank_branches()
        stats['services']['bank_branches'] = branches
        print(f'  Sportelli: {branches}')
    except Exception as e:
        print(f'  ERROR: {e}')

    stats['_meta']['istat_fetched'] = pd.Timestamp.now().strftime('%Y-%m-%d')

    with OUTPUT_PATH.open('w') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    print(f'\nSalvato: {OUTPUT_PATH}')
    print('\nDati ancora manuali: turismo, occupazione/pendolari, rischio sismico/idrogeologico, servizi locali.')


if __name__ == '__main__':
    main()
