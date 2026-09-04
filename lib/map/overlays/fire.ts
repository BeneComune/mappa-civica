// lib\map\overlays\fire.ts
import type { ExpressionSpecification, Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"

// Forest fire perimeters (IRDAT FVG) from the old app's RescueModule.
// Historical burned areas, coloured by ignition cause. Danger zonation,
// ignition points, and the NBR burn index are optional overlays that were
// off by default behind checkboxes in the old app - added here (so the
// route-level toggle works once that UI exists) but kept hidden for now,
// since only the main perimeters are shown when this route is active.
export const FIRE_PERIMETERS_LAYER_IDS = ["fire-perimeters-fill", "fire-perimeters-outline"]
export const FIRE_DANGER_LAYER_IDS = ["fire-danger-fill", "fire-danger-outline"]
export const FIRE_IGNITION_LAYER_IDS = ["fire-ignition-points"]
export const FIRE_NBR_LAYER_IDS = ["rescue-nbr-fill", "rescue-nbr-outline"]

export const FIRE_LAYER_IDS = [...FIRE_PERIMETERS_LAYER_IDS]

const FIRE_COLOR: ExpressionSpecification = [
  "match",
  ["get", "causa_classe"],
  "dolosa", COLORS.fireCauseDolosa,
  "colposa", COLORS.fireCauseColposa,
  "naturale", COLORS.fireCauseNaturale,
  COLORS.fireCauseIgnota,
]

const FIRE_DANGER_COLOR: ExpressionSpecification = [
  "match",
  ["get", "grado"],
  "alta", COLORS.fireDangerAlta,
  "medio", COLORS.fireDangerMedio,
  COLORS.fireDangerDefault,
]

// Features carry a stable top-level `id` in the source GeoJSON already, so
// no generateId is needed for setFeatureState to work.
const FIRE_HOVER: ExpressionSpecification = ["boolean", ["feature-state", "hover"], false]

export function addFireOverlay(map: Map): void {
  if (!map.getSource("firePerimeters")) {
    map.addSource("firePerimeters", { type: "geojson", data: "/data/rescue/fire_perimeters.geojson" })
  }
  if (!map.getSource("fireDanger")) {
    map.addSource("fireDanger", { type: "geojson", data: "/data/rescue/fire_danger.geojson" })
  }
  if (!map.getSource("fireIgnition")) {
    map.addSource("fireIgnition", { type: "geojson", data: "/data/rescue/fire_ignition_points.geojson" })
  }
  // Shared with the Green module's NBR tab once that's ported - same source,
  // different (uniquely-named) layers, so both can toggle independently.
  if (!map.getSource("nbr")) {
    map.addSource("nbr", { type: "geojson", data: "/data/nbr.geojson" })
  }

  if (!map.getLayer("fire-danger-fill")) {
    map.addLayer({
      id: "fire-danger-fill",
      type: "fill",
      source: "fireDanger",
      layout: { visibility: "none" },
      paint: { "fill-color": FIRE_DANGER_COLOR, "fill-opacity": 0.18 },
    })
  }
  if (!map.getLayer("fire-danger-outline")) {
    map.addLayer({
      id: "fire-danger-outline",
      type: "line",
      source: "fireDanger",
      layout: { visibility: "none" },
      paint: { "line-color": FIRE_DANGER_COLOR, "line-width": 1.2, "line-dasharray": [3, 2] },
    })
  }

  if (!map.getLayer("rescue-nbr-fill")) {
    map.addLayer({
      id: "rescue-nbr-fill",
      type: "fill",
      source: "nbr",
      layout: { visibility: "none" },
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.5 },
    })
  }
  if (!map.getLayer("rescue-nbr-outline")) {
    map.addLayer({
      id: "rescue-nbr-outline",
      type: "line",
      source: "nbr",
      layout: { visibility: "none" },
      paint: { "line-color": COLORS.white, "line-width": 0.3, "line-opacity": 0.35 },
    })
  }

  if (!map.getLayer("fire-perimeters-fill")) {
    map.addLayer({
      id: "fire-perimeters-fill",
      type: "fill",
      source: "firePerimeters",
      layout: { visibility: "none" },
      paint: { "fill-color": FIRE_COLOR, "fill-opacity": ["case", FIRE_HOVER, 0.5, 0.25] },
    })
  }
  if (!map.getLayer("fire-perimeters-outline")) {
    map.addLayer({
      id: "fire-perimeters-outline",
      type: "line",
      source: "firePerimeters",
      layout: { visibility: "none" },
      paint: { "line-color": FIRE_COLOR, "line-width": ["case", FIRE_HOVER, 2.6, 1.1] },
    })
  }

  if (!map.getLayer("fire-ignition-points")) {
    map.addLayer({
      id: "fire-ignition-points",
      type: "circle",
      source: "fireIgnition",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 6],
        "circle-color": COLORS.fireIgnitionToggle,
        "circle-stroke-color": COLORS.white,
        "circle-stroke-width": 1.4,
        "circle-opacity": 0.95,
      },
    })
  }
}
