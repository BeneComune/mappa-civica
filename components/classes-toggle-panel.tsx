// components\classes-toggle-panel.tsx
"use client"

import { useEffect, useState } from "react"
import type { FilterSpecification } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"
import { HoverPopupLayer } from "@/components/hover-popup-layer"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { computeClassStats, type ClassStats } from "@/lib/green-classes"

// A scene older than this many days past the monthly refresh cadence gets
// flagged in the UI instead of silently showing an out-of-season image.
const STALE_AFTER_DAYS = 45

// Generic version of the old NdviClassesPanel - toggle-by-class chips with
// live area stats, reused by the Vegetazione, Salute vegetazione and
// Temperatura suolo tabs (see app/green/{ndvi,nbr,lst}/page.tsx). Each tab
// only differs by dataUrl, layer ids, property key and class config.
export function ClassesTogglePanel<T extends string>({
  dataUrl,
  fillLayerId,
  outlineLayerId,
  propertyKey,
  allClasses,
  config,
  disabled = false,
  disabledHint,
}: {
  dataUrl: string
  fillLayerId: string
  outlineLayerId: string
  propertyKey: string
  allClasses: readonly T[]
  config: Record<T, { label: string; color: string; range?: string }>
  // For panels gated behind a separate overlay toggle (e.g. the NBR chips on
  // the Rescue fire page, off unless "Indice NBR" is on) - greys the chips
  // out and blocks interaction without touching the underlying layer filter.
  disabled?: boolean
  // Tooltip shown while hovering the disabled chips, telling the user how
  // to enable them (e.g. "Attiva ... per modificare le classi").
  disabledHint?: string
}) {
  const { setLayersFilter } = useMapContext()
  const [visible, setVisible] = useState<T[]>([...allClasses])
  const [stats, setStats] = useState<Record<T, ClassStats> | null>(null)
  const [sceneDate, setSceneDate] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    fetch(dataUrl)
      .then((r) => r.json())
      .then((fc) => {
        setStats(computeClassStats(fc.features ?? [], allClasses, propertyKey))
        const date: string | null = fc.scene_date ?? null
        setSceneDate(date)
        const ageDays = date != null ? (Date.now() - new Date(date).getTime()) / 86_400_000 : 0
        setIsStale(date != null && ageDays > STALE_AFTER_DAYS)
      })
      .catch(() => null)
    // Each page mounts its own panel instance with fixed props - fetch once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const filter: FilterSpecification =
      visible.length > 0
        ? ["in", ["get", propertyKey], ["literal", visible]]
        : ["==", ["get", propertyKey], "__none__"]
    setLayersFilter([fillLayerId, outlineLayerId], filter)
  }, [visible, propertyKey, fillLayerId, outlineLayerId, setLayersFilter])

  function toggle(cls: T): void {
    setVisible((prev) => (prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]))
  }

  return (
    <div className="flex flex-col gap-2">
      {sceneDate && (
        <p className={`text-xs ${isStale ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
          Immagine satellitare del{" "}
          {new Date(sceneDate).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {isStale && " · dato non aggiornato di recente"}
        </p>
      )}

      <HoverPopupLayer
        layerId={fillLayerId}
        render={(props) => {
          const cls = String(props[propertyKey] ?? "")
          const entry = config[cls as T]
          if (!entry) return null
          return entry.range ? `<strong>${entry.label}</strong><br/>${entry.range}` : `<strong>${entry.label}</strong>`
        }}
      />

      <MaybeTooltip hint={disabled ? disabledHint : undefined}>
        <div className={`flex flex-wrap gap-2 ${disabled ? "opacity-40" : ""}`}>
          {allClasses.map((cls) => {
            const entry = config[cls]
            const checked = visible.includes(cls)
            return (
              <button
                key={cls}
                type="button"
                aria-pressed={checked}
                disabled={disabled}
                onClick={() => toggle(cls)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${checked ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}
                style={checked ? { borderColor: entry.color } : undefined}
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                {entry.label}
                {stats && <span className="text-muted-foreground">{stats[cls].pct.toFixed(1)}%</span>}
              </button>
            )
          })}
        </div>
      </MaybeTooltip>

      {stats && (
        <div className="mt-1 flex h-2 overflow-hidden rounded-full">
          {allClasses.filter((cls) => stats[cls].pct > 0).map((cls) => (
            <div
              key={cls}
              style={{ width: `${stats[cls].pct}%`, background: config[cls].color }}
              title={`${config[cls].label}: ${stats[cls].pct.toFixed(1)}%`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Only pays for the tooltip wrapper when there's actually a hint to show
// (i.e. the chips are disabled) - renders children as-is otherwise.
function MaybeTooltip({ hint, children }: { hint?: string; children: React.ReactElement }) {
  if (!hint) return children
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}
