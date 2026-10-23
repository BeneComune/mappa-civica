// lib\map\overlays\peaks.ts
import type { Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"
import { addLayerOnce, addSourceOnce } from "./shared"

// "Cime principali": the municipality's summits (every OSM natural=peak
// inside the boundary), each shown as a white fill-extrusion "pole" (plain
// line layers can't stand up off the terrain surface) whose height is scaled
// between the lowest and highest peak - a stylized relative-elevation marker,
// not a to-scale one - plus a point + label at the actual summit.
export const PEAKS_LAYER_IDS = ["peak-poles", "peak-summits", "peak-labels"]

export function addPeaksOverlay(map: Map): void {
  addSourceOnce(map, "peakPoles", { type: "geojson", data: "/data/outdoor/peaks_poles.geojson" })
  addSourceOnce(map, "peaks", { type: "geojson", data: "/data/outdoor/peaks.geojson" })

  addLayerOnce(map, {
    id: "peak-poles",
    type: "fill-extrusion",
    source: "peakPoles",
    layout: { visibility: "none" },
    paint: {
      "fill-extrusion-color": COLORS.white,
      "fill-extrusion-height": ["get", "poleHeight"],
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.95,
    },
  })

  addLayerOnce(map, {
    id: "peak-summits",
    type: "circle",
    source: "peaks",
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 4,
      "circle-color": COLORS.peakSummit,
      "circle-stroke-color": COLORS.white,
      "circle-stroke-width": 1.5,
    },
  })

  addLayerOnce(map, {
    id: "peak-labels",
    type: "symbol",
    source: "peaks",
    layout: {
      visibility: "none",
      "text-field": ["concat", ["get", "name"], " (", ["get", "ele"], " m)"],
      "text-offset": [0, -1.6],
      "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 15, 13],
      "text-font": ["Noto Sans Bold"],
    },
    paint: {
      "text-color": COLORS.peakLabel,
      "text-halo-color": COLORS.white,
      "text-halo-width": 1.6,
    },
  })
}
