// lib\ICONS.ts
import {
  Bike,
  CircleHelp,
  CirclePlus,
  Compass,
  Droplets,
  Flame,
  Flower2,
  Footprints,
  GlassWater,
  HeartPulse,
  Hospital,
  House,
  Lightbulb,
  Map,
  MapPinPlus,
  MapPlus,
  Megaphone,
  MessageSquare,
  Mountain,
  OctagonAlert,
  PersonStanding,
  PlaneTakeoff,
  Repeat2,
  Route,
  Satellite,
  ShieldPlus,
  Signpost,
  SquareParking,
  Target,
  ThermometerSun,
  TrafficCone,
  Trash2,
  Trees,
  TreePine,
  TrendingUp,
  TriangleAlert,
  UtensilsCrossed,
  Users,
  Waves,
  Wrench,
  X,
  Zap,
} from "lucide-react"

/**
 * Single source of truth for every icon used in the nav. Ported 1:1 from the
 * old app's bootstrap-icons mapping (ModuleCards.tsx, OutdoorModule.tsx,
 * RescueModule.tsx, GreenLegend.tsx).
 */
export const ICONS = {
  // App brand mark
  appLogo: MapPlus,

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
  peaks: Mountain,
  routePlanner: Compass,
  routePlannerWalking: PersonStanding,
  routePlannerBiking: Bike,
  routePlannerEbike: Zap,
  routePlannerRemovePoint: X,

  // Bike infra categories
  bikeInfraCiclabili: Bike,
  bikeInfraBikeParking: SquareParking,
  bikeInfraBikeRental: Repeat2,
  bikeInfraBikeRepair: Wrench,
  bikeInfraEbikeCharging: Zap,

  // Trails/water categories
  waterPointsHiking: Footprints,
  waterPointsMtb: Bike,
  waterPointsDrinkingWater: GlassWater,
  waterPointsSpring: Waves,
  waterPointsPicnic: UtensilsCrossed,

  // Rescue assets
  aed: HeartPulse,
  hems: PlaneTakeoff,
  fireHydrants: Droplets,
  assemblyPoints: Users,

  // Wildfire causes
  fireCauseDolosa: Flame,
  fireCauseColposa: TriangleAlert,
  fireCauseNaturale: Zap,
  fireCauseIgnota: CircleHelp,

  // Wildfire optional overlays
  fireDangerToggle: TriangleAlert,
  fireIgnitionToggle: Target,
  fireNbrToggle: Satellite,

  // Rescue sections
  riverRisk: TriangleAlert,
  wildfires: Flame,
  rescueAssets: HeartPulse,
  nearestHospital: Hospital,

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
