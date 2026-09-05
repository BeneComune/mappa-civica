// components\info-note.tsx
import { Info } from "lucide-react"

// Collapsed-by-default explanatory note, same <details>/<summary> + Info
// icon pattern as the catasto toggle's "a cosa serve" panel - reused for
// short per-overlay caveats that would otherwise sit as always-visible text.
// `label` should name what the note explains (e.g. "Come leggere i colori"),
// not just say "Info" - that reads as filler once there's more than one on a page.
export function InfoNote({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="flex cursor-pointer list-none items-center gap-1 select-none hover:text-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </summary>
      <p className="mt-1">{children}</p>
    </details>
  )
}
