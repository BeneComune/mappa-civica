// components\page-header.tsx
import type { LucideIcon } from "lucide-react"

// Icon + title + description, repeated at the top of nearly every route
// page. The icon reuses the same one shown for that section in the nav bar
// (site-header.tsx), so a page's header always matches how you got there.
export function PageHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Icon aria-hidden="true" className="size-5" />
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </>
  )
}
