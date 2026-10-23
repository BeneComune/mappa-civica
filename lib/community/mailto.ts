// lib\community\mailto.ts
// A report leaves the app as a pre-filled email to the municipality; there
// is no backend to POST to.
import { MUNICIPALITY_EMAIL } from "@/lib/config"
import { STRINGS } from "@/lib/strings"
import { categoryLabel } from "./categories"
import type { CommunityReport } from "./types"

export function buildReportMailto(report: CommunityReport): string {
  const catLabel = categoryLabel(report.category)
  const subject = `${STRINGS.reportEmailSubjectPrefix} ${catLabel}: ${report.title}`
  const body = [
    `${STRINGS.reportCategoryLabel}: ${catLabel}`,
    `${STRINGS.reportLocationLabel}: lat ${report.lat.toFixed(5)}, lon ${report.lon.toFixed(5)}`,
    ...(report.foglio && report.particella
      ? [`${STRINGS.reportParcelLabel}: foglio ${report.foglio}, particella ${report.particella}`]
      : []),
    ``,
    `${STRINGS.reportDescriptionLabel}:`,
    report.description || STRINGS.reportEmailNoDescription,
    ...(report.photoDataUrl ? [``, STRINGS.reportEmailPhotoNote] : []),
    ``,
    `---`,
    `${STRINGS.reportEmailSignature} ${STRINGS.appName}`,
  ].join("\n")

  return `mailto:${MUNICIPALITY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
