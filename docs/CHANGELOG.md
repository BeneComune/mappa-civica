# Changelog

One entry per commit, newest first, grouped by date. This is the raw commit-by-commit trail;
[`PROGRESS.md`](PROGRESS.md) is the distilled history and ADRs - fold outcomes that matter there,
keep the play-by-play here.

From 2026-10-23 on, each commit adds its own entry (subject, then what/why bullets) in the same
commit. Everything before that was backfilled from `git log` as subject lines only - run
`git show <hash>` for the full message.

## 2026-10-23

### Draw the route line through setRouteLine

- The route planner (`use-route-map-layers.ts`) and the hospital route (`nearest-hospital.tsx`)
  each wrote the shared `route` source by hand. `setRouteLine(map, line | null)` in
  `lib/map/overlays/route.ts`, next to the source it fills, now does it for both.
- The two identical line shapes (`RouteSummary.line`, `DrivingRoute.line`) are one `RouteLine`
  type in `lib/routing/types.ts`; with it `setData` type-checks, so both `as never` casts are gone.
- After the four dupes fixes: default `fallow dupes` 1 group (the intentional `graph.ts` prologue),
  `--mode weak` 9 → 3 groups (the rest are overlay calls with different literals).

### Add overlay sources and layers through addSourceOnce / addLayerOnce

- 60 `if (!map.getSource(X)) map.addSource(X, ...)` / `if (!map.getLayer(X)) map.addLayer({ id: X,
  ... })` blocks across 12 overlay files become `addSourceOnce(map, X, ...)` /
  `addLayerOnce(map, { id: X, ... })` (`lib/map/overlays/shared.ts`). The layer id is now written
  once, so the existence check can't drift from the id being added (a drift would re-add the layer
  on the next basemap switch and MapLibre would throw).
- Converted with a one-off codemod that checked every block's id against its layer object first:
  no mismatches existed. New unit test for the two helpers.
- Smoke-tested on a production build: `/rescue/fire` and `/outdoor/trails/trails` render their
  layers, and switching basemap (which re-adds every overlay) raises no console errors.

### Extract MapPickHint for the mobile "tap the map" banner

- Segnala and the route planner each carried the same 18-line portaled banner (identical markup
  and Tailwind classes). `components/map-pick-hint.tsx` now renders it from `hint`, `actionLabel`
  and `onAction`; both callers pass their own strings. Markup unchanged.

### Build route lines with one appendSegmentCoordinates

- `summary.ts` called `appendSegmentCoordinates` only to reverse an edge, then re-implemented its
  joint-skipping merge inline (a `fallow dupes --mode semantic` find). The helper now appends in
  place, so `buildRouteSummary` and `computeDrivingRoute` both just call it; it no longer copies
  the whole line on every edge.
- Same output as before for both callers; new unit test for the helper.

### Share one Dijkstra between the route planners and the driving route

- `driving.ts` had its own copy of `path.ts`'s Dijkstra, differing only in the edge cost and in
  skipping non-drivable ways (3 of the 4 `fallow dupes` clone groups). `path.ts` now has
  `shortestPathByCost(graph, start, end, edgeCost)`, where `edgeCost` returning `null` means the
  edge can't be used. `shortestPath` (planners) and `computeDrivingRoute` both go through it.
- `computeDrivingRoute` had no tests. Four cases were added first and passed against the old code:
  speed-limit cost, the 40 km/h fallback, a shorter cycleway avoided in favour of a road detour,
  `null` when only non-drivable ways connect the points.
- Duplication goes from 0.94% to 0.27%. The remaining clone (the two graph builders' shared loop
  prologue in `graph.ts`, 13 lines) is left on purpose: the bodies differ, and extracting it would
  add indirection without removing real logic.

### Suppress the six verified fallow:security false positives

- Each sink gets `// fallow-ignore-next-line security-sink -- <reason>` stating why its input is
  safe: jsPDF `blob:` URL, `mailto:` to the configured address, fixed Nominatim/Open-Meteo
  origins, literal `/data/` paths. `pnpm fallow:security` now reports 0 items, with no stale
  suppressions.
- `docs/AGENTS.md` documents the suppression format for future reviewed false positives.

### Add a fallow:security script

- `pnpm fallow:security` runs `fallow security`. First run: 6 candidates (4 `ssrf`, 2
  `open-redirect`), all verified false positives. Every fetch/navigation target is a fixed origin,
  a literal `/data/...` path, a jsPDF `blob:` URL or a `mailto:` to the configured address, and
  there's no server code for SSRF to apply to. A pass that adds `hardcoded-secret` finds nothing.
- `CLAUDE.md` and `docs/AGENTS.md` list the script and note that its findings need verifying.

### Require Node 24 LTS (22.12+) in README and CONTRIBUTING

- Both said Node 20+, but vitest 5's declared engine range is `^22.12 || ^24 || >=26`, so Node 20
  is outside what the test runner supports. CI already uses 24, and Vercel deprecated Node 20 on
  2026-10-01.
- The `paper/paper.md` affiliation TODO is left for the authors (tracked in `TODO.md`).

### Add the docs/ structure: index, agent guide, changelog, backlog, architecture, audits

- `docs/` follows the standard layout used across projects: `README.md` (index), `AGENTS.md`
  (process for AI agents), this changelog (backfilled from `git log`), `BACKLOG.md`, `TODO.md`,
  `architecture/` (one doc per concern) and `audits/`.
- First audit: `audits/2026-10-23-comune-reusability.md`, the comune-specific values still
  hardcoded after the two commits below. Its open items seed `BACKLOG.md` and `TODO.md`.

### Move inline UI labels and messages into lib/strings.ts

- Labels, buttons, titles, aria-labels, popup field names and user-facing messages hardcoded
  across ~35 files now live in `STRINGS`.
- The rii and assets FAQ paragraphs read the comune name from `MUNICIPALITY_NAME`.
- Kept inline on purpose (rule written into `CLAUDE.md`): long FAQ/InfoNote prose, code-to-label
  lookup tables, words inside formatted values.
- Errors thrown and caught without reaching the UI (routing graph load, weather fetch) are now
  English developer messages.

### Read the Segnala recipient email from comune.config.json

- `lib/community/mailto.ts` hardcoded the Montereale address, so a reused deployment would have
  emailed its reports to Montereale. It now reads `MUNICIPALITY_EMAIL` from `lib/config.ts`.

## 2026-10-05

- chore: auto-refresh GIS data (`57078dc`)

## 2026-10-01

- chore: auto-refresh GIS data (`6919ac6`)

## 2026-09-24

- Extract StatCard for the route summary totals and travel times (`4974fd5`)
- Show last commit hash and time since update in the footer (`1e1e6a9`)
- Lay out route planner download buttons in a 4-column grid (`abf3b20`)
- CI: generate Next route types before type-check (`5784baf`)
- Add CI workflow running lint, type-check, path check and tests (`278b06a`)
- Add dividers between route planner summary sections (`730d1ff`)
- Add icons and labels to route planner distance/ascent/descent totals (`53a6ec1`)
- Lay out route planner travel times in an equal 3-column grid (`aaa8fe7`)
- Color route planner surface breakdown bar and legend by road type (`300e697`)
- Reorder route planner buttons and make them fill the row (`cec094a`)
- Use ArrowLeftRight for route planner swap icon (`94deaa9`)
- Add icons to route planner swap/undo/clear buttons (`766f474`)

## 2026-09-14

- Add JOSS submission paper (paper/paper.md, paper/paper.bib) (`f58bceb`)
- Add CONTRIBUTING.md (`0092280`)
- chore: auto-refresh GIS data (`19fa62f`)
- fix to skip corridords.geojson (`7e603bf`)
- Shorten download-request label to fit M2M's 50-char limit (`0187be8`)
- Use the secondary download's own entityId, not the parent scene's (`8823e6f`)
- Fix M2M download-request: missing label meant nothing got queued (`3a138da`)
- Widen ST_B10 match to all option fields, dump full objects on failure (`cadf27f`)
- Fix Landsat ST_B10 download option lookup to search bundle secondaryDownloads (`642d619`)
- give rischio frane its own icon (`b2fcc5c`)
- Add landslide hazard (PAI) module, document national DTM as a DEM fallback (`0d1266d`)
- Redesign shade-corridor colors: coverage drives hue, type drives width (`f0e1aa6`)
- Drop stale hardcoded dates from NBR/LST pages' static captions (`9d81cf6`)
- chore: auto-refresh GIS data (`005975e`)
- Add green-refresh-sentinel2 target to test/use NDVI+NBR before USGS is ready (`117fc99`)
- Automate monthly Sentinel-2/Landsat refresh, show satellite scene date in Green module (`945df8e`)
- chore: auto-refresh GIS data (`2c58222`)
- fix ux anomalies in both desktop and mobile views (`a02406a`)

## 2026-09-08

- Collapse the mobile home sheet when a frazione is tapped (`1a43542`)
- Fix clipped map search panel; open mobile nav from the right (`6f6a77b`)

## 2026-09-07

- Mobile sweep: module-landing sheet titles, mobile ADR, drop Goal 0 baselines (`0e71c7d`)
- Remove accidentally-committed planning doc; ignore piano-*.md (`e9cdfa5`)
- fix routing and lts (`60202ea`)
- wo-step Segnala flow below md (`177280c`)
- collapse the weather card to a line below md (`936f574`)
- trim and collapse the map controls below md (`c046168`)
- Put the route panel in a bottom sheet below md (`b6c988c`)
- chore: auto-refresh GIS data (`8eaf58b`)
- Add a hamburger nav for < md. Below md the NavigationMenu i hidden and an hamburger opens a left drawer with the full nav tree from menu.ts (`4ba935b`)
- drop the 118% zoom below md (`ae0b5bb`)
- add a viewpoint export and capture the desktop baseline (`62f13e7`)
- Footer source link: Github icon only (`0afcb30`)

## 2026-09-06

- Add a Home-view screenshot to the README (`415f31a`)
- Add a credits footer, MIT LICENSE and README badges (`eda5a92`)
- Add  ADRs for the data-pipeline port and the Segnala write path.  Records why the pipeline is its own directory, why the cadastre moved to PMTiles etc. (`0a6d6e5`)
- translated docs (`3f28c8d`)
- flesh out the README with sections from the old repo. Add Architecture, Project Structure, Data sources table, Deployment and data refresh, and a Data section pointing to pipeline/README.md and public/data/rescue/README.md Correct the Stack line: PMTiles is cadastre-only, not everywhere (`a9b4409`)
- rewrite SETUP.md for the new repo layout (`f7f9f12`)
- Port the satellite/DEM Green scripts (not CI-safe) process_green_layers / nbr / lst / shade_corridors, path transform only: raw scenes from data/raw/ (.SAFE, *_lwir11.TIF), output to public/data/. shade_corridors reads trails from pipeline/data/outdoor/trails.geojson. (`39ad6df`)
- Port the curated rescue-asset lists into data/rescue/ (`3b463c4`)
- wire map interactions without the onStyleReady gate (`4be6212`)
- Move rescue feature popups into a panel card (`5dd976c`)
- Give Segnala a real write path: curated CSV to DuckDB (`f1895f0`)
- Serve catasto as PMTiles vector tiles catasto.geojson becaomes catasto.pmtiles (only 209 KB), built by tippecanoe. (`c9c4823`)
- edited refresh-data.yml  to node 24 (`dd19493`)
- Add the refresh-data workflow to do weekly and monthly data ubtate about rescue, fire, catasto, cyclepaths, peaks, hospital. Vercel auto-deploys (`5e5e124`)
- Route to the hospital past the comune boundary The nearest hospital is outside the comune and transport.geojson is clipped to it, so the route stopped at the border. build_hospital_geojson.py now also emits hospital_roads.geojson, a driving graph covering comune + hospital; nearest-hospital.tsx routes over that instead. (`36c38e8`)
- Add build_peaks_geojson.py and show every summit Was a hand-picked 5; now every OSM natural=peak inside the boundary (10), sorted by elevation, pole heights rescaled over the real min/max. data/peaks_curated.json stays as a supplement for peaks OSM lacks. Wording dropped from 'cinque vette' to 'le vette'. (`492a7ea`)
- Port the CI-safe data pipeline scripts from the old repo pipeline/ now holds the Python scripts that regenerate the static GIS assets in public/data/. (`a63cd23`)
- Move municipality config into a single shared JSON (`783c2f6`)

## 2026-09-05

- Add project-specific guidance to CLAUDE.md (`4131cdd`)
- Replace create-next-app boilerplate README with a project overview (`2ba5835`)
- Add the Info icon to the Faq summary (`b3726c0`)
- Disable the NBR chips until the NBR overlay is switched on (`84bab70`)
- Turn always-visible overlay captions into collapsible InfoNotes (`89e19ba`)
- Reuse ClassesTogglePanel for the NBR legend on the Rescue fire page (`bc7de2f`)
- Add class toggles to Salute vegetazione and Temperatura suolo (`6de7c34`)
- Fix overlay visibility/filter gating to not require full style load (`a094ad2`)
- Add "Ospedale più vicino" to the Rescue module (`39faeb4`)
- Add a driving-only router over the road graph (`ced47da`)
- Add a "Cime principali" overlay for the five main peaks (`3780ce5`)
- Ignore .vercel/ (added by vercel link) (`d4dd04e`)
- Turn the catasto toggle into a badge and clean up the parcel result card (`70e1022`)
- Remove obsolete fallow dupes markers check script (`9b24c75`)
- Cover the weather, nav-data and route-formatting splits (`6f28110`)
- Extend test cover to the map-provider and community splits (`6d5a2d3`)
- Add a vitest suite covering lib/routing (`3f9679c`)
- Split weather-card.tsx into a components/weather-card/ directory (`d0f5a16`)
- Split lib/community.ts into a lib/community/ module directory (`7c1d36e`)
- Split report-drawer.tsx into a components/report-drawer/ directory (`82bfc9c`)
- Split map-provider.tsx into a components/map-provider/ directory (`ccab42e`)
- Split route-planner.tsx into a components/route-planner/ directory (`857d995`)
- Split lib/map/base.ts into a lib/map/base/ module directory (`cf65e6d`)
- Split site-header.tsx into a components/site-header/ directory (`6647e7b`)
- Split lib/routing.ts into a lib/routing/ module directory (`2586710`)
- Extract appendEdge and finalizeGraph from the two routing graph builders (`4710bb5`)
- Drop two inert coord self-assignments in buildTransportRoutingGraph (`e089000`)
- Extract the shared filter toggle into a useToggleSet hook (`792cc16`)
- Stop the fallow markers check flagging its own header comment as a broken marker (`f8e2c2d`)
- Modernize Tailwind arbitrary values (not-first: variant, bare numeric widths) (`eb496bf`)
- Silence editor 'Unknown at rule' warnings for Tailwind v4 at-rules (@theme, @custom-variant, @apply) (`3561796`)
- Strip dead 'color' property from greenery.geojson (NDVI paints from NDVI_CLASS_CONFIG, not the data) (`2f9da3e`)
- Drop 4 unused deps carried over from the Vite prototype; ignore 3 fallow false positives (`056c656`)
- Dedupe: extract addChoroplethOverlay for vegetation, vegetation-health and soil-temperature (`2051368`)
- Fix bike route line never showing (two ROUTE_OVERLAYS entries fighting over the same shared layer) (`67f4452`)
- Fix Categoria select showing raw value and no icon (Base UI Select.Value needs a render function) (`3effdea`)
- Centralize every hex color into lib/colors.ts (same pattern as ICONS/STRINGS) (`ed3dad8`)

## 2026-09-04

- Adopt app/ project's eslint stylistic settings (max-len 100, no-semi, eqeqeq, object-curly-newline) (`da10c76`)
- Dedupe: extract ClassLegendList and createControlButton, drop unused type aliases (`9135f13`)
- Add .fallowrc.json ignoring vendored maplibre chunk and shadcn ui primitives (`1e03672`)
- Drop unused public exports flagged by fallow (MUNICIPALITY_EMAIL, GPX/KML/CSV/GeoJSON builders, assets barrel re-exports) (`8a8bcdd`)
- Add path-header comments to every source file (check:paths convention) (`a263d7b`)
- Add fallow tooling scripts and check-file-paths, ported from MagicTheGathering/app (`13aa59b`)
- Extract PageHeader component, use it across all route pages (`384929e`)
- Convert fire danger/ignition/NBR toggles to icon badges, remove now-unused OverlayCheckbox (`3040c0c`)
- Convert Pendenza filter to color-swatch badges, remove now-unused FilterCheckboxGroup (`2ab9212`)
- Widen the municipality stats card for less text wrapping (`2595d36`)
- Split long-text stat rows to their own line instead of a cramped table cell (`89113b1`)
- Render Territorio/Popolazione/Rischio/Servizi stats as tables (`1727c13`)
- Add a MapPlus brand icon next to the app name in the header (`2d0b979`)
- Flag Stress da traffico in the nav menu as an external map (`921e46c`)
- Fix popup arrow rendering as a square instead of a triangle (`2d7ad1d`)
- Dark-mode MapLibre hover/click popups (fixes white-on-white text) (`285f9f9`)
- Show the section's nav icon next to each page's card title (`d672745`)
- Convert Rii a rischio recency filter to icon badges (`73390d8`)
- Add global cursor-pointer rule for buttons (badges/chips included) (`1532af5`)
- Convert wildfire cause filter to icon badges (`ccdd4e1`)
- Convert bike-infra, trails/water, rescue assets and NDVI category toggles to icon badges (`49cd322`)
- Make Segnala category chips multi-select, consistent with other filters (`dee0cc8`)
- Restore cadastral office code in the Particelle catastali detail text (`1cc64dd`)
- Restore field limits, camera-capture hint and inline confirmation in the report drawer (`e4d16f7`)
- Restore pending badge, photo preview and catasto line in the Community report list (`918ca6c`)
- Port the old app's methodology Faq blurbs and NBR/LST color legends across Outdoor, Rescue and Green pages (`127e23f`)
- Wire category filter controls for bike-infra, trails/water and slope pages (`111993b`)
- Port the route planner (Dijkstra routing engine + on-map UI for Cyclability/Trails) (`46f6e3c`)
- Port duckdb-backed official Community reports (loadCommunityReports) (`a12796b`)
- Add hover feature-state highlighting for rii and fire-perimeters layers (`b6fb0a9`)
- Use a lucide ChevronRight icon for stat-section disclosure triangles (`6c3b705`)
- Nudge weather card's right offset to right-10 (`5068a2f`)
- Dark-mode the MapLibre compact attribution toggle button (`21bf40d`)
- Align weather card's right margin with the map's control column (`1da7157`)
- Port photo upload and cadastral parcel autofill on the Segnala form (`c394e10`)
- Fix attribution stacking order; reorganize Home cards per feedback (`dcb3574`)
- Restructure Home into independent floating cards; port LTS embed (`9738d05`)
- Port Community map markers, filter chips, and upvoting (`602d6eb`)
- Port Rescue click popups (rii, fire, assets) and rii recency filter (`bec5859`)
- Port Green NDVI per-class checkboxes/stats and hover popups on all 4 tabs (`7f76faa`)
- Add explicit Home nav link (`bb8881b`)
- Port Home module: weather, municipality stats, frazioni, cadastral identify (`bf2b566`)
- Port Faq component and catasto.ts (`28bb79a`)
- Personalize MapLibre controls with lucide icons and theme colors (`bb8ef6f`)
- Default to 3D terrain view (`a6be664`)
- Reproduce Segnala (community reporting) using shadcn's Drawer (`12478c1`)
- Wire Rescue fire legend panel: cause filter + danger/ignition/NBR toggles (`3a1a5dc`)
- Default to dark basemap style (`4f9ac42`)
- Wire first interactive legend panel: Rescue assets checkboxes (`b2b54c3`)
- Port all four Green module overlays; move overlay registry into lib/map (`8a8f62d`)
- Port slope (Pendenza) overlay (`4689843`)
- Port bike infra (Infrastrutture ciclabili) overlay (`2fa0d17`)
- Split lib/map.ts into domain files under lib/map/ (`70fa56f`)
- Port trails/water (Sentieri e punti acqua) overlay - first Outdoor overlay (`93f9f3f`)
- Port assets (Presidi di soccorso) overlay - completes Rescue module (`2f840bc`)
- Port fire (Incendi boschivi) overlay, generalize overlay wiring (`a7f4445`)
- Port rii (Rii a rischio) overlay onto the persistent map (`ebe9d0a`)
- Add persistent MapLibre map shell shared across all module routes (`9272417`)
- Build out primary navigation menu with Outdoor/Rescue/Green submenus (`3b4c535`)
- Add ADR for map/data dependency migration decision (`02d619f`)
- Set up shadcn/ui and integrate map/data dependencies (`ad550e4`)
- Initial commit from Create Next App (`1a14fc7`)
