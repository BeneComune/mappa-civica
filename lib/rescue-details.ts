// lib\rescue-details.ts
// Structured detail data for a clicked rescue feature (rii, fire perimeters /
// danger / ignition, assets). MapFeatureDetail renders it as a panel card,
// matching the catasto parcel readout - replaces the old map balloons, which
// overflowed the popup with no way to scroll.

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
    title: text(props.nome) || "Rio",
    subtitle: [badge, posLabel].filter(Boolean).join(" · "),
    photo: props.foto ? `/${text(props.foto)}` : undefined,
    rows: keep([
      row("Bacino", props.area),
      row("Rilievo", props.anno_rilievo),
      section("Criticità", props.descrizione),
      section("Punti critici", props.punti_critici),
      section("Interventi proposti", props.interventi),
      section("Eventi recenti", props.eventi_recenti),
    ]),
  }
}

function moreRow(label: string, value: unknown): DetailRow | null {
  const r = row(label, value)
  return r && { ...r, collapsible: true }
}

export function fireDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  const localita = text(props.localita) || "Località non indicata"
  return {
    title: props.anno ? `${localita} (${text(props.anno)})` : localita,
    subtitle: text(props.causa),
    // Only date + duration up front; the rest under "Altri dettagli".
    moreLabel: "Altri dettagli",
    rows: keep([
      row("Data di inizio", props.data_inizio),
      row("Durata", props.durata),
      moreRow("Luogo di innesco", props.luogo_inizio),
      moreRow("Stato della vegetazione", props.stato_vegetazione),
      moreRow("Vincoli naturali", props.vincoli_naturali),
      moreRow("Codice foglio notizie", props.codice),
    ]),
  }
}

export function dangerDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  const grado = text(props.grado)
  const label = grado === "alta" ? "alto" : grado === "medio" ? "medio" : grado || "n/d"
  return {
    title: `Classe di pericolo incendi: ${label}`,
    rows: [],
    note:
      "Zonazione regionale SITFOR (IRDAT FVG), ritagliata sul confine comunale. Indica la " +
      "propensione del territorio agli incendi, non un allarme in corso.",
  }
}

export function ignitionDetail(props: Record<string, unknown>): RescueDetail | null {
  if (!props) return null
  return {
    title: `Punto di innesco${props.anno ? ` (${text(props.anno)})` : ""}`,
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
  const kind = ASSET_KIND[text(props.class)] ?? "Presidio"
  const name = text(props["name:it"]) || text(props.name) || text(props.address)
  const hours = text(props.opening_hours)
  return {
    title: name || kind,
    subtitle: kind,
    rows: keep([
      row("Dove si trova", props["defibrillator:location"] ?? props.description),
      row("Orari", hours === "24/7" ? "Sempre accessibile (24/7)" : hours),
      props.access ? row("Accesso", ACCESS_LABEL[text(props.access)] ?? text(props.access)) : null,
      props.indoor === "yes" ? row("Collocazione", "Interno") : null,
      row("Gestore", props.operator),
      row("Telefono", props.phone),
    ]),
    note: props.geocoded
      ? `Posizione ricavata dall'indirizzo (${text(props.geo_precision) || "approssimata"}), da verificare sul posto.`
      : props.fixme
        ? "Posizione indicativa, da verificare sul posto."
        : undefined,
  }
}
