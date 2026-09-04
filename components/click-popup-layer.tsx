// components\click-popup-layer.tsx
"use client"

import { useEffect } from "react"
import { useMapContext } from "@/components/map-provider"

// Renders nothing - wires a click-to-open popup on `layerId` for as long as
// this component is mounted. Shared by Rescue's rii/fire/assets popups.
export function ClickPopupLayer({
  layerId,
  render,
}: {
  layerId: string
  render: (props: Record<string, unknown>) => string | null | undefined
}) {
  const { attachClickPopup } = useMapContext()

  useEffect(() => attachClickPopup(layerId, render), [layerId, render, attachClickPopup])

  return null
}
