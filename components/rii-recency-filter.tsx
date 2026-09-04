// components\rii-recency-filter.tsx
"use client"

import { useEffect, useState } from "react"
import type { FilterSpecification } from "maplibre-gl"
import { Clock, History } from "lucide-react"
import { useMapContext } from "@/components/map-provider"

// Rii's recency filter groups two `stato` values per badge (unlike fire's
// cause filter, where each badge is one property value), so it doesn't fit
// FilterBadgeGroup - a small bespoke component instead.
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

  const recenti = selected.includes("recenti")
  const storici = selected.includes("storici")

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={recenti}
        onClick={() => toggle("recenti")}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${recenti ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}
        style={recenti ? { borderColor: "#1c7ed6" } : undefined}
      >
        <Clock className="size-3.5" aria-hidden="true" style={{ color: recenti ? "#1c7ed6" : undefined }} />
        Rilievi 2024
      </button>
      <button
        type="button"
        aria-pressed={storici}
        onClick={() => toggle("storici")}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${storici ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}
        style={storici ? { borderColor: "#e8590c" } : undefined}
      >
        <History className="size-3.5" aria-hidden="true" style={{ color: storici ? "#e8590c" : undefined }} />
        Rilievi meno recenti
      </button>
    </div>
  )
}
