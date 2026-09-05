// components\weather-card\weather.ts
// Fetching and caching the current conditions. Open-Meteo is free, needs
// no key and is CORS-enabled; the localStorage cache keeps a browser to a
// few refetches a day, well inside the free limits.
import { MUNICIPALITY_CENTER } from "@/lib/config"

const CACHE_KEY = "mv_weather_cache"
const TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

export type Weather = {
  tempC: number
  code: number
  windKmh: number
  humidity: number
  precip24hMm: number
  observedAt: string
}

export async function fetchWeather(): Promise<Weather> {
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

export function readCache(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as { data: Weather; fetchedAt: number }
    return Date.now() - cached.fetchedAt < TTL_MS ? cached.data : null
  } catch {
    return null
  }
}

export function writeCache(weather: Weather): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: weather, fetchedAt: Date.now() }))
  } catch {
    /* storage unavailable, still show this session */
  }
}
