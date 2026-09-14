// lib\landslide-classes.ts
// Class config for the Rescue module's "Rischio frane" tab - same
// label/color/toggle-chip shape as lib/green-classes.ts, consumed by the
// same generic ClassesTogglePanel. Source: ISPRA's PAI landslide hazard
// mosaic (pipeline/scripts/build_landslide_geojson.py), which already
// simplifies "Moderata P1" etc. to these class keys.
import { COLORS } from "@/lib/colors"

export type LandslideClass = "aa" | "p1" | "p2" | "p3" | "p4"

export const ALL_LANDSLIDE_CLASSES: LandslideClass[] = ["aa", "p1", "p2", "p3", "p4"]

export const LANDSLIDE_CLASS_CONFIG: Record<LandslideClass, { label: string; color: string }> = {
  aa: { label: "Area di attenzione", color: COLORS.landslideAa },
  p1: { label: "Moderata (P1)", color: COLORS.landslideP1 },
  p2: { label: "Media (P2)", color: COLORS.landslideP2 },
  p3: { label: "Elevata (P3)", color: COLORS.landslideP3 },
  p4: { label: "Molto elevata (P4)", color: COLORS.landslideP4 },
}
