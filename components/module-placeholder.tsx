import { STRINGS } from "@/lib/strings"

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-base text-muted-foreground">{STRINGS.portingNotice}</p>
    </div>
  )
}
