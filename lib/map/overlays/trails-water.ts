import type { FilterSpecification, Map } from "maplibre-gl"

// "Sentieri e punti acqua" from the old app's OutdoorModule: hiking/MTB
// trail network (casing + coloured line + label per category) plus
// drinking water, springs, and picnic areas.
export const TRAILS_WATER_LAYER_IDS = [
  "trail-casing-hiking",
  "trail-network-hiking",
  "trail-labels-hiking",
  "trail-casing-mtb",
  "trail-network-mtb",
  "trail-labels-mtb",
  "water-poi-drinking-water",
  "water-poi-labels-drinking-water",
  "water-poi-spring",
  "water-poi-labels-spring",
  "water-poi-picnic",
  "water-poi-labels-picnic",
]

function addTrailLayers(
  map: Map,
  sourceId: string,
  categoryId: string,
  filter: FilterSpecification,
  options: { casingColor: string; lineColor: string; labelColor: string; dasharray: number[] }
): void {
  if (!map.getLayer(`trail-casing-${categoryId}`)) {
    map.addLayer({
      id: `trail-casing-${categoryId}`,
      type: "line",
      source: sourceId,
      filter,
      layout: { visibility: "none" },
      paint: {
        "line-color": options.casingColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 3.4, 14, 7.8],
        "line-opacity": 0.9,
      },
    })
  }

  if (!map.getLayer(`trail-network-${categoryId}`)) {
    map.addLayer({
      id: `trail-network-${categoryId}`,
      type: "line",
      source: sourceId,
      filter,
      layout: { visibility: "none" },
      paint: {
        "line-color": options.lineColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.9, 14, 2.4],
        "line-opacity": 1,
        "line-dasharray": options.dasharray,
      },
    })
  }

  if (!map.getLayer(`trail-labels-${categoryId}`)) {
    map.addLayer({
      id: `trail-labels-${categoryId}`,
      type: "symbol",
      source: sourceId,
      filter,
      layout: {
        visibility: "none",
        "symbol-placement": "line",
        "text-field": ["coalesce", ["get", "name:it"], ["get", "name"], ""],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 15, 13],
        "text-font": ["Noto Sans Regular"],
      },
      paint: {
        "text-color": options.labelColor,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.8,
      },
    })
  }
}

function addWaterLayers(
  map: Map,
  sourceId: string,
  categoryId: string,
  filter: FilterSpecification,
  color: string
): void {
  if (!map.getLayer(`water-poi-${categoryId}`)) {
    map.addLayer({
      id: `water-poi-${categoryId}`,
      type: "circle",
      source: sourceId,
      filter,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 7],
        "circle-color": color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.95,
      },
    })
  }

  if (!map.getLayer(`water-poi-labels-${categoryId}`)) {
    map.addLayer({
      id: `water-poi-labels-${categoryId}`,
      type: "symbol",
      source: sourceId,
      filter,
      layout: {
        visibility: "none",
        "text-field": ["coalesce", ["get", "name:it"], ["get", "name"], ""],
        "text-offset": [0, 1.2],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 15, 12],
        "text-font": ["Noto Sans Regular"],
      },
      paint: {
        "text-color": "#7a4d00",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    })
  }
}

export function addTrailsWaterOverlay(map: Map): void {
  if (!map.getSource("trails")) {
    map.addSource("trails", { type: "geojson", data: "/data/outdoor/trails_shaded.geojson" })
  }
  if (!map.getSource("water")) {
    map.addSource("water", { type: "geojson", data: "/data/outdoor/water.geojson" })
  }

  addTrailLayers(map, "trails", "hiking", ["in", ["get", "class"], ["literal", ["path", "track", "bridleway"]]], {
    casingColor: "#dfe9d8",
    lineColor: "#4f7b3a",
    labelColor: "#436432",
    dasharray: [1, 0],
  })
  addTrailLayers(map, "trails", "mtb", ["in", ["get", "class"], ["literal", ["track", "cycleway"]]], {
    casingColor: "#d9e7f4",
    lineColor: "#2f78c4",
    labelColor: "#245c99",
    dasharray: [1.8, 1],
  })

  addWaterLayers(map, "water", "drinking-water", ["==", ["get", "class"], "drinking_water"], "#2b8a3e")
  addWaterLayers(map, "water", "spring", ["==", ["get", "class"], "spring"], "#74c0fc")
  addWaterLayers(
    map,
    "water",
    "picnic",
    ["in", ["get", "class"], ["literal", ["picnic_site", "picnic_area"]]],
    "#f59f00"
  )
}
