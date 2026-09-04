// lib\catasto.ts
// Lazy loader + nearest-parcel lookup for the cadastral point layer
// (public/data/catasto.geojson: one interior point per parcel, with foglio +
// particella). Used by the Home identify toggle and the Segnala autofill.

export type ParcelPoint = { foglio: string; particella: string; lng: number; lat: number }

let cache: ParcelPoint[] | null = null
let inflight: Promise<ParcelPoint[]> | null = null

export async function loadParcels(): Promise<ParcelPoint[]> {
  if (cache) return cache
  if (!inflight) {
    inflight = fetch("/data/catasto.geojson")
      .then((r) => (r.ok ? r.json() : { features: [] }))
      .then(
        (fc: {
          features?: Array<{
            geometry: { coordinates: [number, number] }
            properties: { foglio: string; particella: string }
          }>
        }) => {
          cache = (fc.features ?? []).map((f) => ({
            foglio: String(f.properties.foglio),
            particella: String(f.properties.particella),
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          }))
          return cache
        }
      )
      .catch(() => {
        cache = []
        return cache
      })
  }
  return inflight
}

// Nearest parcel point to a location, or null if none within `maxMeters`.
// Plain squared-distance scan - a few ms over ~15k points, fine on click.
export function nearestParcel(
  parcels: ParcelPoint[],
  lng: number,
  lat: number,
  maxMeters = 120
): ParcelPoint | null {
  const cosLat = Math.cos((lat * Math.PI) / 180)
  let best: ParcelPoint | null = null
  let bestSq = Infinity
  for (const p of parcels) {
    const dx = (p.lng - lng) * cosLat
    const dy = p.lat - lat
    const sq = dx * dx + dy * dy
    if (sq < bestSq) {
      bestSq = sq
      best = p
    }
  }
  if (!best) return null
  const metres = Math.sqrt(bestSq) * 111_320
  return metres <= maxMeters ? best : null
}
