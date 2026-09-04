// components\site-header\outdoor-menu.tsx
// The Outdoor dropdown. Unlike the others its links are split into titled
// groups (Ciclabilita, Sentieri), laid out in two columns on wider screens.
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { ListItem } from "./list-item"
import { OUTDOOR_GROUPS } from "./menus"

export function OutdoorMenu({ pathname }: { pathname: string }) {
  const active = pathname.startsWith("/outdoor")
  const OutdoorIcon = ICONS.outdoor

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger data-active={active || undefined}>
        <OutdoorIcon aria-hidden="true" className="size-4" />
        {STRINGS.outdoor}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-130 grid-cols-1 gap-3 p-2 sm:grid-cols-2 sm:w-180">
          {OUTDOOR_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <span className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <group.icon aria-hidden="true" className="size-3.5" />
                {group.title}
              </span>
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <ListItem
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    external={"external" in item && item.external}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}
