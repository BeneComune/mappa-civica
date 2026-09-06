# Reports validated by the comune

`reports.csv` is the hand-curated list of reports the comune has chosen to
publish. `pipeline/scripts/build_community_duckdb.py` turns it into
`public/data/community_data.duckdb`, the read-only file the app loads in the
browser (`lib/duckdb.ts`). Reports that have not been validated yet are not
here: they stay in the `localStorage` of whoever wrote them and reach the
comune by email (the app has no backend).

## Ingestion workflow

1. Someone at the comune reads the emails sent to
   `info@comune.montereale-valcellina.pn.it`.
2. For each report to publish, they append **one row** to `reports.csv`.
3. If there is a photo, they save it to `public/data/community/<id>.jpg` and put
   the relative path (`community/<id>.jpg`) in the `photo` column.
4. `cd pipeline && make community` rebuilds `community_data.duckdb`.
5. `git commit` + `git push` -> Vercel deploys, the report goes public.

To remove a report: delete the row (or set `status` to `resolved` to keep it
visible but marked done), then repeat steps 4-5.

## Columns

| column | notes |
|---|---|
| `id` | unique row identifier (the app's UUID, or a short hand-picked string) |
| `category` | one of: `strade`, `natura`, `rifiuti`, `illuminazione`, `segnaletica`, `proposta` |
| `title` | required |
| `description` | free text |
| `lon`, `lat` | WGS84, decimal degrees |
| `created_at` | ISO 8601 (e.g. `2026-09-06T09:00:00Z`) |
| `status` | `open` (default), `in_progress`, `resolved` |
| `foglio`, `particella` | cadastral, optional |
| `photo` | relative path inside `public/data/`, e.g. `community/<id>.jpg`, optional |

The column schema is deliberately shaped like a future `/api/reports` response:
if a real backend is added later, only the body of `loadCommunityReports()` in
`lib/duckdb.ts` changes, not the rest of the app.

## Warning: the repo is public

`reports.csv` and its entire git history are public. A removed row **stays in
the history forever**. Never put personal data in the clear (names, contacts,
plate numbers): only category, title, description, location, date.
