// app\green\lst\page.tsx
import { ClassesTogglePanel } from "@/components/classes-toggle-panel"
import { Faq } from "@/components/faq"
import { PageHeader } from "@/components/page-header"
import { ALL_LST_CLASSES, LST_CLASS_CONFIG } from "@/lib/green-classes"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function GreenLstPage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.soilTemperature}
        title={STRINGS.soilTemperature}
        description={STRINGS.soilTemperatureDescription}
      />
      <p className="mt-1 text-xs text-muted-foreground">Da Landsat 8 · 30 m · settembre 2023</p>
      <div className="mt-3">
        <ClassesTogglePanel
          dataUrl="/data/lst.geojson"
          fillLayerId="lst-fill"
          outlineLayerId="lst-outline"
          propertyKey="lst_class"
          allClasses={ALL_LST_CLASSES}
          config={LST_CLASS_CONFIG}
        />
      </div>
      <Faq>
        Temperatura misurata dal sensore termico di Landsat 8/9 a 30 m di risoluzione: è la
        temperatura della superficie del terreno, non dell&apos;aria. Aiuta a individuare le isole
        di calore nelle zone urbanizzate rispetto alle aree rinfrescate dagli alberi.
      </Faq>
    </div>
  )
}
