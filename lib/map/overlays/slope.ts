// lib\map\overlays\slope.ts
import type { ExpressionSpecification, Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"

// "Pendenza" from the old app's OutdoorModule: trails/roads coloured by
// steepness class.
export const SLOPE_LAYER_IDS = ["slope-network-trails"]

const SLOPE_COLOR: ExpressionSpecification = [
  "match",
  ["get", "slope_class"],
  "0-3: flat", COLORS.slopeFlat,
  "3-5: mild", COLORS.slopeMild,
  "5-8: medium", COLORS.slopeMedium,
  "8-10: hard", COLORS.slopeHard,
  "10-20: extreme", COLORS.slopeExtreme,
  ">20: impossible", COLORS.slopeImpossible,
  COLORS.slopeDefault,
]

export function addSlopeOverlay(map: Map): void {
  if (!map.getSource("trailsRouting")) {
    map.addSource("trailsRouting", { type: "geojson", data: "/data/outdoor/trails_routing.geojson" })
  }

  if (!map.getLayer("slope-network-trails")) {
    map.addLayer({
      id: "slope-network-trails",
      type: "line",
      source: "trailsRouting",
      filter: ["has", "slope_class"],
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": SLOPE_COLOR,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.4, 14, 4.2],
        "line-opacity": 0.95,
      },
    })
  }
}
