// lib\community\categories.ts
// The report categories offered in the form and used to colour markers.
import { COLORS } from "@/lib/colors"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export const CATEGORIES = [
  { id: "strade", label: STRINGS.reportCategoryRoads, icon: ICONS.reportRoads, color: COLORS.reportRoads },
  { id: "natura", label: STRINGS.reportCategoryNature, icon: ICONS.reportNature, color: COLORS.reportNature },
  { id: "rifiuti", label: STRINGS.reportCategoryWaste, icon: ICONS.reportWaste, color: COLORS.reportWaste },
  {
    id: "illuminazione",
    label: STRINGS.reportCategoryLighting,
    icon: ICONS.reportLighting,
    color: COLORS.reportLighting,
  },
  {
    id: "segnaletica",
    label: STRINGS.reportCategorySignage,
    icon: ICONS.reportSignage,
    color: COLORS.reportSignage,
  },
  {
    id: "proposta",
    label: STRINGS.reportCategoryProposal,
    icon: ICONS.reportProposal,
    color: COLORS.reportProposal,
  },
] as const

export type CategoryId = (typeof CATEGORIES)[number]["id"]

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}
