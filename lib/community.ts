// lib\community.ts
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

// Port of the old app's communityStore.ts. Official duckdb-backed reports
// live in lib/duckdb.ts (loadCommunityReports) and are merged in at the
// component level, since they aren't persisted to localStorage.

const MUNICIPALITY_EMAIL = "info@comune.montereale-valcellina.pn.it"

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
  photoDataUrl?: string
  foglio?: string
  particella?: string
}

// Downscales + re-encodes an uploaded photo client-side before it's stored
// as a data URL (localStorage has no room for full-resolution originals).
export function resizeImageToDataUrl(file: File, maxWidth = 1024, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("canvas"))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("load"))
    }
    img.src = objectUrl
  })
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
    ...(report.foglio && report.particella
      ? [`Particella catastale (indicativa): foglio ${report.foglio}, particella ${report.particella}`]
      : []),
    ``,
    `Descrizione:`,
    report.description || "(nessuna descrizione)",
    ...(report.photoDataUrl ? [``, `Fotografia allegata: → allegare il file all'email prima di inviare.`] : []),
    ``,
    `---`,
    `Inviato dal portale ${STRINGS.appName}`,
  ].join("\n")

  return `mailto:${MUNICIPALITY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
