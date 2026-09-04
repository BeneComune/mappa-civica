// components\frazioni-list.tsx
"use client"

import { useEffect, useState } from "react"
import { useMapContext } from "@/components/map-provider"

type FrazioneFeature = {
  name: string
  type: "capoluogo" | "frazione" | "borgata"
  centroid_lon: number
  centroid_lat: number
  name_fur?: string
}

export function FrazioniList() {
  const { flyTo } = useMapContext()
  const [frazioni, setFrazioni] = useState<FrazioneFeature[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch("/data/frazioni.geojson")
      .then((r) => r.json())
      .then((geojson) => {
        const items: FrazioneFeature[] = geojson.features.map((f: { properties: FrazioneFeature }) => f.properties)
        setFrazioni(items)
      })
      .catch(() => null)
  }, [])

  const visible = frazioni.filter((f) => f.type !== "borgata")
  if (visible.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold">Frazioni</h3>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {visible.map((f) => (
          <li key={f.name}>
            <button
              type="button"
              onClick={() => {
                setSelected(f.name)
                flyTo([f.centroid_lon, f.centroid_lat], 14)
              }}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                selected === f.name ? "bg-accent text-accent-foreground" : "hover:bg-accent"
              }`}
            >
              {f.name}
              {f.name_fur && <span className="ml-1 text-muted-foreground">{f.name_fur}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
