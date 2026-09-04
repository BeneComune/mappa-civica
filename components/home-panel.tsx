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
    // Independent floating cards, not one shared panel (see PanelFrame) -
    // the stack scrolls as a group if it overflows the viewport.
    <div className="pointer-events-none absolute inset-0 flex flex-col gap-2 overflow-y-auto p-4">
      <section className={CARD}>
        <h2 className="text-xl font-semibold">{stats?.municipality.name ?? STRINGS.appName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{STRINGS.homeSubtitle}</p>
      </section>

      <section className={CARD}>
        <WeatherCard />
      </section>

      <section className={CARD}>
        <CatastoToggle />
      </section>

      <section className={CARD}>
        <FrazioniList />
      </section>

      {stats && (
        <section className={CARD}>
          <MunicipalityStatsPanel stats={stats} />
        </section>
      )}
    </div>
  )
}
