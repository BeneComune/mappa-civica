// components\route-planner\stat-card.tsx
import type { LucideIcon } from "lucide-react"

// One icon + value + caption cell of the route summary grids (totals, travel times).
type StatCardProps = { icon: LucideIcon; value: string; label: string }

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <span className="flex flex-col items-center gap-0.5 text-sm font-medium">
      <Icon className="size-4" aria-hidden="true" />
      {value}
      <span className="text-xs font-normal text-muted-foreground">{label}</span>
    </span>
  )
}
