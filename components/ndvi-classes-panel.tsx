"use client"

import { useEffect, useState } from "react"
import type { FilterSpecification } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"
import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { ALL_NDVI_CLASSES, computeNdviStats, NDVI_CLASS_CONFIG, type ClassStats, type NdviClass } from "@/lib/green-classes"

export function NdviClassesPanel() {
  const { setLayersFilter } = useMapContext()
  const [visible, setVisible] = useState<NdviClass[]>(ALL_NDVI_CLASSES)
  const [stats, setStats] = useState<Record<NdviClass, ClassStats> | null>(null)

  useEffect(() => {
    fetch("/data/greenery.geojson")
      .then((r) => r.json())
      .then((fc) => setStats(computeNdviStats(fc.features ?? [])))
      .catch(() => null)
  }, [])

  useEffect(() => {
    const filter: FilterSpecification =
      visible.length > 0
        ? ["in", ["get", "ndvi_class"], ["literal", visible]]
        : ["==", ["get", "ndvi_class"], "__none__"]
    setLayersFilter(["greenery-fill", "greenery-outline"], filter)
  }, [visible, setLayersFilter])

  function toggle(cls: NdviClass): void {
    setVisible((prev) => (prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]))
  }

  return (
    <div className="flex flex-col gap-2">
      <HoverPopupLayer
        layerId="greenery-fill"
        render={(props) => {
          const cls = String(props.ndvi_class ?? "")
          const config = NDVI_CLASS_CONFIG[cls as NdviClass]
          return config ? `<strong>${config.label}</strong>` : null
        }}
      />

      <ul className="flex flex-col gap-1.5">
        {ALL_NDVI_CLASSES.map((cls) => {
          const config = NDVI_CLASS_CONFIG[cls]
          return (
            <li key={cls}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={visible.includes(cls)}
                  onChange={() => toggle(cls)}
                  className="size-4 accent-primary"
                />
                <span className="size-2.5 rounded-full" style={{ background: config.color }} />
                {config.label}
                {stats && <span className="ml-auto text-xs text-muted-foreground">{stats[cls].pct.toFixed(1)}%</span>}
              </label>
            </li>
          )
        })}
      </ul>

      {stats && (
        <div className="mt-1 flex h-2 overflow-hidden rounded-full">
          {ALL_NDVI_CLASSES.filter((cls) => stats[cls].pct > 0).map((cls) => (
            <div
              key={cls}
              style={{ width: `${stats[cls].pct}%`, background: NDVI_CLASS_CONFIG[cls].color }}
              title={`${NDVI_CLASS_CONFIG[cls].label}: ${stats[cls].pct.toFixed(1)}%`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
