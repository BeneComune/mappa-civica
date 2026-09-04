"use client"

import { useEffect, useState } from "react"
import type { FilterSpecification } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"

// Rii's recency filter groups two `stato` values per checkbox (unlike
// fire's cause filter, where each checkbox is one property value), so it
// doesn't fit FilterCheckboxGroup - a small bespoke component instead.
// Each layer keeps its own geometry-type filter combined with the shared
// stato match, matching the old app (rii-points is Point-only, the line
// layers are LineString-only, labels have no geometry filter).
const RECENCY_GROUPS: Record<string, string[]> = {
  recenti: ["aggiornato_2024", "solo_foto_2024"],
  storici: ["storico_2013", "storico_2007"],
}

export function RiiRecencyFilter() {
  const { setLayersFilter } = useMapContext()
  const [selected, setSelected] = useState<string[]>(["recenti", "storici"])

  useEffect(() => {
    const allowedStati = selected.flatMap((f) => RECENCY_GROUPS[f])
    const statoMatch: FilterSpecification =
      allowedStati.length > 0 ? ["in", ["get", "stato"], ["literal", allowedStati]] : ["==", ["get", "stato"], "__none__"]

    setLayersFilter(["rii-line-casing", "rii-line"], ["all", ["==", ["geometry-type"], "LineString"], statoMatch])
    setLayersFilter(["rii-points"], ["all", ["==", ["geometry-type"], "Point"], statoMatch])
    setLayersFilter(["rii-labels"], statoMatch)
  }, [selected, setLayersFilter])

  function toggle(value: string): void {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={selected.includes("recenti")}
          onChange={() => toggle("recenti")}
          className="size-4 accent-primary"
        />
        Rilievi 2024
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={selected.includes("storici")}
          onChange={() => toggle("storici")}
          className="size-4 accent-primary"
        />
        Rilievi meno recenti
      </label>
    </div>
  )
}
