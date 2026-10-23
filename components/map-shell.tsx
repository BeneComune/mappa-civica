// components\map-shell.tsx
"use client"

import dynamic from "next/dynamic"
import { STRINGS } from "@/lib/strings"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="map-canvas flex items-center justify-center text-sm text-muted-foreground">{STRINGS.mapLoading}</div>,
})

export function MapShell() {
  return <MapView />
}
