// components\map-pick-hint.tsx
"use client"

import { createPortal } from "react-dom"
import { MapPin } from "lucide-react"

// The "tap the map" banner pinned over the map while a mobile flow waits for a point (Segnala,
// route planner). Portaled to <body> so the collapsed panel sheet (display:none) can't hide it.
export function MapPickHint({
  hint,
  actionLabel,
  onAction,
}: {
  hint: string
  actionLabel: string
  onAction: () => void
}) {
  if (typeof document === "undefined") return null

  return createPortal(
    <div className="fixed top-[calc(env(safe-area-inset-top)+4.5rem)] right-14 left-3 z-50 flex items-center justify-between gap-2 rounded-lg border bg-background/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
      <span className="flex min-w-0 items-center gap-2">
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{hint}</span>
      </span>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 font-medium underline underline-offset-2"
      >
        {actionLabel}
      </button>
    </div>,
    document.body
  )
}
