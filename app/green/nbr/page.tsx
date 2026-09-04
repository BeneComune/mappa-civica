"use client"

import { Faq } from "@/components/faq"
import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { PageHeader } from "@/components/page-header"
import { ALL_NBR_CLASSES, NBR_CLASS_CONFIG, type NbrClass } from "@/lib/green-classes"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

function renderNbrPopup(props: Record<string, unknown>): string | null {
  const config = NBR_CLASS_CONFIG[props.nbr_class as NbrClass]
  return config ? `<strong>${config.label}</strong><br/>NBR ${config.range}` : null
}

export default function GreenNbrPage() {
  return (
    <div>
      <HoverPopupLayer layerId="green-nbr-fill" render={renderNbrPopup} />
      <PageHeader icon={ICONS.vegetationHealth} title={STRINGS.vegetationHealth} description={STRINGS.vegetationHealthDescription} />
      <p className="mt-1 text-xs text-muted-foreground">Da Sentinel-2 · 20 m · settembre 2025 · ombre mascherate</p>
      <ul className="mt-2 flex flex-col gap-1">
        {ALL_NBR_CLASSES.map((cls) => {
          const config = NBR_CLASS_CONFIG[cls]
          return (
            <li key={cls} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: config.color }} />
              {config.label}
              <span className="text-xs text-muted-foreground">{config.range}</span>
            </li>
          )
        })}
      </ul>
      <Faq>
        Confronta due bande infrarosse di Sentinel-2 (B8A e B12) a 20 m di risoluzione per individuare stress
        idrico, degrado o aree bruciate; i pixel di ombra e acqua vengono esclusi dal calcolo. Valori bassi o
        negativi segnalano vegetazione in sofferenza o suolo bruciato.
      </Faq>
    </div>
  )
}
