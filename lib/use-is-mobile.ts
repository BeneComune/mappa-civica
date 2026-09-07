// lib\use-is-mobile.ts
"use client"

import { useSyncExternalStore } from "react"

// True below Tailwind's `md` breakpoint (48rem). SSR-safe: the server and the
// first client render both return false, so a structural swap that depends on
// it happens only after mount (no hydration mismatch). Prefer `md:` utility
// classes where a class toggle is enough - reach for this only when a
// component has to render a genuinely different tree on mobile.
const QUERY = "(max-width: 47.999rem)"

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
