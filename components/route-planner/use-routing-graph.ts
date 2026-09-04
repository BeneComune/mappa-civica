// components\route-planner\use-routing-graph.ts
"use client"

import { useEffect, useState } from "react"
import { loadRoutingGraphForMode, type RoutingGraph, type RoutingMode } from "@/lib/routing"

// Loads the routing network once per mount. `mode` is fixed per mount - each
// routing page renders its own RoutePlanner with a constant mode - so the
// graph never needs reloading.
export function useRoutingGraph(mode: RoutingMode): {
  graph: RoutingGraph | null
  unavailable: boolean
} {
  const [graph, setGraph] = useState<RoutingGraph | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadRoutingGraphForMode(mode)
      .then((g) => {
        if (!cancelled) setGraph(g)
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { graph, unavailable }
}
