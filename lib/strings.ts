// lib\strings.ts
/**
 * Single source of truth for every Italian UI string in the app. Check here
 * before hardcoding new text — reuse an existing constant if the string
 * already exists, rather than duplicating it inline.
 */
export const STRINGS = {
  appName: "Mappa Civica",
  homeSubtitle:
    "Piattaforma civica open-source per la mobilità sostenibile, l'ambiente, la resilienza del territorio e la partecipazione della comunità.",
  portingNotice: "Porting in corso dal prototipo Vite.",

  // Top-level nav / page titles
  home: "Home",
  outdoor: "Outdoor",
  outdoorTitle: "Modulo Outdoor",
  rescue: "Soccorso ed Emergenza",
  rescueTitle: "Modulo Soccorso ed Emergenza",
  green: "Verde",
  greenTitle: "Modulo Verde",
  community: "Segnala",

  // Outdoor > Percorsi in bici
  cyclability: "Percorsi in bici",
  trafficStress: "Stress da traffico",
  trafficStressDescription: "Quanto ogni strada è stressante o sicura da percorrere in bici, mappa di stressinbici.it",
  bikeInfra: "Infrastrutture ciclabili",
  bikeInfraDescription: "Piste ciclabili, rastrelliere, bike sharing e altri servizi per la bici",
  bikeInfraCiclabili: "Ciclabili / MV 06",
  bikeInfraBikeParking: "Rastrelliere",
  bikeInfraBikeRental: "Bike sharing",
  bikeInfraBikeRepair: "Riparazione bici",
  bikeInfraEbikeCharging: "Ricarica e-bike",
  bikeRoutePlanner: "Pianifica percorso",
  bikeRoutePlannerDescription: "Calcola un itinerario in bici, con distanza, tempo e profilo altimetrico",
  routePlannerNetworkBiking: "strade e ciclabili",
  routePlannerNetworkWalking: "strade e sentieri",

  // Outdoor > Sentieri
  trails: "Sentieri",
  waterPoints: "Sentieri e punti acqua",
  waterPointsDescription: "Sentieri CAI, percorsi MTB, fontane e aree picnic",
  waterPointsHiking: "Escursionismo",
  waterPointsMtb: "MTB",
  waterPointsDrinkingWater: "Fontane",
  waterPointsSpring: "Sorgenti",
  waterPointsPicnic: "Aree picnic",
  slope: "Pendenza",
  slopeDescription: "Strade e sentieri colorati per pendenza, con etichette pensate per chi cammina",
  slopeFlat: "0-3: pianeggiante",
  slopeMild: "3-5: facile",
  slopeMedium: "5-8: moderata",
  slopeHard: "8-10: dura",
  slopeExtreme: "10-20: molto dura",
  slopeImpossible: ">20: estrema",
  trailsRoutePlanner: "Pianifica percorso",
  trailsRoutePlannerDescription: "Calcola un itinerario a piedi, con distanza, tempo e profilo altimetrico",

  // Route planner (shared by Cyclability and Trails)
  routePlannerActivate: "Attiva pianificazione",
  routePlannerActive: "Pianificazione attiva",
  routePlannerHint: "Clicca sulla mappa per porre partenza, arrivo e tappe; trascina i pallini per spostarli. Rete:",
  routePlannerStart: "Partenza",
  routePlannerEnd: "Arrivo",
  routePlannerWaypoint: "Tappa",
  routePlannerSwap: "Inverti",
  routePlannerUndo: "Indietro",
  routePlannerClear: "Pulisci",
  routePlannerStatusEmpty: "Clicca sulla mappa per aggiungere punti",
  routePlannerStatusOnePoint: "Aggiungi almeno un altro punto",
  routePlannerStatusNotFound: "Percorso non trovato",
  routePlannerStatusUnavailable: "Routing non disponibile",
  routePlannerStatusConnected: "punti collegati",
  routePlannerWalking: "a piedi",
  routePlannerBiking: "bici",
  routePlannerEbike: "bici elettrica",
  routePlannerSurfaceTitle: "Tipologia di strada",
  routePlannerProfileTitle: "Profilo altimetrico",
  routePlannerProfileSubtitle: "dislivello relativo",
  routePlannerDownloads: "Scarica",

  // Rescue sections
  riverRisk: "Rii a rischio",
  riverRiskDescription:
    "Censimento dei piccoli corsi d'acqua (\"rii\") sopra l'abitato che esondano durante le piogge intense.",
  wildfires: "Incendi boschivi",
  wildfiresDescription:
    "Perimetri degli incendi boschivi rilevati dalle Stazioni Forestali della Regione FVG, colorati per causa dell'innesco.",
  rescueAssets: "Presidi di soccorso",
  rescueAssetsDescription: "Defibrillatori, elisoccorso, idranti e punti di raccolta.",
  aed: "Defibrillatori",
  hems: "Elisoccorso",
  fireHydrants: "Idranti",
  assemblyPoints: "Punti raccolta",
  fireCauseDolosa: "Dolose",
  fireCauseColposa: "Colpose",
  fireCauseNaturale: "Naturali (fulmini)",
  fireCauseIgnota: "Ignote",
  fireDangerToggle: "Classe di pericolo",
  fireIgnitionToggle: "Punti di innesco",
  fireNbrToggle: "Indice NBR (vegetazione secca/bruciata)",

  // Green sections
  vegetation: "Vegetazione",
  vegetationDescription:
    "Quanto è coperto ogni punto del territorio da vegetazione sana, dal suolo nudo alla foresta più densa.",
  naturalShade: "Ombra naturale",
  naturalShadeDescription:
    "Strade e sentieri colorati in base a quanto sono coperti dalle chiome degli alberi, utile per scegliere un percorso fresco nelle giornate calde.",
  vegetationHealth: "Salute vegetazione",
  vegetationHealthDescription:
    "Individua vegetazione in sofferenza, degradata o bruciata: non solo quanto verde c'è, ma come sta.",
  soilTemperature: "Temperatura suolo",
  soilTemperatureDescription: "Le zone più calde e quelle più fresche del territorio, misurate dal satellite.",

  // Community (Segnala)
  communityDescription: "Invia una segnalazione al Comune: strade, sentieri, rifiuti, illuminazione o proposte.",
  newReport: "Nuova segnalazione",
  reportCategoryRoads: "Viabilità e strade",
  reportCategoryNature: "Sentieri e natura",
  reportCategoryWaste: "Rifiuti e degrado",
  reportCategoryLighting: "Illuminazione",
  reportCategorySignage: "Segnaletica",
  reportCategoryProposal: "Proposta",
  reportFormTitle: "Nuova segnalazione",
  reportFormDescription: "Clicca sulla mappa per indicare la posizione, poi compila i campi qui sotto.",
  reportCategoryLabel: "Categoria",
  reportTitleLabel: "Titolo",
  reportDescriptionLabel: "Descrizione",
  reportLocationLabel: "Posizione",
  reportLocationUnset: "Clicca sulla mappa per indicarla",
  reportPhotoLabel: "Fotografia (opzionale)",
  reportPhotoRemove: "Rimuovi foto",
  reportParcelLabel: "Particella catastale (indicativa)",
  reportSubmit: "Invia segnalazione",
  reportCancel: "Annulla",
  reportSubmitted: "Segnalazione pronta: si apre il client email per inviarla al Comune.",
  reportListEmpty: "Nessuna segnalazione ancora. Usa \"Nuova segnalazione\" per crearne una.",
  reportDelete: "Elimina",
  reportPending: "In attesa",
} as const

