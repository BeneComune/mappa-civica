// components\faq.tsx
import { Info } from "lucide-react"
import { STRINGS } from "@/lib/strings"

export function Faq({ children }: { children: React.ReactNode }) {
  return (
    <details className="mt-2 text-xs text-muted-foreground">
      <summary className="flex cursor-pointer list-none items-center gap-1 select-none font-medium text-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        {STRINGS.faqSummary}
      </summary>
      <p className="mt-1">{children}</p>
    </details>
  )
}
