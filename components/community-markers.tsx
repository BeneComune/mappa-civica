"use client"

import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"
import { CATEGORIES, categoryLabel, type CommunityReport } from "@/lib/community"

// Plain maplibregl.Marker per report (not a GeoJSON layer, since the report
// list is small and locally-sourced) with a hover preview and click-to-fly.
export function CommunityMarkers({
  reports,
  onSelect,
}: {
  reports: CommunityReport[]
  onSelect: (report: CommunityReport) => void
}) {
  const { getMap } = useMapContext()
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    const map = getMap()
    if (!map) return

    for (const m of markersRef.current) m.remove()
    markersRef.current = []

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, maxWidth: "200px" })

    for (const report of reports) {
      const category = CATEGORIES.find((c) => c.id === report.category)
      const el = document.createElement("div")
      el.style.cssText = `width:16px;height:16px;border-radius:9999px;background:${category?.color ?? "#666"};cursor:pointer;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)`

      el.addEventListener("mouseenter", () => {
        popup
          .setLngLat([report.lon, report.lat])
          .setHTML(
            `<div style="font-size:0.82rem"><strong style="display:block;margin-bottom:0.15rem">${report.title}</strong><span style="color:#888;font-size:0.75rem">${categoryLabel(report.category)}</span></div>`
          )
          .addTo(map)
      })
      el.addEventListener("mouseleave", () => popup.remove())
      el.addEventListener("click", () => onSelect(report))

      const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([report.lon, report.lat]).addTo(map)
      markersRef.current.push(marker)
    }

    return () => {
      for (const m of markersRef.current) m.remove()
      markersRef.current = []
      popup.remove()
    }
  }, [reports, getMap, onSelect])

  return null
}
