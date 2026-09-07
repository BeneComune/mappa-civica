// components\mobile-panel-sheet.tsx
"use client"

import { useState } from "react"
import { ChevronUp } from "lucide-react"

// The < md legend/panel: a sheet pinned to the bottom of the map. Collapsed
// (the default on route entry) it's just a peek bar with the route title -
// the map stays fully visible and interactive above it. Tapping the bar
// expands it to a scrollable panel (~70dvh). Rendered by PanelFrame; >= md
// uses the floating card instead.
export function MobilePanelSheet({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
      <div className="pointer-events-auto mx-2 mb-2 overflow-hidden rounded-xl border bg-background/95 shadow-lg backdrop-blur">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold"
        >
          <span className="truncate">{title}</span>
          <ChevronUp
            className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div className="max-h-[70dvh] overflow-y-auto border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
