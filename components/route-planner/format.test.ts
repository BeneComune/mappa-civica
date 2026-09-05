// components\route-planner\format.test.ts
import { describe, expect, it } from "vitest"
import { formatDistance, formatTime, routePointColor } from "./format"
import { COLORS } from "@/lib/colors"

describe("formatDistance", () => {
  it("uses two decimals under 10 km and one at or above", () => {
    expect(formatDistance(1.234)).toBe("1.23 km")
    expect(formatDistance(9.999)).toBe("10.00 km")
    expect(formatDistance(10)).toBe("10.0 km")
    expect(formatDistance(42.66)).toBe("42.7 km")
  })

  it("handles a zero-length route", () => {
    expect(formatDistance(0)).toBe("0.00 km")
  })
})

describe("formatTime", () => {
  it("shows whole minutes under an hour", () => {
    expect(formatTime(25.4)).toBe("25 min")
    expect(formatTime(59.4)).toBe("59 min")
  })

  it("never rounds a real route down to zero minutes", () => {
    expect(formatTime(0.1)).toBe("1 min")
  })

  it("switches to hours and minutes at 60", () => {
    expect(formatTime(60)).toBe("1 h 0 min")
    expect(formatTime(95)).toBe("1 h 35 min")
    expect(formatTime(150)).toBe("2 h 30 min")
  })
})

describe("routePointColor", () => {
  it("distinguishes start, end and waypoints", () => {
    expect(routePointColor(0, 3)).toBe(COLORS.routePointStart)
    expect(routePointColor(1, 3)).toBe(COLORS.routePointWaypoint)
    expect(routePointColor(2, 3)).toBe(COLORS.routePointEnd)
  })

  it("treats a lone point as the start", () => {
    expect(routePointColor(0, 1)).toBe(COLORS.routePointStart)
  })

  it("has no waypoints in a two-point route", () => {
    expect(routePointColor(0, 2)).toBe(COLORS.routePointStart)
    expect(routePointColor(1, 2)).toBe(COLORS.routePointEnd)
  })
})
