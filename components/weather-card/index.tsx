// components\weather-card\index.tsx
"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Droplet, Umbrella, Wind } from "lucide-react"
import { useIsMobile } from "@/lib/use-is-mobile"
import { describe } from "./wmo-codes"
import { fetchWeather, readCache, writeCache, type Weather } from "./weather"

// Current conditions + rolling 24h rainfall for the municipality. Renders
// nothing until data arrives, and stays hidden if the fetch fails. On mobile
// it starts collapsed to just temperature + condition; tap to see the rest.
export function WeatherCard() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const showDetails = !isMobile || open

  useEffect(() => {
    let cancelled = false

    const cached = readCache()
    const result = cached
      ? Promise.resolve(cached)
      : fetchWeather().then((w) => {
          writeCache(w)
          return w
        })

    result
      .then((w) => {
        if (!cancelled) setWeather(w)
      })
      .catch(() => {
        /* leave the card hidden on failure */
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!weather) return null

  const { label, icon: Icon } = describe(weather.code)
  const time = new Date(weather.observedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex flex-col gap-2" aria-label="Meteo attuale">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={showDetails}
        className="flex items-center gap-3 text-left"
      >
        <Icon className="size-8 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <span className="text-xl font-semibold">{Math.round(weather.tempC)}°C</span>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform md:hidden ${showDetails ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {showDetails && (
        <>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1">
              <Umbrella className="size-3.5" aria-hidden="true" /> {weather.precip24hMm.toFixed(1)} mm / 24h
            </li>
            <li className="flex items-center gap-1">
              <Wind className="size-3.5" aria-hidden="true" /> {Math.round(weather.windKmh)} km/h
            </li>
            <li className="flex items-center gap-1">
              <Droplet className="size-3.5" aria-hidden="true" /> {weather.humidity}%
            </li>
          </ul>
          <span className="text-xs text-muted-foreground">
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">
              Open-Meteo
            </a>{" "}
            · agg. {time}
          </span>
        </>
      )}
    </div>
  )
}
