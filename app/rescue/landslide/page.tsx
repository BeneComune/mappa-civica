// app\rescue\landslide\page.tsx
import { ClassesTogglePanel } from "@/components/classes-toggle-panel"
import { Faq } from "@/components/faq"
import { InfoNote } from "@/components/info-note"
import { PageHeader } from "@/components/page-header"
import { ALL_LANDSLIDE_CLASSES, LANDSLIDE_CLASS_CONFIG } from "@/lib/landslide-classes"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function RescueLandslidePage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.landslideHazard}
        title={STRINGS.landslideHazard}
        description={STRINGS.landslideHazardDescription}
      />
      <div className="mt-1">
        <InfoNote label="Cosa mostra questa mappa">
          Perimetrazioni ISPRA (mosaicatura nazionale) delle aree a pericolosità da frana definite
          nei Piani di Assetto Idrogeologico. Non prevede dove accadrà una frana: descrive dove il
          territorio è già classificato a rischio dalle autorità di bacino competenti.
        </InfoNote>
      </div>
      <div className="mt-3">
        <ClassesTogglePanel
          dataUrl="/data/rescue/landslide_hazard.geojson"
          fillLayerId="landslide-fill"
          outlineLayerId="landslide-outline"
          propertyKey="class"
          allClasses={ALL_LANDSLIDE_CLASSES}
          config={LANDSLIDE_CLASS_CONFIG}
        />
      </div>
      <Faq>
        Fonte: ISPRA, mosaicatura delle aree a pericolosità da frana dei Piani di Assetto
        Idrogeologico (PAI), redatti dalle autorità di bacino distrettuali. Le classi vanno da P1
        (moderata) a P4 (molto elevata); le &quot;aree di attenzione&quot; sono zone segnalate ma
        non ancora classificate in una classe di pericolosità.
      </Faq>
    </div>
  )
}
