// lib\time-since.ts
// "How long ago" as one whole unit (floored): minutes < 1h, hours < 1d, days < 1 month, then months, years.
export type TimeSinceUnit = "now" | "minutes" | "hours" | "days" | "months" | "years"

export type TimeSince = { unit: TimeSinceUnit; count: number }

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function wholeMonthsBetween(from: Date, to: Date): number {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
  const dayReached = to.getTime() - new Date(to.getFullYear(), to.getMonth(), 1).getTime()
  const fromDayOffset = from.getTime() - new Date(from.getFullYear(), from.getMonth(), 1).getTime()
  return dayReached < fromDayOffset ? months - 1 : months
}

export function timeSince(isoDate: string, now: Date = new Date()): TimeSince | null {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null

  // A date in the future (clock skew) reads as "just now"
  const elapsedMs = now.getTime() - date.getTime()
  if (elapsedMs < MINUTE_MS) return { unit: "now", count: 0 }
  if (elapsedMs < HOUR_MS) return { unit: "minutes", count: Math.floor(elapsedMs / MINUTE_MS) }
  if (elapsedMs < DAY_MS) return { unit: "hours", count: Math.floor(elapsedMs / HOUR_MS) }

  const months = wholeMonthsBetween(date, now)
  if (months < 1) return { unit: "days", count: Math.floor(elapsedMs / DAY_MS) }
  if (months < 12) return { unit: "months", count: months }
  return { unit: "years", count: Math.floor(months / 12) }
}
