// app\rescue\assets\page.tsx
"use client"

import { ClickPopupLayer } from "@/components/click-popup-layer"
import { Faq } from "@/components/faq"
import { OverlayToggleBadge } from "@/components/overlay-toggle-badge"
import { PageHeader } from "@/components/page-header"
import { ICONS } from "@/lib/ICONS"
import {
  AED_LAYER_IDS,
  ASSEMBLY_POINT_LAYER_IDS,
  FIRE_HYDRANT_LAYER_IDS,
  HEMS_LAYER_IDS,
} from "@/lib/map/overlays/assets"
import { assetPopupHTML } from "@/lib/rescue-popups"
import { STRINGS } from "@/lib/strings"

export default function RescueAssetsPage() {
  return (
    <div>
      <ClickPopupLayer layerId="aed-sites" render={assetPopupHTML} />
      <ClickPopupLayer layerId="hems-sites" render={assetPopupHTML} />
      <ClickPopupLayer layerId="fire-hydrant-sites" render={assetPopupHTML} />
      <ClickPopupLayer layerId="assembly-point-sites" render={assetPopupHTML} />
      <PageHeader
        icon={ICONS.rescueAssets}
        title={STRINGS.rescueAssets}
        description={STRINGS.rescueAssetsDescription}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <OverlayToggleBadge label={STRINGS.aed} icon={ICONS.aed} color="#e03131" layerIds={AED_LAYER_IDS} />
        <OverlayToggleBadge label={STRINGS.hems} icon={ICONS.hems} color="#f59f00" layerIds={HEMS_LAYER_IDS} />
        <OverlayToggleBadge
          label={STRINGS.fireHydrants}
          icon={ICONS.fireHydrants}
          color="#0b7285"
          layerIds={FIRE_HYDRANT_LAYER_IDS}
        />
        <OverlayToggleBadge
          label={STRINGS.assemblyPoints}
          icon={ICONS.assemblyPoints}
          color="#2f9e44"
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
    </div>
  )
}
