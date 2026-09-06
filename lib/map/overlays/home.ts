// lib\map\overlays\home.ts
import type { Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"

// Home module from the old app's BaseModule: the municipality boundary
// (always shown on "/") plus cadastral parcels. The parcels are vector tiles
// (public/data/catasto.pmtiles, one "catasto" layer) served through the
// pmtiles:// protocol registered in lib/map/base; the layers stay hidden
// until the "Particelle catastali" toggle shows them and zooms in. minzoom
// lowered from the old app's 15/16 to 13/14 so parcels show up without
// having to zoom in quite as far.
export const HOME_LAYER_IDS = ["boundary-fill", "boundary-outline"]
export const CATASTO_LAYER_IDS = ["catasto-points", "catasto-labels"]
const CATASTO_SOURCE_LAYER = "catasto"

export function addHomeOverlay(map: Map): void {
  if (!map.getSource("municipalityBoundary")) {
    map.addSource("municipalityBoundary", { type: "geojson", data: "/data/boundary.geojson" })
  }
  if (!map.getSource("catasto")) {
    map.addSource("catasto", { type: "vector", url: "pmtiles:///data/catasto.pmtiles" })
  }

  if (!map.getLayer("boundary-fill")) {
    map.addLayer({
      id: "boundary-fill",
      type: "fill",
      source: "municipalityBoundary",
      layout: { visibility: "none" },
      paint: { "fill-color": COLORS.boundaryFill, "fill-opacity": 0.06 },
    })
  }
  if (!map.getLayer("boundary-outline")) {
    map.addLayer({
      id: "boundary-outline",
      type: "line",
      source: "municipalityBoundary",
      layout: { visibility: "none" },
      paint: {
        "line-color": COLORS.boundaryOutline,
        "line-width": 2,
        "line-opacity": 0.7,
        "line-dasharray": [4, 3],
      },
    })
  }

  if (!map.getLayer("catasto-hit")) {
    // Invisible (circle-radius 0), always present and never visibility:none -
    // that's what keeps the catasto vector source "used" so MapLibre loads
    // its tiles at every zoom, on every page. querySourceFeatures reads those
    // tiles for the Segnala parcel autofill (see use-nearest-parcel.ts); the
    // visible catasto-points layer only exists from zoom 13 and only on "/".
    map.addLayer({
      id: "catasto-hit",
      type: "circle",
      source: "catasto",
      "source-layer": CATASTO_SOURCE_LAYER,
      paint: { "circle-radius": 0 },
    })
  }

  if (!map.getLayer("catasto-points")) {
    map.addLayer({
      id: "catasto-points",
      type: "circle",
      source: "catasto",
      "source-layer": CATASTO_SOURCE_LAYER,
      minzoom: 13,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 2, 15, 3.5, 18, 6.5],
        "circle-color": COLORS.catastoPoint,
        "circle-stroke-color": COLORS.white,
        "circle-stroke-width": 1.2,
        "circle-opacity": 0.9,
      },
    })
  }
  if (!map.getLayer("catasto-labels")) {
    map.addLayer({
      id: "catasto-labels",
      type: "symbol",
      source: "catasto",
      "source-layer": CATASTO_SOURCE_LAYER,
      minzoom: 14,
      layout: {
        visibility: "none",
        "text-field": ["get", "particella"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 14, 8, 19, 13],
        "text-font": ["Noto Sans Regular"],
        "text-optional": true,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": COLORS.catastoLabel,
        "text-halo-color": COLORS.white,
        "text-halo-width": 1.6,
      },
    })
  }
}
