// lib\map\overlays\soil-temperature.ts
import type { Map } from "maplibre-gl"
import { addChoroplethOverlay } from "./choropleth"

// "Temperatura suolo" (LST) from the old app's GreenModule. Class colours
// come from the pipeline (process_lst.py), baked per-feature - the matching
// legend bands live in LST_CLASS_CONFIG (lib/green-classes.ts).
export const SOIL_TEMPERATURE_LAYER_IDS = ["lst-fill", "lst-outline"]

export function addSoilTemperatureOverlay(map: Map): void {
  addChoroplethOverlay(map, {
    sourceId: "lst",
    dataUrl: "/data/lst.geojson",
    fillLayerId: "lst-fill",
    outlineLayerId: "lst-outline",
  })
}
