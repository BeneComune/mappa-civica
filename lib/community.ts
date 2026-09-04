import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

// Simplified port of the old app's communityStore.ts. Not ported yet:
// duckdb-backed official reports (loadCommunityReports), cadastral parcel
// snapping (foglio/particella), photo upload, and upvoting - this covers
// only the "submit a new report" flow (local list + mailto), which is what
// the drawer form needs.

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
