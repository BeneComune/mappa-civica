# Documentation index

What's documented where, and what to read first for a given task. Setup and usage live at the repo
root: [`README.md`](../README.md) (overview, stack, data sources), [`SETUP.md`](../SETUP.md)
(configuring another comune), [`CONTRIBUTING.md`](../CONTRIBUTING.md),
[`pipeline/README.md`](../pipeline/README.md) (data pipeline targets).

## Documents

| Doc | What it covers |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Process for AI agents: verification gates, docs to update per commit, recipes, hands-off areas |
| [`PROGRESS.md`](PROGRESS.md) | Curated history and ADRs, newest first - why things are the way they are |
| [`CHANGELOG.md`](CHANGELOG.md) | Raw commit-by-commit trail, newest first |
| [`BACKLOG.md`](BACKLOG.md) | Committed work, ranked P1-P3 with S/M/L effort |
| [`TODO.md`](TODO.md) | Loose observations and open questions, not committed yet |
| [`architecture/map.md`](architecture/map.md) | The single persistent map, `ROUTE_OVERLAYS`, overlay rules, the `MapProvider` API, data per overlay |
| [`architecture/routes.md`](architecture/routes.md) | Every route: panel, overlays, `PanelFrame`, nav tree, adding a page |
| [`architecture/routing.md`](architecture/routing.md) | In-browser Dijkstra: networks, cost model, route summary, planner UI |
| [`architecture/community.md`](architecture/community.md) | Segnala: pending vs published reports, mailto, votes, publishing workflow |
| [`architecture/data-pipeline.md`](architecture/data-pipeline.md) | Data roots, formats (GeoJSON / PMTiles / DuckDB), scheduled refresh, adding a layer |
| [`architecture/mobile.md`](architecture/mobile.md) | The `md` breakpoint, bottom sheet, two-step flows, `useIsMobile` |
| [`architecture/ui-copy.md`](architecture/ui-copy.md) | `STRINGS` / `COLORS` / `ICONS`: what goes where, and the deliberate exceptions |
| [`architecture/testing.md`](architecture/testing.md) | Coverage by area, gaps, next tests worth adding |
| [`audits/2026-10-23-comune-reusability.md`](audits/2026-10-23-comune-reusability.md) | Comune-specific values still hardcoded, fixed vs open |

`architecture/` explains **how the app works**. The root-level docs here are entry points and
process: this index, agent rules, history, roadmap. `audits/` holds dated, point-in-time reports;
they aren't updated after the fact.

## Reading order by task

**First time in the repo:** root `CLAUDE.md` → [`architecture/map.md`](architecture/map.md) →
[`architecture/routes.md`](architecture/routes.md) → [`AGENTS.md`](AGENTS.md).

**Adding or changing a page:** [`architecture/routes.md`](architecture/routes.md) →
[`architecture/map.md`](architecture/map.md) (panel building blocks) →
[`architecture/ui-copy.md`](architecture/ui-copy.md).

**Adding a map layer:** [`architecture/data-pipeline.md`](architecture/data-pipeline.md) →
[`architecture/map.md`](architecture/map.md) → [`pipeline/README.md`](../pipeline/README.md).

**Route planner or hospital route:** [`architecture/routing.md`](architecture/routing.md).

**Segnala:** [`architecture/community.md`](architecture/community.md) →
[`data/community/README.md`](../data/community/README.md).

**Mobile layout bug:** [`architecture/mobile.md`](architecture/mobile.md), then the 2026-09-07 ADR
in [`PROGRESS.md`](PROGRESS.md).

**Deploying for another comune:** [`SETUP.md`](../SETUP.md) →
[`audits/2026-10-23-comune-reusability.md`](audits/2026-10-23-comune-reusability.md).

**Writing tests:** [`architecture/testing.md`](architecture/testing.md).

## Layout

```
docs/
├── README.md          ← this index
├── AGENTS.md          ← process for AI agents
├── PROGRESS.md        ← curated history + ADRs
├── CHANGELOG.md       ← raw commit trail
├── BACKLOG.md         ← committed, ranked work
├── TODO.md            ← loose observations
├── screenshot.jpg     ← used by the root README
├── architecture/
│   ├── community.md
│   ├── data-pipeline.md
│   ├── map.md
│   ├── mobile.md
│   ├── routes.md
│   ├── routing.md
│   ├── testing.md
│   └── ui-copy.md
└── audits/
    └── 2026-10-23-comune-reusability.md
```
