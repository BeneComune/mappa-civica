// lib\map\overlays\hospital.ts
import type { Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"

// "Ospedale più vicino": the fixed destination marker. The driving route
// line to it reuses the route planner's shared "route" source/layers
// (lib/map/overlays/route.ts) rather than owning its own.
export const HOSPITAL_LAYER_IDS = ["hospital-site", "hospital-label"]

export function addHospitalOverlay(map: Map): void {
  if (!map.getSource("hospital")) {
    map.addSource("hospital", { type: "geojson", data: "/data/rescue/hospital.geojson" })
  }

  if (!map.getLayer("hospital-site")) {
    map.addLayer({
      id: "hospital-site",
      type: "circle",
      source: "hospital",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 6, 15, 11],
        "circle-color": COLORS.hospital,
        "circle-stroke-color": COLORS.white,
        "circle-stroke-width": 1.8,
        "circle-opacity": 0.95,
      },
    })
  }

  if (!map.getLayer("hospital-label")) {
    map.addLayer({
      id: "hospital-label",
      type: "symbol",
      source: "hospital",
      layout: {
        visibility: "none",
        "text-field": ["get", "name"],
        "text-offset": [0, 1.2],
        "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 15, 13],
        "text-font": ["Noto Sans Bold"],
      },
      paint: {
        "text-color": COLORS.hospitalLabel,
        "text-halo-color": COLORS.white,
        "text-halo-width": 1.6,
      },
    })
  }
}
