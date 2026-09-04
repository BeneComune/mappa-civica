import type { Map } from "maplibre-gl"

// "Temperatura suolo" (LST) from the old app's GreenModule.
export const SOIL_TEMPERATURE_LAYER_IDS = ["lst-fill", "lst-outline"]

export function addSoilTemperatureOverlay(map: Map): void {
  if (!map.getSource("lst")) {
    map.addSource("lst", { type: "geojson", data: "/data/lst.geojson" })
  }

  if (!map.getLayer("lst-fill")) {
    map.addLayer({
      id: "lst-fill",
      type: "fill",
      source: "lst",
      layout: { visibility: "none" },
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.65 },
    })
  }

  if (!map.getLayer("lst-outline")) {
    map.addLayer({
      id: "lst-outline",
      type: "line",
      source: "lst",
      layout: { visibility: "none" },
      paint: { "line-color": "#ffffff", "line-width": 0.3, "line-opacity": 0.4 },
    })
  }
}
