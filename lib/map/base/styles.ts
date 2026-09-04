// lib\map\base\styles.ts
// Basemap appearance: which style documents the switcher offers, and the
// terrain source the 3D relief reads from.

// Live basemap styles from Maptoolkit - the same tile+style service the old
// app's integrated stressinbici.it (LTS) map uses.
export type BasemapStyleKey = "light" | "summer" | "cycling" | "dark"

export const BASEMAP_STYLE_URLS: Record<BasemapStyleKey, string> = {
  light: "https://styles.maptoolkit.org/light.json",
  summer: "https://styles.maptoolkit.org/summer.json",
  cycling: "https://styles.maptoolkit.org/cycling.json",
  dark: "https://styles.maptoolkit.org/dark.json",
}

export const BASEMAP_STYLE_LABELS: Record<BasemapStyleKey, string> = {
  light: "Sfondo chiaro",
  summer: "Sfondo estivo",
  cycling: "Sfondo ciclabile",
  dark: "Sfondo scuro",
}

export const DEFAULT_BASEMAP_STYLE: BasemapStyleKey = "dark"

// Free public terrarium-encoded DEM (same source the old app uses) - kept as
// our own overlay source so 3D terrain works regardless of which Maptoolkit
// style is currently active.
export const TERRAIN_SOURCE_ID = "mapterhorn-dem"
