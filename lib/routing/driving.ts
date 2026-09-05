// lib\routing\driving.ts
// A separate, minimal Dijkstra for car travel over the same road graph the
// bike planner uses (loadRoutingGraphForMode("biking") - transport.geojson
// only, no trails). Kept apart from RouteMode/buildRouteSummary: that type's
// `times: Record<RouteMode, ...>` and the planner UI built on it assume
// walking/biking/ebike on the SAME route geometry, which doesn't fit a
// car-only search that must exclude cycleways and steps outright.
import type { Coord, GraphEdge, NodeId, RoutingGraph, RoutingInputPoint } from "./types"
import { findNearestNodeId, appendSegmentCoordinates } from "./path"
import { MinHeap } from "./min-heap"

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

function shortestDrivingPath(
  graph: RoutingGraph,
  startId: NodeId,
  endId: NodeId
): { nodePath: NodeId[]; edgePath: number[] } | null {
  const distances = new Map<NodeId, number>()
  const previousNode = new Map<NodeId, NodeId>()
  const previousEdge = new Map<NodeId, number>()
  const queue = new MinHeap()

  distances.set(startId, 0)
  queue.push({ node: startId, cost: 0 })

  while (true) {
    const current = queue.pop()
    if (!current) break

    const knownDistance = distances.get(current.node)
    if (knownDistance !== undefined && current.cost > knownDistance) continue
    if (current.node === endId) break

    const node = graph.nodes.get(current.node)
    if (!node) continue

    for (const edgeIndex of node.edges) {
      const edge = graph.edges[edgeIndex]
      if (edge.highway && NOT_DRIVABLE.has(edge.highway)) continue

      const neighbor = edge.from === current.node ? edge.to : edge.from
      const nextCost = current.cost + drivingTravelTimeMinutes(edge)
      const previousBest = distances.get(neighbor)
      if (previousBest !== undefined && previousBest <= nextCost) continue

      distances.set(neighbor, nextCost)
      previousNode.set(neighbor, current.node)
      previousEdge.set(neighbor, edgeIndex)
      queue.push({ node: neighbor, cost: nextCost })
    }
  }

  if (!distances.has(endId)) return null

  const nodePath = [endId]
  const edgePath: number[] = []
  let current: NodeId = endId
  while (current !== startId) {
    const prevNode = previousNode.get(current)
    const prevEdge = previousEdge.get(current)
    if (prevNode === undefined || prevEdge === undefined) return null
    nodePath.push(prevNode)
    edgePath.push(prevEdge)
    current = prevNode
  }
  nodePath.reverse()
  edgePath.reverse()
  return { nodePath, edgePath }
}

export type DrivingRoute = {
  distanceKm: number
  timeMin: number
  line: { type: "Feature"; geometry: { type: "LineString"; coordinates: Coord[] }; properties: Record<string, never> }
}

export function computeDrivingRoute(
  graph: RoutingGraph,
  from: RoutingInputPoint,
  to: RoutingInputPoint
): DrivingRoute | null {
  const startId = findNearestNodeId(graph, from)
  const endId = findNearestNodeId(graph, to)
  if (!startId || !endId) return null

  const path = shortestDrivingPath(graph, startId, endId)
  if (!path) return null

  let distanceMeters = 0
  let timeMin = 0
  let coordinates: Coord[] = []

  for (let index = 0; index < path.edgePath.length; index += 1) {
    const edge = graph.edges[path.edgePath[index]]
    const fromNode = path.nodePath[index]
    distanceMeters += edge.length
    timeMin += drivingTravelTimeMinutes(edge)
    coordinates = appendSegmentCoordinates(coordinates, edge.coords, edge.from !== fromNode)
  }

  return {
    distanceKm: distanceMeters / 1000,
    timeMin,
    line: { type: "Feature", geometry: { type: "LineString", coordinates }, properties: {} },
  }
}
