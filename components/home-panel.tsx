"use client"

import { useEffect, useState } from "react"
import { WeatherCard } from "@/components/weather-card"
import { CatastoToggle } from "@/components/catasto-toggle"
import { FrazioniList } from "@/components/frazioni-list"
import { MunicipalityStatsPanel, type MunicipalityStats } from "@/components/municipality-stats"
import { STRINGS } from "@/lib/strings"

const CARD = "pointer-events-auto w-full max-w-xs rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur"

export function HomePanel() {
  const [stats, setStats] = useState<MunicipalityStats | null>(null)

  useEffect(() => {
    fetch("/data/municipality_stats.json")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => null)
  }, [])

  return (
    <>
      {/* Top-left: zone name, stats. */}
      <div className="pointer-events-none absolute top-0 left-0 flex flex-col gap-2 overflow-y-auto p-4">
        <section className={CARD}>
          <h2 className="text-xl font-semibold">{stats?.municipality.name ?? STRINGS.appName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{STRINGS.homeSubtitle}</p>
        </section>

        {stats && (
          <section className={CARD}>
            <MunicipalityStatsPanel stats={stats} />
          </section>
        )}
      </div>

      {/* Bottom-left: frazioni + catasto toggle, same anchor point every
          other route's legend panel uses. */}
      <div className="pointer-events-none absolute bottom-0 left-0 flex flex-col gap-2 p-4">
        <section className={CARD}>
          <CatastoToggle />
        </section>

        <section className={CARD}>
          <FrazioniList />
        </section>
      </div>

      {/* Weather floats independently top-right, to the left of the map's
          own zoom/fullscreen/search/terrain/print control column, at the
          same height as the top of that column. */}
      <div className="pointer-events-none absolute top-2.5 right-10">
        <section className={CARD}>
          <WeatherCard />
        </section>
      </div>
    </>
  )
}
