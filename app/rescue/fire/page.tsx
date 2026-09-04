"use client"

import { ClickPopupLayer } from "@/components/click-popup-layer"
import { FilterCheckboxGroup } from "@/components/filter-checkbox-group"
import { OverlayCheckbox } from "@/components/overlay-checkbox"
import {
  FIRE_DANGER_LAYER_IDS,
  FIRE_IGNITION_LAYER_IDS,
  FIRE_NBR_LAYER_IDS,
  FIRE_PERIMETERS_LAYER_IDS,
} from "@/lib/map/overlays/fire"
import { dangerPopupHTML, firePopupHTML, ignitionPopupHTML } from "@/lib/rescue-popups"
import { STRINGS } from "@/lib/strings"

const CAUSE_OPTIONS = [
  { value: "dolosa", label: STRINGS.fireCauseDolosa },
  { value: "colposa", label: STRINGS.fireCauseColposa },
  { value: "naturale", label: STRINGS.fireCauseNaturale },
  { value: "ignota", label: STRINGS.fireCauseIgnota },
]

export default function RescueFirePage() {
  return (
    <div>
      <ClickPopupLayer layerId="fire-perimeters-fill" render={firePopupHTML} />
      <ClickPopupLayer layerId="fire-danger-fill" render={dangerPopupHTML} />
      <ClickPopupLayer layerId="fire-ignition-points" render={ignitionPopupHTML} />
      <h2 className="text-xl font-semibold">{STRINGS.wildfires}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.wildfiresDescription}</p>
      <div className="mt-3 flex flex-col gap-3">
        <FilterCheckboxGroup property="causa_classe" options={CAUSE_OPTIONS} layerIds={FIRE_PERIMETERS_LAYER_IDS} />
        <div className="flex flex-col gap-2 border-t pt-3">
          <OverlayCheckbox label={STRINGS.fireDangerToggle} layerIds={FIRE_DANGER_LAYER_IDS} defaultChecked={false} />
          <OverlayCheckbox
            label={STRINGS.fireIgnitionToggle}
            layerIds={FIRE_IGNITION_LAYER_IDS}
            defaultChecked={false}
          />
          <OverlayCheckbox label={STRINGS.fireNbrToggle} layerIds={FIRE_NBR_LAYER_IDS} defaultChecked={false} />
        </div>
      </div>
    </div>
  )
}
