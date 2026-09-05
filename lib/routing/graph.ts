// lib\routing\graph.ts
// Biking routes the transport network as-is (edges keyed by the u/v node
// properties); walking combines roads and trails and splits every linestring
// into per-segment edges keyed by rounded coordinate.

import type {
  Coord,
  CombinedFeature,
  GraphEdge,
  GraphNode,
  NodeId,
  RoutingGraph,
  RoutingMode,
  TransportFeature,
} from "./types"
import { coordKey, distanceMeters, hasRoutableGeometry, toNumber } from "./geo"

export async function loadRoutingGraphForMode(mode: RoutingMode): Promise<RoutingGraph> {
  if (mode === "biking") {
    const response = await fetch("/data/transport.geojson")
    if (!response.ok) {
      throw new Error("Impossibile caricare il dataset routing")
    }

    const data = await response.json()
    return buildTransportRoutingGraph(data.features ?? [])
  }

  const [roadsResponse, trailsResponse] = await Promise.all([
    fetch("/data/transport.geojson"),
    fetch("/data/outdoor/trails_routing.geojson"),
  ])

  if (!roadsResponse.ok || !trailsResponse.ok) {
    throw new Error("Impossibile caricare il dataset routing")
  }

  const [roadsData, trailsData] = await Promise.all([roadsResponse.json(), trailsResponse.json()])
  return buildWalkingRoutingGraph([...(roadsData.features ?? []), ...(trailsData.features ?? [])])
}

function buildTransportRoutingGraph(features: TransportFeature[]): RoutingGraph {
  const nodes = new Map<NodeId, GraphNode>()
  const edges: GraphEdge[] = []

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const geometry = feature.geometry
    if (!hasRoutableGeometry(geometry)) {
      continue
    }

    const from = String(properties.u ?? "")
    const to = String(properties.v ?? "")
    const length = toNumber(properties.length, 0)
    if (!from || !to || length <= 0) {
      continue
    }

    const coords = geometry.coordinates as Coord[]
    const edge: GraphEdge = {
      from,
      to,
      coords,
      length,
      lts: toNumber(properties.lts, 2),
      slope: toNumber(properties.slope, 0),
      grade: toNumber(properties.grade, 0),
      highway: properties.highway ? String(properties.highway) : undefined,
      surface: properties.surface ? String(properties.surface) : undefined,
      maxspeed: toNumber(properties.maxspeed ?? properties.maxspeed_assumed, 0) || undefined,
    }

    appendEdge({ nodes, edges }, edge, coords[0], coords[coords.length - 1])
  }

  return finalizeGraph(nodes, edges)
}

// Append an edge and attach its index to both endpoint nodes, creating either
// node on first sight at the given coordinate. Both graph builders key their
// nodes differently (transport by the u/v properties, walking by rounded
// coordinate) but agree on everything after that, so the id and the coord
// come in as arguments.
function appendEdge(
  graph: { nodes: Map<NodeId, GraphNode>; edges: GraphEdge[] },
  edge: GraphEdge,
  fromCoord: Coord,
  toCoord: Coord
): void {
  const edgeIndex = graph.edges.push(edge) - 1

  const fromNode = graph.nodes.get(edge.from) ?? { coord: fromCoord, edges: [] }
  fromNode.edges.push(edgeIndex)
  graph.nodes.set(edge.from, fromNode)

  const toNode = graph.nodes.get(edge.to) ?? { coord: toCoord, edges: [] }
  toNode.edges.push(edgeIndex)
  graph.nodes.set(edge.to, toNode)
}

function finalizeGraph(nodes: Map<NodeId, GraphNode>, edges: GraphEdge[]): RoutingGraph {
  const nodeCoords = Array.from(nodes.entries()).map(([id, node]) => ({ id, coord: node.coord }))
  return { nodes, edges, nodeCoords }
}

function addSegmentEdge(
  graph: { nodes: Map<NodeId, GraphNode>; edges: GraphEdge[] },
  fromCoord: Coord,
  toCoord: Coord,
  properties: { lts?: number; slope?: number; grade?: number; highway?: string; surface?: string }
): void {
  const from = coordKey(fromCoord, 6)
  const to = coordKey(toCoord, 6)
  const length = distanceMeters(fromCoord, toCoord)

  if (length <= 0 || from === to) {
    return
  }

  const edge: GraphEdge = {
    from,
    to,
    coords: [fromCoord, toCoord],
    length,
    lts: properties.lts ?? 1,
    slope: properties.slope ?? 0,
    grade: properties.grade ?? 0,
    highway: properties.highway,
    surface: properties.surface,
  }

  appendEdge(graph, edge, fromCoord, toCoord)
}

function buildWalkingRoutingGraph(features: CombinedFeature[]): RoutingGraph {
  const nodes = new Map<NodeId, GraphNode>()
  const edges: GraphEdge[] = []

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const geometry = feature.geometry

    if (!hasRoutableGeometry(geometry)) {
      continue
    }

    const coords = geometry.coordinates as Coord[]
    const lts = toNumber(properties.lts, 1)
    const slope = toNumber(properties.slope, 0)
    const grade = toNumber(properties.grade, 0)
    const highway = properties.highway ? String(properties.highway) : undefined
    const surface = properties.surface ? String(properties.surface) : undefined

    for (let index = 1; index < coords.length; index += 1) {
      addSegmentEdge({ nodes, edges }, coords[index - 1], coords[index], {
        lts,
        slope,
        grade,
        highway,
        surface,
      })
    }
  }

  return finalizeGraph(nodes, edges)
}
