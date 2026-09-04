// components\route-planner\use-route-map-layers.ts
"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"
import type { RouteSummary } from "@/lib/routing"
import { routePointColor, type RoutePoint } from "./format"

// Mirrors the current route onto the map: the computed line into the "route"
// source, and one draggable marker per point. Dragging a marker reports the
// new position back so the route recomputes.
export function useRouteMapLayers(
  points: RoutePoint[],
  summary: RouteSummary | null,
  movePoint: (id: string, lng: number, lat: number) => void
): void {
  const { getMap } = useMapContext()
  const markersRef = useRef(new globalThis.Map<string, maplibregl.Marker>())

  useEffect(() => {
    const map = getMap()
    if (!map) return
    const source = map.getSource("route") as GeoJSONSource | undefined
    if (!source) return
    source.setData({
      type: "FeatureCollection",
      features: summary ? [summary.line] : [],
    } as never)
  }, [summary, getMap])

  // Markers are rebuilt whenever the point list changes.
  useEffect(() => {
    const map = getMap()
    const markers = markersRef.current
    const clearAll = () => {
      for (const marker of markers.values()) marker.remove()
      markers.clear()
    }
    clearAll()
    if (!map) return clearAll

    points.forEach((point, index) => {
      const color = routePointColor(index, points.length)
      const marker = new maplibregl.Marker({ color, draggable: true })
        .setLngLat([point.lng, point.lat])
        .addTo(map)
      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat()
        movePoint(point.id, lng, lat)
      })
      markers.set(point.id, marker)
    })

    return clearAll
  }, [points, getMap, movePoint])
}
