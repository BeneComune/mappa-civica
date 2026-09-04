// lib\map\overlays\route.ts
import type { Map } from "maplibre-gl"

// The computed route's line geometry (see lib/routing.ts). Start/end/
// waypoint markers are plain draggable maplibregl.Marker instances owned by
// RoutePlanner, not layer features - only the line itself lives on this
// source. Shared by both Outdoor routing pages (Cyclability and Trails).
export const ROUTE_LAYER_IDS = ["route-line-casing", "route-line"]

export function addRouteOverlay(map: Map): void {
  if (!map.getSource("route")) {
    map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } })
  }

  if (!map.getLayer("route-line-casing")) {
    map.addLayer({
      id: "route-line-casing",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 0.8,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 6, 15, 10],
      },
    })
  }

  if (!map.getLayer("route-line")) {
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": "#1d4ed8",
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 5.5],
      },
    })
  }
}
