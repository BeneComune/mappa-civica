import type { Map } from "maplibre-gl"

// "Salute vegetazione" (NBR) from the old app's GreenModule. Shares the
// 'nbr' source with the Rescue fire overlay's burn-index toggle (see
// overlays/fire.ts) - same data, uniquely-named layers so each module can
// show/hide its own independently.
export const VEGETATION_HEALTH_LAYER_IDS = ["green-nbr-fill", "green-nbr-outline"]

export function addVegetationHealthOverlay(map: Map): void {
  if (!map.getSource("nbr")) {
    map.addSource("nbr", { type: "geojson", data: "/data/nbr.geojson" })
  }

  if (!map.getLayer("green-nbr-fill")) {
    map.addLayer({
      id: "green-nbr-fill",
      type: "fill",
      source: "nbr",
      layout: { visibility: "none" },
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.65 },
    })
  }

  if (!map.getLayer("green-nbr-outline")) {
    map.addLayer({
      id: "green-nbr-outline",
      type: "line",
      source: "nbr",
      layout: { visibility: "none" },
      paint: { "line-color": "#ffffff", "line-width": 0.3, "line-opacity": 0.4 },
    })
  }
}
