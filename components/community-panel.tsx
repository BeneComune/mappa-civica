// components\community-panel.tsx
"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportDrawer } from "@/components/report-drawer"
import { FilterChips } from "@/components/filter-chips"
import { CommunityMarkers } from "@/components/community-markers"
import { useMapContext } from "@/components/map-provider"
import {
  CATEGORIES,
  categoryLabel,
  getReportsServerSnapshot,
  getReportsSnapshot,
  getVotedIdsServerSnapshot,
  getVotedIdsSnapshot,
  getVotesServerSnapshot,
  getVotesSnapshot,
  saveReports,
  subscribeReports,
  subscribeVotes,
  toggleVote,
  type CommunityReport,
} from "@/lib/community"
import { loadCommunityReports } from "@/lib/duckdb"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export function CommunityPanel() {
  const { flyTo } = useMapContext()
  const pendingReports = useSyncExternalStore(subscribeReports, getReportsSnapshot, getReportsServerSnapshot)
  const votes = useSyncExternalStore(subscribeVotes, getVotesSnapshot, getVotesServerSnapshot)
  const votedIds = useSyncExternalStore(subscribeVotes, getVotedIdsSnapshot, getVotedIdsServerSnapshot)
  const [categoryFilter, setCategoryFilter] = useState<string[]>(() => CATEGORIES.map((c) => c.id))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Official reports from the read-only DuckDB snapshot, fetched once on
  // mount and merged with the locally-pending ones below - kept separate
  // from the localStorage-backed store since they aren't ours to persist.
  const [dbReports, setDbReports] = useState<CommunityReport[]>([])

  useEffect(() => {
    loadCommunityReports().then(setDbReports)
  }, [])

  const pendingIds = new Set(pendingReports.map((r) => r.id))
  const reports = [...pendingReports, ...dbReports.filter((r) => !pendingIds.has(r.id))]

  const filteredReports = reports.filter((r) => categoryFilter.includes(r.category))

  function handleSubmitted(report: CommunityReport): void {
    saveReports([...pendingReports, report])
  }

  function handleDelete(id: string): void {
    saveReports(pendingReports.filter((r) => r.id !== id))
    setDbReports((prev) => prev.filter((r) => r.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleSelect(report: CommunityReport): void {
    setSelectedId(report.id)
    flyTo([report.lon, report.lat], 15)
  }

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto">
      <CommunityMarkers reports={filteredReports} onSelect={handleSelect} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <ICONS.community aria-hidden="true" className="size-5" />
          {STRINGS.community}
        </h2>
        <ReportDrawer onSubmitted={handleSubmitted} />
      </div>
      <p className="text-sm text-muted-foreground">{STRINGS.communityDescription}</p>

      <FilterChips selected={categoryFilter} onChange={setCategoryFilter} />

      <ul className="flex flex-col gap-2">
        {filteredReports.length === 0 && <li className="text-sm text-muted-foreground">{STRINGS.reportListEmpty}</li>}
        {filteredReports.map((report) => {
          const category = CATEGORIES.find((c) => c.id === report.category)
          const Icon = category?.icon
          const selected = selectedId === report.id
          const voted = votedIds.includes(report.id)
          const pending = pendingIds.has(report.id)

          return (
            <li key={report.id} className="rounded-lg border p-2">
              <button
                type="button"
                onClick={() => handleSelect(report)}
                className="flex w-full items-start justify-between gap-2 text-left"
              >
                <div className="flex items-start gap-2">
                  {Icon && <Icon className="mt-0.5 size-4 shrink-0" style={{ color: category?.color }} />}
                  <div>
                    <p className="text-sm font-medium leading-none">{report.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {categoryLabel(report.category)}
                      {pending && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5">{STRINGS.reportPending}</span>}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVote(report.id)
                  }}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${voted ? "bg-accent text-accent-foreground" : ""}`}
                  title={voted ? "Rimuovi voto" : "Anche a me importa"}
                >
                  <ThumbsUp className="size-3" aria-hidden="true" /> {votes[report.id] ?? 0}
                </button>
              </button>

              {selected && (
                <div className="mt-2 flex flex-col gap-1 border-t pt-2 text-xs">
                  {report.description && <p>{report.description}</p>}
                  {report.photoDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- local/data-URL preview, next/image doesn't apply
                    <img src={report.photoDataUrl} alt="" className="h-24 w-full rounded object-cover" />
                  )}
                  <p className="text-muted-foreground">
                    {report.lat.toFixed(5)}, {report.lon.toFixed(5)}
                    {report.foglio && report.particella && (
                      <>
                        {" "}
                        · catasto F.{report.foglio} P.{report.particella}
                      </>
                    )}
                  </p>
                  {pending && (
                    <Button variant="ghost" size="sm" className="w-fit" onClick={() => handleDelete(report.id)}>
                      {STRINGS.reportDelete}
                    </Button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
