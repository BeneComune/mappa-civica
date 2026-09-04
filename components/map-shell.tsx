"use client"

import dynamic from "next/dynamic"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="map-canvas flex items-center justify-center text-sm text-muted-foreground">Caricamento mappa…</div>,
})

export function MapShell() {
  return <MapView />
}
