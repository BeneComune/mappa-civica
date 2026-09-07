// components\panel-frame.tsx
"use client"

import { usePathname } from "next/navigation"
import { MobilePanelSheet } from "@/components/mobile-panel-sheet"
import { routeTitle } from "@/components/site-header/menus"
import { useIsMobile } from "@/lib/use-is-mobile"

// Every route's legend-panel content shares one container. On desktop it's a
// floating card anchored bottom-left; below md it's a bottom sheet
// (MobilePanelSheet) so it doesn't cover the map. Two routes have no panel of
// their own: Home renders its own cards (HomePanel), the LTS embed replaces
// the whole map with an iframe.
const FULL_BLEED_ROUTES = ["/", "/outdoor/cyclability/lts"]
const NO_PANEL_ROUTES = ["/outdoor/cyclability/lts"]

export function PanelFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  if (isMobile) {
    if (NO_PANEL_ROUTES.includes(pathname)) {
      return <>{children}</>
    }
    return <MobilePanelSheet title={routeTitle(pathname)}>{children}</MobilePanelSheet>
  }

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
