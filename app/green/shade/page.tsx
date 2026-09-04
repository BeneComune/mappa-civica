"use client"

import { HoverPopupLayer } from "@/components/hover-popup-layer"
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
      <h2 className="text-xl font-semibold">{STRINGS.naturalShade}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.naturalShadeDescription}</p>
    </div>
  )
}
