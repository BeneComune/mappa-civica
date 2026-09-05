// lib\map\index.ts
import type { Map } from "maplibre-gl"

// This barrel re-exports ./base, which does a real (non-type-only) runtime
// `import * as maplibregl from "maplibre-gl"`. Importing anything from this
// file - even a plain string constant like RII_LAYER_IDS - pulls maplibre-gl
// into whatever bundle does the importing. That's fine from Client
// Components (map-view.tsx, map-provider.tsx), but breaks the build if a
// Server Component (a page.tsx without "use client") imports from here: use
// `@/lib/map/overlays/<name>` directly instead in that case, since overlay
// files only import maplibre-gl's types (erased at compile time).
export { createBaseMap, onStyleReady } from "./base"
export { setOverlayVisibility } from "./overlays/shared"
export { CATASTO_LAYER_IDS } from "./overlays/home"

import { setOverlayVisibility } from "./overlays/shared"
import { addHomeOverlay, HOME_LAYER_IDS } from "./overlays/home"
import { addRiiOverlay, RII_LAYER_IDS } from "./overlays/rii"
import { addFireOverlay, FIRE_LAYER_IDS } from "./overlays/fire"
import { addAssetsOverlay, ASSETS_LAYER_IDS } from "./overlays/assets"
import { addTrailsWaterOverlay, TRAILS_WATER_LAYER_IDS } from "./overlays/trails-water"
import { addBikeInfraOverlay, BIKE_INFRA_LAYER_IDS } from "./overlays/bike-infra"
import { addSlopeOverlay, SLOPE_LAYER_IDS } from "./overlays/slope"
import { addPeaksOverlay, PEAKS_LAYER_IDS } from "./overlays/peaks"
import { addVegetationOverlay, VEGETATION_LAYER_IDS } from "./overlays/vegetation"
import { addNaturalShadeOverlay, NATURAL_SHADE_LAYER_IDS } from "./overlays/natural-shade"
import { addVegetationHealthOverlay, VEGETATION_HEALTH_LAYER_IDS } from "./overlays/vegetation-health"
import { addSoilTemperatureOverlay, SOIL_TEMPERATURE_LAYER_IDS } from "./overlays/soil-temperature"
import { addRouteOverlay, ROUTE_LAYER_IDS } from "./overlays/route"
import { addHospitalOverlay, HOSPITAL_LAYER_IDS } from "./overlays/hospital"

// Each entry's overlay is added once (idempotently) on every style load, and
// shown only when the current route matches `path` (or is included in it,
// for overlays shared by more than one route - e.g. the route planner line,
// shown on both the Cyclability and Trails routing pages). Add a row here
// for each new overlay ported instead of wiring it by hand in map-view.tsx.
export const ROUTE_OVERLAYS: Array<{
  path: string | string[]
  add: (map: Map) => void
  layerIds: string[]
}> = [
  { path: "/", add: addHomeOverlay, layerIds: HOME_LAYER_IDS },
  { path: "/rescue/events", add: addRiiOverlay, layerIds: RII_LAYER_IDS },
  { path: "/rescue/fire", add: addFireOverlay, layerIds: FIRE_LAYER_IDS },
  { path: "/rescue/assets", add: addAssetsOverlay, layerIds: ASSETS_LAYER_IDS },
  { path: "/rescue/hospital", add: addHospitalOverlay, layerIds: HOSPITAL_LAYER_IDS },
  { path: "/outdoor/trails/trails", add: addTrailsWaterOverlay, layerIds: TRAILS_WATER_LAYER_IDS },
  { path: "/outdoor/cyclability/bike-infra", add: addBikeInfraOverlay, layerIds: BIKE_INFRA_LAYER_IDS },
  { path: "/outdoor/trails/slope", add: addSlopeOverlay, layerIds: SLOPE_LAYER_IDS },
  { path: "/outdoor/trails/peaks", add: addPeaksOverlay, layerIds: PEAKS_LAYER_IDS },
  { path: "/green/ndvi", add: addVegetationOverlay, layerIds: VEGETATION_LAYER_IDS },
  { path: "/green/shade", add: addNaturalShadeOverlay, layerIds: NATURAL_SHADE_LAYER_IDS },
  { path: "/green/nbr", add: addVegetationHealthOverlay, layerIds: VEGETATION_HEALTH_LAYER_IDS },
  { path: "/green/lst", add: addSoilTemperatureOverlay, layerIds: SOIL_TEMPERATURE_LAYER_IDS },
  {
    path: ["/outdoor/cyclability/routing", "/outdoor/trails/routing", "/rescue/hospital"],
    add: addRouteOverlay,
    layerIds: ROUTE_LAYER_IDS,
  },
]

export function syncOverlayVisibility(map: Map, pathname: string): void {
  for (const overlay of ROUTE_OVERLAYS) {
    const matches = Array.isArray(overlay.path)
      ? overlay.path.includes(pathname)
      : pathname === overlay.path
    setOverlayVisibility(map, overlay.layerIds, matches)
  }
}
