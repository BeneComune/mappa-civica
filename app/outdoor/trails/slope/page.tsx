"use client"

import { Faq } from "@/components/faq"
import { FilterBadgeGroup } from "@/components/filter-badge-group"
import { PageHeader } from "@/components/page-header"
import { ICONS } from "@/lib/ICONS"
import { SLOPE_LAYER_IDS } from "@/lib/map/overlays/slope"
import { STRINGS } from "@/lib/strings"

// Colors match SLOPE_COLOR in lib/map/overlays/slope.ts.
const SLOPE_OPTIONS = [
  { value: "0-3: flat", label: STRINGS.slopeFlat, color: "#2b8a3e" },
  { value: "3-5: mild", label: STRINGS.slopeMild, color: "#74c69d" },
  { value: "5-8: medium", label: STRINGS.slopeMedium, color: "#ffd43b" },
  { value: "8-10: hard", label: STRINGS.slopeHard, color: "#ff922b" },
  { value: "10-20: extreme", label: STRINGS.slopeExtreme, color: "#e03131" },
  { value: ">20: impossible", label: STRINGS.slopeImpossible, color: "#7f1d1d" },
]

export default function TrailsSlopePage() {
  return (
    <div>
      <PageHeader icon={ICONS.slope} title={STRINGS.slope} description={STRINGS.slopeDescription} />
      <div className="mt-3">
        <FilterBadgeGroup property="slope_class" options={SLOPE_OPTIONS} layerIds={SLOPE_LAYER_IDS} />
      </div>
      <Faq>
        Pendenza media di ogni tratto, calcolata dal modello digitale del terreno (DEM/LiDAR). Le classi vanno da
        pianeggiante (0-3%) a impraticabile (oltre il 20%), con etichette pensate per chi cammina più che per chi
        pedala.
      </Faq>
    </div>
  )
}
