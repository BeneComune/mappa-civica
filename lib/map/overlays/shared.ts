// lib\map\overlays\shared.ts
import type { AddLayerObject, Map } from "maplibre-gl"

// The old app recreated the whole map per module/section. This app keeps a
// single persistent map, so overlays are added once (idempotently, since
// setStyle() wipes anything not part of the new style document and
// onStyleReady re-runs this on every style load) and toggled on/off by
// layout.visibility depending on the current route.

// The idempotent adds every overlay uses. The layer id is read from the layer
// object itself, so the existence check can't drift from the id being added.
export function addSourceOnce(
  map: Map,
  id: string,
  source: Parameters<Map["addSource"]>[1]
): void {
  if (!map.getSource(id)) {
    map.addSource(id, source)
  }
}

export function addLayerOnce(map: Map, layer: AddLayerObject): void {
  if (!map.getLayer(layer.id)) {
    map.addLayer(layer)
  }
}

// Sets a MapLibre layer's visibility, ignoring layers that don't exist yet
// (e.g. the style hasn't finished loading, or this overlay hasn't been
// added). Shared by every overlay's route-driven show/hide.
export function setOverlayVisibility(map: Map, layerIds: string[], visible: boolean): void {
  for (const id of layerIds) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
    }
  }
}
