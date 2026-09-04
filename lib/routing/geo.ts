// lib\routing\geo.ts
// Coordinate maths and GeoJSON property coercion shared by the graph
// builders, the pathfinder, and the summary builder.

import type { Coord, NodeId } from "./types"

export function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "string" ? Number(value) : value
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback
}

export function distanceMeters(a: Coord, b: Coord): number {
  const radius = 6371000
  const toRadians = (value: number) => (value * Math.PI) / 180
  const deltaLat = toRadians(b[1] - a[1])
  const deltaLng = toRadians(b[0] - a[0])
  const lat1 = toRadians(a[1])
  const lat2 = toRadians(b[1])
  const h =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(h))
}

export function coordKey(coord: Coord, digits = 7): NodeId {
  return `${coord[0].toFixed(digits)},${coord[1].toFixed(digits)}`
}

export function hasRoutableGeometry(
  geometry?: { type?: string; coordinates?: Coord[] }
): geometry is { type: string; coordinates: Coord[] } {
  return geometry?.type === "LineString" && !!geometry.coordinates && geometry.coordinates.length >= 2
}

export function segmentLength(coords: Coord[]): number {
  let total = 0
  for (let index = 1; index < coords.length; index += 1) {
    total += distanceMeters(coords[index - 1], coords[index])
  }
  return total
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
