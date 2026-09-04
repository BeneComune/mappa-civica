// lib\routing\summary.ts
// Walk the shortest path between each consecutive pair of input points and
// accumulate everything the planner shows: distance, per-mode times, the
// elevation profile, the surface breakdown, and the drawable geometry.

import type {
  Coord,
  GraphEdge,
  NodeId,
  RouteMode,
  RouteSummary,
  RoutingGraph,
  RoutingInputPoint,
  RoutingMode,
  SurfaceRun,
} from "./types"
import { distanceMeters, segmentLength } from "./geo"
import { edgeTravelTimeMinutes } from "./cost"
import { appendSegmentCoordinates, findNearestNodeId, shortestPath } from "./path"

const SURFACE_LABELS: Record<string, string> = {
  asphalt: "Asfalto",
  paved: "Asfalto",
  concrete: "Asfalto",
  paving_stones: "Pavimentazione",
  sett: "Pavé",
  cobblestone: "Pavé",
  unpaved: "Sterrato",
  compacted: "Sterrato",
  fine_gravel: "Sterrato",
  gravel: "Ghiaia",
  ground: "Sterrato",
  dirt: "Sterrato",
  earth: "Sterrato",
  grass: "Prato",
  sand: "Sabbia",
}

const HIGHWAY_LABELS: Record<string, string> = {
  cycleway: "Pista ciclabile",
  path: "Sentiero",
  track: "Strada bianca",
  footway: "Percorso pedonale",
  pedestrian: "Area pedonale",
  steps: "Scalini",
  residential: "Strada urbana",
  living_street: "Strada urbana",
  service: "Strada di servizio",
  unclassified: "Strada minore",
  tertiary: "Strada extraurbana",
  secondary: "Strada extraurbana",
  primary: "Strada principale",
  trunk: "Strada principale",
}

function surfaceRunLabel(edge: GraphEdge): string {
  if (edge.surface && SURFACE_LABELS[edge.surface]) return SURFACE_LABELS[edge.surface]
  if (edge.highway && HIGHWAY_LABELS[edge.highway]) return HIGHWAY_LABELS[edge.highway]
  if (edge.surface) return edge.surface.charAt(0).toUpperCase() + edge.surface.slice(1).replace(/_/g, " ")
  if (edge.highway) return edge.highway.charAt(0).toUpperCase() + edge.highway.slice(1).replace(/_/g, " ")
  return "Non classificato"
}

export function buildRouteSummary(
  graph: RoutingGraph,
  points: RoutingInputPoint[],
  mode: RoutingMode
): RouteSummary | null {
  if (points.length < 2) {
    return null
  }

  const snappedNodeIds = points
    .map((point) => findNearestNodeId(graph, point))
    .filter((value): value is NodeId => value !== null)

  if (snappedNodeIds.length < 2) {
    return null
  }

  let totalDistanceMeters = 0
  let totalTimeMin = 0
  let totalElevationGainM = 0
  let totalElevationLossM = 0
  const routeCoordinates: Coord[] = []
  const profile: Array<{ distanceKm: number; elevationM: number; grade: number }> = []
  let profileDistanceMeters = 0
  let profileElevationM = 0
  const timesMin: Record<RouteMode, number> = { walking: 0, biking: 0, ebike: 0 }
  const surfaceMeters = new Map<string, number>()

  const appendProfilePoint = (distMeters: number, elevationMeters: number, grade: number): void => {
    const last = profile[profile.length - 1]
    if (!last || last.distanceKm !== distMeters / 1000 || last.elevationM !== elevationMeters) {
      profile.push({ distanceKm: distMeters / 1000, elevationM: elevationMeters, grade })
    }
  }

  for (let index = 0; index < snappedNodeIds.length - 1; index += 1) {
    const startId = snappedNodeIds[index]
    const endId = snappedNodeIds[index + 1]
    const path = shortestPath(graph, startId, endId, mode)
    if (!path) {
      return null
    }

    for (let pathIndex = 0; pathIndex < path.edgePath.length; pathIndex += 1) {
      const edgeIndex = path.edgePath[pathIndex]
      const edge = graph.edges[edgeIndex]
      const fromNode = path.nodePath[pathIndex]
      const toNode = path.nodePath[pathIndex + 1]
      const traversedGrade = edge.from === fromNode ? edge.grade : -edge.grade
      const edgeElevationDeltaM = (traversedGrade / 100) * edge.length
      const edgeGeometry = edge.from === fromNode ? edge.coords : [...edge.coords].reverse()
      const edgeGeometryLength = segmentLength(edgeGeometry)

      totalDistanceMeters += edge.length
      totalTimeMin += edgeTravelTimeMinutes(edge, mode, fromNode)
      timesMin.walking += edgeTravelTimeMinutes(edge, "walking", fromNode)
      timesMin.biking += edgeTravelTimeMinutes(edge, "biking", fromNode)
      timesMin.ebike += edgeTravelTimeMinutes(edge, "ebike", fromNode)

      const runLabel = surfaceRunLabel(edge)
      surfaceMeters.set(runLabel, (surfaceMeters.get(runLabel) ?? 0) + edge.length)

      if (profile.length === 0) {
        appendProfilePoint(profileDistanceMeters, profileElevationM, traversedGrade)
      }

      let edgeAccumulatedGeometryMeters = 0
      for (let coordinateIndex = 1; coordinateIndex < edgeGeometry.length; coordinateIndex += 1) {
        const segmentMeters = distanceMeters(
          edgeGeometry[coordinateIndex - 1],
          edgeGeometry[coordinateIndex]
        )
        if (segmentMeters <= 0 || edgeGeometryLength <= 0) {
          continue
        }

        edgeAccumulatedGeometryMeters += segmentMeters
        const progress = Math.min(1, edgeAccumulatedGeometryMeters / edgeGeometryLength)
        const distanceOnRouteMeters = profileDistanceMeters + edge.length * progress
        const elevationOnRouteM = profileElevationM + edgeElevationDeltaM * progress
        appendProfilePoint(distanceOnRouteMeters, elevationOnRouteM, traversedGrade)
      }

      profileDistanceMeters += edge.length
      profileElevationM += edgeElevationDeltaM
      if (edgeElevationDeltaM > 0) {
        totalElevationGainM += edgeElevationDeltaM
      } else {
        totalElevationLossM += Math.abs(edgeElevationDeltaM)
      }

      const reverse = edge.from !== fromNode || edge.to !== toNode ? edge.to === fromNode : false
      const segment = appendSegmentCoordinates([], edge.coords, reverse)
      if (routeCoordinates.length === 0) {
        routeCoordinates.push(...segment)
      } else {
        for (const coordinate of segment) {
          const last = routeCoordinates[routeCoordinates.length - 1]
          if (!last || last[0] !== coordinate[0] || last[1] !== coordinate[1]) {
            routeCoordinates.push(coordinate)
          }
        }
      }
    }
  }

  const distanceKm = totalDistanceMeters / 1000
  const timeMin = totalTimeMin

  const line = {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: routeCoordinates,
    },
    properties: {},
  }

  const pointFeatures = points.map((point, index) => {
    const snappedId = snappedNodeIds[index] ?? snappedNodeIds[snappedNodeIds.length - 1]
    const node = snappedId !== undefined ? graph.nodes.get(snappedId) : undefined
    const coordinate = node?.coord ?? [point.lng, point.lat]
    const kind: "start" | "waypoint" | "end" = index === 0 ? "start" : index === points.length - 1 ? "end" : "waypoint"
    const label = kind === "start" ? "A" : kind === "end" ? "B" : String(index)

    return {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: coordinate },
      properties: { kind, label, index },
    }
  })

  const surfaceBreakdown: SurfaceRun[] = Array.from(surfaceMeters.entries())
    .map(([label, meters]) => ({ label, km: meters / 1000 }))
    .sort((a, b) => b.km - a.km)

  return {
    distanceKm,
    timeMin,
    times: timesMin,
    elevationGainM: totalElevationGainM,
    elevationLossM: totalElevationLossM,
    surfaceBreakdown,
    profile,
    line,
    points: {
      type: "FeatureCollection" as const,
      features: pointFeatures,
    },
  }
}
