"use client"

import { Faq } from "@/components/faq"
import { FilterCheckboxGroup } from "@/components/filter-checkbox-group"
import { ICONS } from "@/lib/ICONS"
import { SLOPE_LAYER_IDS } from "@/lib/map/overlays/slope"
import { STRINGS } from "@/lib/strings"

const SLOPE_OPTIONS = [
  { value: "0-3: flat", label: STRINGS.slopeFlat },
  { value: "3-5: mild", label: STRINGS.slopeMild },
  { value: "5-8: medium", label: STRINGS.slopeMedium },
  { value: "8-10: hard", label: STRINGS.slopeHard },
  { value: "10-20: extreme", label: STRINGS.slopeExtreme },
  { value: ">20: impossible", label: STRINGS.slopeImpossible },
]

export default function TrailsSlopePage() {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <ICONS.slope aria-hidden="true" className="size-5" />
        {STRINGS.slope}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.slopeDescription}</p>
      <div className="mt-3">
        <FilterCheckboxGroup property="slope_class" options={SLOPE_OPTIONS} layerIds={SLOPE_LAYER_IDS} />
      </div>
      <Faq>
        Pendenza media di ogni tratto, calcolata dal modello digitale del terreno (DEM/LiDAR). Le classi vanno da
        pianeggiante (0-3%) a impraticabile (oltre il 20%), con etichette pensate per chi cammina più che per chi
        pedala.
      </Faq>
    </div>
  )
}
