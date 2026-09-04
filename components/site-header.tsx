"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

const OUTDOOR_GROUPS = [
  {
    title: STRINGS.cyclability,
    icon: ICONS.cyclability,
    items: [
      {
        title: STRINGS.trafficStress,
        href: "/outdoor/cyclability/lts",
        icon: ICONS.trafficStress,
        description: STRINGS.trafficStressDescription,
      },
      {
        title: STRINGS.bikeInfra,
        href: "/outdoor/cyclability/bike-infra",
        icon: ICONS.bikeInfra,
        description: STRINGS.bikeInfraDescription,
      },
      {
        title: STRINGS.bikeRoutePlanner,
        href: "/outdoor/cyclability/routing",
        icon: ICONS.routePlanner,
        description: STRINGS.bikeRoutePlannerDescription,
      },
    ],
  },
  {
    title: STRINGS.trails,
    icon: ICONS.trails,
    items: [
      {
        title: STRINGS.waterPoints,
        href: "/outdoor/trails/trails",
        icon: ICONS.waterPoints,
        description: STRINGS.waterPointsDescription,
      },
      {
        title: STRINGS.slope,
        href: "/outdoor/trails/slope",
        icon: ICONS.slope,
        description: STRINGS.slopeDescription,
      },
      {
        title: STRINGS.trailsRoutePlanner,
        href: "/outdoor/trails/routing",
        icon: ICONS.routePlanner,
        description: STRINGS.trailsRoutePlannerDescription,
      },
    ],
  },
] as const

const RESCUE_MENU = {
  label: STRINGS.rescue,
  icon: ICONS.rescue,
  basePath: "/rescue",
  items: [
    {
      title: STRINGS.riverRisk,
      href: "/rescue/events",
      icon: ICONS.riverRisk,
      description: STRINGS.riverRiskDescription,
    },
    {
      title: STRINGS.wildfires,
      href: "/rescue/fire",
      icon: ICONS.wildfires,
      description: STRINGS.wildfiresDescription,
    },
    {
      title: STRINGS.rescueAssets,
      href: "/rescue/assets",
      icon: ICONS.rescueAssets,
      description: STRINGS.rescueAssetsDescription,
    },
  ],
} as const

const GREEN_MENU = {
  label: STRINGS.green,
  icon: ICONS.green,
  basePath: "/green",
  items: [
    {
      title: STRINGS.vegetation,
      href: "/green/ndvi",
      icon: ICONS.vegetation,
      description: STRINGS.vegetationDescription,
    },
    {
      title: STRINGS.naturalShade,
      href: "/green/shade",
      icon: ICONS.naturalShade,
      description: STRINGS.naturalShadeDescription,
    },
    {
      title: STRINGS.vegetationHealth,
      href: "/green/nbr",
      icon: ICONS.vegetationHealth,
      description: STRINGS.vegetationHealthDescription,
    },
    {
      title: STRINGS.soilTemperature,
      href: "/green/lst",
      icon: ICONS.soilTemperature,
      description: STRINGS.soilTemperatureDescription,
    },
  ],
} as const

export function SiteHeader() {
  const pathname = usePathname()
  const outdoorActive = pathname.startsWith("/outdoor")
  const OutdoorIcon = ICONS.outdoor

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3">
        <Link href="/" className="w-fit text-xl font-semibold">
          {STRINGS.appName}
        </Link>
        <NavigationMenu className="max-w-none justify-start">
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

            <NavigationMenuItem>
              <NavigationMenuTrigger data-active={outdoorActive || undefined}>
                <OutdoorIcon aria-hidden="true" className="size-4" />
                {STRINGS.outdoor}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[520px] grid-cols-1 gap-3 p-2 sm:grid-cols-2 sm:w-[720px]">
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
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

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

type SimpleMenu = {
  label: string
  icon: LucideIcon
  basePath: string
  items: ReadonlyArray<{ title: string; href: string; icon: LucideIcon; description: string }>
}

function NavDropdown({ menu, pathname }: { menu: SimpleMenu; pathname: string }) {
  const active = pathname.startsWith(menu.basePath)
  const Icon = menu.icon

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger data-active={active || undefined}>
        <Icon aria-hidden="true" className="size-4" />
        {menu.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="flex w-[420px] flex-col gap-1 p-2 md:w-[480px]">
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

function ListItem({
  title,
  href,
  icon: Icon,
  description,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string
  title: string
  icon: LucideIcon
  description: string
}) {
  return (
    <li className={cn("list-none", className)} {...props}>
      <NavigationMenuLink
        render={
          <Link href={href} className="items-start">
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium leading-none">{title}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </Link>
        }
      />
    </li>
  )
}
