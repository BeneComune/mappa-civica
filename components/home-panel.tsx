"use client"

import { useEffect, useState } from "react"
import { WeatherCard } from "@/components/weather-card"
import { CatastoToggle } from "@/components/catasto-toggle"
import { FrazioniList } from "@/components/frazioni-list"
import { MunicipalityStatsPanel, type MunicipalityStats } from "@/components/municipality-stats"
import { STRINGS } from "@/lib/strings"

export function HomePanel() {
  const [stats, setStats] = useState<MunicipalityStats | null>(null)

  useEffect(() => {
    fetch("/data/municipality_stats.json")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => null)
  }, [])

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-4 overflow-y-auto">
      <div>
        <h2 className="text-xl font-semibold">{stats?.municipality.name ?? STRINGS.appName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{STRINGS.homeSubtitle}</p>
      </div>

      <WeatherCard />

      <CatastoToggle />

      <FrazioniList />

      {stats && <MunicipalityStatsPanel stats={stats} />}
    </div>
  )
}
