// components\site-header\mobile-nav.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { GREEN_MENU, OUTDOOR_GROUPS, RESCUE_MENU } from "./menus"

// The < md navigation: a hamburger that opens a left drawer with the full
// nav tree from ./menus. The >= md NavigationMenu in ./index is untouched.
export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="left">
      <DrawerTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label={STRINGS.menuLabel} />}
      >
        <ICONS.menu className="size-5" aria-hidden="true" />
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ICONS.appLogo aria-hidden="true" className="size-5" />
            {STRINGS.appName}
          </DrawerTitle>
          <DrawerDescription className="sr-only">{STRINGS.menuDescription}</DrawerDescription>
        </DrawerHeader>

        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          <NavLink href="/" icon={ICONS.home} label={STRINGS.home} active={pathname === "/"} onNavigate={close} />

          <Group label={STRINGS.outdoor} icon={ICONS.outdoor}>
            {OUTDOOR_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-1">
                <p className="mt-1 px-2 text-xs font-medium text-muted-foreground">{group.title}</p>
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.title}
                    external={"external" in item ? item.external : undefined}
                    active={pathname === item.href}
                    onNavigate={close}
                  />
                ))}
              </div>
            ))}
          </Group>

          <Group label={RESCUE_MENU.label} icon={RESCUE_MENU.icon}>
            {RESCUE_MENU.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.title}
                active={pathname === item.href}
                onNavigate={close}
              />
            ))}
          </Group>

          <Group label={GREEN_MENU.label} icon={GREEN_MENU.icon}>
            {GREEN_MENU.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.title}
                active={pathname === item.href}
                onNavigate={close}
              />
            ))}
          </Group>

          <NavLink
            href="/community"
            icon={ICONS.community}
            label={STRINGS.community}
            active={pathname.startsWith("/community")}
            onNavigate={close}
          />
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

function Group({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="mt-2 flex flex-col gap-1 border-t pt-2">
      <p className="flex items-center gap-2 px-2 text-sm font-semibold">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </p>
      <div className="flex flex-col gap-1 pl-2">{children}</div>
    </div>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  external,
  onNavigate,
}: {
  href: string
  icon: LucideIcon
  label: string
  active: boolean
  external?: boolean
  onNavigate: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex items-center gap-1.5">
        {label}
        {external && <ExternalLink aria-label="Apre una mappa esterna" className="size-3" />}
      </span>
    </Link>
  )
}
