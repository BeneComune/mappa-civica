// lib\map\overlays\vegetation-health.ts
import type { Map } from "maplibre-gl"
import { addChoroplethOverlay } from "./choropleth"

// "Salute vegetazione" (NBR) from the old app's GreenModule. Shares the
// 'nbr' source with the Rescue fire overlay's burn-index toggle (see
// overlays/fire.ts) - same data, uniquely-named layers so each module can
// show/hide its own independently.
export const VEGETATION_HEALTH_LAYER_IDS = ["green-nbr-fill", "green-nbr-outline"]

export function addVegetationHealthOverlay(map: Map): void {
  addChoroplethOverlay(map, {
    sourceId: "nbr",
    dataUrl: "/data/nbr.geojson",
    fillLayerId: "green-nbr-fill",
    outlineLayerId: "green-nbr-outline",
  })
}
