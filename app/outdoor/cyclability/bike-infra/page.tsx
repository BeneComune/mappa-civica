"use client"

import { Faq } from "@/components/faq"
import { OverlayCheckbox } from "@/components/overlay-checkbox"
import { STRINGS } from "@/lib/strings"

const BIKE_LANE_LAYER_IDS = ["bike-lane-casing", "bike-lane-network", "bike-lane-labels"]

export default function CyclabilityBikeInfraPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">{STRINGS.bikeInfra}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.bikeInfraDescription}</p>
      <div className="mt-3 flex flex-col gap-2">
        <OverlayCheckbox label={STRINGS.bikeInfraCiclabili} layerIds={BIKE_LANE_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.bikeInfraBikeParking} layerIds={["bike-infra-bike-parking"]} />
        <OverlayCheckbox label={STRINGS.bikeInfraBikeRental} layerIds={["bike-infra-bike-rental"]} />
        <OverlayCheckbox label={STRINGS.bikeInfraBikeRepair} layerIds={["bike-infra-bike-repair"]} />
        <OverlayCheckbox label={STRINGS.bikeInfraEbikeCharging} layerIds={["bike-infra-ebike-charging"]} />
      </div>
      <Faq>
        Piste ciclabili (incluso il percorso regionale FVG3 / MV 06), rastrelliere per parcheggiare la bici, punti
        di bike sharing, officine per la riparazione e colonnine di ricarica per e-bike, mappati da OpenStreetMap.
      </Faq>
    </div>
  )
}
