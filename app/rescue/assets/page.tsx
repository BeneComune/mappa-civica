import { OverlayCheckbox } from "@/components/overlay-checkbox"
import {
  AED_LAYER_IDS,
  ASSEMBLY_POINT_LAYER_IDS,
  FIRE_HYDRANT_LAYER_IDS,
  HEMS_LAYER_IDS,
} from "@/lib/map/overlays/assets"
import { STRINGS } from "@/lib/strings"

export default function RescueAssetsPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">{STRINGS.rescueAssets}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.rescueAssetsDescription}</p>
      <div className="mt-3 flex flex-col gap-2">
        <OverlayCheckbox label={STRINGS.aed} layerIds={AED_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.hems} layerIds={HEMS_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.fireHydrants} layerIds={FIRE_HYDRANT_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.assemblyPoints} layerIds={ASSEMBLY_POINT_LAYER_IDS} />
      </div>
    </div>
  )
}
