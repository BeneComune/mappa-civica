# Routes

Every route under `app/`, what its panel shows and which overlay it turns on. Overlays and the
panel building blocks are described in [`map.md`](map.md).

## Layout

`app/layout.tsx` renders the header, the persistent map (`MapShell`), the route's page inside
`PanelFrame`, and the footer. `PanelFrame` (`components/panel-frame.tsx`) decides where the page
content goes:

- **Desktop (`md` and up):** a floating card anchored bottom-left. Two routes skip the card: `/`
  (Home positions its own cards) and `/outdoor/cyclability/lts` (the iframe replaces the map).
- **Mobile (below `md`):** a bottom sheet (`MobilePanelSheet`) titled by `routeTitle(pathname)`.
  The LTS route skips it. See [`mobile.md`](mobile.md).

## Inventory

| Route | Panel | Overlay(s) shown |
|---|---|---|
| `/` | `HomePanel`: comune name, ISTAT stats, catasto toggle, frazioni, weather | `home` (boundary; catasto layers via its toggle) |
| `/community` | `CommunityPanel`: report list, filters, votes, `ReportDrawer` | none (markers are DOM `Marker`s from `CommunityMarkers`) |
| `/outdoor` | `ModulePlaceholder` | none |
| `/outdoor/cyclability/lts` | `LtsEmbed`: stressinbici.it iframe over the map | none |
| `/outdoor/cyclability/bike-infra` | 5 `OverlayToggleBadge`s | `bike-infra` |
| `/outdoor/cyclability/routing` | `RoutePlanner mode="biking"` | `route` |
| `/outdoor/trails/trails` | 5 `OverlayToggleBadge`s (hiking, MTB, water, springs, picnic) | `trails-water` |
| `/outdoor/trails/slope` | `FilterBadgeGroup` on `slope_class` | `slope` |
| `/outdoor/trails/peaks` | FAQ only | `peaks` |
| `/outdoor/trails/routing` | `RoutePlanner mode="walking"` | `route` |
| `/rescue` | `ModulePlaceholder` | none |
| `/rescue/events` | `RiiRecencyFilter`, `MapFeatureDetail` | `rii` |
| `/rescue/fire` | cause filter, danger/ignition/NBR toggles, NBR classes, `MapFeatureDetail` | `fire` |
| `/rescue/landslide` | `ClassesTogglePanel` (PAI classes) | `landslide` |
| `/rescue/assets` | 4 `OverlayToggleBadge`s, `MapFeatureDetail` | `assets` |
| `/rescue/hospital` | `NearestHospital` | `hospital`, `route` |
| `/green` | `ModulePlaceholder` | none |
| `/green/ndvi` | `ClassesTogglePanel` (NDVI) | `vegetation` |
| `/green/shade` | legend caption, hover popup | `natural-shade` |
| `/green/nbr` | `ClassesTogglePanel` (NBR) | `vegetation-health` |
| `/green/lst` | `ClassesTogglePanel` (LST) | `soil-temperature` |

The three module landing pages (`/outdoor`, `/rescue`, `/green`) are placeholders that no nav entry
links to - see [`TODO.md`](../TODO.md).

## Navigation

`components/site-header/menus.ts` holds the nav tree as data: `OUTDOOR_GROUPS` (two titled
groups), `RESCUE_MENU`, `GREEN_MENU`. The desktop `NavigationMenu`, the mobile drawer
(`mobile-nav.tsx`) and `routeTitle()` (the mobile sheet's title) all read from it, so adding a page
to the nav is one entry here. `menus.test.ts` checks the tree: no duplicate hrefs, every item under
its menu's base path, only the LTS link marked external.

## Adding a page

1. `app/<module>/<section>/page.tsx`: `PageHeader`, the panel, an optional `Faq`.
2. An entry in `components/site-header/menus.ts`.
3. Strings in `lib/strings.ts`, an icon in `lib/ICONS.ts`, colors in `lib/colors.ts`.
4. If it shows map data: an overlay plus a `ROUTE_OVERLAYS` row ([`map.md`](map.md)).
5. A row in the table above.

A page can stay a Server Component unless it passes functions or component references (icons,
popup renderers, detail resolvers) to a client component, or holds state. Most pages here need
`"use client"` for that reason.
