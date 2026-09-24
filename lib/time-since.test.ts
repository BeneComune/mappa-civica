// lib\time-since.test.ts
import { describe, expect, it } from "vitest"
import { timeSince } from "@/lib/time-since"

const NOW = new Date(2026, 8, 24, 12, 0, 0)

describe("timeSince", () => {
  it("returns null for an invalid date", () => {
    expect(timeSince("not-a-date", NOW)).toBeNull()
  })

  it("reads under a minute and future dates as now", () => {
    expect(timeSince(new Date(2026, 8, 24, 11, 59, 30).toISOString(), NOW)).toEqual({ unit: "now", count: 0 })
    expect(timeSince(new Date(2026, 8, 24, 13, 0, 0).toISOString(), NOW)).toEqual({ unit: "now", count: 0 })
  })

  it("uses minutes under an hour", () => {
    expect(timeSince(new Date(2026, 8, 24, 11, 15, 0).toISOString(), NOW)).toEqual({ unit: "minutes", count: 45 })
  })

  it("uses hours under a day", () => {
    expect(timeSince(new Date(2026, 8, 24, 9, 0, 0).toISOString(), NOW)).toEqual({ unit: "hours", count: 3 })
  })

  it("uses days under a month", () => {
    expect(timeSince(new Date(2026, 8, 21, 12, 0, 0).toISOString(), NOW)).toEqual({ unit: "days", count: 3 })
    expect(timeSince(new Date(2026, 7, 25, 12, 0, 0).toISOString(), NOW)).toEqual({ unit: "days", count: 30 })
  })

  it("uses whole months under a year", () => {
    expect(timeSince(new Date(2026, 7, 24, 12, 0, 0).toISOString(), NOW)).toEqual({ unit: "months", count: 1 })
    expect(timeSince(new Date(2026, 5, 25, 12, 0, 0).toISOString(), NOW)).toEqual({ unit: "months", count: 2 })
  })

  it("uses whole years from twelve months", () => {
    expect(timeSince(new Date(2025, 8, 24, 12, 0, 0).toISOString(), NOW)).toEqual({ unit: "years", count: 1 })
    expect(timeSince(new Date(2023, 8, 25, 12, 0, 0).toISOString(), NOW)).toEqual({ unit: "years", count: 2 })
  })
})
