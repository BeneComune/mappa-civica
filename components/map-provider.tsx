// components\map-provider.tsx
"use client"

import { createContext, useCallback, useContext, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import type {
  FilterSpecification,
  GeoJSONSource,
  LngLat,
  Map,
  MapLayerMouseEvent,
  MapMouseEvent,
  Marker,
  Popup,
} from "maplibre-gl"
import { onStyleReady, setOverlayVisibility } from "@/lib/map"

// Bridges the single persistent map instance (mounted once in the root
// layout, see MapShell/MapView) to legend-panel checkboxes and forms
// rendered as route children elsewhere in the tree. The map instance itself
// is stored in a ref, not React state - toggling a layer or reading a click
// is an imperative side effect, not something that should trigger a
// re-render of the provider's subtree.
type MapContextValue = {
  registerMap: (map: Map | null) => void
  setLayersVisible: (layerIds: string[], visible: boolean) => void
  setLayersFilter: (layerIds: string[], filter: FilterSpecification) => void
  subscribeMapClick: (handler: (lngLat: LngLat) => void) => () => void
  setPinMarker: (lngLat: [number, number] | null) => void
  flyTo: (center: [number, number], zoom: number) => void
  setSourceData: (sourceId: string, url: string) => void
  // Shows a popup following the cursor while hovering features on `layerId`,
  // via `render(properties)` returning an HTML string, or nothing to skip
  // that hover. Shared by every module's hover-popup (Rescue, Green, ...).
  attachHoverPopup: (layerId: string, render: (props: Record<string, unknown>) => string | null | undefined) => () => void
  // Shows a popup at the clicked feature's position on `layerId`. Shared by
  // Rescue's click-to-open popups (rii, fire, assets, ...).
  attachClickPopup: (layerId: string, render: (props: Record<string, unknown>) => string | null | undefined) => () => void
  // Toggles feature-state `hover` on `sourceId` for whichever of `layerIds`
  // is under the cursor, driving hover-highlight paint expressions (see
  // RII_HOVER/FIRE_HOVER in the overlay definitions). Requires features to
  // carry a stable top-level `id` (or `generateId: true` on the source).
  attachHoverHighlight: (sourceId: string, layerIds: string[]) => () => void
  // Escape hatch for interactions too specific to generalize (e.g. Home's
  // cadastral-parcel identify: click + hover + queryRenderedFeatures). Use
  // the narrower methods above where possible instead.
  getMap: () => Map | null
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<Map | null>(null)
  const clickHandlersRef = useRef<Set<(lngLat: LngLat) => void>>(new Set())
  const pinMarkerRef = useRef<Marker | null>(null)

  const registerMap = useCallback((map: Map | null) => {
    const previous = mapRef.current
    if (previous) previous.off("click", handleMapClick)
    mapRef.current = map
    pinMarkerRef.current = null
    if (map) map.on("click", handleMapClick)

    function handleMapClick(e: MapMouseEvent): void {
      for (const handler of clickHandlersRef.current) handler(e.lngLat)
    }
  }, [])

  const setLayersVisible = useCallback((layerIds: string[], visible: boolean) => {
    const map = mapRef.current
    if (map && map.isStyleLoaded()) {
      setOverlayVisibility(map, layerIds, visible)
    }
  }, [])

  const setLayersFilter = useCallback((layerIds: string[], filter: FilterSpecification) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    for (const id of layerIds) {
      if (map.getLayer(id)) map.setFilter(id, filter)
    }
  }, [])

  const subscribeMapClick = useCallback((handler: (lngLat: LngLat) => void) => {
    clickHandlersRef.current.add(handler)
    return () => clickHandlersRef.current.delete(handler)
  }, [])

  const setPinMarker = useCallback((lngLat: [number, number] | null) => {
    const map = mapRef.current
    if (!map) return
    if (!lngLat) {
      pinMarkerRef.current?.remove()
      pinMarkerRef.current = null
      return
    }
    if (pinMarkerRef.current) {
      pinMarkerRef.current.setLngLat(lngLat)
    } else {
      pinMarkerRef.current = new maplibregl.Marker({ color: "#e03131" }).setLngLat(lngLat).addTo(map)
    }
  }, [])

  const flyTo = useCallback((center: [number, number], zoom: number) => {
    mapRef.current?.flyTo({ center, zoom, duration: 900 })
  }, [])

  const setSourceData = useCallback((sourceId: string, url: string) => {
    const map = mapRef.current
    if (!map) return
    const source = map.getSource(sourceId) as GeoJSONSource | undefined
    source?.setData(url)
  }, [])

  const getMap = useCallback(() => mapRef.current, [])

  const attachHoverPopup = useCallback(
    (layerId: string, render: (props: Record<string, unknown>) => string | null | undefined) => {
      const map = mapRef.current
      if (!map) return () => {}

      let popup: Popup | null = null

      const handleMove = (e: MapLayerMouseEvent) => {
        const html = render(e.features?.[0]?.properties ?? {})
        if (!html) {
          popup?.remove()
          map.getCanvas().style.cursor = ""
          return
        }
        map.getCanvas().style.cursor = "pointer"
        if (!popup) {
          popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        }
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map)
      }
      const handleLeave = () => {
        map.getCanvas().style.cursor = ""
        popup?.remove()
      }

      const attach = () => {
        map.on("mousemove", layerId, handleMove)
        map.on("mouseleave", layerId, handleLeave)
      }
      const unsubStyleReady = onStyleReady(map, attach)

      return () => {
        unsubStyleReady()
        map.off("mousemove", layerId, handleMove)
        map.off("mouseleave", layerId, handleLeave)
        popup?.remove()
      }
    },
    []
  )

  const attachClickPopup = useCallback(
    (layerId: string, render: (props: Record<string, unknown>) => string | null | undefined) => {
      const map = mapRef.current
      if (!map) return () => {}

      const handleClick = (e: MapLayerMouseEvent) => {
        const html = render(e.features?.[0]?.properties ?? {})
        if (!html) return
        new maplibregl.Popup({ closeButton: true, closeOnClick: true }).setLngLat(e.lngLat).setHTML(html).addTo(map)
      }
      const handleEnter = () => {
        map.getCanvas().style.cursor = "pointer"
      }
      const handleLeave = () => {
        map.getCanvas().style.cursor = ""
      }

      const attach = () => {
        map.on("click", layerId, handleClick)
        map.on("mouseenter", layerId, handleEnter)
        map.on("mouseleave", layerId, handleLeave)
      }
      const unsubStyleReady = onStyleReady(map, attach)

      return () => {
        unsubStyleReady()
        map.off("click", layerId, handleClick)
        map.off("mouseenter", layerId, handleEnter)
        map.off("mouseleave", layerId, handleLeave)
      }
    },
    []
  )

  const attachHoverHighlight = useCallback((sourceId: string, layerIds: string[]) => {
    const map = mapRef.current
    if (!map) return () => {}

    let hovered: { source: string; id: string | number } | undefined

    const clearHover = () => {
      if (hovered) {
        map.setFeatureState(hovered, { hover: false })
        hovered = undefined
      }
      map.getCanvas().style.cursor = ""
    }

    const handleMove = (e: MapMouseEvent) => {
      const layers = layerIds.filter((id) => map.getLayer(id))
      if (layers.length === 0) {
        clearHover()
        return
      }
      const feature = map.queryRenderedFeatures(e.point, { layers })[0]
      if (!feature || feature.id === undefined) {
        clearHover()
        return
      }
      const next = { source: sourceId, id: feature.id }
      if (hovered && (hovered.source !== next.source || hovered.id !== next.id)) {
        map.setFeatureState(hovered, { hover: false })
      }
      hovered = next
      map.setFeatureState(hovered, { hover: true })
      map.getCanvas().style.cursor = "pointer"
    }

    const attach = () => {
      map.on("mousemove", handleMove)
      map.on("mouseout", clearHover)
    }
    const unsubStyleReady = onStyleReady(map, attach)

    return () => {
      unsubStyleReady()
      map.off("mousemove", handleMove)
      map.off("mouseout", clearHover)
      clearHover()
    }
  }, [])

  return (
    <MapContext.Provider
      value={{
        registerMap,
        setLayersVisible,
        setLayersFilter,
        subscribeMapClick,
        setPinMarker,
        flyTo,
        setSourceData,
        getMap,
        attachHoverPopup,
        attachClickPopup,
        attachHoverHighlight,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error("useMapContext must be used within MapProvider")
  return ctx
}
