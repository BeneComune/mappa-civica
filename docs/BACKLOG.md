# Backlog

Committed, actionable work items, ranked by priority with a rough effort estimate. Loose
observations and open questions that aren't committed work yet go in [`TODO.md`](TODO.md); what's
already done is in [`PROGRESS.md`](PROGRESS.md).

**Priority:** P1 (do next) · P2 (soon) · P3 (someday)
**Effort:** S (< 1h) · M (a few hours) · L (a day+)

| # | Item | Priority | Effort |
|---|------|----------|--------|
| 1 | [Province abbreviation in the Home stats from config](#1-province-abbreviation-in-the-home-stats-from-config) | P2 | S |
| 2 | [Say in SETUP.md that the fire layers are FVG-only](#2-say-in-setupmd-that-the-fire-layers-are-fvg-only) | P3 | S |
| 3 | [Verify the satellite/DEM pipeline targets](#3-verify-the-satellitedem-pipeline-targets) | P3 | M |

---

## 1. Province abbreviation in the Home stats from config

`components/municipality-stats.tsx` tags the three provincial-fallback values (average age,
old-age index, 65+ share) with a hardcoded `(PN)`. Any other province shows the wrong
abbreviation. Add the abbreviation to `data/comune.config.json`, export it from `lib/config.ts`,
document it in `SETUP.md` §1. Source: [comune reusability audit](audits/2026-10-23-comune-reusability.md) #1.

## 2. Say in SETUP.md that the fire layers are FVG-only

`build_fire_geojson.py` only gets data for comuni in Friuli-Venezia Giulia (IRDAT WFS); elsewhere
`make fire` writes empty layers. The Makefile help says so, `SETUP.md` doesn't. Add a short note,
and say what the Incendi tab shows when the layers are empty. Source: [audit](audits/2026-10-23-comune-reusability.md) #5.

## 3. Verify the satellite/DEM pipeline targets

`process_green_layers`, `process_nbr`, `process_lst`, `process_shade_corridors` and `rii` were
ported without the raw scenes, so they were never checked to reproduce the committed outputs (see
the 2026-09-06 pipeline ADR in `PROGRESS.md`). Run each against real `data/raw/` inputs and diff
the outputs against `public/data/`.
