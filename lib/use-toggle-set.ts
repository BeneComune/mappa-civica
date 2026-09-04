// lib\use-toggle-set.ts
"use client"

import { useCallback, useState } from "react"

// A set of selected string values plus a toggle that adds or removes one.
// Shared by the filter badge components, which all start fully selected and
// narrow down from there.
export function useToggleSet(initial: () => string[]): {
  selected: string[]
  toggle: (value: string) => void
} {
  const [selected, setSelected] = useState<string[]>(initial)

  const toggle = useCallback((value: string): void => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }, [])

  return { selected, toggle }
}
