// lib\routing.ts
// Port of the old app's lib/routing.ts: an in-browser Dijkstra router over
// the transport/trails GeoJSON networks, used by the "Pianifica percorso"
// planners in both Outdoor sections (biking network for Cyclability,
// roads+trails network for Trails).
type Coord = [number, number]
type NodeId = string

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

type TransportFeature = {
  properties?: {
    u?: number | string
    v?: number | string
    length?: number | string
    lts?: number | string
    slope?: number | string
    grade?: number | string
    highway?: string | null
    surface?: string | null
  }
  geometry?: {
    type?: string
    coordinates?: Coord[]
  }
}

type CombinedFeature = TransportFeature

type GraphEdge = {
  from: NodeId
  to: NodeId
  coords: Coord[]
  length: number
  lts: number
  slope: number
  grade: number
  highway?: string
  surface?: string
}

type GraphNode = {
  coord: Coord
  edges: number[]
}

export type RoutingGraph = {
  nodes: Map<NodeId, GraphNode>
  edges: GraphEdge[]
  nodeCoords: Array<{ id: NodeId; coord: Coord }>
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "string" ? Number(value) : value
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback
}

function distanceMeters(a: Coord, b: Coord): number {
  const radius = 6371000
  const toRadians = (value: number) => (value * Math.PI) / 180
  const deltaLat = toRadians(b[1] - a[1])
  const deltaLng = toRadians(b[0] - a[0])
  const lat1 = toRadians(a[1])
  const lat2 = toRadians(b[1])
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(h))
}

function coordKey(coord: Coord, digits = 7): NodeId {
  return `${coord[0].toFixed(digits)},${coord[1].toFixed(digits)}`
}

function segmentLength(coords: Coord[]): number {
  let total = 0
  for (let index = 1; index < coords.length; index += 1) {
    total += distanceMeters(coords[index - 1], coords[index])
  }
  return total
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getTraversalGrade(edge: GraphEdge, fromNode: NodeId): number {
  return edge.from === fromNode ? edge.grade : -edge.grade
}

function speedKmhForMode(edge: GraphEdge, mode: RouteMode, fromNode: NodeId): number {
  const grade = getTraversalGrade(edge, fromNode) / 100

  if (mode === "walking") {
    // Tobler-style hiking speed model.
    return clamp(6 * Math.exp(-3.5 * Math.abs(grade + 0.05)), 1.0, 6.0)
  }

  // Bike: an e-bike's motor flattens climbs, so it loses far less speed
  // uphill and cruises a little faster on the flat; both share descent
  // behaviour and the LTS (traffic-stress) penalty.
  const flatSpeed = mode === "ebike" ? 19 : 16
  const climbDecay = mode === "ebike" ? 1.6 : 5.0
  const uphillFactor = Math.exp(-climbDecay * Math.max(0, grade))
  const downhillFactor = grade < 0 ? 1 + Math.min(0.5, Math.abs(grade) * 1.5) : 1
  const ltsPenalty = 1 + Math.max(0, edge.lts - 1) * 0.25
  const cap = mode === "ebike" ? 25 : 28

  return clamp((flatSpeed * uphillFactor * downhillFactor) / ltsPenalty, 3.0, cap)
}

function edgeTravelTimeMinutes(edge: GraphEdge, mode: RouteMode, fromNode: NodeId): number {
  const speedKmh = speedKmhForMode(edge, mode, fromNode)
  const distanceKm = edge.length / 1000
  return distanceKm > 0 ? (distanceKm / speedKmh) * 60 : 0
}

class MinHeap {
  private items: Array<{ node: NodeId; cost: number }> = []

  push(item: { node: NodeId; cost: number }): void {
    this.items.push(item)
    this.bubbleUp(this.items.length - 1)
  }

  pop(): { node: NodeId; cost: number } | undefined {
    if (this.items.length === 0) {
      return undefined
    }

    const top = this.items[0]
    const last = this.items.pop()

    if (this.items.length > 0 && last) {
      this.items[0] = last
      this.bubbleDown(0)
    }

    return top
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.items[parent].cost <= this.items[index].cost) {
        break
      }

      ;[this.items[parent], this.items[index]] = [this.items[index], this.items[parent]]
      index = parent
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = index * 2 + 1
      const right = left + 1
      let smallest = index

      if (left < this.items.length && this.items[left].cost < this.items[smallest].cost) {
        smallest = left
      }

      if (right < this.items.length && this.items[right].cost < this.items[smallest].cost) {
        smallest = right
      }

      if (smallest === index) {
        break
      }

      ;[this.items[smallest], this.items[index]] = [this.items[index], this.items[smallest]]
      index = smallest
    }
  }
}

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

export function buildTransportRoutingGraph(features: TransportFeature[]): RoutingGraph {
  const nodes = new Map<NodeId, GraphNode>()
  const edges: GraphEdge[] = []

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const geometry = feature.geometry
    if (geometry?.type !== "LineString" || !geometry.coordinates || geometry.coordinates.length < 2) {
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
    }

    const edgeIndex = edges.push(edge) - 1

    const fromNode = nodes.get(from) ?? { coord: coords[0], edges: [] }
    fromNode.coord = fromNode.coord ?? coords[0]
    fromNode.edges.push(edgeIndex)
    nodes.set(from, fromNode)

    const toNode = nodes.get(to) ?? { coord: coords[coords.length - 1], edges: [] }
    toNode.coord = toNode.coord ?? coords[coords.length - 1]
    toNode.edges.push(edgeIndex)
    nodes.set(to, toNode)
  }

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

  const edgeIndex = graph.edges.push(edge) - 1

  const fromNode = graph.nodes.get(from) ?? { coord: fromCoord, edges: [] }
  fromNode.edges.push(edgeIndex)
  graph.nodes.set(from, fromNode)

  const toNode = graph.nodes.get(to) ?? { coord: toCoord, edges: [] }
  toNode.edges.push(edgeIndex)
  graph.nodes.set(to, toNode)
}

function buildWalkingRoutingGraph(features: CombinedFeature[]): RoutingGraph {
  const nodes = new Map<NodeId, GraphNode>()
  const edges: GraphEdge[] = []

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const geometry = feature.geometry

    if (geometry?.type !== "LineString" || !geometry.coordinates || geometry.coordinates.length < 2) {
      continue
    }

    const coords = geometry.coordinates as Coord[]
    const lts = toNumber(properties.lts, 1)
    const slope = toNumber(properties.slope, 0)
    const grade = toNumber(properties.grade, 0)
    const highway = properties.highway ? String(properties.highway) : undefined
    const surface = properties.surface ? String(properties.surface) : undefined

    for (let index = 1; index < coords.length; index += 1) {
      addSegmentEdge({ nodes, edges }, coords[index - 1], coords[index], { lts, slope, grade, highway, surface })
    }
  }

  const nodeCoords = Array.from(nodes.entries()).map(([id, node]) => ({ id, coord: node.coord }))
  return { nodes, edges, nodeCoords }
}

function findNearestNodeId(graph: RoutingGraph, point: RoutingInputPoint): NodeId | null {
  let bestId: NodeId | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  const target: Coord = [point.lng, point.lat]

  for (const candidate of graph.nodeCoords) {
    const currentDistance = distanceMeters(target, candidate.coord)
    if (currentDistance < bestDistance) {
      bestDistance = currentDistance
      bestId = candidate.id
    }
  }

  return bestId
}

function shortestPath(
  graph: RoutingGraph,
  startId: NodeId,
  endId: NodeId,
  mode: RoutingMode
): { nodePath: NodeId[]; edgePath: number[] } | null {
  const distances = new Map<NodeId, number>()
  const previousNode = new Map<NodeId, NodeId>()
  const previousEdge = new Map<NodeId, number>()
  const queue = new MinHeap()

  distances.set(startId, 0)
  queue.push({ node: startId, cost: 0 })

  while (true) {
    const current = queue.pop()
    if (!current) {
      break
    }

    const knownDistance = distances.get(current.node)
    if (knownDistance !== undefined && current.cost > knownDistance) {
      continue
    }

    if (current.node === endId) {
      break
    }

    const node = graph.nodes.get(current.node)
    if (!node) {
      continue
    }

    for (const edgeIndex of node.edges) {
      const edge = graph.edges[edgeIndex]
      const neighbor = edge.from === current.node ? edge.to : edge.from
      const nextCost = current.cost + edgeTravelTimeMinutes(edge, mode, current.node)
      const previousBest = distances.get(neighbor)

      if (previousBest !== undefined && previousBest <= nextCost) {
        continue
      }

      distances.set(neighbor, nextCost)
      previousNode.set(neighbor, current.node)
      previousEdge.set(neighbor, edgeIndex)
      queue.push({ node: neighbor, cost: nextCost })
    }
  }

  if (!distances.has(endId)) {
    return null
  }

  const nodePath = [endId]
  const edgePath: number[] = []
  let current: NodeId = endId

  while (current !== startId) {
    const prevNode = previousNode.get(current)
    const prevEdge = previousEdge.get(current)
    if (prevNode === undefined || prevEdge === undefined) {
      return null
    }

    nodePath.push(prevNode)
    edgePath.push(prevEdge)
    current = prevNode
  }

  nodePath.reverse()
  edgePath.reverse()
  return { nodePath, edgePath }
}

function appendSegmentCoordinates(coordinates: Coord[], segment: Coord[], reverse: boolean): Coord[] {
  const segmentCoordinates = reverse ? [...segment].reverse() : segment
  if (coordinates.length === 0) {
    return [...segmentCoordinates]
  }

  const merged = [...coordinates]
  for (const coordinate of segmentCoordinates) {
    const last = merged[merged.length - 1]
    if (!last || last[0] !== coordinate[0] || last[1] !== coordinate[1]) {
      merged.push(coordinate)
    }
  }

  return merged
}

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

export function buildRouteSummary(graph: RoutingGraph, points: RoutingInputPoint[], mode: RoutingMode): RouteSummary | null {
  if (points.length < 2) {
    return null
  }

  const snappedNodeIds = points.map((point) => findNearestNodeId(graph, point)).filter((value): value is NodeId => value !== null)

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
        const segmentMeters = distanceMeters(edgeGeometry[coordinateIndex - 1], edgeGeometry[coordinateIndex])
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

// --- Route export -------------------------------------------------------
// Turn a computed route into a downloadable file. GeoJSON keeps the summary
// numbers as properties; GPX/KML are the line as a track; CSV is the
// elevation/grade profile, one row per sampled point.

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

export function routeToGeoJSON(summary: RouteSummary): string {
  const fc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: summary.line.geometry,
        properties: {
          distanza_km: Number(summary.distanceKm.toFixed(3)),
          tempo_piedi_min: Math.round(summary.times.walking),
          tempo_bici_min: Math.round(summary.times.biking),
          tempo_ebike_min: Math.round(summary.times.ebike),
          dislivello_positivo_m: Math.round(summary.elevationGainM),
          dislivello_negativo_m: Math.round(summary.elevationLossM),
          fondo: summary.surfaceBreakdown.map((r) => `${r.label}: ${r.km.toFixed(2)} km`).join("; "),
        },
      },
      ...summary.points.features,
    ],
  }
  return JSON.stringify(fc, null, 2)
}

export function routeToGPX(summary: RouteSummary): string {
  const pts = summary.line.geometry.coordinates.map(([lon, lat]) => `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"/>`).join("\n")
  const wpts = summary.points.features
    .map((f) => {
      const [lon, lat] = f.geometry.coordinates
      return `  <wpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"><name>${xmlEscape(f.properties.label)}</name></wpt>`
    })
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Mappa Civica" xmlns="http://www.topografix.com/GPX/1/1">
${wpts}
  <trk><name>Percorso</name><trkseg>
${pts}
  </trkseg></trk>
</gpx>
`
}

export function routeToKML(summary: RouteSummary): string {
  const coords = summary.line.geometry.coordinates.map(([lon, lat]) => `${lon.toFixed(7)},${lat.toFixed(7)},0`).join(" ")
  const marks = summary.points.features
    .map((f) => {
      const [lon, lat] = f.geometry.coordinates
      return `    <Placemark><name>${xmlEscape(f.properties.label)}</name><Point><coordinates>${lon.toFixed(7)},${lat.toFixed(7)},0</coordinates></Point></Placemark>`
    })
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Percorso</name>
${marks}
    <Placemark><name>Percorso</name><LineString><tessellate>1</tessellate><coordinates>${coords}</coordinates></LineString></Placemark>
  </Document>
</kml>
`
}

export function routeToCSV(summary: RouteSummary): string {
  // elevationM is cumulative height change from the start (can be negative),
  // not an absolute altitude - the source data only carries per-edge grade.
  const header = "distanza_km,dislivello_dalla_partenza_m,pendenza_pct"
  const rows = summary.profile.map((p) => `${p.distanceKm.toFixed(3)},${p.elevationM.toFixed(1)},${p.grade.toFixed(1)}`)
  return [header, ...rows].join("\n") + "\n"
}

function downloadTextFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type RouteExportFormat = "geojson" | "gpx" | "kml" | "csv"

export function exportRoute(summary: RouteSummary, format: RouteExportFormat): void {
  const map: Record<RouteExportFormat, [string, string, string]> = {
    geojson: ["percorso.geojson", "application/geo+json", routeToGeoJSON(summary)],
    gpx: ["percorso.gpx", "application/gpx+xml", routeToGPX(summary)],
    kml: ["percorso.kml", "application/vnd.google-earth.kml+xml", routeToKML(summary)],
    csv: ["percorso-altimetria.csv", "text/csv", routeToCSV(summary)],
  }
  const [name, mime, content] = map[format]
  downloadTextFile(name, mime, content)
}
