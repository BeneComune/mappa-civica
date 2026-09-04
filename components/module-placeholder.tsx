// components\module-placeholder.tsx
import type { LucideIcon } from "lucide-react"
import { STRINGS } from "@/lib/strings"

export function ModulePlaceholder({ title, icon: Icon }: { title: string; icon?: LucideIcon }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        {Icon && <Icon aria-hidden="true" className="size-5" />}
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.portingNotice}</p>
    </div>
  )
}
