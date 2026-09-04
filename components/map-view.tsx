"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import type { Map } from "maplibre-gl"
import {
  addAssetsOverlay,
  addBikeInfraOverlay,
  addFireOverlay,
  addRiiOverlay,
  addSlopeOverlay,
  addTrailsWaterOverlay,
  ASSETS_LAYER_IDS,
  BIKE_INFRA_LAYER_IDS,
  createBaseMap,
  FIRE_LAYER_IDS,
  onStyleReady,
  RII_LAYER_IDS,
  setOverlayVisibility,
  SLOPE_LAYER_IDS,
  TRAILS_WATER_LAYER_IDS,
} from "@/lib/map"
import { STRINGS } from "@/lib/strings"

// Each entry's overlay is added once (idempotently) on every style load, and
// shown only when the current route matches `path`. Add a row here for each
// new overlay ported instead of wiring it by hand in the effects below.
const ROUTE_OVERLAYS = [
  { path: "/rescue/events", add: addRiiOverlay, layerIds: RII_LAYER_IDS },
  { path: "/rescue/fire", add: addFireOverlay, layerIds: FIRE_LAYER_IDS },
  { path: "/rescue/assets", add: addAssetsOverlay, layerIds: ASSETS_LAYER_IDS },
  { path: "/outdoor/trails/trails", add: addTrailsWaterOverlay, layerIds: TRAILS_WATER_LAYER_IDS },
  { path: "/outdoor/cyclability/bike-infra", add: addBikeInfraOverlay, layerIds: BIKE_INFRA_LAYER_IDS },
  { path: "/outdoor/trails/slope", add: addSlopeOverlay, layerIds: SLOPE_LAYER_IDS },
]

function syncOverlayVisibility(map: Map, pathname: string): void {
  for (const overlay of ROUTE_OVERLAYS) {
    setOverlayVisibility(map, overlay.layerIds, pathname === overlay.path)
  }
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!containerRef.current) return

    const map = createBaseMap(containerRef.current, STRINGS.appName, STRINGS.appName)
    mapRef.current = map

    const unsubscribe = onStyleReady(map, () => {
      for (const overlay of ROUTE_OVERLAYS) {
        overlay.add(map)
      }
      syncOverlayVisibility(map, pathnameRef.current)
    })

    return () => {
      unsubscribe()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    syncOverlayVisibility(map, pathname)
  }, [pathname])

  return <div ref={containerRef} className="map-canvas" />
}
