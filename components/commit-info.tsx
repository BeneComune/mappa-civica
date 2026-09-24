// components\commit-info.tsx
"use client"

import { useSyncExternalStore } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { STRINGS } from "@/lib/strings"
import { timeSince } from "@/lib/time-since"

const COMMIT_SHA = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? ""
const COMMIT_DATE = process.env.NEXT_PUBLIC_GIT_COMMIT_DATE ?? ""

const formatExactDate = (iso: string): string =>
  new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(new Date(iso))

function elapsedLabel(iso: string, now: Date): string {
  const since = timeSince(iso, now)
  if (!since) return ""
  if (since.unit === "now") return STRINGS.footerUpdatedNow

  const [singular, plural] = STRINGS.footerTimeUnits[since.unit]
  const unit = since.count === 1 ? singular : plural
  return `${STRINGS.footerUpdatedPrefix} ${since.count} ${unit} ${STRINGS.footerUpdatedSuffix}`
}

const MINUTE_MS = 60_000

// Minute-resolution clock; the server snapshot is null so prerender and hydration agree.
function subscribeToMinuteTick(onChange: () => void): () => void {
  const tick = setInterval(onChange, MINUTE_MS)
  return () => clearInterval(tick)
}
const getMinuteSnapshot = (): number => Math.floor(Date.now() / MINUTE_MS)
const getServerSnapshot = (): null => null

// Short commit hash plus how long ago it was made, exact date in a tooltip.
export function CommitInfo() {
  const minute = useSyncExternalStore(subscribeToMinuteTick, getMinuteSnapshot, getServerSnapshot)
  const now = minute == null ? null : new Date(minute * MINUTE_MS)

  const label = COMMIT_DATE && now ? elapsedLabel(COMMIT_DATE, now) : ""

  return (
    <>
      {COMMIT_SHA && (
        <>
          <span aria-hidden="true">•</span>
          <span className="font-mono">{COMMIT_SHA.slice(0, 7)}</span>
        </>
      )}
      {label && (
        <>
          <span aria-hidden="true">•</span>
          <Tooltip>
            <TooltipTrigger render={<time dateTime={COMMIT_DATE} className="cursor-default" />}>
              {label}
            </TooltipTrigger>
            <TooltipContent>{formatExactDate(COMMIT_DATE)}</TooltipContent>
          </Tooltip>
        </>
      )}
    </>
  )
}
