import { Faq } from "@/components/faq"
import { NdviClassesPanel } from "@/components/ndvi-classes-panel"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function GreenNdviPage() {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <ICONS.vegetation aria-hidden="true" className="size-5" />
        {STRINGS.vegetation}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.vegetationDescription}</p>
      <div className="mt-3">
        <NdviClassesPanel />
      </div>
      <Faq>
        Misura quanto una zona è coperta da vegetazione sana confrontando la luce rossa e quella infrarossa vicina
        catturate dal satellite Sentinel-2, a 10 m di risoluzione. Più il valore è alto, più la vegetazione è
        densa; i toni chiari indicano suolo nudo o superfici costruite.
      </Faq>
    </div>
  )
}
