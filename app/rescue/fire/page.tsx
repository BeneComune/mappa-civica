// app\rescue\fire\page.tsx
"use client"

import { ClassesTogglePanel } from "@/components/classes-toggle-panel"
import { ClickPopupLayer } from "@/components/click-popup-layer"
import { Faq } from "@/components/faq"
import { FilterBadgeGroup } from "@/components/filter-badge-group"
import { HoverHighlightLayer } from "@/components/hover-highlight-layer"
import { OverlayToggleBadge } from "@/components/overlay-toggle-badge"
import { PageHeader } from "@/components/page-header"
import { COLORS } from "@/lib/colors"
import { ICONS } from "@/lib/ICONS"
import { ALL_NBR_CLASSES, NBR_CLASS_CONFIG } from "@/lib/green-classes"
import {
  FIRE_DANGER_LAYER_IDS,
  FIRE_IGNITION_LAYER_IDS,
  FIRE_NBR_LAYER_IDS,
  FIRE_PERIMETERS_LAYER_IDS,
} from "@/lib/map/overlays/fire"
import { dangerPopupHTML, firePopupHTML, ignitionPopupHTML } from "@/lib/rescue-popups"
import { STRINGS } from "@/lib/strings"

const CAUSE_OPTIONS = [
  {
    value: "dolosa",
    label: STRINGS.fireCauseDolosa,
    icon: ICONS.fireCauseDolosa,
    color: COLORS.fireCauseDolosa,
  },
  {
    value: "colposa",
    label: STRINGS.fireCauseColposa,
    icon: ICONS.fireCauseColposa,
    color: COLORS.fireCauseColposa,
  },
  {
    value: "naturale",
    label: STRINGS.fireCauseNaturale,
    icon: ICONS.fireCauseNaturale,
    color: COLORS.fireCauseNaturale,
  },
  {
    value: "ignota",
    label: STRINGS.fireCauseIgnota,
    icon: ICONS.fireCauseIgnota,
    color: COLORS.fireCauseIgnota,
  },
]

export default function RescueFirePage() {
  return (
    <div>
      <ClickPopupLayer layerId="fire-perimeters-fill" render={firePopupHTML} />
      <ClickPopupLayer layerId="fire-danger-fill" render={dangerPopupHTML} />
      <ClickPopupLayer layerId="fire-ignition-points" render={ignitionPopupHTML} />
      <HoverHighlightLayer sourceId="firePerimeters" layerIds={FIRE_PERIMETERS_LAYER_IDS} />
      <PageHeader
        icon={ICONS.wildfires}
        title={STRINGS.wildfires}
        description={STRINGS.wildfiresDescription}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Archivio storico (perimetri digitalizzati dai Fogli Notizie Incendi Boschivi, dal 1990):
        registra dove il fuoco è già passato, non è una mappa previsionale di pericolosità. La
        precisione dei rilievi più vecchi è variabile.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <FilterBadgeGroup property="causa_classe" options={CAUSE_OPTIONS} layerIds={FIRE_PERIMETERS_LAYER_IDS} />
        <div className="flex flex-col gap-2 border-t pt-3">
          <div className="flex flex-wrap gap-2">
            <OverlayToggleBadge
              label={STRINGS.fireDangerToggle}
              icon={ICONS.fireDangerToggle}
              color={COLORS.fireDangerToggle}
              layerIds={FIRE_DANGER_LAYER_IDS}
              defaultChecked={false}
            />
            <OverlayToggleBadge
              label={STRINGS.fireIgnitionToggle}
              icon={ICONS.fireIgnitionToggle}
              color={COLORS.fireIgnitionToggle}
              layerIds={FIRE_IGNITION_LAYER_IDS}
              defaultChecked={false}
            />
            <OverlayToggleBadge
              label={STRINGS.fireNbrToggle}
              icon={ICONS.fireNbrToggle}
              color={COLORS.fireNbrToggle}
              layerIds={FIRE_NBR_LAYER_IDS}
              defaultChecked={false}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Zonazione regionale SITFOR (IRDAT FVG) ritagliata sul confine comunale: giallo =
            pericolo medio, rosso = pericolo alto. È la propensione del territorio agli incendi,
            non un allarme.
          </p>
          <p className="text-xs text-muted-foreground">
            Da immagine Sentinel-2 (set. 2025): vegetazione secca, degradata o suolo nudo/bruciato.
            È una condizione attuale, non l&apos;effetto di un singolo incendio.
          </p>
          <ClassesTogglePanel
            dataUrl="/data/nbr.geojson"
            fillLayerId="rescue-nbr-fill"
            outlineLayerId="rescue-nbr-outline"
            propertyKey="nbr_class"
            allClasses={ALL_NBR_CLASSES}
            config={NBR_CLASS_CONFIG}
          />
        </div>
      </div>
      <Faq>
        Fonte: Regione Autonoma Friuli-Venezia Giulia, IRDAT FVG, dataset &quot;Perimetro degli
        incendi boschivi&quot; (n. 1232), ottenuto dal geoservizio regionale (WFS). I perimetri
        derivano dalla digitalizzazione delle cartografie allegate ai Fogli Notizie Incendi
        Boschivi redatti dalle Stazioni Forestali, con rilievi GPS sul campo. La causa
        (&quot;dolosa&quot;, &quot;colposa&quot;, &quot;naturale&quot; da fulmine,
        &quot;ignota&quot;) è quella registrata nel foglio notizie. È un archivio di eventi
        passati, aggiornato quando le Stazioni Forestali trasmettono nuovi rilievi.
      </Faq>
    </div>
  )
}
