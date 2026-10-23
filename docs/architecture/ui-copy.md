# UI copy, colors and icons

Three central modules keep text, colors and icons consistent between the map and the panels that
describe it. The short rule is in the root `CLAUDE.md`; this doc is the detail.

| Module | Holds | Read by |
|---|---|---|
| `lib/strings.ts` → `STRINGS` | Every short Italian UI string | Pages, components, nav tree, map controls, PDF export, report email |
| `lib/colors.ts` → `COLORS` | Every hex color, one name per color | Overlay paint expressions, legend chips, class configs |
| `lib/ICONS.ts` → `ICONS` | lucide-react icons by meaning (`ICONS.wildfires`, `ICONS.aed`, ...) | Nav, page headers, toggle chips |

An overlay's paint and its legend chip both read the same `COLORS` entry, so they can't drift
apart. The same goes for a nav item and its page header (`ICONS`, `STRINGS`).

## What goes in STRINGS, and what doesn't

**In:** labels, buttons, titles, aria-labels, tooltips, popup and detail-card field names, captions,
status and error messages the user sees, the report email's fixed text. Reuse an existing key when
the text is the same (the Home stats reuse `STRINGS.peaks` for "Cime principali").

**Stays inline, on purpose:**

- **Long explanatory prose:** `<Faq>` and `<InfoNote>` bodies, the catasto explainer. It's
  paragraph-length, often with `<b>`/entities, and lives best next to the UI it explains.
  Comune-specific facts in it read `MUNICIPALITY_NAME` from `lib/config.ts`.
- **Code-to-label lookup tables:** they stay next to the codes they map, colors included, so a
  class's label, color and range sit on one line. `lib/green-classes.ts` (NDVI/NBR/LST classes),
  `lib/landslide-classes.ts`, `lib/routing/summary.ts` (OSM surface/highway → label),
  `components/weather-card/wmo-codes.ts`, and the value maps in `lib/rescue-details.ts` (rii
  status, asset kind, OSM access).
- **Words inside formatted values:** `45 anni`, `Zona 2`, `foglio 5, particella 12`, units. They
  stay in the template that formats them.
- **Developer errors:** errors thrown and caught without reaching the UI (`graph.ts`,
  `weather.ts`) are English messages. The UI shows its own `STRINGS` status instead (e.g.
  `routePlannerStatusUnavailable`).

## Idioms

- **Sentences around a value:** a prefix/suffix pair, composed at the call site.
  Examples: `footerUpdatedPrefix`/`footerUpdatedSuffix`, `fireNbrDisabledPrefix`/`fireNbrDisabledSuffix`.
- **Singular/plural:** a `[singular, plural]` tuple (`footerTimeUnits`).
- **Grouping:** keys are grouped by module/section under a comment header; add new keys to the
  matching group.
- **Plain DOM controls:** the MapLibre `IControl` classes in `lib/map/base/` build plain DOM, so they
  take their labels from `STRINGS` and their icons from the framework-agnostic `lucide` package
  (`dom.ts`), not `ICONS`.
