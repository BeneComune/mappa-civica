import type { Map } from "maplibre-gl"

// "Presidi di soccorso" from the old app's RescueModule: AED defibrillators,
// HEMS heliports, fire hydrants, and emergency assembly points. All four
// were visible by default (no checkbox unchecked initially), so all four
// are shown together when this route is active.
export const ASSETS_LAYER_IDS = [
  "aed-sites",
  "aed-labels",
  "hems-sites",
  "hems-labels",
  "fire-hydrant-sites",
  "fire-hydrant-labels",
  "assembly-point-sites",
  "assembly-point-labels",
]

function addEmergencyLayers(
  map: Map,
  sourceId: string,
  layerId: string,
  labelId: string,
  color: string,
  labelColor: string
): void {
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 5, 15, 10],
        "circle-color": color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.6,
        "circle-opacity": 0.95,
      },
    })
  }

  if (!map.getLayer(labelId)) {
    map.addLayer({
      id: labelId,
      type: "symbol",
      source: sourceId,
      layout: {
        visibility: "none",
        "text-field": ["coalesce", ["get", "name:it"], ["get", "name"], ""],
        "text-offset": [0, 1.15],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 15, 12],
        "text-font": ["Noto Sans Regular"],
      },
      paint: {
        "text-color": labelColor,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    })
  }
}

export function addAssetsOverlay(map: Map): void {
  if (!map.getSource("aed")) {
    map.addSource("aed", { type: "geojson", data: "/data/rescue/aed.geojson" })
  }
  if (!map.getSource("hems")) {
    map.addSource("hems", { type: "geojson", data: "/data/rescue/hems.geojson" })
  }
  if (!map.getSource("fireHydrants")) {
    map.addSource("fireHydrants", { type: "geojson", data: "/data/rescue/fire_hydrants.geojson" })
  }
  if (!map.getSource("assemblyPoints")) {
    map.addSource("assemblyPoints", { type: "geojson", data: "/data/rescue/emergency_assembly_points.geojson" })
  }

  addEmergencyLayers(map, "aed", "aed-sites", "aed-labels", "#e03131", "#7f1d1d")
  addEmergencyLayers(map, "hems", "hems-sites", "hems-labels", "#f59f00", "#7a4d00")
  addEmergencyLayers(map, "fireHydrants", "fire-hydrant-sites", "fire-hydrant-labels", "#0b7285", "#0b4f61")
  addEmergencyLayers(map, "assemblyPoints", "assembly-point-sites", "assembly-point-labels", "#2f9e44", "#1b5e20")
}
