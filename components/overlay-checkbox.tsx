"use client"

import { useEffect, useId, useState } from "react"
import { useMapContext } from "@/components/map-provider"

export function OverlayCheckbox({
  label,
  layerIds,
  defaultChecked = true,
}: {
  label: string
  layerIds: string[]
  defaultChecked?: boolean
}) {
  const { setLayersVisible } = useMapContext()
  const [checked, setChecked] = useState(defaultChecked)
  const id = useId()

  useEffect(() => {
    setLayersVisible(layerIds, checked)
    // Hide again on unmount (route change away) so a stale "off" layer from
    // one visit doesn't linger visible=true from a previous visibility sync.
    return () => setLayersVisible(layerIds, false)
  }, [checked, layerIds, setLayersVisible])

  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  )
}
