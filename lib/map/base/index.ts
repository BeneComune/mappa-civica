// lib\map\base\index.ts
import * as maplibregl from "maplibre-gl"
import type { Map } from "maplibre-gl"
import { Protocol } from "pmtiles"
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
  // Serves the catasto vector tiles from a single public/data/catasto.pmtiles
  // archive (source url "pmtiles:///data/catasto.pmtiles"). Only catasto uses
  // it - every other layer is still plain GeoJSON.
  maplibregl.addProtocol("pmtiles", new Protocol().tile)
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
  // Below md the map opens flat (the tilted view is disorienting and the
  // terrain tiles cost data on a phone); the Terrain 3D button re-enables it.
  const isMobile = window.matchMedia("(max-width: 47.999rem)").matches

  const map = new maplibregl.Map({
    container,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    pitch: isMobile ? 0 : 60,
    style: BASEMAP_STYLE_URLS[DEFAULT_BASEMAP_STYLE],
    attributionControl: false,
    // Needed for the print/export control to read back a valid PNG from the
    // WebGL canvas via toDataURL().
    canvasContextAttributes: { preserveDrawingBuffer: true },
  })

  let terrainOn = !isMobile

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

  // Fullscreen is a no-op on mobile browsers and PDF export is a desktop task -
  // both dropped below md; the rest keep their desktop order.
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")
  if (!isMobile) {
    map.addControl(new maplibregl.FullscreenControl(), "top-right")
  }
  map.addControl(new MapSearchControl(), "top-right")
  map.addControl(
    new MapTerrainControl(terrainOn, (on) => {
      terrainOn = on
    }),
    "top-right"
  )
  if (!isMobile) {
    map.addControl(new MapPrintControl(printLabel, productName), "top-right")
  }
  // Bottom-corner controls stack with the most-recently-added one closest to
  // the map edge, so attribution (added first) ends up below Legenda. On
  // mobile both start collapsed (attribution to just the "i", Legenda shut).
  map.addControl(new maplibregl.AttributionControl(isMobile ? { compact: true } : undefined), "bottom-right")
  map.addControl(new MapStyleControl(DEFAULT_BASEMAP_STYLE, isMobile), "bottom-right")

  if (isMobile) {
    // MapLibre's compact attribution shows itself once the map loads;
    // collapse it back to just the "i" (it re-opens on tap).
    const collapseAttrib = () =>
      container
        .querySelector(".maplibregl-ctrl-attrib.maplibregl-compact")
        ?.classList.remove("maplibregl-compact-show")
    map.once("idle", collapseAttrib)
  }

  return map
}
