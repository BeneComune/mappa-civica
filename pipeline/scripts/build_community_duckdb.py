"""Build public/data/community_data.duckdb from the curated report list.

Replaces the old init_duckdb.py, which only ever created empty tables. The
Segnala module has no backend: citizens' reports arrive at the comune by
email, and whoever validates them appends a row to
data/community/reports.csv (see data/community/README.md). This script turns
that CSV into the read-only DuckDB snapshot the app loads in the browser
(lib/duckdb.ts -> loadCommunityReports).

The CSV columns are shaped like a future /api/reports response, so adding a
real backend later means changing only loadCommunityReports(), not the rest
of the app.

`make community`.
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import duckdb

REPO_ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = REPO_ROOT / "data" / "community" / "reports.csv"
DB_PATH = REPO_ROOT / "public" / "data" / "community_data.duckdb"

FIELDS = [
    "id", "category", "title", "description", "lon", "lat",
    "created_at", "status", "foglio", "particella", "photo",
]

SCHEMA = """
CREATE TABLE reports (
    id VARCHAR,
    category VARCHAR,
    title VARCHAR,
    description VARCHAR,
    lon DOUBLE,
    lat DOUBLE,
    created_at VARCHAR,
    status VARCHAR,
    foglio VARCHAR,
    particella VARCHAR,
    photo VARCHAR
);
"""


def load_rows() -> list[dict]:
    if not CSV_PATH.exists():
        print(f"[note] {CSV_PATH} missing - writing an empty reports table", file=sys.stderr)
        return []

    with CSV_PATH.open(encoding="utf-8-sig", newline="") as handle:
        rows: list[dict] = []
        for line_no, raw in enumerate(csv.DictReader(handle), start=2):
            row = {key: (raw.get(key) or "").strip() for key in FIELDS}
            if not row["id"] or not row["title"]:
                print(f"[warn] reports.csv line {line_no}: missing id or title - skipped", file=sys.stderr)
                continue
            try:
                row["lon"] = float(row["lon"])
                row["lat"] = float(row["lat"])
            except ValueError:
                print(f"[warn] reports.csv line {line_no} ({row['id']}): bad lon/lat - skipped", file=sys.stderr)
                continue
            row["status"] = row["status"] or "open"
            rows.append(row)
        return rows


def main() -> None:
    rows = load_rows()
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()  # rebuilt from scratch every run

    con = duckdb.connect(str(DB_PATH))
    con.execute(SCHEMA)
    if rows:
        con.executemany(
            "INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    row["id"], row["category"], row["title"], row["description"],
                    row["lon"], row["lat"], row["created_at"], row["status"],
                    row["foglio"] or None, row["particella"] or None, row["photo"] or None,
                )
                for row in rows
            ],
        )
    con.close()
    print(f"[OK] community_data.duckdb: {len(rows)} reports")


if __name__ == "__main__":
    main()
