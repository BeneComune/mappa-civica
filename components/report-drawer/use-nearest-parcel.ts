// components\report-drawer\use-nearest-parcel.ts
"use client"

import { useEffect, useState } from "react"
import { loadParcels, nearestParcel, type ParcelPoint } from "@/lib/catasto"

// Resolves the cadastral parcel containing the picked location. The parcel
// points are fetched once, the first time the drawer opens, and reused for
// every later lookup.
export function useNearestParcel(
  active: boolean,
  location: [number, number] | null
): ParcelPoint | null {
  const [parcels, setParcels] = useState<ParcelPoint[]>([])

  useEffect(() => {
    if (active && parcels.length === 0) {
      loadParcels().then(setParcels)
    }
  }, [active, parcels.length])

  return location ? nearestParcel(parcels, location[0], location[1]) : null
}
