// components\hover-popup-layer.tsx
"use client"

import { useEffect } from "react"
import { useMapContext } from "@/components/map-provider"

// Renders nothing - just wires a hover popup on `layerId` for as long as
// this component is mounted (i.e. for as long as the user is on the route
// that owns this layer). Shared by every module's hover-popup.
export function HoverPopupLayer({
  layerId,
  render,
}: {
  layerId: string
  render: (props: Record<string, unknown>) => string | null | undefined
}) {
  const { attachHoverPopup } = useMapContext()

  useEffect(() => attachHoverPopup(layerId, render), [layerId, render, attachHoverPopup])

  return null
}
