// components\route-planner\format.ts
// Presentation helpers and the point shape shared across the planner's parts.
import { COLORS } from "@/lib/colors"

export type RoutePoint = { id: string; lng: number; lat: number }

export function formatDistance(distanceKm: number): string {
  return `${distanceKm.toFixed(distanceKm >= 10 ? 1 : 2)} km`
}

export function formatTime(timeMin: number): string {
  if (timeMin < 60) return `${Math.max(1, Math.round(timeMin))} min`
  const hours = Math.floor(timeMin / 60)
  const minutes = Math.round(timeMin % 60)
  return `${hours} h ${minutes} min`
}

// Start and end get their own colour; everything between is a waypoint.
export function routePointColor(index: number, total: number): string {
  if (index === 0) return COLORS.routePointStart
  if (index === total - 1) return COLORS.routePointEnd
  return COLORS.routePointWaypoint
}
