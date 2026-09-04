// lib\map\overlays\vegetation.ts
import type { ExpressionSpecification, Map } from "maplibre-gl"
import { ALL_NDVI_CLASSES, NDVI_CLASS_CONFIG } from "@/lib/green-classes"
import { COLORS } from "@/lib/colors"

// "Vegetazione" (NDVI) from the old app's GreenModule - the default tab,
// showing land cover from bare soil to dense forest. Built from
// NDVI_CLASS_CONFIG (lib/green-classes.ts) rather than its own hardcoded
// match arms, so the map layer and the NdviClassesPanel legend can't drift.
export const VEGETATION_LAYER_IDS = ["greenery-fill", "greenery-outline"]

// MapLibre's `match` expression type is a strict tuple, which a dynamically
// built array (from NDVI_CLASS_CONFIG) can't satisfy structurally - the
// shape is still a valid match expression at runtime, so cast through
// unknown rather than hand-writing (and re-duplicating) each match arm.
const NDVI_FILL_COLOR = [
  "match",
  ["get", "ndvi_class"],
  ...ALL_NDVI_CLASSES.flatMap((cls) => [cls, NDVI_CLASS_CONFIG[cls].color]),
  COLORS.ndviDefault,
] as unknown as ExpressionSpecification

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
      paint: { "line-color": COLORS.white, "line-width": 0.3, "line-opacity": 0.4 },
    })
  }
}
