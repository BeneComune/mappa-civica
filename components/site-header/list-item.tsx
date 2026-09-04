// components\site-header\list-item.tsx
// One link inside a navigation dropdown: icon, title, and a line of
// description underneath.
import * as React from "react"
import Link from "next/link"
import { ExternalLink, type LucideIcon } from "lucide-react"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

export function ListItem({
  title,
  href,
  icon: Icon,
  description,
  external,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string
  title: string
  icon: LucideIcon
  description: string
  external?: boolean
}) {
  return (
    <li className={cn("list-none", className)} {...props}>
      <NavigationMenuLink
        render={
          <Link href={href} className="items-start">
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 font-medium leading-none">
                {title}
                {external && (
                  <ExternalLink aria-label="Apre una mappa esterna" className="size-3 text-muted-foreground" />
                )}
              </span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </Link>
        }
      />
    </li>
  )
}
