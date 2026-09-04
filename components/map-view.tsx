"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import type { Map } from "maplibre-gl"
import { createBaseMap, onStyleReady, ROUTE_OVERLAYS, syncOverlayVisibility } from "@/lib/map"
import { STRINGS } from "@/lib/strings"

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
