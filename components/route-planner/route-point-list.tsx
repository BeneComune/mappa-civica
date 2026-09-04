// components\route-planner\route-point-list.tsx
// The ordered list of chosen points, each with its colour swatch, role
// (partenza / tappa N / arrivo), coordinates, and a remove button.
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { routePointColor, type RoutePoint } from "./format"

function pointLabel(index: number, total: number): string {
  if (index === 0) return STRINGS.routePlannerStart
  if (index === total - 1) return STRINGS.routePlannerEnd
  return `${STRINGS.routePlannerWaypoint} ${index}`
}

export function RoutePointList({
  points,
  onRemove,
}: {
  points: RoutePoint[]
  onRemove: (id: string) => void
}) {
  const RemoveIcon = ICONS.routePlannerRemovePoint

  return (
    <ul className="flex flex-col gap-1">
      {points.map((point, index) => (
        <li key={point.id} className="flex items-center gap-2 text-xs">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: routePointColor(index, points.length) }}
            aria-hidden="true"
          />
          <span className="font-medium">{pointLabel(index, points.length)}</span>
          <span className="text-muted-foreground">
            {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
          </span>
          <button
            type="button"
            className="ml-auto text-muted-foreground hover:text-foreground"
            title="Rimuovi"
            onClick={() => onRemove(point.id)}
          >
            <RemoveIcon className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  )
}
