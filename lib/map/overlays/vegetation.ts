import type { ExpressionSpecification, Map } from "maplibre-gl"

// "Vegetazione" (NDVI) from the old app's GreenModule - the default tab,
// showing land cover from bare soil to dense forest.
export const VEGETATION_LAYER_IDS = ["greenery-fill", "greenery-outline"]

const NDVI_FILL_COLOR: ExpressionSpecification = [
  "match",
  ["get", "ndvi_class"],
  "water", "#4a90d9",
  "bare", "#c9a96e",
  "sparse", "#a8d08d",
  "moderate", "#5aaa5a",
  "dense", "#238b45",
  "very_dense", "#004d20",
  "#cccccc",
]

const NDVI_FILL_OPACITY: ExpressionSpecification = ["match", ["get", "ndvi_class"], "bare", 0.15, 0.45]

export function addVegetationOverlay(map: Map): void {
  if (!map.getSource("greenery")) {
    map.addSource("greenery", { type: "geojson", data: "/data/greenery.geojson" })
  }

  if (!map.getLayer("greenery-fill")) {
    map.addLayer({
      id: "greenery-fill",
      type: "fill",
      source: "greenery",
      layout: { visibility: "none" },
      paint: { "fill-color": NDVI_FILL_COLOR, "fill-opacity": NDVI_FILL_OPACITY },
    })
  }

  if (!map.getLayer("greenery-outline")) {
    map.addLayer({
      id: "greenery-outline",
      type: "line",
      source: "greenery",
      layout: { visibility: "none" },
      paint: { "line-color": "#ffffff", "line-width": 0.3, "line-opacity": 0.4 },
    })
  }
}
