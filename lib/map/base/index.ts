// lib\map\base\index.ts
import * as maplibregl from "maplibre-gl"
import type { Map } from "maplibre-gl"
import { MUNICIPALITY_CENTER, MUNICIPALITY_ZOOM } from "@/lib/config"

// Ported from the old app's lib/map.ts. Base map: basemap style, controls
// (style switcher, search, terrain, print), worker setup.

import { MapStyleControl } from "./style-control"
import { MapSearchControl } from "./search-control"
import { MapTerrainControl } from "./terrain-control"
import { MapPrintControl } from "./print-control"
import { BASEMAP_STYLE_URLS, DEFAULT_BASEMAP_STYLE, TERRAIN_SOURCE_ID } from "./styles"

// maplibre-gl-worker.mjs imports a sibling chunk (maplibre-gl-shared.mjs) via
// a relative import that Vite historically didn't resolve correctly (see the
// old app's lib/map.ts). Both files are copied verbatim into
// public/maplibre-gl/ as a precaution. Re-copy them from
// node_modules/maplibre-gl/dist/ if maplibre-gl is upgraded.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl/maplibre-gl-worker.mjs")
}

const DEFAULT_CENTER = MUNICIPALITY_CENTER
const DEFAULT_ZOOM = MUNICIPALITY_ZOOM

// Runs `fn` once immediately if the style is already loaded, and again after
// every future style load - the basemap switcher's setStyle() wipes any
// overlay source/layer not part of the new style document, so overlays must
// be re-added on every style load, not just the first one.
export function onStyleReady(map: Map, fn: () => void): () => void {
  if (map.isStyleLoaded()) fn()
  map.on("style.load", fn)
  return () => map.off("style.load", fn)
}

export function createBaseMap(
  container: HTMLElement,
  printLabel: string,
  productName: string
): Map {
  const map = new maplibregl.Map({
    container,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    pitch: 60,
    style: BASEMAP_STYLE_URLS[DEFAULT_BASEMAP_STYLE],
    attributionControl: false,
    // Needed for the print/export control to read back a valid PNG from the
    // WebGL canvas via toDataURL().
    canvasContextAttributes: { preserveDrawingBuffer: true },
  })

  let terrainOn = true

  map.on("style.load", () => {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: "raster-dem",
        tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"],
        tileSize: 512,
        encoding: "terrarium",
        maxzoom: 13,
      })
    }
    if (terrainOn) {
      map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.3 })
    }
  })

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")
  map.addControl(new maplibregl.FullscreenControl(), "top-right")
  map.addControl(new MapSearchControl(), "top-right")
  map.addControl(
    new MapTerrainControl(terrainOn, (on) => {
      terrainOn = on
    }),
    "top-right"
  )
  map.addControl(new MapPrintControl(printLabel, productName), "top-right")
  // Bottom-corner controls stack with the most-recently-added one closest to
  // the map edge, so attribution (added first) ends up below Legenda.
  map.addControl(new maplibregl.AttributionControl(), "bottom-right")
  map.addControl(new MapStyleControl(DEFAULT_BASEMAP_STYLE), "bottom-right")

  return map
}
