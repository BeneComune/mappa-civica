"use client"

import { useEffect, useRef } from "react"
import type { Map } from "maplibre-gl"
import { createBaseMap } from "@/lib/map"
import { STRINGS } from "@/lib/strings"

export default function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = createBaseMap(containerRef.current, STRINGS.appName, STRINGS.appName)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="map-canvas" />
}
