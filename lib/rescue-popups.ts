// lib\rescue-popups.ts
// Click-popup HTML builders ported from the old app's RescueModule.tsx, for
// rii, fire perimeters/danger/ignition, and assets (AED/HEMS/hydrant/
// assembly). Plain string templates (MapLibre popups are HTML, not React).

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function tidyDashes(text: string): string {
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return text.replace(/\s+-\s+/g, " / ")
}

function fireRow(label: string, value: unknown): string {
  const text = String(value ?? "").trim()
  if (!text || /^assenti?$/i.test(text)) return ""
  return `<p><b>${esc(label)}</b><br/>${esc(tidyDashes(text))}</p>`
}

function riiSection(title: string, body: unknown): string {
  const text = String(body ?? "").trim()
  if (!text || /^non disponibile/i.test(text) || /^non documentata/i.test(text)) return ""
  return `<p><b>${esc(title)}</b><br/>${esc(text)}</p>`
}

const STATO_BADGE: Record<string, string> = {
  aggiornato_2024: "Rilievo 2024",
  solo_foto_2024: "Solo foto 2024",
  storico_2013: "Dati fermi al 2013",
  storico_2007: "Dati fermi al 2007",
}

export function riiPopupHTML(props: Record<string, unknown>): string {
  const stato = String(props.stato ?? "")
  const badge = STATO_BADGE[stato] ?? ""
  const posLabel = props.pos_approssimata
    ? "posizione approssimata"
    : `posizione ${props.pos_affidabilita || "da verificare"}`

  const photo = props.foto
    ? `<img src="/${esc(props.foto)}" alt="Foto ${esc(props.nome)}" style="width:100%;border-radius:4px;margin-top:0.35rem;display:block;max-height:110px;object-fit:cover;" loading="lazy" />`
    : ""

  return (
    `<div style="font-size:0.85rem;max-width:260px">` +
    photo +
    `<strong>${esc(props.nome)}</strong>` +
    `<div style="margin:0.25rem 0;font-size:0.75rem;color:#888">${esc(badge)} · ${esc(posLabel)}</div>` +
    (props.area ? `<p>${esc(props.area)}</p>` : "") +
    (props.anno_rilievo ? `<p>Rilievo: ${esc(props.anno_rilievo)}</p>` : "") +
    riiSection("Criticità", props.descrizione) +
    riiSection("Punti critici", props.punti_critici) +
    riiSection("Interventi proposti", props.interventi) +
    riiSection("Eventi recenti", props.eventi_recenti) +
    `</div>`
  )
}

export function firePopupHTML(props: Record<string, unknown>): string {
  const localita = String(props.localita ?? "").trim() || "Località non indicata"
  const title = props.anno ? `${esc(localita)} (${esc(props.anno)})` : esc(localita)
  return (
    `<div style="font-size:0.85rem;max-width:260px">` +
    `<strong>${title}</strong>` +
    `<div style="margin:0.25rem 0;font-size:0.75rem;color:#888">${esc(props.causa ?? "")}</div>` +
    fireRow("Data di inizio", props.data_inizio) +
    fireRow("Durata", props.durata) +
    fireRow("Luogo di innesco", props.luogo_inizio) +
    fireRow("Stato della vegetazione", props.stato_vegetazione) +
    fireRow("Vincoli naturali", props.vincoli_naturali) +
    fireRow("Codice foglio notizie", props.codice) +
    `</div>`
  )
}

export function dangerPopupHTML(props: Record<string, unknown>): string {
  const grado = String(props.grado ?? "")
  const label = grado === "alta" ? "alto" : grado === "medio" ? "medio" : grado || "n/d"
  return (
    `<div style="font-size:0.85rem;max-width:260px">` +
    `<strong>Classe di pericolo incendi: ${label}</strong>` +
    `<p>Zonazione regionale SITFOR (IRDAT FVG), ritagliata sul confine comunale. ` +
    `Indica la propensione del territorio agli incendi, non un allarme in corso.</p></div>`
  )
}

export function ignitionPopupHTML(props: Record<string, unknown>): string {
  return (
    `<div style="font-size:0.85rem;max-width:260px">` +
    `<strong>Punto di innesco${props.anno ? ` (${esc(props.anno)})` : ""}</strong>` +
    `<p>Stazione forestale ${esc(props.sigla_staz ?? "")} - foglio notizie n. ${esc(props.num_fnib ?? "")}</p></div>`
  )
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

export function assetPopupHTML(props: Record<string, unknown>): string {
  const kind = ASSET_KIND[String(props.class ?? "")] ?? "Presidio"
  const name = String(props["name:it"] ?? props.name ?? props.address ?? "").trim()
  const hours = String(props.opening_hours ?? "").trim()
  const rows =
    fireRow("Dove si trova", props["defibrillator:location"] ?? props.description) +
    fireRow("Orari", hours === "24/7" ? "Sempre accessibile (24/7)" : hours) +
    (props.access ? fireRow("Accesso", ACCESS_LABEL[String(props.access)] ?? String(props.access)) : "") +
    (props.indoor === "yes" ? fireRow("Collocazione", "Interno") : "") +
    fireRow("Gestore", props.operator) +
    fireRow("Telefono", props.phone)
  const note = props.geocoded
    ? `<p>Posizione ricavata dall'indirizzo (${esc(props.geo_precision ?? "approssimata")}), da verificare sul posto.</p>`
    : props.fixme
      ? `<p>Posizione indicativa, da verificare sul posto.</p>`
      : ""
  return (
    `<div style="font-size:0.85rem;max-width:260px">` +
    `<strong>${esc(name || kind)}</strong>` +
    `<div style="margin:0.25rem 0;font-size:0.75rem;color:#888">${esc(kind)}</div>` +
    rows +
    note +
    `</div>`
  )
}
