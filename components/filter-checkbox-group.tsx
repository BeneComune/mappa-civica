"use client"

import { useEffect, useId, useState } from "react"
import type { FilterSpecification } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"

// For overlays where checkboxes narrow down a single layer via a shared
// MapLibre filter (e.g. fire cause, rii survey recency) rather than each
// checkbox owning its own independent layer (see OverlayCheckbox for that
// simpler case). All options start checked, matching the old app's default.
export function FilterCheckboxGroup({
  property,
  options,
  layerIds,
}: {
  property: string
  options: ReadonlyArray<{ value: string; label: string }>
  layerIds: string[]
}) {
  const { setLayersFilter } = useMapContext()
  const [selected, setSelected] = useState<string[]>(() => options.map((o) => o.value))
  const idPrefix = useId()

  useEffect(() => {
    const filter: FilterSpecification =
      selected.length > 0
        ? ["in", ["get", property], ["literal", selected]]
        : ["==", ["get", property], "__none__"]
    setLayersFilter(layerIds, filter)
  }, [selected, property, layerIds, setLayersFilter])

  function toggle(value: string): void {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <label key={option.value} htmlFor={`${idPrefix}-${option.value}`} className="flex items-center gap-2 text-sm">
          <input
            id={`${idPrefix}-${option.value}`}
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="size-4 accent-primary"
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
