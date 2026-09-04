// Single source of truth for municipality-specific values (from the old
// app's comune.config.json), reused by the map default view and any widget
// that needs the town's coordinates without depending on lib/map/base.ts
// (which pulls in the real maplibre-gl runtime import).
export const MUNICIPALITY_CENTER: [number, number] = [12.664, 46.16]
export const MUNICIPALITY_ZOOM = 12
