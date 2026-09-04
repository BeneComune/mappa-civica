import { STRINGS } from "@/lib/strings"

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{STRINGS.portingNotice}</p>
    </div>
  )
}
