// app\outdoor\trails\slope\page.tsx
"use client"

import { Faq } from "@/components/faq"
import { FilterBadgeGroup } from "@/components/filter-badge-group"
import { PageHeader } from "@/components/page-header"
import { COLORS } from "@/lib/colors"
import { ICONS } from "@/lib/ICONS"
import { SLOPE_LAYER_IDS } from "@/lib/map/overlays/slope"
import { STRINGS } from "@/lib/strings"

const SLOPE_OPTIONS = [
  { value: "0-3: flat", label: STRINGS.slopeFlat, color: COLORS.slopeFlat },
  { value: "3-5: mild", label: STRINGS.slopeMild, color: COLORS.slopeMild },
  { value: "5-8: medium", label: STRINGS.slopeMedium, color: COLORS.slopeMedium },
  { value: "8-10: hard", label: STRINGS.slopeHard, color: COLORS.slopeHard },
  { value: "10-20: extreme", label: STRINGS.slopeExtreme, color: COLORS.slopeExtreme },
  { value: ">20: impossible", label: STRINGS.slopeImpossible, color: COLORS.slopeImpossible },
]

export default function TrailsSlopePage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.slope}
        title={STRINGS.slope}
        description={STRINGS.slopeDescription}
      />
      <div className="mt-3">
        <FilterBadgeGroup property="slope_class" options={SLOPE_OPTIONS} layerIds={SLOPE_LAYER_IDS} />
      </div>
      <Faq>
        Pendenza media di ogni tratto, calcolata dal modello digitale del terreno (DEM/LiDAR). Le
        classi vanno da pianeggiante (0-3%) a impraticabile (oltre il 20%), con etichette pensate
        per chi cammina più che per chi pedala.
      </Faq>
    </div>
  )
}
