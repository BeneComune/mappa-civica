// lib\map\overlays\landslide.ts
import type { ExpressionSpecification, Map } from "maplibre-gl"
import { addChoroplethOverlay } from "./choropleth"
import { LANDSLIDE_CLASS_CONFIG } from "@/lib/landslide-classes"

// "Rischio frane" (PAI landslide hazard) - ISPRA's national mosaic, clipped
// to the comune by pipeline/scripts/build_landslide_geojson.py. Colours from
// LANDSLIDE_CLASS_CONFIG (not baked into the GeoJSON) so the legend chips
// and the polygons read from the same source, matching the fire-danger
// overlay's `grado` match expression rather than the NDVI/NBR/LST choropleths'
// pipeline-baked `color` property.
export const LANDSLIDE_LAYER_IDS = ["landslide-fill", "landslide-outline"]

const LANDSLIDE_COLOR: ExpressionSpecification = [
  "match",
  ["get", "class"],
  "p4", LANDSLIDE_CLASS_CONFIG.p4.color,
  "p3", LANDSLIDE_CLASS_CONFIG.p3.color,
  "p2", LANDSLIDE_CLASS_CONFIG.p2.color,
  "p1", LANDSLIDE_CLASS_CONFIG.p1.color,
  LANDSLIDE_CLASS_CONFIG.aa.color,
]

export function addLandslideOverlay(map: Map): void {
  addChoroplethOverlay(map, {
    sourceId: "landslideHazard",
    dataUrl: "/data/rescue/landslide_hazard.geojson",
    fillLayerId: "landslide-fill",
    outlineLayerId: "landslide-outline",
    fillColor: LANDSLIDE_COLOR,
    fillOpacity: 0.45,
  })
}
