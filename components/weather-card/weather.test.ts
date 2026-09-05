// components\weather-card\weather.test.ts
// The non-React half of the weather card: the WMO lookup, the 24h rainfall
// window, and the TTL cache.
import { afterEach, describe, expect, it, vi } from "vitest"
import { describe as describeCode } from "./wmo-codes"
import { fetchWeather, readCache, writeCache } from "./weather"

function stubStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
  return store
}

// 26 hourly readings; `current.time` sits at index 25 so the rolling window
// is the 24 entries before it (indices 1..24).
function hourlyPayload(precipitation: number[], currentTime = "2026-09-05T01:00") {
  return {
    current: {
      time: currentTime,
      temperature_2m: 14.2,
      weather_code: 3,
      wind_speed_10m: 9,
      relative_humidity_2m: 80,
    },
    hourly: {
      time: precipitation.map((_, i) => `2026-09-04T${String(i).padStart(2, "0")}:00`),
      precipitation,
    },
  }
}

function mockFetch(payload: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok, json: async () => payload })))
}

afterEach(() => vi.unstubAllGlobals())

describe("wmo codes", () => {
  it("maps known codes to a label and icon", () => {
    expect(describeCode(0).label).toBe("Sereno")
    expect(describeCode(95).label).toBe("Temporale")
    expect(describeCode(0).icon).toBeTruthy()
  })

  it("falls back for an unknown code rather than throwing", () => {
    const unknown = describeCode(4242)
    expect(unknown.label).toBe("Dati meteo")
    expect(unknown.icon).toBeTruthy()
  })
})

describe("fetchWeather", () => {
  it("reads the current conditions through", async () => {
    mockFetch(hourlyPayload(Array(26).fill(0)))
    const w = await fetchWeather()
    expect(w.tempC).toBe(14.2)
    expect(w.code).toBe(3)
    expect(w.windKmh).toBe(9)
    expect(w.humidity).toBe(80)
    expect(w.observedAt).toBe("2026-09-05T01:00")
  })

  it("sums only the 24 hours before the current reading", async () => {
    // index 0 is outside the window; indices 1..24 are inside; 25 is at/after now.
    const precip = Array(26).fill(0)
    precip[0] = 100 // too old
    precip[1] = 1
    precip[24] = 2
    precip[25] = 500 // at or after the current hour
    mockFetch(hourlyPayload(precip, "2026-09-04T24:00"))

    const w = await fetchWeather()
    expect(w.precip24hMm).toBeCloseTo(3, 6)
  })

  it("treats missing hourly data as no rainfall", async () => {
    mockFetch({ current: { time: "x", temperature_2m: 1, weather_code: 0, wind_speed_10m: 0, relative_humidity_2m: 0 } })
    const w = await fetchWeather()
    expect(w.precip24hMm).toBe(0)
  })

  it("rejects when the endpoint is unavailable", async () => {
    mockFetch({}, false)
    await expect(fetchWeather()).rejects.toThrow("meteo non disponibile")
  })
})

describe("weather cache", () => {
  const sample = {
    tempC: 10, code: 0, windKmh: 1, humidity: 50, precip24hMm: 0, observedAt: "t",
  }

  it("returns nothing when empty", () => {
    stubStorage()
    expect(readCache()).toBeNull()
  })

  it("round-trips a fresh entry", () => {
    stubStorage()
    writeCache(sample as never)
    expect(readCache()).toEqual(sample)
  })

  it("ignores an entry past its TTL", () => {
    const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000
    stubStorage({ mv_weather_cache: JSON.stringify({ data: sample, fetchedAt: fiveHoursAgo }) })
    expect(readCache()).toBeNull()
  })

  it("keeps an entry inside its TTL", () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    stubStorage({ mv_weather_cache: JSON.stringify({ data: sample, fetchedAt: oneHourAgo }) })
    expect(readCache()).toEqual(sample)
  })

  it("survives malformed cache contents", () => {
    stubStorage({ mv_weather_cache: "{not json" })
    expect(readCache()).toBeNull()
  })

  it("does not throw when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota")
      },
    })
    expect(() => writeCache(sample as never)).not.toThrow()
  })
})
