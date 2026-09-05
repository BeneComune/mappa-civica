// lib\routing\types.ts
// Shared shapes for the router: the GeoJSON features it ingests, the graph
// it builds from them, and the summary it hands back to the planner UI.

export type Coord = [number, number]
export type NodeId = string

export type RoutingMode = "walking" | "biking"

export type RoutingInputPoint = {
  lng: number
  lat: number
}

export type RouteMode = "walking" | "biking" | "ebike"

export type SurfaceRun = {
  label: string
  km: number
}

export type RouteSummary = {
  distanceKm: number
  timeMin: number
  // Estimated time on the SAME route geometry for each travel mode, so the
  // planner can show piedi / bici / bici elettrica side by side.
  times: Record<RouteMode, number>
  elevationGainM: number
  elevationLossM: number
  // Route length grouped by road/path type (OSM highway, plus surface for
  // trails), most-used first.
  surfaceBreakdown: SurfaceRun[]
  profile: Array<{
    distanceKm: number
    elevationM: number
    grade: number
  }>
  line: {
    type: "Feature"
    geometry: {
      type: "LineString"
      coordinates: Coord[]
    }
    properties: Record<string, never>
  }
  points: {
    type: "FeatureCollection"
    features: Array<{
      type: "Feature"
      geometry: { type: "Point"; coordinates: Coord }
      properties: {
        kind: "start" | "waypoint" | "end"
        label: string
        index: number
      }
    }>
  }
}

export type TransportFeature = {
  properties?: {
    u?: number | string
    v?: number | string
    length?: number | string
    lts?: number | string
    slope?: number | string
    grade?: number | string
    highway?: string | null
    surface?: string | null
    maxspeed?: number | string
    maxspeed_assumed?: number | string
  }
  geometry?: {
    type?: string
    coordinates?: Coord[]
  }
}

export type CombinedFeature = TransportFeature

export type GraphEdge = {
  from: NodeId
  to: NodeId
  coords: Coord[]
  length: number
  lts: number
  slope: number
  grade: number
  highway?: string
  surface?: string
  // Posted (or OSMnx-assumed) speed limit in km/h, driving-only. Absent for
  // the walking graph's trail segments, which don't carry either tag.
  maxspeed?: number
}

export type GraphNode = {
  coord: Coord
  edges: number[]
}

export type RoutingGraph = {
  nodes: Map<NodeId, GraphNode>
  edges: GraphEdge[]
  nodeCoords: Array<{ id: NodeId; coord: Coord }>
}
