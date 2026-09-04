import type { ExpressionSpecification, Map } from "maplibre-gl"

// "Ombra naturale" from the old app's GreenModule - roads/trails coloured
// by tree canopy coverage.
export const NATURAL_SHADE_LAYER_IDS = ["shade-corridors-casing", "shade-corridors"]

const SHADE_COLOR: ExpressionSpecification = ["match", ["get", "type"], "road", "#1a7f3c", "#52b788"]

const SHADE_OPACITY: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "shade_pct"],
  20, 0.55,
  100, 0.95,
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
        "line-color": "#ffffff",
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
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.8, 15, 4.5],
        "line-opacity": SHADE_OPACITY,
      },
    })
  }
}
