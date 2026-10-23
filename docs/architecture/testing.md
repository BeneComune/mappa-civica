# Test coverage

What's tested today, area by area, and what isn't. Approach: unit tests for pure logic and the
small stores; component tests only where a real mount is needed (none yet); E2E kept to a couple of
high-value flows (none yet, candidates in [`TODO.md`](../TODO.md)).

Vitest, colocated `*.test.ts` files next to the module, Node environment (browser APIs are stubbed
per test). `pnpm test` runs everything; CI runs it on every push and PR.

## At a glance

| Area | Unit | Notes |
|---|:---:|---|
| Routing: geo, cost model, heap, graph builders, pathfinding, route summary, driving (hospital) | 🟩 | `lib/routing/routing.test.ts` |
| Routing: export (GPX/KML/CSV/GeoJSON) | 🟥 | `route-export.ts` |
| Route planner formatting (distance, time, point colors) | 🟩 | `components/route-planner/format.test.ts` |
| Map interactions (`attachHoverPopup`, `attachFeatureSelect`, `attachHoverHighlight`) | 🟩 | `components/map-provider/interactions.test.ts`, against a stub map |
| Community stores (pending reports, votes), `readJSON`, mailto | 🟩 | `lib/community/community.test.ts` |
| Weather: fetch, 24h rainfall, cache TTL, WMO lookup | 🟩 | `components/weather-card/weather.test.ts` |
| Nav tree data (`menus.ts`) | 🟩 | `components/site-header/menus.test.ts` |
| Footer "updated N ago" (`timeSince`) | 🟩 | `lib/time-since.test.ts` |
| Class stats (`computeClassStats` in `lib/green-classes.ts`) | 🟥 | Pure, easy to add |
| Rescue detail resolvers (`lib/rescue-details.ts`) | 🟥 | Pure, easy to add |
| `syncOverlayVisibility` / `ROUTE_OVERLAYS` path matching | 🟥 | Pure apart from the map calls |
| Overlay `add*` functions, base map controls, PDF export | 🟥 | Need a MapLibre fake or a browser |
| DuckDB read (`lib/duckdb.ts`) | 🟥 | Needs DuckDB-Wasm |
| React components | – | No component tests |
| End-to-end flows | – | No E2E layer |

🟩 covered with several cases · 🟥 no coverage · – layer not set up

## Next tests worth adding

The three 🟥 pure modules (`computeClassStats`, the rescue detail resolvers, the overlay path
matching) are cheap unit tests that would catch real regressions: wrong legend percentages, a
dropped detail row, an overlay shown on the wrong route.
