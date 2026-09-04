// lib\routing\cost.ts
// The edge cost model: how fast each travel mode covers an edge, and so how
// long traversing it takes. This is what Dijkstra minimises.

import type { GraphEdge, NodeId, RouteMode } from "./types"
import { clamp } from "./geo"

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

export function edgeTravelTimeMinutes(edge: GraphEdge, mode: RouteMode, fromNode: NodeId): number {
  const speedKmh = speedKmhForMode(edge, mode, fromNode)
  const distanceKm = edge.length / 1000
  return distanceKm > 0 ? (distanceKm / speedKmh) * 60 : 0
}
