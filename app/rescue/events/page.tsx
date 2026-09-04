"use client"

import { ClickPopupLayer } from "@/components/click-popup-layer"
import { HoverHighlightLayer } from "@/components/hover-highlight-layer"
import { RiiRecencyFilter } from "@/components/rii-recency-filter"
import { riiPopupHTML } from "@/lib/rescue-popups"
import { STRINGS } from "@/lib/strings"

export default function RescueEventsPage() {
  return (
    <div>
      <ClickPopupLayer layerId="rii-points" render={riiPopupHTML} />
      <ClickPopupLayer layerId="rii-line" render={riiPopupHTML} />
      <HoverHighlightLayer sourceId="rii" layerIds={["rii-points", "rii-line"]} />
      <h2 className="text-xl font-semibold">{STRINGS.riverRisk}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.riverRiskDescription}</p>
      <div className="mt-3">
        <RiiRecencyFilter />
      </div>
    </div>
  )
}
