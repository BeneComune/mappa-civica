// components\home-panel.tsx
"use client"

import { useEffect, useState } from "react"
import { WeatherCard } from "@/components/weather-card"
import { CatastoToggle } from "@/components/catasto-toggle"
import { FrazioniList } from "@/components/frazioni-list"
import { MunicipalityStatsPanel, type MunicipalityStats } from "@/components/municipality-stats"
import { STRINGS } from "@/lib/strings"

// Desktop: a floating card. Mobile (< md): plain content stacked inside the
// bottom sheet PanelFrame provides, so no card chrome and no width cap.
const CARD =
  "pointer-events-auto w-full md:rounded-lg md:border md:bg-background/95 md:p-3 md:shadow-lg md:backdrop-blur"

export function HomePanel() {
  const [stats, setStats] = useState<MunicipalityStats | null>(null)

  useEffect(() => {
    fetch("/data/municipality_stats.json")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => null)
  }, [])

  // md:contents => on desktop this wrapper generates no box, so the three
  // groups position absolutely against <main> exactly as before; on mobile
  // it's a flex column that stacks them inside the sheet.
  return (
    <div className="flex flex-col gap-3 md:contents">
      {/* Top-left: zone name, stats. */}
      <div className="flex flex-col gap-2 md:pointer-events-none md:absolute md:top-0 md:left-0 md:overflow-y-auto md:p-4">
        <section className={`${CARD} md:max-w-xs`}>
          <h2 className="text-xl font-semibold">{stats?.municipality.name ?? STRINGS.appName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{STRINGS.homeSubtitle}</p>
        </section>

        {stats && (
          <section className={`${CARD} md:max-w-sm`}>
            <MunicipalityStatsPanel stats={stats} />
          </section>
        )}
      </div>

      {/* Bottom-left: frazioni + catasto toggle, same anchor point every
          other route's legend panel uses. */}
      <div className="flex flex-col gap-2 md:pointer-events-none md:absolute md:bottom-0 md:left-0 md:p-4">
        <section className={`${CARD} md:max-w-xs`}>
          <CatastoToggle />
        </section>

        <section className={`${CARD} md:max-w-xs`}>
          <FrazioniList />
        </section>
      </div>

      {/* Weather floats independently top-right on desktop, to the left of the
          map's own control column; on mobile it's just another section. */}
      <div className="md:pointer-events-none md:absolute md:top-2.5 md:right-10">
        <section className={`${CARD} md:max-w-xs`}>
          <WeatherCard />
        </section>
      </div>
    </div>
  )
}
