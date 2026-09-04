"use client"

import { Faq } from "@/components/faq"
import { OverlayToggleBadge } from "@/components/overlay-toggle-badge"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

const BIKE_LANE_LAYER_IDS = ["bike-lane-casing", "bike-lane-network", "bike-lane-labels"]

export default function CyclabilityBikeInfraPage() {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <ICONS.bikeInfra aria-hidden="true" className="size-5" />
        {STRINGS.bikeInfra}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.bikeInfraDescription}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <OverlayToggleBadge
          label={STRINGS.bikeInfraCiclabili}
          icon={ICONS.bikeInfraCiclabili}
          color="#2f78c4"
          layerIds={BIKE_LANE_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.bikeInfraBikeParking}
          icon={ICONS.bikeInfraBikeParking}
          color="#2f78c4"
          layerIds={["bike-infra-bike-parking"]}
        />
        <OverlayToggleBadge
          label={STRINGS.bikeInfraBikeRental}
          icon={ICONS.bikeInfraBikeRental}
          color="#2b8a3e"
          layerIds={["bike-infra-bike-rental"]}
        />
        <OverlayToggleBadge
          label={STRINGS.bikeInfraBikeRepair}
          icon={ICONS.bikeInfraBikeRepair}
          color="#7b2cbf"
          layerIds={["bike-infra-bike-repair"]}
        />
        <OverlayToggleBadge
          label={STRINGS.bikeInfraEbikeCharging}
          icon={ICONS.bikeInfraEbikeCharging}
          color="#f59f00"
          layerIds={["bike-infra-ebike-charging"]}
        />
      </div>
      <Faq>
        Piste ciclabili (incluso il percorso regionale FVG3 / MV 06), rastrelliere per parcheggiare la bici, punti
        di bike sharing, officine per la riparazione e colonnine di ricarica per e-bike, mappati da OpenStreetMap.
      </Faq>
    </div>
  )
}
