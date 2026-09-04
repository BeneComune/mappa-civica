"use client"

import { RoutePlanner } from "@/components/route-planner"
import { STRINGS } from "@/lib/strings"

export default function TrailsRoutingPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">{STRINGS.trailsRoutePlanner}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.trailsRoutePlannerDescription}</p>
      <div className="mt-3">
        <RoutePlanner mode="walking" />
      </div>
    </div>
  )
}
