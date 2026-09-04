// components\panel-frame.tsx
"use client"

import { usePathname } from "next/navigation"

// Every route's legend-panel content shares one floating card, anchored
// bottom-left. Two routes bypass it entirely instead: Home (multiple
// unrelated cards - zone name, weather, catasto toggle, frazioni, stats -
// that shouldn't nest inside one box) and the LTS embed (replaces the
// whole map view with an iframe, nothing to put in a card at all).
const FULL_BLEED_ROUTES = ["/", "/outdoor/cyclability/lts"]

export function PanelFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (FULL_BLEED_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end p-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
        {children}
      </div>
    </div>
  )
}
