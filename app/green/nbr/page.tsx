// app\green\nbr\page.tsx
import { ClassesTogglePanel } from "@/components/classes-toggle-panel"
import { Faq } from "@/components/faq"
import { PageHeader } from "@/components/page-header"
import { ALL_NBR_CLASSES, NBR_CLASS_CONFIG } from "@/lib/green-classes"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function GreenNbrPage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.vegetationHealth}
        title={STRINGS.vegetationHealth}
        description={STRINGS.vegetationHealthDescription}
      />
      <p className="mt-1 text-xs text-muted-foreground">Da Sentinel-2 · 20 m · settembre 2025 · ombre mascherate</p>
      <div className="mt-3">
        <ClassesTogglePanel
          dataUrl="/data/nbr.geojson"
          fillLayerId="green-nbr-fill"
          outlineLayerId="green-nbr-outline"
          propertyKey="nbr_class"
          allClasses={ALL_NBR_CLASSES}
          config={NBR_CLASS_CONFIG}
        />
      </div>
      <Faq>
        Confronta due bande infrarosse di Sentinel-2 (B8A e B12) a 20 m di risoluzione per
        individuare stress idrico, degrado o aree bruciate; i pixel di ombra e acqua vengono
        esclusi dal calcolo. Valori bassi o negativi segnalano vegetazione in sofferenza o suolo
        bruciato.
      </Faq>
    </div>
  )
}
