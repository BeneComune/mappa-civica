"use client"

import { ClickPopupLayer } from "@/components/click-popup-layer"
import { Faq } from "@/components/faq"
import { OverlayCheckbox } from "@/components/overlay-checkbox"
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
      <h2 className="text-xl font-semibold">{STRINGS.rescueAssets}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.rescueAssetsDescription}</p>
      <div className="mt-3 flex flex-col gap-2">
        <OverlayCheckbox label={STRINGS.aed} layerIds={AED_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.hems} layerIds={HEMS_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.fireHydrants} layerIds={FIRE_HYDRANT_LAYER_IDS} />
        <OverlayCheckbox label={STRINGS.assemblyPoints} layerIds={ASSEMBLY_POINT_LAYER_IDS} />
      </div>
      <Faq>
        Defibrillatori (DAE), elisuperfici per l&apos;elisoccorso (HEMS), idranti antincendio e punti di raccolta
        per le emergenze. I DAE sono l&apos;elenco fornito dal Comune di Montereale Valcellina, unito ai punti già
        presenti su OpenStreetMap; alcuni sono posizionati a partire dall&apos;indirizzo (da verificare sul
        posto), come indicato nel dettaglio. Elisuperfici, idranti e punti di raccolta vengono da OpenStreetMap:
        se ne conosci uno mancante puoi aggiungerlo tu stesso.
      </Faq>
    </div>
  )
}
