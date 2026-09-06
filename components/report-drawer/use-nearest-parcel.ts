// components\report-drawer\use-nearest-parcel.ts
"use client"

import { useEffect, useMemo, useState } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"

export type ParcelPoint = { foglio: string; particella: string; lng: number; lat: number }

// Resolves the cadastral parcel nearest the picked location by reading the
// loaded catasto vector tiles (public/data/catasto.pmtiles) around it - no
// full-dataset fetch. Null until the drawer is open, a location is picked,
// and the catasto source has tiles covering that spot; recomputed as tiles
// stream in.
const MAX_METERS = 120

export function useNearestParcel(
  active: boolean,
  location: [number, number] | null
): ParcelPoint | null {
  const { getMap } = useMapContext()
  const [tilesTick, setTilesTick] = useState(0)

  useEffect(() => {
    if (!active || !location) return
    const map = getMap()
    if (!map) return

    const onSourceData = (event: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (event.sourceId === "catasto" && event.isSourceLoaded) setTilesTick((t) => t + 1)
    }
    map.on("sourcedata", onSourceData)
    return () => {
      map.off("sourcedata", onSourceData)
    }
  }, [active, location, getMap])

  return useMemo(() => {
    if (!active || !location) return null
    const map = getMap()
    if (!map) return null
    return nearestParcelFromTiles(map, location[0], location[1])
    // tilesTick forces a recompute once the tiles for this spot have loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, location, tilesTick, getMap])
}

function nearestParcelFromTiles(map: MapLibreMap, lng: number, lat: number): ParcelPoint | null {
  if (!map.getSource("catasto")) return null

  const cosLat = Math.cos((lat * Math.PI) / 180)
  let best: ParcelPoint | null = null
  let bestSq = Infinity

  for (const feature of map.querySourceFeatures("catasto", { sourceLayer: "catasto" })) {
    if (feature.geometry.type !== "Point") continue
    const [flng, flat] = feature.geometry.coordinates as [number, number]
    const dx = (flng - lng) * cosLat
    const dy = flat - lat
    const sq = dx * dx + dy * dy
    if (sq < bestSq) {
      bestSq = sq
      best = {
        foglio: String(feature.properties?.foglio ?? ""),
        particella: String(feature.properties?.particella ?? ""),
        lng: flng,
        lat: flat,
      }
    }
  }

  if (!best) return null
  return Math.sqrt(bestSq) * 111_320 <= MAX_METERS ? best : null
}
