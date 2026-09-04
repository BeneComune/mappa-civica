// app\outdoor\trails\routing\page.tsx
"use client"

import { PageHeader } from "@/components/page-header"
import { RoutePlanner } from "@/components/route-planner"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function TrailsRoutingPage() {
  return (
    <div>
      <PageHeader icon={ICONS.routePlanner} title={STRINGS.trailsRoutePlanner} description={STRINGS.trailsRoutePlannerDescription} />
      <div className="mt-3">
        <RoutePlanner mode="walking" />
      </div>
    </div>
  )
}
