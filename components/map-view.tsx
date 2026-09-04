"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import type { Map } from "maplibre-gl"
import { createBaseMap, onStyleReady, ROUTE_OVERLAYS, syncOverlayVisibility } from "@/lib/map"
import { STRINGS } from "@/lib/strings"
import { useMapContext } from "@/components/map-provider"

export default function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const { registerMap } = useMapContext()

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!containerRef.current) return

    const map = createBaseMap(containerRef.current, STRINGS.appName, STRINGS.appName)
    mapRef.current = map
    registerMap(map)

    const unsubscribe = onStyleReady(map, () => {
      for (const overlay of ROUTE_OVERLAYS) {
        overlay.add(map)
      }
      syncOverlayVisibility(map, pathnameRef.current)
    })

    return () => {
      unsubscribe()
      registerMap(null)
      map.remove()
      mapRef.current = null
    }
  }, [registerMap])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    syncOverlayVisibility(map, pathname)
  }, [pathname])

  return <div ref={containerRef} className="map-canvas" />
}
