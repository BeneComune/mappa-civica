"use client"

import { Faq } from "@/components/faq"
import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { ALL_LST_CLASSES, LST_CLASS_CONFIG, type LstClass } from "@/lib/green-classes"
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
      <p className="mt-1 text-xs text-muted-foreground">Da Landsat 8 · 30 m · settembre 2023</p>
      <ul className="mt-2 flex flex-col gap-1">
        {ALL_LST_CLASSES.map((cls) => {
          const config = LST_CLASS_CONFIG[cls]
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
        Temperatura misurata dal sensore termico di Landsat 8/9 a 30 m di risoluzione: è la temperatura della
        superficie del terreno, non dell&apos;aria. Aiuta a individuare le isole di calore nelle zone urbanizzate
        rispetto alle aree rinfrescate dagli alberi.
      </Faq>
    </div>
  )
}
