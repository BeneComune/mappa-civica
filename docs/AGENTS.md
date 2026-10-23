# Working in this repo (AI agents)

Code conventions (style, path comments, import boundaries, the architecture summary) are in the
root `CLAUDE.md`, which loads automatically. This file covers the process around a change.

The root `AGENTS.md` is a different file: `next dev` rewrites it on every run with Next.js's own
agent notice. Commit its diff along with your changes; don't put project content there.

## Before writing code

- **Next.js 16 differs from training data.** Read the relevant guide in
  `node_modules/next/dist/docs/` before using a Next.js API, and heed deprecation notices.
- **Read the area's doc** in [`architecture/`](architecture/) ([`README.md`](README.md) maps
  tasks to docs).
- **Reuse before adding.** `STRINGS` / `COLORS` / `ICONS`; the overlay shape and `ROUTE_OVERLAYS`;
  the panel building blocks (`OverlayToggleBadge`, `FilterBadgeGroup`, `ClassesTogglePanel`,
  `MapFeatureDetail`, `InfoNote`, `Faq`); the `MapProvider` methods before `getMap()`.
- **Nothing comune-specific in `app/`, `components/`, `lib/`.** Values come from
  `data/comune.config.json` via `lib/config.ts`
  ([audit](audits/2026-10-23-comune-reusability.md)).

## Verification gates

All must pass with zero warnings before a commit. A failure that was already there gets fixed too,
not reported and left.

```bash
pnpm lint
npx next typegen && npx tsc --noEmit   # typegen: on a fresh clone .next/types is missing (CI runs it too)
pnpm check:paths
pnpm test
pnpm build                             # when imports change across the server/client boundary or in lib/map
```

## Commits and docs upkeep

- One commit per unit of work. Never `git push` without an explicit go-ahead for that batch.
- **Every commit** adds its entry to [`CHANGELOG.md`](CHANGELOG.md) in the same commit: the subject
  as a `###` heading under today's date, then what/why bullets.
- **Direction-setting changes** (new dependency or data source, a new pattern, a reversed decision)
  also get an ADR entry in [`PROGRESS.md`](PROGRESS.md): Context / Decision / Consequence /
  Status, newest first.
- **Committed follow-up work** goes in [`BACKLOG.md`](BACKLOG.md), **loose observations and open
  questions** in [`TODO.md`](TODO.md), **point-in-time reports** in `audits/YYYY-MM-DD-<topic>.md`.
  Plans, if any, in `plans/YYYY-MM-DD-<topic>.md`.
- When a change alters what an [`architecture/`](architecture/) doc describes (a new route, a
  new overlay, a new MapProvider method), update that doc in the same commit.

## Recipes

**Add a page:** see [`architecture/routes.md`](architecture/routes.md#adding-a-page).
**Add an overlay:** see [`architecture/map.md`](architecture/map.md#overlays-added-once-per-style-load-shown-per-route).
**Add a data layer:** see [`architecture/data-pipeline.md`](architecture/data-pipeline.md#adding-a-data-layer).
**Add UI text:** see [`architecture/ui-copy.md`](architecture/ui-copy.md).

## Hands off

- `components/ui/**`: shadcn-generated. Regenerate with `shadcn add`, don't hand-edit.
- `public/maplibre-gl/**`: vendored worker. Re-copy from `node_modules/maplibre-gl/dist/` when
  maplibre-gl is upgraded.
- Generated files under `public/data/`: regenerate through `pipeline/`. `SETUP.md` lists the few
  hand-authored ones.
- `data/community/reports.csv`: public, with permanent history. Never personal data.

## Tests

Unit tests for pure logic and small stores, colocated as `*.test.ts`. Component tests only for
real interactive logic, and E2E only for a couple of high-value flows (neither layer exists yet).
Check [`architecture/testing.md`](architecture/testing.md) for what's covered before adding tests,
and update it after.

## Static analysis

`pnpm fallow:dead-code` after removing or renaming exports, `pnpm fallow:dupes` for duplication,
`pnpm fallow:health` for hotspots, `pnpm fallow:security` for security candidates. Configuration
and deliberate exclusions are in `.fallowrc.json`.

`fallow:security` reports *candidates*, not vulnerabilities: verify each against the code before
changing anything. Once a candidate is verified as a false positive, suppress it on the line above
with a reason: `// fallow-ignore-next-line security-sink -- <why the input is safe>`.

Duplication kept on purpose gets the same treatment, above the first instance of the clone:
`// fallow-ignore-next-line code-duplication -- <why it stays duplicated>`. One comment silences
the whole clone group. Everything here runs in the browser and the site has no server code, so the
`ssrf` category can't apply yet; it starts to matter if an API route is added (e.g. the
`/api/reports` the 2026-09-06 ADR anticipates).
