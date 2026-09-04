"use client"

import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { ReportDrawer } from "@/components/report-drawer"
import {
  CATEGORIES,
  categoryLabel,
  getReportsServerSnapshot,
  getReportsSnapshot,
  saveReports,
  subscribeReports,
  type CommunityReport,
} from "@/lib/community"
import { STRINGS } from "@/lib/strings"

export function CommunityPanel() {
  const reports = useSyncExternalStore(subscribeReports, getReportsSnapshot, getReportsServerSnapshot)

  function handleSubmitted(report: CommunityReport): void {
    saveReports([...reports, report])
  }

  function handleDelete(id: string): void {
    saveReports(reports.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{STRINGS.community}</h2>
        <ReportDrawer onSubmitted={handleSubmitted} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.communityDescription}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {reports.length === 0 && <li className="text-sm text-muted-foreground">{STRINGS.reportListEmpty}</li>}
        {reports.map((report) => {
          const category = CATEGORIES.find((c) => c.id === report.category)
          const Icon = category?.icon
          return (
            <li key={report.id} className="flex items-start justify-between gap-2 rounded-lg border p-2">
              <div className="flex items-start gap-2">
                {Icon && <Icon className="mt-0.5 size-4 shrink-0" style={{ color: category?.color }} />}
                <div>
                  <p className="text-sm font-medium leading-none">{report.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{categoryLabel(report.category)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(report.id)}>
                {STRINGS.reportDelete}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
