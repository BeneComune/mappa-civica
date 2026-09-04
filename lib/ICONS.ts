import {
  Bike,
  CirclePlus,
  Compass,
  Flame,
  Flower2,
  HeartPulse,
  Lightbulb,
  Map,
  MapPinPlus,
  Megaphone,
  MessageSquare,
  OctagonAlert,
  Route,
  ShieldPlus,
  Signpost,
  ThermometerSun,
  TrafficCone,
  Trash2,
  Trees,
  TreePine,
  TrendingUp,
  TriangleAlert,
} from "lucide-react"

/**
 * Single source of truth for every icon used in the nav. Ported 1:1 from the
 * old app's bootstrap-icons mapping (ModuleCards.tsx, OutdoorModule.tsx,
 * RescueModule.tsx, GreenLegend.tsx).
 */
export const ICONS = {
  // Top-level modules
  outdoor: Signpost,
  rescue: ShieldPlus,
  green: Trees,
  community: Megaphone,

  // Outdoor sections
  cyclability: Bike,
  trails: Route,

  // Outdoor subsections
  trafficStress: TriangleAlert,
  bikeInfra: Signpost,
  waterPoints: Map,
  slope: TrendingUp,
  routePlanner: Compass,

  // Rescue sections
  riverRisk: TriangleAlert,
  wildfires: Flame,
  rescueAssets: HeartPulse,

  // Green sections
  vegetation: Flower2,
  naturalShade: TreePine,
  vegetationHealth: HeartPulse,
  soilTemperature: ThermometerSun,

  // Community report categories
  reportRoads: TrafficCone,
  reportNature: Trees,
  reportWaste: Trash2,
  reportLighting: Lightbulb,
  reportSignage: OctagonAlert,
  reportProposal: MessageSquare,
  newReport: CirclePlus,
  reportLocation: MapPinPlus,
} as const

export type IconName = keyof typeof ICONS
