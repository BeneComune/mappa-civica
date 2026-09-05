// lib\community\reports-store.ts
// useSyncExternalStore-compatible store for locally-pending reports:
// localStorage is the source of truth, this adds the subscribe/notify +
// cached-snapshot plumbing React needs to read it safely without an SSR
// hydration mismatch (the server has no window, so it must render the same
// empty list the client renders before its first effect would otherwise run).
import type { CommunityReport } from "./types"
import { readJSON } from "./storage"

const STORAGE_KEY = "mv_pending_reports"

const EMPTY_REPORTS: CommunityReport[] = []
const listeners = new Set<() => void>()
let cached: CommunityReport[] | null = null

export function subscribeReports(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function getReportsSnapshot(): CommunityReport[] {
  if (cached === null) cached = readJSON<CommunityReport[]>(STORAGE_KEY, [])
  return cached
}

export function getReportsServerSnapshot(): CommunityReport[] {
  return EMPTY_REPORTS
}

export function saveReports(reports: CommunityReport[]): void {
  cached = reports
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  }
  for (const listener of listeners) listener()
}
