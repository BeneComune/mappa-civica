// components\map-feature-detail.tsx
"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useMapContext } from "@/components/map-provider"
import type { RescueDetail } from "@/lib/rescue-details"

type Resolver = (props: Record<string, unknown>) => RescueDetail | null

// Click a feature on one of `layers` -> its detail appears as a panel card
// (same style as the catasto parcel readout), not a map balloon that can
// overflow with nowhere to scroll. One shared card slot; long free-text
// fields sit in a collapsed <details> so the card stays short by default.
export function MapFeatureDetail({
  layers,
}: {
  layers: Array<{ id: string; resolve: Resolver }>
}) {
  const { attachFeatureSelect, mapReady } = useMapContext()
  const [detail, setDetail] = useState<RescueDetail | null>(null)

  const layerKey = layers.map((l) => l.id).join(",")
  useEffect(() => {
    if (!mapReady) return
    const detachers = layers.map(({ id, resolve }) =>
      attachFeatureSelect(id, (props) => setDetail(resolve(props)))
    )
    return () => detachers.forEach((detach) => detach())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachFeatureSelect, mapReady, layerKey])

  if (!detail) return null

  const inlineRows = detail.rows.filter((r) => !r.collapsible)
  const collapsibleRows = detail.rows.filter((r) => r.collapsible)

  return (
    <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-lg border p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold leading-tight">{detail.title}</h3>
          {detail.subtitle && <p className="mt-0.5 text-muted-foreground">{detail.subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setDetail(null)}
          aria-label="Chiudi"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {detail.photo && (
        // eslint-disable-next-line @next/next/no-img-element -- local static asset, next/image adds no value here
        <img src={detail.photo} alt="" className="mt-2 max-h-28 w-full rounded object-cover" />
      )}

      {inlineRows.length > 0 && (
        <dl className="mt-2 flex flex-col gap-1.5">
          {inlineRows.map((r) => (
            <div key={r.label}>
              <dt className="font-medium">{r.label}</dt>
              <dd className="whitespace-pre-line text-muted-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {collapsibleRows.length > 0 && detail.moreLabel ? (
        <details className="mt-2 border-t pt-2 text-muted-foreground">
          <summary className="cursor-pointer list-none font-medium text-foreground hover:text-muted-foreground">
            {detail.moreLabel}
          </summary>
          <dl className="mt-1 flex flex-col gap-1.5">
            {collapsibleRows.map((r) => (
              <div key={r.label}>
                <dt className="font-medium text-foreground">{r.label}</dt>
                <dd className="whitespace-pre-line">{r.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : (
        collapsibleRows.map((r) => (
          <details key={r.label} className="mt-2 border-t pt-2 text-muted-foreground">
            <summary className="cursor-pointer list-none font-medium text-foreground hover:text-muted-foreground">
              {r.label}
            </summary>
            <p className="mt-1 whitespace-pre-line">{r.value}</p>
          </details>
        ))
      )}

      {detail.note && <p className="mt-2 whitespace-pre-line text-muted-foreground">{detail.note}</p>}
    </div>
  )
}
