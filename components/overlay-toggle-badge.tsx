"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { useMapContext } from "@/components/map-provider"

// Badge/chip variant of OverlayCheckbox: same layer-visibility toggle
// behavior, styled as an icon pill instead of a checkbox row. Used for
// category groups where an icon-per-category reads better than a plain list
// (bike infra, trail/water points, rescue assets).
export function OverlayToggleBadge({
  label,
  icon: Icon,
  color,
  layerIds,
  defaultChecked = true,
}: {
  label: string
  icon: LucideIcon
  color?: string
  layerIds: string[]
  defaultChecked?: boolean
}) {
  const { setLayersVisible } = useMapContext()
  const [checked, setChecked] = useState(defaultChecked)

  useEffect(() => {
    setLayersVisible(layerIds, checked)
    // Hide again on unmount (route change away) so a stale "off" layer from
    // one visit doesn't linger visible=true from a previous visibility sync.
    return () => setLayersVisible(layerIds, false)
  }, [checked, layerIds, setLayersVisible])

  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => setChecked((v) => !v)}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${checked ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}
      style={checked && color ? { borderColor: color } : undefined}
    >
      <Icon className="size-3.5" aria-hidden="true" style={{ color: checked ? color : undefined }} />
      {label}
    </button>
  )
}
