// lib\colors.ts
// Single source of truth for every hex color used across map layers, class
// legends, and their matching UI badges (see lib/ICONS.ts / lib/strings.ts
// for the same pattern) - one name per color, referenced everywhere instead
// of hand-copying the same hex value into multiple files.
export const COLORS = {
  // Generic
  white: "#ffffff",

  // Bike infra categories
  bikeInfraCiclabili: "#2f78c4",
  bikeInfraBikeParking: "#2f78c4",
  bikeInfraBikeRental: "#2b8a3e",
  bikeInfraBikeRepair: "#7b2cbf",
  bikeInfraEbikeCharging: "#f59f00",
  bikeInfraCasing: "#d9e7f4",
  bikeInfraLabel: "#245c99",

  // Trails/water categories
  waterPointsHiking: "#4f7b3a",
  waterPointsMtb: "#2f78c4",
  waterPointsDrinkingWater: "#2b8a3e",
  waterPointsSpring: "#74c0fc",
  waterPointsPicnic: "#f59f00",
  waterPointsLabel: "#7a4d00",
  waterPointsHikingCasing: "#dfe9d8",
  waterPointsHikingLabel: "#436432",
  waterPointsMtbCasing: "#d9e7f4",
  waterPointsMtbLabel: "#245c99",

  // Rescue assets
  aed: "#e03131",
  hems: "#f59f00",
  fireHydrants: "#0b7285",
  assemblyPoints: "#2f9e44",
  aedLabel: "#7f1d1d",
  hemsLabel: "#7a4d00",
  fireHydrantsLabel: "#0b4f61",
  assemblyPointsLabel: "#1b5e20",

  // Wildfire causes
  fireCauseDolosa: "#e03131",
  fireCauseColposa: "#f76707",
  fireCauseNaturale: "#7048e8",
  fireCauseIgnota: "#868e96",

  // Wildfire optional overlays
  fireDangerToggle: "#f59f00",
  fireIgnitionToggle: "#7a1f1f",
  fireNbrToggle: "#1a9641",
  fireDangerAlta: "#e03131",
  fireDangerMedio: "#f59f00",
  fireDangerDefault: "#adb5bd",

  // Rii survey recency/state
  riiAggiornato2024: "#1c7ed6",
  riiSoloFoto2024: "#4dabf7",
  riiStorico2013: "#f59f00",
  riiStorico2007: "#e8590c",
  riiDefault: "#868e96",
  riiLabel: "#1b3a4b",

  // Slope classes
  slopeFlat: "#2b8a3e",
  slopeMild: "#74c69d",
  slopeMedium: "#ffd43b",
  slopeHard: "#ff922b",
  slopeExtreme: "#e03131",
  slopeImpossible: "#7f1d1d",
  slopeDefault: "#adb5bd",

  // NDVI classes (vegetation cover)
  ndviWater: "#4a90d9",
  ndviBare: "#c9a96e",
  ndviSparse: "#a8d08d",
  ndviModerate: "#5aaa5a",
  ndviDense: "#238b45",
  ndviVeryDense: "#004d20",
  ndviDefault: "#cccccc",

  // NBR classes (vegetation health)
  nbrSana: "#1a9641",
  nbrModerata: "#a6d96a",
  nbrStress: "#ffffbf",
  nbrDegradata: "#fdae61",
  nbrBruciata: "#d7191c",

  // LST classes (soil temperature)
  lstFresco: "#4575b4",
  lstModeratoFresco: "#91bfdb",
  lstTemperato: "#fee090",
  lstCaldo: "#fc8d59",
  lstMoltoCaldo: "#d73027",

  // Community report categories
  reportRoads: "#e8590c",
  reportNature: "#2f9e44",
  reportWaste: "#7b2cbf",
  reportLighting: "#f59f00",
  reportSignage: "#1c7ed6",
  reportProposal: "#0ca678",

  // Home module: municipality boundary + cadastral parcels
  boundaryFill: "#4a90d9",
  boundaryOutline: "#2563a8",
  catastoPoint: "#8a5a00",
  catastoLabel: "#5c3d00",

  // Natural shade (tree canopy coverage)
  shadeRoad: "#1a7f3c",
  shadeTrail: "#52b788",

  // Route planner: start/waypoint/end markers, and the computed route line
  routePointStart: "#2f9e44",
  routePointWaypoint: "#f59f00",
  routePointEnd: "#e03131",
  routeLine: "#1d4ed8",
  routeProfileFill: "#8ecae6",

  // Report drawer: single-point pin marker (Segnala)
  reportLocationPin: "#e03131",

  // Peaks (cime principali): summit point + label
  peakSummit: "#4a3728",
  peakLabel: "#3d2b00",
} as const
