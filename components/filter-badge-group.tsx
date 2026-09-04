// components\filter-badge-group.tsx
"use client"

import { useEffect, useState } from "react"
import type { FilterSpecification } from "maplibre-gl"
import type { LucideIcon } from "lucide-react"
import { useMapContext } from "@/components/map-provider"

// Toggleable pills that narrow a single layer set via one shared MapLibre
// filter (multiple property values selected at once). All options start
// selected, matching the old app's default. `icon` is optional - continuous-
// class filters (slope, NDVI) read better as a plain color swatch than a
// mismatched icon.
export function FilterBadgeGroup({
  property,
  options,
  layerIds,
}: {
  property: string
  options: ReadonlyArray<{ value: string; label: string; icon?: LucideIcon; color?: string }>
  layerIds: string[]
}) {
  const { setLayersFilter } = useMapContext()
  const [selected, setSelected] = useState<string[]>(() => options.map((o) => o.value))

  useEffect(() => {
    const filter: FilterSpecification =
      selected.length > 0
        ? ["in", ["get", property], ["literal", selected]]
        : ["==", ["get", property], "__none__"]
    setLayersFilter(layerIds, filter)
  }, [selected, property, layerIds, setLayersFilter])

  function toggle(value: string): void {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const Icon = option.icon
        const checked = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={checked}
            onClick={() => toggle(option.value)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${checked ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}
            style={checked && option.color ? { borderColor: option.color } : undefined}
          >
            {Icon ? (
              <Icon className="size-3.5" aria-hidden="true" style={{ color: checked ? option.color : undefined }} />
            ) : (
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: option.color }} />
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
