"use client"

import { CATEGORIES } from "@/lib/community"

export function FilterChips({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string | null
  onFilterChange: (id: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        className={`rounded-full border px-2.5 py-1 text-xs ${!activeFilter ? "bg-accent text-accent-foreground" : "hover:bg-accent"}`}
      >
        Tutte
      </button>
      {CATEGORIES.map((c) => {
        const Icon = c.icon
        const active = activeFilter === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onFilterChange(active ? null : c.id)}
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
