import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

// Simplified port of the old app's communityStore.ts. Not ported yet:
// duckdb-backed official reports (loadCommunityReports), cadastral parcel
// snapping (foglio/particella), and photo upload.

export const MUNICIPALITY_EMAIL = "info@comune.montereale-valcellina.pn.it"

export const CATEGORIES = [
  { id: "strade", label: STRINGS.reportCategoryRoads, icon: ICONS.reportRoads, color: "#e8590c" },
  { id: "natura", label: STRINGS.reportCategoryNature, icon: ICONS.reportNature, color: "#2f9e44" },
  { id: "rifiuti", label: STRINGS.reportCategoryWaste, icon: ICONS.reportWaste, color: "#7b2cbf" },
  { id: "illuminazione", label: STRINGS.reportCategoryLighting, icon: ICONS.reportLighting, color: "#f59f00" },
  { id: "segnaletica", label: STRINGS.reportCategorySignage, icon: ICONS.reportSignage, color: "#1c7ed6" },
  { id: "proposta", label: STRINGS.reportCategoryProposal, icon: ICONS.reportProposal, color: "#0ca678" },
] as const

export type CategoryId = (typeof CATEGORIES)[number]["id"]

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export type CommunityReport = {
  id: string
  category: CategoryId
  title: string
  description: string
  lon: number
  lat: number
  createdAt: string
}

const STORAGE_KEY = "mv_pending_reports"

function loadReports(): CommunityReport[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CommunityReport[]) : []
  } catch {
    return []
  }
}

const EMPTY_REPORTS: CommunityReport[] = []
const listeners = new Set<() => void>()
let cached: CommunityReport[] | null = null

// useSyncExternalStore-compatible store: localStorage is the source of
// truth, this just adds the subscribe/notify + cached-snapshot plumbing
// React needs to read it safely without an SSR hydration mismatch (server
// has no window, so it must render the same empty list the client renders
// before its first effect would otherwise run).
export function subscribeReports(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function getReportsSnapshot(): CommunityReport[] {
  if (cached === null) cached = loadReports()
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

// Upvoting ("Anche a me importa"), same subscribe/snapshot pattern as
// reports above.
type Votes = Record<string, number>
const VOTES_KEY = "mv_report_votes"
const VOTED_IDS_KEY = "mv_voted_ids"
const EMPTY_VOTES: Votes = {}
const EMPTY_VOTED_IDS: string[] = []
const voteListeners = new Set<() => void>()
let cachedVotes: Votes | null = null
let cachedVotedIds: string[] | null = null

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function subscribeVotes(onChange: () => void): () => void {
  voteListeners.add(onChange)
  return () => voteListeners.delete(onChange)
}

export function getVotesSnapshot(): Votes {
  if (cachedVotes === null) cachedVotes = readJSON(VOTES_KEY, {})
  return cachedVotes
}

export function getVotesServerSnapshot(): Votes {
  return EMPTY_VOTES
}

export function getVotedIdsSnapshot(): string[] {
  if (cachedVotedIds === null) cachedVotedIds = readJSON(VOTED_IDS_KEY, [])
  return cachedVotedIds
}

export function getVotedIdsServerSnapshot(): string[] {
  return EMPTY_VOTED_IDS
}

export function toggleVote(reportId: string): void {
  const votes = { ...getVotesSnapshot() }
  const votedIds = new Set(getVotedIdsSnapshot())
  if (votedIds.has(reportId)) {
    votes[reportId] = Math.max(0, (votes[reportId] ?? 1) - 1)
    votedIds.delete(reportId)
  } else {
    votes[reportId] = (votes[reportId] ?? 0) + 1
    votedIds.add(reportId)
  }
  cachedVotes = votes
  cachedVotedIds = [...votedIds]
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
    window.localStorage.setItem(VOTED_IDS_KEY, JSON.stringify(cachedVotedIds))
  }
  for (const listener of voteListeners) listener()
}

export function buildReportMailto(report: CommunityReport): string {
  const catLabel = categoryLabel(report.category)
  const subject = `[Segnalazione] ${catLabel}: ${report.title}`
  const body = [
    `Categoria: ${catLabel}`,
    `Posizione: lat ${report.lat.toFixed(5)}, lon ${report.lon.toFixed(5)}`,
    ``,
    `Descrizione:`,
    report.description || "(nessuna descrizione)",
    ``,
    `---`,
    `Inviato dal portale ${STRINGS.appName}`,
  ].join("\n")

  return `mailto:${MUNICIPALITY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
