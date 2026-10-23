# Route planning

An in-browser Dijkstra router over GeoJSON networks, with no routing server. It's used by the two
"Pianifica percorso" pages (biking, walking) and by "Ospedale più vicino" (driving).

## Modules (`lib/routing/`)

| File | Role |
|---|---|
| `index.ts` | Public surface: `loadRoutingGraphForMode`, `loadDrivingGraph`, `buildRouteSummary`, `computeDrivingRoute`, `exportRoute` |
| `graph.ts` | Fetch a network and build the graph (`appendEdge` / `finalizeGraph` shared by both builders) |
| `cost.ts` | Direction-dependent edge travel time per mode - what Dijkstra minimises |
| `min-heap.ts` | Priority queue |
| `path.ts` | Nearest-node snapping; `shortestPathByCost` (the one Dijkstra, cost passed in, `null` = edge unusable) and `shortestPath` (planner cost for a mode) |
| `summary.ts` | Leg-by-leg route → `RouteSummary` (distance, times, elevation, surfaces, profile) |
| `driving.ts` | Car-only route for the hospital page: driving cost over `shortestPathByCost`, own result type |
| `route-export.ts` | GeoJSON / GPX / KML / CSV download |
| `geo.ts`, `types.ts` | Haversine distance, coordinate keys, shared types |

## Networks

| Mode | Data | Graph |
|---|---|---|
| biking | `transport.geojson` | One edge per feature, nodes keyed by the `u`/`v` properties |
| walking | `transport.geojson` + `outdoor/trails_routing.geojson` | Every linestring split into per-segment edges, nodes keyed by coordinate rounded to 6 decimals, so roads and trails join where they touch |
| driving | `rescue/hospital_roads.geojson` | Transport-shaped, built like biking. It extends past the comune boundary to reach the hospital, which `transport.geojson` (clipped to the comune) can't |

`transport.geojson` stays GeoJSON, not vector tiles. The router needs the whole graph in memory,
not per-viewport tiles (2026-09-06 ADR in `PROGRESS.md`).

## Cost model (`cost.ts`)

Grade is signed by travel direction, so uphill and downhill cost differently.

- **Walking:** Tobler-style, `6 · e^(−3.5·|grade + 0.05|)` km/h, clamped to 1-6.
- **Bike / e-bike:** flat speed 16 / 19 km/h, uphill decay `e^(−k·grade)` with k = 5.0 / 1.6,
  downhill bonus up to +50%, and +25% time per traffic-stress (LTS) level above 1. Clamped to
  3-28 / 3-25 km/h.
- **Driving (`driving.ts`):** speed limit (or assumed limit, default 40) × 0.7, clamped to 10-90
  km/h. Cycleways, steps, footways, paths and pedestrian ways are excluded.

## Route summary (`summary.ts`)

`buildRouteSummary(graph, points, mode)` snaps each point to its nearest node and runs
`shortestPath` between consecutive points, minimising the page's mode. Along that one geometry it
accumulates:

- distance, plus walking / biking / e-bike times (all three on the same path);
- elevation gain and loss, and a profile of cumulative height change. It's relative to the start,
  not absolute altitude, because the data only carries per-edge grade;
- distance per surface, labelled from OSM `surface`, falling back to `highway` (the label tables
  are in `summary.ts`; colors in `route-summary-panel.tsx`).

It returns `null` when any leg can't be connected.

## UI

- `components/route-planner/index.tsx` (`RoutePlanner`) owns the point list and the computed
  summary. Its hooks: `useRoutingGraph` (load once per mount), `useMapPointInput` (click to add
  while armed), `useRouteMapLayers` (route line into the `route` source, draggable markers that
  report moves back).
- `RouteSummaryPanel` shows totals, per-mode times, surface breakdown, `ElevationProfile` and the
  export buttons.
- `NearestHospital` (`components/nearest-hospital.tsx`) is deliberately separate: one fixed,
  non-draggable destination, driving only. It draws into the same `route` source and links out to
  Google Maps for turn-by-turn directions.

## Tests

`lib/routing/routing.test.ts` covers geo helpers, the cost model, the heap, both graph builders,
snapping and pathfinding, `buildRouteSummary`, and `computeDrivingRoute` (speed-limit cost, the
40 km/h fallback, non-drivable ways skipped even when shorter). `components/route-planner/format.test.ts`
covers distance/time formatting and point colors. Not covered: `route-export.ts`.
