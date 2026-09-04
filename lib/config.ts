// Single source of truth for municipality-specific values (from the old
// app's comune.config.json), reused by the map default view and any widget
// that needs the town's coordinates without depending on lib/map/base.ts
// (which pulls in the real maplibre-gl runtime import).
export const MUNICIPALITY_CENTER: [number, number] = [12.664, 46.16]
export const MUNICIPALITY_ZOOM = 12

// Default view for the embedded stressinbici.it (LTS) map - "Percorsi in
// bici > Stress da traffico" replaces the map view entirely with this
// iframe, same as the old app.
export const LTS_EMBED_VIEW = { lat: 46.1562, lon: 12.65731, zoom: 12.86 }
