"use client"

import { createContext, useCallback, useContext, useRef } from "react"
import type { Map } from "maplibre-gl"
import { setOverlayVisibility } from "@/lib/map"

// Bridges the single persistent map instance (mounted once in the root
// layout, see MapShell/MapView) to legend-panel checkboxes rendered as route
// children elsewhere in the tree. The map instance itself is stored in a
// ref, not React state - toggling a layer is an imperative side effect, not
// something that should trigger a re-render of the provider's subtree.
type MapContextValue = {
  registerMap: (map: Map | null) => void
  setLayersVisible: (layerIds: string[], visible: boolean) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<Map | null>(null)

  const registerMap = useCallback((map: Map | null) => {
    mapRef.current = map
  }, [])

  const setLayersVisible = useCallback((layerIds: string[], visible: boolean) => {
    const map = mapRef.current
    if (map && map.isStyleLoaded()) {
      setOverlayVisibility(map, layerIds, visible)
    }
  }, [])

  return <MapContext.Provider value={{ registerMap, setLayersVisible }}>{children}</MapContext.Provider>
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error("useMapContext must be used within MapProvider")
  return ctx
}
