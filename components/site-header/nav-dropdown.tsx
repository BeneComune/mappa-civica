// components\site-header\nav-dropdown.tsx
// A dropdown whose content is a flat list of links. Outdoor does not use
// this - its items are grouped, see ./outdoor-menu.
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ListItem } from "./list-item"
import type { SimpleMenu } from "./menus"

export function NavDropdown({ menu, pathname }: { menu: SimpleMenu; pathname: string }) {
  const active = pathname.startsWith(menu.basePath)
  const Icon = menu.icon

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger data-active={active || undefined}>
        <Icon aria-hidden="true" className="size-4" />
        {menu.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="flex w-105 flex-col gap-1 p-2 md:w-120">
          <ul className="flex flex-col gap-1">
            {menu.items.map((item) => (
              <ListItem
                key={item.href}
                href={item.href}
                title={item.title}
                description={item.description}
                icon={item.icon}
              />
            ))}
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}
