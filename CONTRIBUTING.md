# Contributing to Mappa Civica

Thanks for considering a contribution. This project is small and maintained
by two people, so the process is deliberately lightweight.

## Reporting a bug or proposing a feature

Open an issue on GitHub. For a bug, include the route/page where it happens,
what you expected, and what happened instead. A screenshot helps a lot for
anything map-related. For a feature, a short description of the use case is
usually enough to start a conversation before any code gets written.

## Setting up the frontend

You need Node 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

The app runs standalone against the data already committed in `public/data/`,
so you don't need to run the Python pipeline to work on the frontend.

Before opening a pull request:

```bash
pnpm lint         # eslint, zero warnings
pnpm test         # vitest
npx tsc --noEmit  # type check
pnpm check:paths  # every .ts/.tsx file starts with a path comment
```

All four have to pass. `pnpm lint` and the type check are treated as hard
gates, including on pre-existing issues your change happens to touch.

## Setting up the data pipeline

The pipeline that produces the GeoJSON in `public/data/` lives in
[`pipeline/`](pipeline/) and is written in Python (3.11+). See
[`pipeline/README.md`](pipeline/README.md) for the full list of targets and
what each one needs. Most targets only hit public APIs and can run with no
local setup beyond `pip install -r requirements.txt`; a few (satellite
NDVI/NBR/LST, DEM-based slope) need raw data you download yourself, documented
in [`SETUP.md`](SETUP.md).

## Code conventions

The short version: no semicolons, `eqeqeq`, 100-character lines, and every
`.ts`/`.tsx` file under `app/`, `components/`, `lib/`, `scripts/` starts with
a comment matching its own path (checked by `pnpm check:paths`). `eslint`
enforces the rest, so if it passes locally it'll pass in CI.

## Adding a new data layer or module

Look at an existing module before adding a new one. Overlays follow a shared
shape in `lib/map/overlays/`, registered once in `lib/map/index.ts`; strings,
colors and icons are centralized in `lib/strings.ts`, `lib/colors.ts` and
`lib/ICONS.ts` rather than hardcoded per component. Matching the existing
pattern is almost always the right call, and keeps a new layer from
disagreeing with the rest of the app on styling or copy.

## Deploying this for another comune

If you're adapting the platform for a different municipality rather than
changing its code, you don't need this file. See [`SETUP.md`](SETUP.md)
instead.

## License

By contributing, you agree your changes are released under the project's
[MIT license](LICENSE).
