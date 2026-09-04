// components\map-provider\interactions.ts
// The reusable map interaction recipes behind MapProvider's attach* methods.
// These are plain functions of a Map - no React - each wiring listeners on
// style load and returning a detach function that also undoes any visual
// state it left behind (open popup, hover cursor, feature-state).
import * as maplibregl from "maplibre-gl"
import type { Map, MapLayerMouseEvent, MapMouseEvent, Popup } from "maplibre-gl"
import { onStyleReady } from "@/lib/map"

// Returns the popup HTML for a hovered/clicked feature's properties, or
// nothing to skip this one.
export type PopupRenderer = (props: Record<string, unknown>) => string | null | undefined

// A popup that follows the cursor while hovering features on `layerId`.
export function attachHoverPopup(map: Map, layerId: string, render: PopupRenderer): () => void {
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
}

// A dismissable popup at the clicked feature's position on `layerId`.
export function attachClickPopup(map: Map, layerId: string, render: PopupRenderer): () => void {
  const handleClick = (e: MapLayerMouseEvent) => {
    const html = render(e.features?.[0]?.properties ?? {})
    if (!html) return
    new maplibregl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map)
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
}

// Toggles feature-state `hover` on `sourceId` for whichever of `layerIds` is
// under the cursor, driving hover-highlight paint expressions. Requires
// features to carry a stable top-level `id` (or `generateId: true`).
export function attachHoverHighlight(
  map: Map,
  sourceId: string,
  layerIds: string[]
): () => void {
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
}
