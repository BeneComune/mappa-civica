// components\site-header\index.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { NavDropdown } from "./nav-dropdown"
import { OutdoorMenu } from "./outdoor-menu"
import { MobileNav } from "./mobile-nav"
import { GREEN_MENU, RESCUE_MENU } from "./menus"

// The site-wide navigation bar. It owns only the top-level bar layout and
// which route is current; each dropdown renders itself from ./menus.
export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex w-fit items-center gap-2 text-xl font-semibold">
            <ICONS.appLogo aria-hidden="true" className="size-5" />
            {STRINGS.appName}
          </Link>
          <MobileNav />
        </div>
        <NavigationMenu className="hidden max-w-none justify-start md:flex">
          <NavigationMenuList className="flex-wrap justify-start gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                data-active={pathname === "/" || undefined}
                render={
                  <Link href="/">
                    <ICONS.home aria-hidden="true" className="size-4" />
                    {STRINGS.home}
                  </Link>
                }
              />
            </NavigationMenuItem>

            <OutdoorMenu pathname={pathname} />
            <NavDropdown menu={RESCUE_MENU} pathname={pathname} />
            <NavDropdown menu={GREEN_MENU} pathname={pathname} />

            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                data-active={pathname.startsWith("/community") || undefined}
                render={
                  <Link href="/community">
                    <ICONS.community aria-hidden="true" className="size-4" />
                    {STRINGS.community}
                  </Link>
                }
              />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
