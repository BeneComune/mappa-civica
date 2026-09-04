// components\route-planner.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource } from "maplibre-gl"
import { Button } from "@/components/ui/button"
import { ElevationProfile } from "@/components/elevation-profile"
import { useMapContext } from "@/components/map-provider"
import { COLORS } from "@/lib/colors"
import { ICONS } from "@/lib/ICONS"
import {
  buildRouteSummary,
  exportRoute,
  loadRoutingGraphForMode,
  type RouteExportFormat,
  type RouteSummary,
  type RoutingGraph,
  type RoutingMode,
} from "@/lib/routing"
import { STRINGS } from "@/lib/strings"

type RouteStatePoint = { id: string; lng: number; lat: number }

function formatDistance(distanceKm: number): string {
  return `${distanceKm.toFixed(distanceKm >= 10 ? 1 : 2)} km`
}

function formatTime(timeMin: number): string {
  if (timeMin < 60) return `${Math.max(1, Math.round(timeMin))} min`
  const hours = Math.floor(timeMin / 60)
  const minutes = Math.round(timeMin % 60)
  return `${hours} h ${minutes} min`
}

const EXPORT_FORMATS: RouteExportFormat[] = ["geojson", "gpx", "kml", "csv"]

function routePointColor(index: number, total: number): string {
  if (index === 0) return COLORS.routePointStart
  if (index === total - 1) return COLORS.routePointEnd
  return COLORS.routePointWaypoint
}

export function RoutePlanner({ mode }: { mode: RoutingMode }) {
  const { getMap, subscribeMapClick } = useMapContext()
  const markersRef = useRef(new globalThis.Map<string, maplibregl.Marker>())

  const [enabled, setEnabled] = useState(false)
  const [points, setPoints] = useState<RouteStatePoint[]>([])
  const [graph, setGraph] = useState<RoutingGraph | null>(null)
  const [graphUnavailable, setGraphUnavailable] = useState(false)

  function clearRoute(): void {
    setPoints([])
  }

  // mode is fixed per mount (each routing page renders its own RoutePlanner
  // with a constant mode), so the graph only ever needs loading once.
  useEffect(() => {
    let cancelled = false
    loadRoutingGraphForMode(mode)
      .then((g) => {
        if (!cancelled) setGraph(g)
      })
      .catch(() => {
        if (!cancelled) setGraphUnavailable(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary: RouteSummary | null = useMemo(() => {
    if (!graph || points.length < 2) return null
    return buildRouteSummary(
      graph,
      points.map(({ lng, lat }) => ({ lng, lat })),
      mode
    )
  }, [graph, points, mode])

  const status: string = graphUnavailable
    ? STRINGS.routePlannerStatusUnavailable
    : points.length === 0
      ? STRINGS.routePlannerStatusEmpty
      : points.length === 1
        ? STRINGS.routePlannerStatusOnePoint
        : summary
          ? `${points.length} ${STRINGS.routePlannerStatusConnected}`
          : STRINGS.routePlannerStatusNotFound

  // Map click while enabled: append a new point.
  useEffect(() => {
    if (!enabled) return
    return subscribeMapClick((lngLat) => {
      setPoints((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, lng: lngLat.lng, lat: lngLat.lat }])
    })
  }, [enabled, subscribeMapClick])

  useEffect(() => {
    const map = getMap()
    if (!map) return
    map.getCanvas().style.cursor = enabled ? "crosshair" : ""
    return () => {
      map.getCanvas().style.cursor = ""
    }
  }, [enabled, getMap])

  // Route line on the map.
  useEffect(() => {
    const map = getMap()
    if (!map) return
    const source = map.getSource("route") as GeoJSONSource | undefined
    if (!source) return
    source.setData({ type: "FeatureCollection", features: summary ? [summary.line] : [] } as never)
  }, [summary, getMap])

  // Draggable A/B/waypoint markers - rebuilt whenever the point list changes.
  useEffect(() => {
    const map = getMap()
    const markers = markersRef.current
    const clearAll = () => {
      for (const marker of markers.values()) marker.remove()
      markers.clear()
    }
    clearAll()
    if (!map) return clearAll

    points.forEach((point, index) => {
      const color = routePointColor(index, points.length)
      const marker = new maplibregl.Marker({ color, draggable: true })
        .setLngLat([point.lng, point.lat])
        .addTo(map)
      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat()
        setPoints((prev) =>
          prev.map((entry) => (entry.id === point.id ? { ...entry, lng, lat } : entry))
        )
      })
      markers.set(point.id, marker)
    })

    return clearAll
  }, [points, getMap])

  useEffect(() => clearRoute, [])

  const network = mode === "biking" ? STRINGS.routePlannerNetworkBiking : STRINGS.routePlannerNetworkWalking
  const WalkIcon = ICONS.routePlannerWalking
  const BikeIcon = ICONS.routePlannerBiking
  const EbikeIcon = ICONS.routePlannerEbike
  const RemoveIcon = ICONS.routePlannerRemovePoint

  function pointLabel(index: number): string {
    if (index === 0) return STRINGS.routePlannerStart
    if (index === points.length - 1) return STRINGS.routePlannerEnd
    return `${STRINGS.routePlannerWaypoint} ${index}`
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="sm" variant={enabled ? "default" : "outline"} onClick={() => setEnabled((v) => !v)}>
        {enabled ? STRINGS.routePlannerActive : STRINGS.routePlannerActivate}
      </Button>
      <p className="text-xs text-muted-foreground">
        {STRINGS.routePlannerHint} {network}.
      </p>

      {points.length > 0 && (
        <ul className="flex flex-col gap-1">
          {points.map((point, index) => (
            <li key={point.id} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: routePointColor(index, points.length) }}
                aria-hidden="true"
              />
              <span className="font-medium">{pointLabel(index)}</span>
              <span className="text-muted-foreground">
                {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
              </span>
              <button
                type="button"
                className="ml-auto text-muted-foreground hover:text-foreground"
                title="Rimuovi"
                onClick={() => setPoints((prev) => prev.filter((p) => p.id !== point.id))}
              >
                <RemoveIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={points.length < 2} onClick={() => setPoints((prev) => [...prev].reverse())}>
          {STRINGS.routePlannerSwap}
        </Button>
        <Button size="sm" variant="outline" disabled={points.length === 0} onClick={() => setPoints((prev) => prev.slice(0, -1))}>
          {STRINGS.routePlannerUndo}
        </Button>
        <Button size="sm" variant="outline" disabled={points.length === 0} onClick={clearRoute}>
          {STRINGS.routePlannerClear}
        </Button>
      </div>

      {!summary && <p className="text-xs text-muted-foreground">{status}</p>}

      {summary && (
        <>
          <div className="flex items-center gap-3 text-sm font-medium">
            <span>{formatDistance(summary.distanceKm)}</span>
            <span>+{Math.round(summary.elevationGainM)} m</span>
            <span>-{Math.round(summary.elevationLossM)} m</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex flex-col items-center gap-0.5">
              <WalkIcon className="size-4" aria-hidden="true" />
              {formatTime(summary.times.walking)}
              <span className="text-muted-foreground">{STRINGS.routePlannerWalking}</span>
            </span>
            <span className="flex flex-col items-center gap-0.5">
              <BikeIcon className="size-4" aria-hidden="true" />
              {formatTime(summary.times.biking)}
              <span className="text-muted-foreground">{STRINGS.routePlannerBiking}</span>
            </span>
            <span className="flex flex-col items-center gap-0.5">
              <EbikeIcon className="size-4" aria-hidden="true" />
              {formatTime(summary.times.ebike)}
              <span className="text-muted-foreground">{STRINGS.routePlannerEbike}</span>
            </span>
          </div>

          {summary.surfaceBreakdown.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">{STRINGS.routePlannerSurfaceTitle}</span>
              <div className="flex h-2 overflow-hidden rounded-full">
                {summary.surfaceBreakdown.map((run) => (
                  <span
                    key={run.label}
                    className="h-full bg-primary/70 first:ml-0 not-first:border-l not-first:border-background"
                    style={{ width: `${(run.km / summary.distanceKm) * 100}%` }}
                    title={`${run.label}: ${run.km.toFixed(2)} km`}
                  />
                ))}
              </div>
              <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {summary.surfaceBreakdown.map((run) => (
                  <li key={run.label} className="flex justify-between">
                    <span>{run.label}</span>
                    <span>{run.km.toFixed(run.km >= 10 ? 1 : 2)} km</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.profile.length >= 2 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">
                {STRINGS.routePlannerProfileTitle} <span className="text-muted-foreground">({STRINGS.routePlannerProfileSubtitle})</span>
              </span>
              <ElevationProfile summary={summary} />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">{STRINGS.routePlannerDownloads}</span>
            <div className="flex flex-wrap gap-2">
              {EXPORT_FORMATS.map((format) => (
                <Button key={format} size="sm" variant="outline" onClick={() => exportRoute(summary, format)}>
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
