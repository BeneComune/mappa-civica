// lib\routing\routing.test.ts
// Behavioural cover for the router. Written to pin down the pieces most at
// risk from the lib/routing.ts -> lib/routing/ split: graph construction
// (both builders share appendEdge/finalizeGraph), the direction-dependent
// cost model, Dijkstra, and summary accumulation.
import { afterEach, describe, expect, it, vi } from "vitest"
import { clamp, coordKey, distanceMeters, hasRoutableGeometry, segmentLength, toNumber } from "./geo"
import { edgeTravelTimeMinutes } from "./cost"
import { MinHeap } from "./min-heap"
import { loadRoutingGraphForMode } from "./graph"
import { findNearestNodeId, shortestPath } from "./path"
import { buildRouteSummary } from "./summary"
import type { Coord, GraphEdge, RoutingGraph } from "./types"

// ---------------------------------------------------------------- helpers

// ~78 m apart at this latitude; small enough to keep expected numbers legible.
const A: Coord = [12.6, 46.16]
const B: Coord = [12.601, 46.16]
const C: Coord = [12.602, 46.16]

function transportFeature(u: string, v: string, coords: Coord[], props = {}) {
  return {
    properties: { u, v, length: segmentLength(coords), lts: 1, slope: 0, grade: 0, ...props },
    geometry: { type: "LineString", coordinates: coords },
  }
}

function mockFetch(byUrl: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const match = Object.keys(byUrl).find((k) => url.includes(k))
      if (!match) return { ok: false }
      return { ok: true, json: async () => byUrl[match] }
    })
  )
}

afterEach(() => vi.unstubAllGlobals())

// ------------------------------------------------------------------- geo

describe("geo", () => {
  it("measures haversine distance", () => {
    // One thousandth of a degree of longitude at 46.16N.
    expect(distanceMeters(A, B)).toBeGreaterThan(70)
    expect(distanceMeters(A, B)).toBeLessThan(80)
    expect(distanceMeters(A, A)).toBe(0)
  })

  it("is symmetric", () => {
    expect(distanceMeters(A, C)).toBeCloseTo(distanceMeters(C, A), 9)
  })

  it("sums a polyline segment by segment", () => {
    expect(segmentLength([A, B, C])).toBeCloseTo(distanceMeters(A, B) + distanceMeters(B, C), 6)
    expect(segmentLength([A])).toBe(0)
  })

  it("keys coordinates at fixed precision so near-identical ends snap together", () => {
    expect(coordKey([12.6000001, 46.16], 6)).toBe(coordKey([12.6000002, 46.16], 6))
    expect(coordKey(A, 6)).not.toBe(coordKey(B, 6))
  })

  it("coerces GeoJSON property values that may arrive as strings", () => {
    expect(toNumber("12.5")).toBe(12.5)
    expect(toNumber(3)).toBe(3)
    expect(toNumber(undefined, 7)).toBe(7)
    expect(toNumber("not a number", 2)).toBe(2)
    expect(toNumber(NaN, 5)).toBe(5)
  })

  it("accepts only linestrings with at least two positions", () => {
    expect(hasRoutableGeometry({ type: "LineString", coordinates: [A, B] })).toBe(true)
    expect(hasRoutableGeometry({ type: "LineString", coordinates: [A] })).toBe(false)
    expect(hasRoutableGeometry({ type: "Point", coordinates: [A, B] })).toBe(false)
    expect(hasRoutableGeometry(undefined)).toBe(false)
  })

  it("clamps", () => {
    expect(clamp(5, 1, 3)).toBe(3)
    expect(clamp(0, 1, 3)).toBe(1)
    expect(clamp(2, 1, 3)).toBe(2)
  })
})

// ------------------------------------------------------------------ cost

function edge(over: Partial<GraphEdge> = {}): GraphEdge {
  return { from: "A", to: "B", coords: [A, B], length: 1000, lts: 1, slope: 0, grade: 0, ...over }
}

describe("cost model", () => {
  it("is direction dependent: the same edge costs more uphill than down", () => {
    const e = edge({ grade: 8 })
    const uphill = edgeTravelTimeMinutes(e, "biking", "A") // traversed A->B, +8%
    const downhill = edgeTravelTimeMinutes(e, "biking", "B") // traversed B->A, -8%
    expect(uphill).toBeGreaterThan(downhill)
  })

  it("gives an e-bike a smaller uphill penalty than a plain bike", () => {
    const steep = edge({ grade: 10 })
    const bikeLoss = edgeTravelTimeMinutes(steep, "biking", "A") / edgeTravelTimeMinutes(edge(), "biking", "A")
    const ebikeLoss = edgeTravelTimeMinutes(steep, "ebike", "A") / edgeTravelTimeMinutes(edge(), "ebike", "A")
    expect(ebikeLoss).toBeLessThan(bikeLoss)
  })

  it("penalises high traffic stress for bikes", () => {
    expect(edgeTravelTimeMinutes(edge({ lts: 4 }), "biking", "A")).toBeGreaterThan(
      edgeTravelTimeMinutes(edge({ lts: 1 }), "biking", "A")
    )
  })

  it("walks slower than it bikes on the flat", () => {
    expect(edgeTravelTimeMinutes(edge(), "walking", "A")).toBeGreaterThan(
      edgeTravelTimeMinutes(edge(), "biking", "A")
    )
  })

  it("costs nothing to traverse a zero-length edge", () => {
    expect(edgeTravelTimeMinutes(edge({ length: 0 }), "walking", "A")).toBe(0)
  })
})

// -------------------------------------------------------------- min-heap

describe("MinHeap", () => {
  it("pops in ascending cost order", () => {
    const heap = new MinHeap()
    for (const cost of [5, 1, 4, 1, 9, 2, 6]) heap.push({ node: `n${cost}`, cost })
    const popped: number[] = []
    for (;;) {
      const next = heap.pop()
      if (!next) break
      popped.push(next.cost)
    }
    expect(popped).toEqual([1, 1, 2, 4, 5, 6, 9])
  })

  it("returns undefined when empty", () => {
    expect(new MinHeap().pop()).toBeUndefined()
  })
})

// ----------------------------------------------------------------- graph

describe("loadRoutingGraphForMode", () => {
  it("builds the biking graph keyed on the u/v properties", async () => {
    mockFetch({
      "transport.geojson": { features: [transportFeature("A", "B", [A, B]), transportFeature("B", "C", [B, C])] },
    })

    const graph = await loadRoutingGraphForMode("biking")

    expect(graph.edges).toHaveLength(2)
    expect([...graph.nodes.keys()].sort()).toEqual(["A", "B", "C"])
    // B is the shared node, so it carries both edge indices.
    expect(graph.nodes.get("B")!.edges.sort()).toEqual([0, 1])
    expect(graph.nodes.get("A")!.edges).toEqual([0])
    expect(graph.nodeCoords).toHaveLength(3)
    expect(graph.nodes.get("A")!.coord).toEqual(A)
  })

  it("skips features with no usable geometry, ids or length", async () => {
    mockFetch({
      "transport.geojson": {
        features: [
          transportFeature("A", "B", [A, B]),
          { properties: { u: "X", v: "Y", length: 10 }, geometry: { type: "Point", coordinates: [A] } },
          transportFeature("", "Z", [A, B]),
          transportFeature("P", "Q", [A, B], { length: 0 }),
        ],
      },
    })

    const graph = await loadRoutingGraphForMode("biking")
    expect(graph.edges).toHaveLength(1)
  })

  it("splits walking linestrings into one edge per segment, keyed by coordinate", async () => {
    mockFetch({
      "transport.geojson": { features: [transportFeature("A", "C", [A, B, C])] },
      "trails_routing.geojson": { features: [] },
    })

    const graph = await loadRoutingGraphForMode("walking")

    // A->B and B->C, rather than the single A->C edge biking would make.
    expect(graph.edges).toHaveLength(2)
    expect(graph.nodes.size).toBe(3)
    expect(graph.nodes.has(coordKey(B, 6))).toBe(true)
  })

  it("merges the roads and trails networks for walking", async () => {
    mockFetch({
      "transport.geojson": { features: [transportFeature("A", "B", [A, B])] },
      "trails_routing.geojson": { features: [transportFeature("B", "C", [B, C])] },
    })

    const graph = await loadRoutingGraphForMode("walking")
    expect(graph.edges).toHaveLength(2)
  })

  it("rejects when the network cannot be fetched", async () => {
    mockFetch({})
    await expect(loadRoutingGraphForMode("biking")).rejects.toThrow()
  })
})

// ------------------------------------------------------------------ path

async function threeNodeGraph(): Promise<RoutingGraph> {
  mockFetch({
    "transport.geojson": {
      features: [transportFeature("A", "B", [A, B]), transportFeature("B", "C", [B, C])],
    },
  })
  return loadRoutingGraphForMode("biking")
}

describe("path", () => {
  it("snaps an arbitrary point to the nearest node", async () => {
    const graph = await threeNodeGraph()
    expect(findNearestNodeId(graph, { lng: A[0] + 0.00001, lat: A[1] })).toBe("A")
    expect(findNearestNodeId(graph, { lng: C[0], lat: C[1] })).toBe("C")
  })

  it("finds the path across an intermediate node", async () => {
    const graph = await threeNodeGraph()
    const path = shortestPath(graph, "A", "C", "biking")
    expect(path).not.toBeNull()
    expect(path!.nodePath).toEqual(["A", "B", "C"])
    expect(path!.edgePath).toHaveLength(2)
  })

  it("returns null when the target is unreachable", async () => {
    mockFetch({
      "transport.geojson": {
        features: [
          transportFeature("A", "B", [A, B]),
          // A disconnected component.
          transportFeature("Y", "Z", [[13.0, 46.0], [13.001, 46.0]] as Coord[]),
        ],
      },
    })
    const graph = await loadRoutingGraphForMode("biking")
    expect(shortestPath(graph, "A", "Z", "biking")).toBeNull()
  })
})

// --------------------------------------------------------------- summary

describe("buildRouteSummary", () => {
  it("needs at least two points", async () => {
    const graph = await threeNodeGraph()
    expect(buildRouteSummary(graph, [{ lng: A[0], lat: A[1] }], "biking")).toBeNull()
    expect(buildRouteSummary(graph, [], "biking")).toBeNull()
  })

  it("accumulates distance, per-mode times and geometry across the route", async () => {
    const graph = await threeNodeGraph()
    const summary = buildRouteSummary(
      graph,
      [
        { lng: A[0], lat: A[1] },
        { lng: C[0], lat: C[1] },
      ],
      "biking"
    )!

    expect(summary).not.toBeNull()
    const expectedKm = (distanceMeters(A, B) + distanceMeters(B, C)) / 1000
    expect(summary.distanceKm).toBeCloseTo(expectedKm, 6)

    // Every mode is costed over the same geometry, and walking is slowest.
    expect(summary.times.walking).toBeGreaterThan(summary.times.biking)
    expect(summary.times.ebike).toBeLessThan(summary.times.biking)
    expect(summary.timeMin).toBeCloseTo(summary.times.biking, 6)

    expect(summary.line.geometry.type).toBe("LineString")
    expect(summary.line.geometry.coordinates.length).toBeGreaterThanOrEqual(2)
    // Start and end markers, labelled A and B.
    expect(summary.points.features).toHaveLength(2)
    expect(summary.points.features[0].properties.kind).toBe("start")
    expect(summary.points.features[1].properties.kind).toBe("end")
    expect(summary.points.features[0].properties.label).toBe("A")
  })

  it("labels an intermediate point as a waypoint", async () => {
    const graph = await threeNodeGraph()
    const summary = buildRouteSummary(
      graph,
      [
        { lng: A[0], lat: A[1] },
        { lng: B[0], lat: B[1] },
        { lng: C[0], lat: C[1] },
      ],
      "biking"
    )!
    expect(summary.points.features.map((f) => f.properties.kind)).toEqual(["start", "waypoint", "end"])
  })

  it("splits elevation into gain and loss from the per-edge grade", async () => {
    mockFetch({
      "transport.geojson": {
        features: [
          transportFeature("A", "B", [A, B], { grade: 10 }),
          transportFeature("B", "C", [B, C], { grade: -10 }),
        ],
      },
    })
    const graph = await loadRoutingGraphForMode("biking")
    const summary = buildRouteSummary(
      graph,
      [
        { lng: A[0], lat: A[1] },
        { lng: C[0], lat: C[1] },
      ],
      "biking"
    )!

    expect(summary.elevationGainM).toBeGreaterThan(0)
    expect(summary.elevationLossM).toBeGreaterThan(0)
    expect(summary.profile.length).toBeGreaterThanOrEqual(2)
  })

  it("groups distance by surface, largest run first", async () => {
    mockFetch({
      "transport.geojson": {
        features: [
          transportFeature("A", "B", [A, B], { surface: "asphalt" }),
          transportFeature("B", "C", [B, C], { surface: "gravel" }),
        ],
      },
    })
    const graph = await loadRoutingGraphForMode("biking")
    const summary = buildRouteSummary(
      graph,
      [
        { lng: A[0], lat: A[1] },
        { lng: C[0], lat: C[1] },
      ],
      "biking"
    )!

    const labels = summary.surfaceBreakdown.map((r) => r.label)
    expect(labels).toContain("Asfalto")
    expect(labels).toContain("Ghiaia")
    const kms = summary.surfaceBreakdown.map((r) => r.km)
    expect([...kms].sort((a, b) => b - a)).toEqual(kms)
  })

  it("returns null when the points cannot be connected", async () => {
    mockFetch({
      "transport.geojson": {
        features: [
          transportFeature("A", "B", [A, B]),
          transportFeature("Y", "Z", [[13.0, 46.0], [13.001, 46.0]] as Coord[]),
        ],
      },
    })
    const graph = await loadRoutingGraphForMode("biking")
    expect(buildRouteSummary(graph, [{ lng: A[0], lat: A[1] }, { lng: 13.001, lat: 46.0 }], "biking")).toBeNull()
  })
})
