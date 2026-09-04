// components\hover-highlight-layer.tsx
"use client"

import { useEffect } from "react"
import { useMapContext } from "@/components/map-provider"

// Renders nothing - wires cursor-driven feature-state hover highlighting
// (RII_HOVER/FIRE_HOVER-style paint expressions) on `layerIds` for as long
// as this component is mounted. Shared by Rescue's rii/fire hover effects.
export function HoverHighlightLayer({
  sourceId,
  layerIds,
}: {
  sourceId: string
  layerIds: string[]
}) {
  const { attachHoverHighlight } = useMapContext()

  useEffect(
    () => attachHoverHighlight(sourceId, layerIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceId, attachHoverHighlight, layerIds.join(",")]
  )

  return null
}
