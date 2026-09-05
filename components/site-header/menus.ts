// components\site-header\menus.ts
// The navigation tree, kept as data so the header components stay purely
// presentational. Adding a page means adding an entry here, nothing else.
import type { LucideIcon } from "lucide-react"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

// A dropdown that is a flat list of links. Outdoor is the exception - its
// items are split into titled groups, so it has its own renderer
// (./outdoor-menu) and reads OUTDOOR_GROUPS directly.
export type SimpleMenu = {
  label: string
  icon: LucideIcon
  basePath: string
  items: ReadonlyArray<{ title: string; href: string; icon: LucideIcon; description: string }>
}

export const OUTDOOR_GROUPS = [
  {
    title: STRINGS.cyclability,
    icon: ICONS.cyclability,
    items: [
      {
        title: STRINGS.trafficStress,
        href: "/outdoor/cyclability/lts",
        icon: ICONS.trafficStress,
        description: STRINGS.trafficStressDescription,
        // Replaces our own map with the stressinbici.it embed (see
        // LtsEmbed) - flagged in the menu so it's clear this leaves our map.
        external: true,
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
        title: STRINGS.peaks,
        href: "/outdoor/trails/peaks",
        icon: ICONS.peaks,
        description: STRINGS.peaksDescription,
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

export const RESCUE_MENU = {
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
    {
      title: STRINGS.nearestHospital,
      href: "/rescue/hospital",
      icon: ICONS.nearestHospital,
      description: STRINGS.nearestHospitalDescription,
    },
  ],
} as const

export const GREEN_MENU = {
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
