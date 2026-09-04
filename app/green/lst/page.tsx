// app\green\lst\page.tsx
"use client"

import { ClassLegendList } from "@/components/class-legend-list"
import { Faq } from "@/components/faq"
import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { PageHeader } from "@/components/page-header"
import { ALL_LST_CLASSES, LST_CLASS_CONFIG, type LstClass } from "@/lib/green-classes"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

function renderLstPopup(props: Record<string, unknown>): string | null {
  const config = LST_CLASS_CONFIG[props.lst_class as LstClass]
  return config ? `<strong>${config.label}</strong><br/>${config.range}` : null
}

export default function GreenLstPage() {
  return (
    <div>
      <HoverPopupLayer layerId="lst-fill" render={renderLstPopup} />
      <PageHeader
        icon={ICONS.soilTemperature}
        title={STRINGS.soilTemperature}
        description={STRINGS.soilTemperatureDescription}
      />
      <p className="mt-1 text-xs text-muted-foreground">Da Landsat 8 · 30 m · settembre 2023</p>
      <ClassLegendList classes={ALL_LST_CLASSES} config={LST_CLASS_CONFIG} />
      <Faq>
        Temperatura misurata dal sensore termico di Landsat 8/9 a 30 m di risoluzione: è la
        temperatura della superficie del terreno, non dell&apos;aria. Aiuta a individuare le isole
        di calore nelle zone urbanizzate rispetto alle aree rinfrescate dagli alberi.
      </Faq>
    </div>
  )
}
