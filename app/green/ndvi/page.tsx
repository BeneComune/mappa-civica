import { ClassesTogglePanel } from "@/components/classes-toggle-panel"
import { Faq } from "@/components/faq"
import { PageHeader } from "@/components/page-header"
import { ALL_NDVI_CLASSES, NDVI_CLASS_CONFIG } from "@/lib/green-classes"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function GreenNdviPage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.vegetation}
        title={STRINGS.vegetation}
        description={STRINGS.vegetationDescription}
      />
      <div className="mt-3">
        <ClassesTogglePanel
          dataUrl="/data/greenery.geojson"
          fillLayerId="greenery-fill"
          outlineLayerId="greenery-outline"
          propertyKey="ndvi_class"
          allClasses={ALL_NDVI_CLASSES}
          config={NDVI_CLASS_CONFIG}
        />
      </div>
      <Faq>
        Misura quanto una zona è coperta da vegetazione sana confrontando la luce rossa e quella
        infrarossa vicina catturate dal satellite Sentinel-2, a 10 m di risoluzione. Più il valore
        è alto, più la vegetazione è densa; i toni chiari indicano suolo nudo o superfici
        costruite.
      </Faq>
    </div>
  )
}
