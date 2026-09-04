// lib\map\overlays\shared.ts
import type { Map } from "maplibre-gl"

// The old app recreated the whole map per module/section. This app keeps a
// single persistent map, so overlays are added once (idempotently, since
// setStyle() wipes anything not part of the new style document and
// onStyleReady re-runs this on every style load) and toggled on/off by
// layout.visibility depending on the current route.

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
