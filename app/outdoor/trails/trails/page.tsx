"use client"

import { Faq } from "@/components/faq"
import { OverlayToggleBadge } from "@/components/overlay-toggle-badge"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

const HIKING_LAYER_IDS = ["trail-casing-hiking", "trail-network-hiking", "trail-labels-hiking"]
const MTB_LAYER_IDS = ["trail-casing-mtb", "trail-network-mtb", "trail-labels-mtb"]
const DRINKING_WATER_LAYER_IDS = ["water-poi-drinking-water", "water-poi-labels-drinking-water"]
const SPRING_LAYER_IDS = ["water-poi-spring", "water-poi-labels-spring"]
const PICNIC_LAYER_IDS = ["water-poi-picnic", "water-poi-labels-picnic"]

export default function TrailsWaterPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">{STRINGS.waterPoints}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.waterPointsDescription}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <OverlayToggleBadge
          label={STRINGS.waterPointsHiking}
          icon={ICONS.waterPointsHiking}
          color="#4f7b3a"
          layerIds={HIKING_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.waterPointsMtb}
          icon={ICONS.waterPointsMtb}
          color="#2f78c4"
          layerIds={MTB_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.waterPointsDrinkingWater}
          icon={ICONS.waterPointsDrinkingWater}
          color="#2b8a3e"
          layerIds={DRINKING_WATER_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.waterPointsSpring}
          icon={ICONS.waterPointsSpring}
          color="#74c0fc"
          layerIds={SPRING_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.waterPointsPicnic}
          icon={ICONS.waterPointsPicnic}
          color="#f59f00"
          layerIds={PICNIC_LAYER_IDS}
        />
      </div>
      <Faq>
        Sentieri segnalati dal CAI (Club Alpino Italiano) per l&apos;escursionismo a piedi, e percorsi adatti alla
        mountain bike. Tracciati mappati da OpenStreetMap.
      </Faq>
    </div>
  )
}
