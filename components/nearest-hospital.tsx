// components\nearest-hospital.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import type { GeoJSONSource } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"
import { useMapLocationPicker } from "@/components/report-drawer/use-map-location-picker"
import { formatDistance, formatTime } from "@/components/route-planner/format"
import { computeDrivingRoute, loadDrivingGraph, type DrivingRoute, type RoutingGraph } from "@/lib/routing"
import { STRINGS } from "@/lib/strings"

type Hospital = { name: string; address: string; lng: number; lat: number }

// Click-a-point-on-the-map planner to the one fixed hospital in
// hospital.geojson, driving-only (see lib/routing/driving.ts). Deliberately
// separate from RoutePlanner: there's a single, non-draggable destination
// and no walking/biking/ebike comparison to show.
export function NearestHospital() {
  const { getMap } = useMapContext()
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [point, setPoint] = useState<{ lng: number; lat: number } | null>(null)
  const [graph, setGraph] = useState<RoutingGraph | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  // The route reaches past the comune boundary, so it needs its own driving
  // network (hospital_roads.geojson) rather than the comune-only
  // transport.geojson the other planners use.
  useEffect(() => {
    let cancelled = false
    loadDrivingGraph("/data/rescue/hospital_roads.geojson")
      .then((loaded) => {
        if (!cancelled) setGraph(loaded)
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    fetch("/data/rescue/hospital.geojson")
      .then((response) => response.json())
      .then((geojson) => {
        const feature = geojson.features[0]
        const [lng, lat] = feature.geometry.coordinates
        const { name, address } = feature.properties
        setHospital({ name, address, lng, lat })
      })
      .catch(() => null)
  }, [])

  useMapLocationPicker(true, (location) => setPoint({ lng: location[0], lat: location[1] }))

  const route: DrivingRoute | null = useMemo(() => {
    if (!graph || !point || !hospital) return null
    return computeDrivingRoute(graph, point, { lng: hospital.lng, lat: hospital.lat })
  }, [graph, point, hospital])

  useEffect(() => {
    const map = getMap()
    if (!map) return
    const source = map.getSource("route") as GeoJSONSource | undefined
    if (!source) return
    source.setData({
      type: "FeatureCollection",
      features: route ? [route.line] : [],
    } as never)
  }, [route, getMap])

  const status = unavailable
    ? STRINGS.nearestHospitalUnavailable
    : !point
      ? STRINGS.nearestHospitalHint
      : !route
        ? STRINGS.nearestHospitalNotFound
        : null

  return (
    <div className="flex flex-col gap-3">
      {hospital && (
        <p className="text-xs text-muted-foreground">
          {hospital.name} · {hospital.address}
        </p>
      )}

      {status && <p className="text-xs text-muted-foreground">{status}</p>}

      {route && (
        <>
          <div className="flex items-center gap-3 text-sm font-medium">
            <span>{formatDistance(route.distanceKm)}</span>
            <span>{formatTime(route.timeMin)}</span>
          </div>

          {hospital && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium underline underline-offset-2"
            >
              {STRINGS.nearestHospitalOpenDirections}
            </a>
          )}
        </>
      )}
    </div>
  )
}
