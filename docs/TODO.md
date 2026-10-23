# Todos

Loose observations and open questions - not committed, ranked work. For that, see
[`BACKLOG.md`](BACKLOG.md).

## Where should per-comune copy live? (2026-10-23)

From the [comune reusability audit](audits/2026-10-23-comune-reusability.md). Some UI copy is
specific to Montereale or to Friuli-Venezia Giulia, so a reused deployment would show text that
doesn't apply to it. Each needs a decision: move it into `data/` (e.g. a per-comune copy file),
make it generic, or accept it and document it in `SETUP.md`.

1. `STRINGS.bikeInfraCiclabili` is `Ciclabili / MV 06`, and the bike-infra FAQ names `FVG3 / MV 06`
   - a local route name inside a generic label.
2. The rii FAQ (`app/rescue/events/page.tsx`) is entirely about Montereale's own census: stream
   names, survey years, flood dates.
3. The fire module copy (`STRINGS.wildfiresDescription`, the fire page InfoNotes and FAQ, the danger
   note in `lib/rescue-details.ts`) describes Regione FVG sources.
4. `pipeline/Makefile`'s `help` banner prints the comune name.

## Module landing pages (2026-10-23)

`/outdoor`, `/rescue` and `/green` still render `ModulePlaceholder` ("Porting in corso dal prototipo
Vite."). Nothing in the nav links to them; they're reachable only by URL. Port a real landing page,
or redirect to the module's first section?

## Paper affiliation (2026-10-23)

`paper/paper.md` still has `affiliation: "TODO: fill in institution or 'Independent researcher'"`.
To fill in before submitting to JOSS.

## README's weekly refresh list is missing landslide (2026-10-23)

The root `README.md` lists the weekly targets as `rescue fire catasto cyclepaths peaks hospital`;
`refresh-data.yml` also runs `landslide`.

## Stale comment in the fire overlay (2026-10-23)

`lib/map/overlays/fire.ts` says the `nbr` source will be "shared with the Green module's NBR tab
once that's ported". The NBR tab (`/green/nbr`) is ported and does share it.

## No E2E tests yet (2026-10-23)

Unit coverage is solid (see [`architecture/testing.md`](architecture/testing.md)); there's no E2E
layer. Candidates if one is added: the route planner (place two points, get a summary, export) and
Segnala (pick a point, fill the form, get a mailto).
