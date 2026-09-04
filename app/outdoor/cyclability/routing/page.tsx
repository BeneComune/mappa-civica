// app\outdoor\cyclability\routing\page.tsx
"use client"

import { PageHeader } from "@/components/page-header"
import { RoutePlanner } from "@/components/route-planner"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function CyclabilityRoutingPage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.routePlanner}
        title={STRINGS.bikeRoutePlanner}
        description={STRINGS.bikeRoutePlannerDescription}
      />
      <div className="mt-3">
        <RoutePlanner mode="biking" />
      </div>
    </div>
  )
}
