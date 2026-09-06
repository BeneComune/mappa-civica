// app\rescue\assets\page.tsx
"use client"

import { Faq } from "@/components/faq"
import { MapFeatureDetail } from "@/components/map-feature-detail"
import { OverlayToggleBadge } from "@/components/overlay-toggle-badge"
import { PageHeader } from "@/components/page-header"
import { COLORS } from "@/lib/colors"
import { ICONS } from "@/lib/ICONS"
import {
  AED_LAYER_IDS,
  ASSEMBLY_POINT_LAYER_IDS,
  FIRE_HYDRANT_LAYER_IDS,
  HEMS_LAYER_IDS,
} from "@/lib/map/overlays/assets"
import { assetDetail } from "@/lib/rescue-details"
import { STRINGS } from "@/lib/strings"

export default function RescueAssetsPage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.rescueAssets}
        title={STRINGS.rescueAssets}
        description={STRINGS.rescueAssetsDescription}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <OverlayToggleBadge
          label={STRINGS.aed}
          icon={ICONS.aed}
          color={COLORS.aed}
          layerIds={AED_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.hems}
          icon={ICONS.hems}
          color={COLORS.hems}
          layerIds={HEMS_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.fireHydrants}
          icon={ICONS.fireHydrants}
          color={COLORS.fireHydrants}
          layerIds={FIRE_HYDRANT_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.assemblyPoints}
          icon={ICONS.assemblyPoints}
          color={COLORS.assemblyPoints}
          layerIds={ASSEMBLY_POINT_LAYER_IDS}
        />
      </div>
      <Faq>
        Defibrillatori (DAE), elisuperfici per l&apos;elisoccorso (HEMS), idranti antincendio e
        punti di raccolta per le emergenze. I DAE sono l&apos;elenco fornito dal Comune di
        Montereale Valcellina, unito ai punti già presenti su OpenStreetMap; alcuni sono
        posizionati a partire dall&apos;indirizzo (da verificare sul posto), come indicato nel
        dettaglio. Elisuperfici, idranti e punti di raccolta vengono da OpenStreetMap: se ne
        conosci uno mancante puoi aggiungerlo tu stesso.
      </Faq>
      <MapFeatureDetail
        layers={[
          { id: "aed-sites", resolve: assetDetail },
          { id: "hems-sites", resolve: assetDetail },
          { id: "fire-hydrant-sites", resolve: assetDetail },
          { id: "assembly-point-sites", resolve: assetDetail },
        ]}
      />
    </div>
  )
}
