// lib\routing\driving.ts
// Car travel for the "Ospedale più vicino" route: the shared Dijkstra
// (path.ts) with a driving cost that excludes cycleways, steps and footpaths
// outright. Kept apart from RouteMode/buildRouteSummary: that type's
// `times: Record<RouteMode, ...>` and the planner UI built on it assume
// walking/biking/ebike on the SAME route geometry, which doesn't fit a
// car-only search.
import type { Coord, GraphEdge, RouteLine, RoutingGraph, RoutingInputPoint } from "./types"
import { appendSegmentCoordinates, findNearestNodeId, shortestPathByCost } from "./path"

const NOT_DRIVABLE = new Set(["cycleway", "steps", "footway", "path", "pedestrian"])

// Posted/assumed speed limits (see graph.ts's maxspeed field) discounted for
// junctions, villages and the curvy mountain roads around here - a car won't
// sustain the limit end to end. Falls back to a cautious default when a
// segment carries neither a maxspeed nor an assumed one.
function drivingSpeedKmh(edge: GraphEdge): number {
  const limit = edge.maxspeed ?? 40
  return Math.min(90, Math.max(10, limit * 0.7))
}

function drivingTravelTimeMinutes(edge: GraphEdge): number {
  const distanceKm = edge.length / 1000
  return (distanceKm / drivingSpeedKmh(edge)) * 60
}

function drivingEdgeCost(edge: GraphEdge): number | null {
  if (edge.highway && NOT_DRIVABLE.has(edge.highway)) return null
  return drivingTravelTimeMinutes(edge)
}

export type DrivingRoute = {
  distanceKm: number
  timeMin: number
  line: RouteLine
}

export function computeDrivingRoute(
  graph: RoutingGraph,
  from: RoutingInputPoint,
  to: RoutingInputPoint
): DrivingRoute | null {
  const startId = findNearestNodeId(graph, from)
  const endId = findNearestNodeId(graph, to)
  if (!startId || !endId) return null

  const path = shortestPathByCost(graph, startId, endId, drivingEdgeCost)
  if (!path) return null

  let distanceMeters = 0
  let timeMin = 0
  const coordinates: Coord[] = []

  for (let index = 0; index < path.edgePath.length; index += 1) {
    const edge = graph.edges[path.edgePath[index]]
    const fromNode = path.nodePath[index]
    distanceMeters += edge.length
    timeMin += drivingTravelTimeMinutes(edge)
    appendSegmentCoordinates(coordinates, edge.coords, edge.from !== fromNode)
  }

  return {
    distanceKm: distanceMeters / 1000,
    timeMin,
    line: { type: "Feature", geometry: { type: "LineString", coordinates }, properties: {} },
  }
}
