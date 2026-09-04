"use client"

import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { LST_CLASS_CONFIG, type LstClass } from "@/lib/green-classes"
import { STRINGS } from "@/lib/strings"

function renderLstPopup(props: Record<string, unknown>): string | null {
  const config = LST_CLASS_CONFIG[props.lst_class as LstClass]
  return config ? `<strong>${config.label}</strong><br/>${config.range}` : null
}

export default function GreenLstPage() {
  return (
    <div>
      <HoverPopupLayer layerId="lst-fill" render={renderLstPopup} />
      <h2 className="text-xl font-semibold">{STRINGS.soilTemperature}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.soilTemperatureDescription}</p>
    </div>
  )
}
