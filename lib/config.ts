// lib\config.ts
// Single source of truth for municipality-specific values. The curated data
// lives in data/comune.config.json (read by the Python pipeline too, via
// pipeline/lib/comune_config.py); this module re-exports the handful of
// values the app needs without depending on lib/map/base.ts (which pulls in
// the real maplibre-gl runtime import).
import comune from "@/data/comune.config.json"

export const MUNICIPALITY_CENTER = comune.map.center as [number, number]
export const MUNICIPALITY_ZOOM = comune.map.zoom
export const MUNICIPALITY_NAME = comune.name
export const MUNICIPALITY_CADASTRAL_CODE = comune.cadastralCode

// Default view for the embedded stressinbici.it (LTS) map - "Percorsi in
// bici > Stress da traffico" replaces the map view entirely with this
// iframe, same as the old app.
export const LTS_EMBED_VIEW = comune.ltsEmbedView
