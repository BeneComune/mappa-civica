"use client"

import { CATEGORIES } from "@/lib/community"

// Multi-select: each chip is an independent toggle, consistent with the
// checkbox-based filters elsewhere in the app (fire cause, rii recency).
// "Tutte" resets to every category selected, it isn't itself a toggle.
export function FilterChips({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const allSelected = selected.length === CATEGORIES.length

  function toggle(id: string): void {
    onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id])
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(CATEGORIES.map((c) => c.id))}
        className={`rounded-full border px-2.5 py-1 text-xs ${allSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent"}`}
      >
        Tutte
      </button>
      {CATEGORIES.map((c) => {
        const Icon = c.icon
        const active = selected.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent"}`}
            style={active ? { borderColor: c.color } : undefined}
          >
            <Icon className="size-3" aria-hidden="true" style={{ color: c.color }} />
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
