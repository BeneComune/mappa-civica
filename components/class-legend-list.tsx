// Color-swatch + label + range legend list, shared by the NBR and LST Green
// pages (identical markup, different class configs - see lib/green-classes.ts).
export function ClassLegendList<T extends string>({
  classes,
  config,
}: {
  classes: readonly T[]
  config: Record<T, { label: string; color: string; range: string }>
}) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {classes.map((cls) => {
        const entry = config[cls]
        return (
          <li key={cls} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
            {entry.label}
            <span className="text-xs text-muted-foreground">{entry.range}</span>
          </li>
        )
      })}
    </ul>
  )
}
