// components\report-drawer\location-field.tsx
import { Label } from "@/components/ui/label"
import type { ParcelPoint } from "./use-nearest-parcel"
import { STRINGS } from "@/lib/strings"

// Read-only readout of the location picked on the map, plus the cadastral
// parcel it falls in once one is resolved.
export function LocationField({
  location,
  parcel,
}: {
  location: [number, number] | null
  parcel: ParcelPoint | null
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{STRINGS.reportLocationLabel}</Label>
      <p className="text-sm text-muted-foreground">
        {location
          ? `${location[1].toFixed(5)}, ${location[0].toFixed(5)}`
          : STRINGS.reportLocationUnset}
      </p>
      {parcel && (
        <p className="text-xs text-muted-foreground">
          {STRINGS.reportParcelLabel}: foglio {parcel.foglio}, particella {parcel.particella}
        </p>
      )}
    </div>
  )
}
