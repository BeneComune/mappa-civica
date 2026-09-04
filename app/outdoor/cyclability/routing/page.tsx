"use client"

import { RoutePlanner } from "@/components/route-planner"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function CyclabilityRoutingPage() {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <ICONS.routePlanner aria-hidden="true" className="size-5" />
        {STRINGS.bikeRoutePlanner}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.bikeRoutePlannerDescription}</p>
      <div className="mt-3">
        <RoutePlanner mode="biking" />
      </div>
    </div>
  )
}
