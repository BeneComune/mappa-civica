// lib\map\overlays\rii.ts
import type { ExpressionSpecification, Map } from "maplibre-gl"

// "Rii a rischio esondazione" - the volunteer stream census (Censimento
// RII) from the old app's RescueModule. Geometry is a mix: the real
// watercourse line from OpenStreetMap where it has the named stream,
// otherwise a single point (faded when its position is only approximate).
// Colour encodes how current the survey is.
export const RII_LAYER_IDS = ["rii-line-casing", "rii-line", "rii-points", "rii-labels"]

const RII_SOURCE_ID = "rii"

const RII_COLOR: ExpressionSpecification = [
  "match",
  ["get", "stato"],
  "aggiornato_2024", "#1c7ed6",
  "solo_foto_2024", "#4dabf7",
  "storico_2013", "#f59f00",
  "storico_2007", "#e8590c",
  "#868e96",
]

// Features carry a stable top-level `id` in the source GeoJSON already, so
// no generateId is needed for setFeatureState to work.
const RII_HOVER: ExpressionSpecification = ["boolean", ["feature-state", "hover"], false]

export function addRiiOverlay(map: Map): void {
  if (!map.getSource(RII_SOURCE_ID)) {
    map.addSource(RII_SOURCE_ID, {
      type: "geojson",
      data: "/data/rescue/rii.geojson",
    })
  }

  if (!map.getLayer("rii-line-casing")) {
    // White casing under the stream line, for legibility over the basemap.
    map.addLayer({
      id: "rii-line-casing",
      type: "line",
      source: RII_SOURCE_ID,
      filter: ["==", ["geometry-type"], "LineString"],
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 0.7,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 4.5, 15, 9],
      },
    })
  }

  if (!map.getLayer("rii-line")) {
    map.addLayer({
      id: "rii-line",
      type: "line",
      source: RII_SOURCE_ID,
      filter: ["==", ["geometry-type"], "LineString"],
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": RII_COLOR,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          11, ["case", RII_HOVER, 4.5, 2.5],
          15, ["case", RII_HOVER, 8, 5.5],
        ],
      },
    })
  }

  if (!map.getLayer("rii-points")) {
    map.addLayer({
      id: "rii-points",
      type: "circle",
      source: RII_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Point"],
      layout: { visibility: "none" },
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          11, ["case", RII_HOVER, 8, 6],
          15, ["case", RII_HOVER, 15, 11],
        ],
        "circle-color": RII_COLOR,
        "circle-opacity": ["case", ["boolean", ["get", "pos_approssimata"], false], 0.5, 0.9],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": ["case", RII_HOVER, 3, 1.8],
      },
    })
  }

  if (!map.getLayer("rii-labels")) {
    map.addLayer({
      id: "rii-labels",
      type: "symbol",
      source: RII_SOURCE_ID,
      minzoom: 12,
      layout: {
        visibility: "none",
        "text-field": ["get", "nome"],
        "text-offset": [0, 1.3],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 15, 13],
        "text-font": ["Noto Sans Regular"],
        "text-optional": true,
      },
      paint: {
        "text-color": "#1b3a4b",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.6,
      },
    })
  }
}
