// Class configs from the old app's GreenLegend.tsx - shared by the NDVI
// checkbox/stats panel and the hover popups on all four Green tabs.

export type NdviClass = "water" | "bare" | "sparse" | "moderate" | "dense" | "very_dense"
export type NbrClass = "sana" | "moderata" | "stress" | "degradata" | "bruciata"
export type LstClass = "fresco" | "moderato_fresco" | "temperato" | "caldo" | "molto_caldo"

export const ALL_NDVI_CLASSES: NdviClass[] = ["water", "bare", "sparse", "moderate", "dense", "very_dense"]

export const NDVI_CLASS_CONFIG: Record<NdviClass, { label: string; color: string }> = {
  water: { label: "Acqua / superfici riflettenti", color: "#4a90d9" },
  bare: { label: "Suolo nudo / edificato", color: "#c9a96e" },
  sparse: { label: "Vegetazione rada", color: "#a8d08d" },
  moderate: { label: "Vegetazione moderata", color: "#5aaa5a" },
  dense: { label: "Foresta densa", color: "#238b45" },
  very_dense: { label: "Foresta molto densa", color: "#004d20" },
}

export const NBR_CLASS_CONFIG: Record<NbrClass, { label: string; color: string; range: string }> = {
  sana: { label: "Vegetazione sana", color: "#1a9641", range: "> 0.4" },
  moderata: { label: "Vegetazione moderata", color: "#a6d96a", range: "0.2 - 0.4" },
  stress: { label: "Stress idrico", color: "#ffffbf", range: "0.0 - 0.2" },
  degradata: { label: "Vegetazione degradata", color: "#fdae61", range: "-0.2 - 0.0" },
  bruciata: { label: "Suolo nudo / bruciato", color: "#d7191c", range: "< -0.2" },
}

export const LST_CLASS_CONFIG: Record<LstClass, { label: string; color: string; range: string }> = {
  fresco: { label: "Fresco", color: "#4575b4", range: "< 18°C" },
  moderato_fresco: { label: "Moderato-fresco", color: "#91bfdb", range: "18-22°C" },
  temperato: { label: "Temperato", color: "#fee090", range: "22-26°C" },
  caldo: { label: "Caldo", color: "#fc8d59", range: "26-30°C" },
  molto_caldo: { label: "Molto caldo", color: "#d73027", range: "> 30°C" },
}

export type ClassStats = { areaM2: number; pct: number }

export function computeNdviStats(
  features: { properties: Record<string, unknown> }[]
): Record<NdviClass, ClassStats> | null {
  const totals: Partial<Record<NdviClass, number>> = {}
  let hasArea = false

  for (const f of features) {
    const cls = f.properties.ndvi_class as NdviClass
    const area = f.properties.area_m2 as number | undefined
    if (!cls || area == null) continue
    hasArea = true
    totals[cls] = (totals[cls] ?? 0) + area
  }

  if (!hasArea) return null
  const totalAll = Object.values(totals).reduce((s, v) => s + (v ?? 0), 0)
  if (totalAll === 0) return null

  return Object.fromEntries(
    ALL_NDVI_CLASSES.map((cls) => {
      const areaM2 = totals[cls] ?? 0
      return [cls, { areaM2, pct: (areaM2 / totalAll) * 100 }]
    })
  ) as Record<NdviClass, ClassStats>
}
