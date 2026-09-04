import { NdviClassesPanel } from "@/components/ndvi-classes-panel"
import { STRINGS } from "@/lib/strings"

export default function GreenNdviPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">{STRINGS.vegetation}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.vegetationDescription}</p>
      <div className="mt-3">
        <NdviClassesPanel />
      </div>
    </div>
  )
}
