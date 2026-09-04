"use client"

import { useEffect, useRef, useState } from "react"
import type { MapMouseEvent, PointLike } from "maplibre-gl"
import { useMapContext } from "@/components/map-provider"
import { MUNICIPALITY_CADASTRAL_CODE, MUNICIPALITY_NAME } from "@/lib/config"
import { CATASTO_LAYER_IDS } from "@/lib/map"

type Parcel = { foglio: string; particella: string; lng: number; lat: number }

export function CatastoToggle() {
  const { getMap, setLayersVisible, setSourceData } = useMapContext()
  const [enabled, setEnabled] = useState(false)
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    setLayersVisible(CATASTO_LAYER_IDS, enabled)
    if (!enabled) return

    const map = getMap()
    if (!map) return

    if (!loadedRef.current) {
      setSourceData("catasto", "/data/catasto.geojson")
      loadedRef.current = true
    }
    if (map.getZoom() < 13) map.easeTo({ zoom: 13.5, duration: 700 })

    return () => {
      setLayersVisible(CATASTO_LAYER_IDS, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => {
    const map = getMap()
    if (!map || !enabled) return

    const boxAround = (p: { x: number; y: number }, r: number): [PointLike, PointLike] => [
      [p.x - r, p.y - r],
      [p.x + r, p.y + r],
    ]

    const onClick = (event: MapMouseEvent) => {
      if (!map.getLayer("catasto-points")) return
      const p = event.point
      const pick = (r: number) =>
        map
          .queryRenderedFeatures(boxAround(p, r), { layers: ["catasto-points"] })
          .filter((feat) => feat.geometry.type === "Point")

      const coordsOf = (feat: (typeof hits)[number]): [number, number] =>
        (feat.geometry as { type: "Point"; coordinates: [number, number] }).coordinates

      let hits = pick(6)
      if (hits.length === 0) hits = pick(40)
      const feature = hits.sort((a, b) => {
        const pa = map.project(coordsOf(a))
        const pb = map.project(coordsOf(b))
        return Math.hypot(pa.x - p.x, pa.y - p.y) - Math.hypot(pb.x - p.x, pb.y - p.y)
      })[0]
      if (!feature) return
      const [lng, lat] = coordsOf(feature)
      setParcel({
        foglio: String(feature.properties?.foglio ?? ""),
        particella: String(feature.properties?.particella ?? ""),
        lng,
        lat,
      })
    }

    const onMove = (event: MapMouseEvent) => {
      if (!map.getLayer("catasto-points")) return
      const near = map.queryRenderedFeatures(
        [
          [event.point.x - 6, event.point.y - 6],
          [event.point.x + 6, event.point.y + 6],
        ],
        { layers: ["catasto-points"] }
      )
      map.getCanvas().style.cursor = near.length ? "pointer" : ""
    }

    map.on("click", onClick)
    map.on("mousemove", onMove)
    return () => {
      map.off("click", onClick)
      map.off("mousemove", onMove)
      map.getCanvas().style.cursor = ""
    }
  }, [enabled, getMap])

  return (
    <div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked)
            if (!e.target.checked) setParcel(null)
          }}
          className="size-4 accent-primary"
        />
        Particelle catastali
      </label>

      {enabled && !parcel && (
        <p className="mt-1 text-xs text-muted-foreground">
          Ingrandisci la mappa e clicca un punto per leggere <b>foglio</b> e <b>particella</b>.
        </p>
      )}

      {parcel && (
        <div className="mt-1 flex flex-col gap-1 text-xs">
          <strong>
            Foglio {parcel.foglio} · Particella {parcel.particella}
          </strong>
          <p className="text-muted-foreground">
            Comune catastale {MUNICIPALITY_CADASTRAL_CODE} ({MUNICIPALITY_NAME}). Serve per pagare IMU/TARI,
            chiedere una <b>visura</b>, pratiche edilizie (CILA/SCIA), successioni, compravendite, mutui.
          </p>
          <a
            href="https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/visura-catastale/consultazione-rendite-catastali"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Consulta rendita / visura (Agenzia delle Entrate)
          </a>
          <p className="text-muted-foreground">
            Dati aperti onData (CC BY 4.0): solo catasto terreni, senza proprietari né rendite. Il confine
            catastale non è probatorio, e un fabbricato non mappato qui va verificato a parte.
          </p>
        </div>
      )}
    </div>
  )
}
