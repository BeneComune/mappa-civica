"use client"

import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { NBR_CLASS_CONFIG, type NbrClass } from "@/lib/green-classes"
import { STRINGS } from "@/lib/strings"

function renderNbrPopup(props: Record<string, unknown>): string | null {
  const config = NBR_CLASS_CONFIG[props.nbr_class as NbrClass]
  return config ? `<strong>${config.label}</strong><br/>NBR ${config.range}` : null
}

export default function GreenNbrPage() {
  return (
    <div>
      <HoverPopupLayer layerId="green-nbr-fill" render={renderNbrPopup} />
      <h2 className="text-xl font-semibold">{STRINGS.vegetationHealth}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.vegetationHealthDescription}</p>
    </div>
  )
}
