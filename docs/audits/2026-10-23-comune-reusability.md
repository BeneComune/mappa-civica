# Comune reusability audit

**Date:** 2026-10-23
**Scope:** `SETUP.md` promises that another comune can adopt the platform by editing `data/` and
`public/data/` only, without touching `app/`, `components/` or `lib/`. This audit checks which
comune- or region-specific values are still hardcoded in the app and the pipeline.
**Method:** grep of `app/`, `components/`, `lib/`, `pipeline/` for the comune name, province,
region, cadastral code, contact details and local place names, then a read of each hit.

## Verdict

The config-driven core holds: map view, boundary, cadastral code, ISTAT codes, OSM area and LTS
embed all come from `data/comune.config.json`. Two leaks were fixed the same day. Six smaller ones
remain, mostly copy that describes Montereale or Friuli-Venezia Giulia specifically.

## Fixed

| What | Where | Fix |
|---|---|---|
| Segnala reports emailed to the Montereale address | `lib/community/mailto.ts` | `5ab0649`: reads `MUNICIPALITY_EMAIL` (config `email`) |
| Comune name in the rii and assets FAQ text | `app/rescue/events/page.tsx`, `app/rescue/assets/page.tsx` | `3a3f53a`: reads `MUNICIPALITY_NAME` |

## Open

| # | What | Where | Impact for another comune |
|---|---|---|---|
| 1 | Provincial fallback values tagged `(PN)` | `components/municipality-stats.tsx` (avg age, old-age index, 65+ share) | Wrong province shown. The pipeline already uses `provinceIstatCode`; the province abbreviation isn't in the config |
| 2 | Local cycle route name in a generic label: `Ciclabili / MV 06` | `lib/strings.ts` (`bikeInfraCiclabili`), bike-infra FAQ (`FVG3 / MV 06`) | Label names a route that doesn't exist elsewhere |
| 3 | Rii FAQ describes Montereale's own census (stream names, survey years, flood dates) | `app/rescue/events/page.tsx` | Whole paragraph is per-comune content, not just the name |
| 4 | Fire module copy cites Regione FVG / IRDAT / SITFOR | `lib/strings.ts` (`wildfiresDescription`), `app/rescue/fire/page.tsx`, `lib/rescue-details.ts` (danger note) | `build_fire_geojson.py` only has data for FVG comuni, so outside FVG the layers are empty while the copy still describes FVG sources |
| 5 | `SETUP.md` doesn't say `make fire` is FVG-only | `SETUP.md` (the Makefile help and the script docstring do say it) | An adopter outside FVG learns it from an empty layer |
| 6 | Pipeline help banner hardcodes the comune name | `pipeline/Makefile` (`help` target) | Cosmetic |

Region-specific by design and not counted as leaks: the IRDAT data source itself (`make fire`), and
the `Europe/Rome` timezone and `it` locale used throughout.

## Follow-ups

Items 1 and 5 are in [`BACKLOG.md`](../BACKLOG.md); 2, 3, 4 and 6 are open questions in
[`TODO.md`](../TODO.md) (each needs a decision on where per-comune copy should live).
