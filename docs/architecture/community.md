# Segnala (community reports)

Citizens report a problem by picking a point on the map. The report goes out as a pre-filled
email to the comune. There's no backend: the comune decides which reports to publish, and
published ones ship as a static DuckDB file.

## Two sources, merged at read time

| Source | Where | Written by | Read by |
|---|---|---|---|
| Pending (this browser's own, unsent or not yet published) | `localStorage` key `mv_pending_reports` | `ReportDrawer` on submit | `lib/community/reports-store.ts` |
| Published (validated by the comune) | `public/data/community_data.duckdb` | `pipeline/scripts/build_community_duckdb.py` from `data/community/reports.csv` | `lib/duckdb.ts` (`loadCommunityReports`) via DuckDB-Wasm |

`CommunityPanel` lists pending first, then published, dropping published rows whose id matches a
pending one (pending wins). Deleting is only offered for pending reports.

## Submit flow

1. `ReportDrawer` (`components/report-drawer/`) collects category, title, description, an optional
   photo (downscaled to a data URL by `resizeImageToDataUrl`) and a map point.
2. `useNearestParcel` finds the nearest cadastral parcel point within 120 m, reading only the
   `catasto` vector tiles already loaded (`querySourceFeatures`). It recomputes as tiles stream in.
3. On submit, `buildReportMailto` (`lib/community/mailto.ts`) builds a `mailto:` addressed to
   `MUNICIPALITY_EMAIL` (`data/comune.config.json` → `email`). The photo can't travel in a mailto,
   so the body tells the sender to attach it.
4. The report is saved to the pending store, so it shows on the map and list right away.

Desktop uses a right-side non-modal drawer, so the map stays clickable behind it. Mobile is a
two-step flow: fold the sheet, tap the map, then the form opens. See [`mobile.md`](mobile.md).

## Votes

"Anche a me importa" is a local-only upvote (`lib/community/votes-store.ts`, `localStorage`): it
records interest on this device and isn't sent anywhere.

## Stores and SSR

Both stores are `useSyncExternalStore`-compatible: `subscribe`, a cached client snapshot that stays
referentially stable between writes, and a constant empty server snapshot. The server and the
first client render agree, so there's no hydration mismatch. `community.test.ts` pins that contract
down.

## Publishing workflow

The comune reads the emails, appends rows to `data/community/reports.csv`, runs
`make community`, commits and pushes. `data/community/README.md` has the column schema and the
rule that matters most: the repo is public and history is forever, so **no personal data in the
CSV**.

The CSV columns match what a future `/api/reports` endpoint would return. If a backend is ever
added, only the body of `loadCommunityReports()` changes (2026-09-06 ADR in `PROGRESS.md`).
