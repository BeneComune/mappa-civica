// lib\routing\index.ts
// Port of the old app's lib/routing.ts: an in-browser Dijkstra router over
// the transport/trails GeoJSON networks, used by the "Pianifica percorso"
// planners in both Outdoor sections (biking network for Cyclability,
// roads+trails network for Trails).
//
// The public surface is deliberately small - load a graph, summarise a route
// over it, export the result. Everything else is an implementation detail of
// the sibling modules.
// Only the types consumers actually name are re-exported. RouteMode,
// RoutingInputPoint and SurfaceRun stay internal to ./types - they are
// reachable structurally through RouteSummary and buildRouteSummary, so
// re-export them here only once something outside needs to name them.
export type { RouteSummary, RoutingGraph, RoutingMode } from "./types"
export { loadRoutingGraphForMode } from "./graph"
export { buildRouteSummary } from "./summary"
export { exportRoute, type RouteExportFormat } from "./route-export"
export { computeDrivingRoute, type DrivingRoute } from "./driving"
