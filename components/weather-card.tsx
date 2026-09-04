// components\weather-card.tsx
"use client"

import { useEffect, useState } from "react"
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Droplet,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react"
import { MUNICIPALITY_CENTER } from "@/lib/config"

// Current conditions + rolling 24h rainfall from Open-Meteo (free, no key,
// CORS-enabled). Cached in localStorage so a browser refetches at most a few
// times a day, well inside the free limits. Hydrometric data is out of scope.

const CACHE_KEY = "mv_weather_cache"
const TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

type Weather = {
  tempC: number
  code: number
  windKmh: number
  humidity: number
  precip24hMm: number
  observedAt: string
}

const WMO: Record<number, { label: string; icon: typeof Sun }> = {
  0: { label: "Sereno", icon: Sun },
  1: { label: "Prevalentemente sereno", icon: Sun },
  2: { label: "Parzialmente nuvoloso", icon: CloudSun },
  3: { label: "Coperto", icon: Cloud },
  45: { label: "Nebbia", icon: CloudFog },
  48: { label: "Nebbia con brina", icon: CloudFog },
  51: { label: "Pioviggine debole", icon: CloudDrizzle },
  53: { label: "Pioviggine", icon: CloudDrizzle },
  55: { label: "Pioviggine intensa", icon: CloudDrizzle },
  61: { label: "Pioggia debole", icon: CloudRain },
  63: { label: "Pioggia", icon: CloudRain },
  65: { label: "Pioggia forte", icon: CloudRainWind },
  66: { label: "Pioggia gelata", icon: CloudHail },
  67: { label: "Pioggia gelata forte", icon: CloudHail },
  71: { label: "Neve debole", icon: CloudSnow },
  73: { label: "Neve", icon: CloudSnow },
  75: { label: "Neve forte", icon: CloudSnow },
  77: { label: "Nevischio", icon: CloudSnow },
  80: { label: "Rovesci deboli", icon: CloudRain },
  81: { label: "Rovesci", icon: CloudRain },
  82: { label: "Rovesci violenti", icon: CloudRainWind },
  85: { label: "Rovesci di neve", icon: CloudSnow },
  86: { label: "Rovesci di neve forti", icon: CloudSnow },
  95: { label: "Temporale", icon: CloudLightning },
  96: { label: "Temporale con grandine", icon: CloudLightning },
  99: { label: "Temporale con grandine forte", icon: CloudLightning },
}

function describe(code: number): { label: string; icon: typeof Sun } {
  return WMO[code] ?? { label: "Dati meteo", icon: Thermometer }
}

async function fetchWeather(): Promise<Weather> {
  const [lon, lat] = MUNICIPALITY_CENTER
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m" +
    "&hourly=precipitation&past_days=1&forecast_days=1&timezone=Europe%2FRome"
  const response = await fetch(url)
  if (!response.ok) throw new Error("meteo non disponibile")
  const data = await response.json()

  const times: string[] = data.hourly?.time ?? []
  const values: number[] = data.hourly?.precipitation ?? []
  const nowIndex = times.findIndex((t) => t > data.current.time)
  const end = nowIndex === -1 ? times.length : nowIndex
  const precip24hMm = values
    .slice(Math.max(0, end - 24), end)
    .reduce((sum, value) => sum + (value ?? 0), 0)

  return {
    tempC: data.current.temperature_2m,
    code: data.current.weather_code,
    windKmh: data.current.wind_speed_10m,
    humidity: data.current.relative_humidity_2m,
    precip24hMm,
    observedAt: data.current.time,
  }
}

function readCache(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as { data: Weather; fetchedAt: number }
    return Date.now() - cached.fetchedAt < TTL_MS ? cached.data : null
  } catch {
    return null
  }
}

export function WeatherCard() {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    let cancelled = false

    const cached = readCache()
    const result = cached
      ? Promise.resolve(cached)
      : fetchWeather().then((w) => {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: w, fetchedAt: Date.now() }))
          } catch {
            /* storage unavailable, still show this session */
          }
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
      <div className="flex items-center gap-3">
        <Icon className="size-8 shrink-0" aria-hidden="true" />
        <div>
          <span className="text-xl font-semibold">{Math.round(weather.tempC)}°C</span>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
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
    </div>
  )
}
