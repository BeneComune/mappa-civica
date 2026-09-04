// components\route-planner\use-map-point-input.ts
"use client"

import { useEffect } from "react"
import { useMapContext } from "@/components/map-provider"
import type { RoutePoint } from "./format"

// While the planner is armed, the map shows a crosshair and every click
// appends a point.
export function useMapPointInput(
  enabled: boolean,
  addPoint: (point: RoutePoint) => void
): void {
  const { getMap, subscribeMapClick } = useMapContext()

  useEffect(() => {
    if (!enabled) return
    return subscribeMapClick((lngLat) => {
      addPoint({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        lng: lngLat.lng,
        lat: lngLat.lat,
      })
    })
  }, [enabled, subscribeMapClick, addPoint])

  useEffect(() => {
    const map = getMap()
    if (!map) return
    map.getCanvas().style.cursor = enabled ? "crosshair" : ""
    return () => {
      map.getCanvas().style.cursor = ""
    }
  }, [enabled, getMap])
}
