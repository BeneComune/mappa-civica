"use client"

import { Faq } from "@/components/faq"
import { OverlayCheckbox } from "@/components/overlay-checkbox"
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
      <div className="mt-3 flex flex-col gap-2">
        <OverlayCheckbox label={STRINGS.waterPointsHiking} layerIds={HIKING_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.waterPointsMtb} layerIds={MTB_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.waterPointsDrinkingWater} layerIds={DRINKING_WATER_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.waterPointsSpring} layerIds={SPRING_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.waterPointsPicnic} layerIds={PICNIC_LAYER_IDS} />
      </div>
      <Faq>
        Sentieri segnalati dal CAI (Club Alpino Italiano) per l&apos;escursionismo a piedi, e percorsi adatti alla
        mountain bike. Tracciati mappati da OpenStreetMap.
      </Faq>
    </div>
  )
}
