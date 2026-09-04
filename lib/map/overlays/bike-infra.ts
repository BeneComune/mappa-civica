// lib\map\overlays\bike-infra.ts
import type { FilterSpecification, Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"

// "Infrastrutture ciclabili" from the old app's OutdoorModule: the cycle
// lane network plus parking, rental, repair, and e-bike charging points.
export const BIKE_INFRA_LAYER_IDS = [
  "bike-lane-casing",
  "bike-lane-network",
  "bike-lane-labels",
  "bike-infra-bike-parking",
  "bike-infra-bike-rental",
  "bike-infra-bike-repair",
  "bike-infra-ebike-charging",
]

function addBikeInfraPoints(
  map: Map,
  categoryId: string,
  filter: FilterSpecification,
  color: string
): void {
  const id = `bike-infra-${categoryId}`
  if (map.getLayer(id)) return

  map.addLayer({
    id,
    type: "circle",
    source: "bikeInfra",
    filter,
    layout: { visibility: "none" },
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 4, 15, 9],
      "circle-color": color,
      "circle-stroke-color": COLORS.white,
      "circle-stroke-width": 1.5,
      "circle-opacity": 0.95,
    },
  })
}

export function addBikeInfraOverlay(map: Map): void {
  if (!map.getSource("cyclepaths")) {
    map.addSource("cyclepaths", { type: "geojson", data: "/data/outdoor/bike_cyclepaths.geojson" })
  }
  if (!map.getSource("bikeInfra")) {
    map.addSource("bikeInfra", { type: "geojson", data: "/data/outdoor/bike_infra.geojson" })
  }

  if (!map.getLayer("bike-lane-casing")) {
    map.addLayer({
      id: "bike-lane-casing",
      type: "line",
      source: "cyclepaths",
      layout: { visibility: "none" },
      paint: {
        "line-color": COLORS.bikeInfraCasing,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 3.2, 14, 6.6],
        "line-opacity": 0.95,
      },
    })
  }

  if (!map.getLayer("bike-lane-network")) {
    map.addLayer({
      id: "bike-lane-network",
      type: "line",
      source: "cyclepaths",
      layout: { visibility: "none" },
      paint: {
        "line-color": COLORS.bikeInfraCiclabili,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.2, 14, 3.2],
        "line-opacity": 1,
        "line-dasharray": [1, 0],
      },
    })
  }

  if (!map.getLayer("bike-lane-labels")) {
    map.addLayer({
      id: "bike-lane-labels",
      type: "symbol",
      source: "cyclepaths",
      layout: {
        visibility: "none",
        "symbol-placement": "line",
        "text-field": ["coalesce", ["get", "name:it"], ["get", "name"], ["get", "ref"], ""],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 15, 13],
        "text-font": ["Noto Sans Regular"],
      },
      paint: {
        "text-color": COLORS.bikeInfraLabel,
        "text-halo-color": COLORS.white,
        "text-halo-width": 1.5,
      },
    })
  }

  addBikeInfraPoints(
    map,
    "bike-parking",
    ["==", ["get", "class"], "bike_parking"],
    COLORS.bikeInfraBikeParking
  )
  addBikeInfraPoints(
    map,
    "bike-rental",
    ["==", ["get", "class"], "bike_rental"],
    COLORS.bikeInfraBikeRental
  )
  addBikeInfraPoints(
    map,
    "bike-repair",
    ["==", ["get", "class"], "bike_repair"],
    COLORS.bikeInfraBikeRepair
  )
  addBikeInfraPoints(
    map,
    "ebike-charging",
    ["==", ["get", "class"], "ebike_charging"],
    COLORS.bikeInfraEbikeCharging
  )
}
