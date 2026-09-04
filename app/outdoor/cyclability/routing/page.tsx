"use client"

import { RoutePlanner } from "@/components/route-planner"
import { STRINGS } from "@/lib/strings"

export default function CyclabilityRoutingPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">{STRINGS.bikeRoutePlanner}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.bikeRoutePlannerDescription}</p>
      <div className="mt-3">
        <RoutePlanner mode="biking" />
      </div>
    </div>
  )
}
