// lib\rescue-details.ts
// Structured detail data for a clicked rescue feature (rii, fire perimeters /
// danger / ignition, assets). MapFeatureDetail renders it as a panel card,
// matching the catasto parcel readout - replaces the old map balloons, which
// overflowed the popup with no way to scroll.
import { STRINGS } from "@/lib/strings"

export type DetailRow = {
  label: string
  value: string
  // Long free-text sections render as a collapsed <details>; short one-liners
  // render inline.
  collapsible?: boolean
}

export type RescueDetail = {
  title: string
  subtitle?: string
  rows: DetailRow[]
  // When set, every collapsible row is folded into one <details> with this
  // summary ("Altri dettagli") instead of one <details> per row.
  moreLabel?: string
  note?: string
  photo?: string
}

function text(value: unknown): string {
  return String(value ?? "").trim()
}

function tidyDashes(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return value.replace(/\s+-\s+/g, " / ")
}

function row(label: string, value: unknown): DetailRow | null {
  const v = text(value)
  if (!v || /^assenti?$/i.test(v)) return null
  return { label, value: tidyDashes(v) }
}

function section(label: string, value: unknown): DetailRow | null {
  const v = text(value)
  if (!v || /^non disponibile/i.test(v) || /^non documentata/i.test(v)) return null
  return { label, value: v, collapsible: true }
}

function keep(rows: Array<DetailRow | null>): DetailRow[] {
  return rows.filter((r): r is DetailRow => r !== null)
}

const STATO_BADGE: Record<string, string> = {
  aggiornato_2024: "Rilievo 2024",
  solo_foto_2024: "Solo foto 2024",
  storico_2013: "Dati fermi al 2013",
  storico_2007: "Dati fermi al 2007",
}

export function riiDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  const badge = STATO_BADGE[text(props.stato)] ?? ""
  const posLabel = props.pos_approssimata
    ? "posizione approssimata"
    : `posizione ${text(props.pos_affidabilita) || "da verificare"}`
  return {
    title: text(props.nome) || STRINGS.riiFallbackTitle,
    subtitle: [badge, posLabel].filter(Boolean).join(" · "),
    photo: props.foto ? `/${text(props.foto)}` : undefined,
    rows: keep([
      row(STRINGS.riiBasin, props.area),
      row(STRINGS.riiSurvey, props.anno_rilievo),
      section(STRINGS.riiIssues, props.descrizione),
      section(STRINGS.riiCriticalPoints, props.punti_critici),
      section(STRINGS.riiProposedWorks, props.interventi),
      section(STRINGS.riiRecentEvents, props.eventi_recenti),
    ]),
  }
}

function moreRow(label: string, value: unknown): DetailRow | null {
  const r = row(label, value)
  return r && { ...r, collapsible: true }
}

export function fireDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  const localita = text(props.localita) || STRINGS.fireUnknownPlace
  return {
    title: props.anno ? `${localita} (${text(props.anno)})` : localita,
    subtitle: text(props.causa),
    // Only date + duration up front; the rest under "Altri dettagli".
    moreLabel: STRINGS.fireMoreDetails,
    rows: keep([
      row(STRINGS.fireStartDate, props.data_inizio),
      row(STRINGS.fireDuration, props.durata),
      moreRow(STRINGS.fireIgnitionPlace, props.luogo_inizio),
      moreRow(STRINGS.fireVegetationState, props.stato_vegetazione),
      moreRow(STRINGS.fireNaturalConstraints, props.vincoli_naturali),
      moreRow(STRINGS.fireReportCode, props.codice),
    ]),
  }
}

export function dangerDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  const grado = text(props.grado)
  const label = grado === "alta" ? "alto" : grado === "medio" ? "medio" : grado || "n/d"
  return {
    title: `${STRINGS.fireDangerTitle}: ${label}`,
    rows: [],
    note:
      "Zonazione regionale SITFOR (IRDAT FVG), ritagliata sul confine comunale. Indica la " +
      "propensione del territorio agli incendi, non un allarme in corso.",
  }
}

export function ignitionDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  return {
    title: `${STRINGS.fireIgnitionTitle}${props.anno ? ` (${text(props.anno)})` : ""}`,
    rows: [],
    note:
      `Stazione forestale ${text(props.sigla_staz)} - foglio notizie n. ${text(props.num_fnib)}`,
  }
}

const ASSET_KIND: Record<string, string> = {
  defibrillator: "Defibrillatore (DAE)",
  hems: "Elisuperficie",
  fire_hydrant: "Idrante",
  assembly_point: "Punto di raccolta",
}

const ACCESS_LABEL: Record<string, string> = {
  yes: "libero",
  permissive: "libero",
  public: "libero",
  customers: "riservato (clienti / utenti)",
  private: "privato",
  permit: "su richiesta",
}

export function assetDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  const kind = ASSET_KIND[text(props.class)] ?? STRINGS.assetFallbackTitle
  const name = text(props["name:it"]) || text(props.name) || text(props.address)
  const hours = text(props.opening_hours)
  const access = text(props.access)
  return {
    title: name || kind,
    subtitle: kind,
    rows: keep([
      row(STRINGS.assetLocation, props["defibrillator:location"] ?? props.description),
      row(STRINGS.assetHours, hours === "24/7" ? "Sempre accessibile (24/7)" : hours),
      access ? row(STRINGS.assetAccess, ACCESS_LABEL[access] ?? access) : null,
      props.indoor === "yes" ? row(STRINGS.assetPlacement, "Interno") : null,
      row(STRINGS.assetOperator, props.operator),
      row(STRINGS.assetPhone, props.phone),
    ]),
    note: props.geocoded
      ? `Posizione ricavata dall'indirizzo (${text(props.geo_precision) || "approssimata"}), da verificare sul posto.`
      : props.fixme
        ? "Posizione indicativa, da verificare sul posto."
        : undefined,
  }
}
