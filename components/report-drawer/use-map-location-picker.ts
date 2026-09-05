// components\report-drawer\use-map-location-picker.ts
"use client"

import { useEffect } from "react"
import { useMapContext } from "@/components/map-provider"

// While `active`, a map click sets the report's location and drops a pin
// there. Removes the pin when the drawer closes or the component unmounts.
export function useMapLocationPicker(
  active: boolean,
  onPick: (location: [number, number]) => void
): void {
  const { subscribeMapClick, setPinMarker } = useMapContext()

  useEffect(() => {
    if (!active) return
    const unsubscribe = subscribeMapClick((lngLat) => {
      onPick([lngLat.lng, lngLat.lat])
      setPinMarker([lngLat.lng, lngLat.lat])
    })
    return () => {
      unsubscribe()
      setPinMarker(null)
    }
  }, [active, subscribeMapClick, setPinMarker, onPick])
}
