// components\route-planner\index.tsx
"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPickHint } from "@/components/map-pick-hint"
import { usePanelSheet } from "@/components/mobile-panel-sheet"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { useIsMobile } from "@/lib/use-is-mobile"
import { buildRouteSummary, type RouteSummary, type RoutingMode } from "@/lib/routing"
import type { RoutePoint } from "./format"
import { useRoutingGraph } from "./use-routing-graph"
import { useMapPointInput } from "./use-map-point-input"
import { useRouteMapLayers } from "./use-route-map-layers"
import { RoutePointList } from "./route-point-list"
import { RouteSummaryPanel } from "./route-summary-panel"

// Owns the chosen points and the route computed from them; the map side
// effects and the display blocks live in the sibling modules.
export function RoutePlanner({ mode }: { mode: RoutingMode }) {
  const [enabled, setEnabled] = useState(false)
  const [points, setPoints] = useState<RoutePoint[]>([])
  const { graph, unavailable } = useRoutingGraph(mode)
  const isMobile = useIsMobile()
  const sheet = usePanelSheet()

  // On mobile the planner lives in the bottom sheet; arming it folds the
  // sheet away so the map is tappable, with a hint pinned over the map.
  const toggleEnabled = useCallback(() => {
    setEnabled((v) => {
      if (!v && isMobile) sheet?.collapse()
      return !v
    })
  }, [isMobile, sheet])

  const addPoint = useCallback((point: RoutePoint) => {
    setPoints((prev) => [...prev, point])
  }, [])

  const removePoint = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const movePoint = useCallback((id: string, lng: number, lat: number) => {
    setPoints((prev) => prev.map((entry) => (entry.id === id ? { ...entry, lng, lat } : entry)))
  }, [])

  const summary: RouteSummary | null = useMemo(() => {
    if (!graph || points.length < 2) return null
    return buildRouteSummary(
      graph,
      points.map(({ lng, lat }) => ({ lng, lat })),
      mode
    )
  }, [graph, points, mode])

  useMapPointInput(enabled, addPoint)
  useRouteMapLayers(points, summary, movePoint)

  const status: string = unavailable
    ? STRINGS.routePlannerStatusUnavailable
    : points.length === 0
      ? STRINGS.routePlannerStatusEmpty
      : points.length === 1
        ? STRINGS.routePlannerStatusOnePoint
        : summary
          ? `${points.length} ${STRINGS.routePlannerStatusConnected}`
          : STRINGS.routePlannerStatusNotFound

  const SwapIcon = ICONS.routePlannerSwap
  const UndoIcon = ICONS.routePlannerUndo
  const ClearIcon = ICONS.routePlannerClear

  const network =
    mode === "biking" ? STRINGS.routePlannerNetworkBiking : STRINGS.routePlannerNetworkWalking

  return (
    <div className="flex flex-col gap-3">
      <Button size="sm" variant={enabled ? "default" : "outline"} onClick={toggleEnabled}>
        {enabled ? STRINGS.routePlannerActive : STRINGS.routePlannerActivate}
      </Button>
      <p className="text-xs text-muted-foreground">
        {STRINGS.routePlannerHint} {network}.
      </p>

      {isMobile && enabled && (
        <MapPickHint
          hint={STRINGS.routePlannerPickHint}
          actionLabel={STRINGS.routePlannerDone}
          onAction={() => setEnabled(false)}
        />
      )}

      {points.length > 0 && <RoutePointList points={points} onRemove={removePoint} />}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="flex-1" disabled={points.length === 0} onClick={() => setPoints((prev) => prev.slice(0, -1))}>
          <UndoIcon aria-hidden="true" />
          {STRINGS.routePlannerUndo}
        </Button>
        <Button size="sm" variant="outline" className="flex-1" disabled={points.length < 2} onClick={() => setPoints((prev) => [...prev].reverse())}>
          <SwapIcon aria-hidden="true" />
          {STRINGS.routePlannerSwap}
        </Button>
        <Button size="sm" variant="outline" className="flex-1" disabled={points.length === 0} onClick={() => setPoints([])}>
          <ClearIcon aria-hidden="true" />
          {STRINGS.routePlannerClear}
        </Button>
      </div>

      {!summary && <p className="text-xs text-muted-foreground">{status}</p>}

      {summary && <RouteSummaryPanel summary={summary} />}
    </div>
  )
}
