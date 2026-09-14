// lib\map\overlays\natural-shade.ts
import type { ExpressionSpecification, Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"

// "Ombra naturale" from the old app's GreenModule - roads/trails coloured
// by tree canopy coverage. Colour (light -> dark green, reusing the NDVI
// vegetation ramp so "more shaded" reads the same as "more vegetation"
// elsewhere in the Green module) carries the coverage % - the thing this
// tab is actually about - instead of the old road-vs-trail hue split, which
// only encoded segment type and left coverage to a narrow opacity range
// (0.55-0.95) that barely differed at a glance. Type is now a line-width
// difference instead (roads drawn wider than trails).
export const NATURAL_SHADE_LAYER_IDS = ["shade-corridors-casing", "shade-corridors"]

// shade_corridors.geojson only carries segments >= MIN_SHADE_PCT (20, see
// process_shade_corridors.py) - stops start there, not at 0.
const SHADE_COLOR: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "shade_pct"],
  20, COLORS.ndviSparse,
  45, COLORS.ndviModerate,
  70, COLORS.ndviDense,
  100, COLORS.ndviVeryDense,
]

const SHADE_OPACITY: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "shade_pct"],
  20, 0.5,
  100, 1,
]

// A single top-level zoom interpolation, with the road/trail width picked
// per stop - MapLibre rejects an expression with more than one zoom-based
// interpolate, so the type "case" has to live inside this one, not wrap it.
const SHADE_WIDTH: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  11, ["case", ["==", ["get", "type"], "road"], 2.5, 1.8],
  15, ["case", ["==", ["get", "type"], "road"], 6.3, 4.5],
]

export function addNaturalShadeOverlay(map: Map): void {
  if (!map.getSource("shadeCorridors")) {
    map.addSource("shadeCorridors", { type: "geojson", data: "/data/shade_corridors.geojson" })
  }

  if (!map.getLayer("shade-corridors-casing")) {
    map.addLayer({
      id: "shade-corridors-casing",
      type: "line",
      source: "shadeCorridors",
      layout: { visibility: "none" },
      paint: {
        "line-color": COLORS.white,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 3.5, 15, 7.5],
        "line-opacity": 0.7,
      },
    })
  }

  if (!map.getLayer("shade-corridors")) {
    map.addLayer({
      id: "shade-corridors",
      type: "line",
      source: "shadeCorridors",
      layout: { visibility: "none" },
      paint: {
        "line-color": SHADE_COLOR,
        "line-width": SHADE_WIDTH,
        "line-opacity": SHADE_OPACITY,
      },
    })
  }
}
