// app\green\shade\page.tsx
"use client"

import { Faq } from "@/components/faq"
import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { PageHeader } from "@/components/page-header"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

function renderShadePopup(props: Record<string, unknown>): string {
  const name = (props.name as string) || ""
  const shadePct = props.shade_pct as number
  const lengthM = props.length_m as number
  const type = props.type === "trail" ? "Sentiero" : "Strada"
  return (
    `<strong>${name || type}</strong><br/>` +
    `Ombra: <strong>${shadePct}%</strong><br/>` +
    `Lunghezza: ${lengthM >= 1000 ? (lengthM / 1000).toFixed(1) + " km" : lengthM + " m"}`
  )
}

export default function GreenShadePage() {
  return (
    <div>
      <HoverPopupLayer layerId="shade-corridors" render={renderShadePopup} />
      <PageHeader
        icon={ICONS.naturalShade}
        title={STRINGS.naturalShade}
        description={STRINGS.naturalShadeDescription}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Verde scuro = strade ombreggiate · verde chiaro = sentieri ombreggiati · opacità
        proporzionale alla copertura
      </p>
      <Faq>
        Percentuale di copertura arborea sopra ogni tratto di strada o sentiero, calcolata
        incrociando le aree di vegetazione densa (dallo stesso indice di vegetazione) con i
        tracciati stradali e i sentieri di OpenStreetMap.
      </Faq>
    </div>
  )
}
