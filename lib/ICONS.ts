import {
  Bike,
  CirclePlus,
  Compass,
  Flame,
  Flower2,
  HeartPulse,
  House,
  Lightbulb,
  Map,
  MapPinPlus,
  Megaphone,
  MessageSquare,
  OctagonAlert,
  PersonStanding,
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
  X,
  Zap,
} from "lucide-react"

/**
 * Single source of truth for every icon used in the nav. Ported 1:1 from the
 * old app's bootstrap-icons mapping (ModuleCards.tsx, OutdoorModule.tsx,
 * RescueModule.tsx, GreenLegend.tsx).
 */
export const ICONS = {
  // Top-level modules
  home: House,
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
  routePlannerWalking: PersonStanding,
  routePlannerBiking: Bike,
  routePlannerEbike: Zap,
  routePlannerRemovePoint: X,

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
