// components\report-drawer\photo-field.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resizeImageToDataUrl } from "@/lib/community"
import { STRINGS } from "@/lib/strings"

export type ReportPhoto = { fileName: string; dataUrl: string }

// Camera/file picker for the optional report photo. The chosen image is
// downscaled to a data URL before it reaches the caller, since the report
// travels out as a mailto body.
export function PhotoField({
  photo,
  onChange,
}: {
  photo: ReportPhoto | null
  onChange: (photo: ReportPhoto | null) => void
}) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      onChange({ fileName: file.name, dataUrl })
    } catch {
      /* silently ignore resize errors */
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="report-photo">{STRINGS.reportPhotoLabel}</Label>
      <Input
        id="report-photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />
      {photo && (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview, next/image doesn't apply */}
          <img src={photo.dataUrl} alt="" className="h-12 w-12 rounded object-cover" />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            {STRINGS.reportPhotoRemove}
          </Button>
        </div>
      )}
    </div>
  )
}
