// lib\community\mailto.ts
// A report leaves the app as a pre-filled email to the municipality; there
// is no backend to POST to.
import { STRINGS } from "@/lib/strings"
import { categoryLabel } from "./categories"
import type { CommunityReport } from "./types"

const MUNICIPALITY_EMAIL = "info@comune.montereale-valcellina.pn.it"

export function buildReportMailto(report: CommunityReport): string {
  const catLabel = categoryLabel(report.category)
  const subject = `[Segnalazione] ${catLabel}: ${report.title}`
  const body = [
    `Categoria: ${catLabel}`,
    `Posizione: lat ${report.lat.toFixed(5)}, lon ${report.lon.toFixed(5)}`,
    ...(report.foglio && report.particella
      ? [`Particella catastale (indicativa): foglio ${report.foglio}, particella ${report.particella}`]
      : []),
    ``,
    `Descrizione:`,
    report.description || "(nessuna descrizione)",
    ...(report.photoDataUrl ? [``, `Fotografia allegata: → allegare il file all'email prima di inviare.`] : []),
    ``,
    `---`,
    `Inviato dal portale ${STRINGS.appName}`,
  ].join("\n")

  return `mailto:${MUNICIPALITY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
