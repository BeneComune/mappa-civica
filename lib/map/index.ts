import type { Map } from "maplibre-gl"

export { createBaseMap, onStyleReady } from "./base"
export { setOverlayVisibility } from "./overlays/shared"

import { setOverlayVisibility } from "./overlays/shared"
import { addRiiOverlay, RII_LAYER_IDS } from "./overlays/rii"
import { addFireOverlay, FIRE_LAYER_IDS } from "./overlays/fire"
import { addAssetsOverlay, ASSETS_LAYER_IDS } from "./overlays/assets"
import { addTrailsWaterOverlay, TRAILS_WATER_LAYER_IDS } from "./overlays/trails-water"
import { addBikeInfraOverlay, BIKE_INFRA_LAYER_IDS } from "./overlays/bike-infra"
import { addSlopeOverlay, SLOPE_LAYER_IDS } from "./overlays/slope"
import { addVegetationOverlay, VEGETATION_LAYER_IDS } from "./overlays/vegetation"
import { addNaturalShadeOverlay, NATURAL_SHADE_LAYER_IDS } from "./overlays/natural-shade"
import { addVegetationHealthOverlay, VEGETATION_HEALTH_LAYER_IDS } from "./overlays/vegetation-health"
import { addSoilTemperatureOverlay, SOIL_TEMPERATURE_LAYER_IDS } from "./overlays/soil-temperature"

// Each entry's overlay is added once (idempotently) on every style load, and
// shown only when the current route matches `path`. Add a row here for each
// new overlay ported instead of wiring it by hand in map-view.tsx.
export const ROUTE_OVERLAYS: Array<{ path: string; add: (map: Map) => void; layerIds: string[] }> = [
  { path: "/rescue/events", add: addRiiOverlay, layerIds: RII_LAYER_IDS },
  { path: "/rescue/fire", add: addFireOverlay, layerIds: FIRE_LAYER_IDS },
  { path: "/rescue/assets", add: addAssetsOverlay, layerIds: ASSETS_LAYER_IDS },
  { path: "/outdoor/trails/trails", add: addTrailsWaterOverlay, layerIds: TRAILS_WATER_LAYER_IDS },
  { path: "/outdoor/cyclability/bike-infra", add: addBikeInfraOverlay, layerIds: BIKE_INFRA_LAYER_IDS },
  { path: "/outdoor/trails/slope", add: addSlopeOverlay, layerIds: SLOPE_LAYER_IDS },
  { path: "/green/ndvi", add: addVegetationOverlay, layerIds: VEGETATION_LAYER_IDS },
  { path: "/green/shade", add: addNaturalShadeOverlay, layerIds: NATURAL_SHADE_LAYER_IDS },
  { path: "/green/nbr", add: addVegetationHealthOverlay, layerIds: VEGETATION_HEALTH_LAYER_IDS },
  { path: "/green/lst", add: addSoilTemperatureOverlay, layerIds: SOIL_TEMPERATURE_LAYER_IDS },
]

export function syncOverlayVisibility(map: Map, pathname: string): void {
  for (const overlay of ROUTE_OVERLAYS) {
    setOverlayVisibility(map, overlay.layerIds, pathname === overlay.path)
  }
}
