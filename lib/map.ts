import * as maplibregl from "maplibre-gl"
import type { Map, IControl } from "maplibre-gl"

// Ported from the old app's lib/map.ts. Base map + controls, plus overlays
// ported so far: rii (Rii a rischio). Remaining module overlays (fire,
// AED/HEMS, NDVI, NBR, LST, trails, bike infra, ...) are not ported yet.

// maplibre-gl-worker.mjs imports a sibling chunk (maplibre-gl-shared.mjs) via
// a relative import that Vite historically didn't resolve correctly (see the
// old app's lib/map.ts). Both files are copied verbatim into
// public/maplibre-gl/ as a precaution. Re-copy them from
// node_modules/maplibre-gl/dist/ if maplibre-gl is upgraded.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl/maplibre-gl-worker.mjs")
}

const DEFAULT_CENTER: [number, number] = [12.664, 46.16]
const DEFAULT_ZOOM = 12

// Live basemap styles from Maptoolkit - the same tile+style service the old
// app's integrated stressinbici.it (LTS) map uses.
type BasemapStyleKey = "light" | "summer" | "cycling" | "dark"

const BASEMAP_STYLE_URLS: Record<BasemapStyleKey, string> = {
  light: "https://styles.maptoolkit.org/light.json",
  summer: "https://styles.maptoolkit.org/summer.json",
  cycling: "https://styles.maptoolkit.org/cycling.json",
  dark: "https://styles.maptoolkit.org/dark.json",
}

const BASEMAP_STYLE_LABELS: Record<BasemapStyleKey, string> = {
  light: "Sfondo chiaro",
  summer: "Sfondo estivo",
  cycling: "Sfondo ciclabile",
  dark: "Sfondo scuro",
}

const DEFAULT_BASEMAP_STYLE: BasemapStyleKey = "summer"

// Free public terrarium-encoded DEM (same source the old app uses) - kept as
// our own overlay source so 3D terrain works regardless of which Maptoolkit
// style is currently active.
const TERRAIN_SOURCE_ID = "mapterhorn-dem"

class MapStyleControl implements IControl {
  private container?: HTMLDivElement
  private current: BasemapStyleKey

  constructor(initial: BasemapStyleKey) {
    this.current = initial
  }

  onAdd(map: Map): HTMLElement {
    const container = document.createElement("div")
    container.className = "maplibregl-ctrl maplibregl-ctrl-group map-style-switcher"

    const header = document.createElement("button")
    header.type = "button"
    header.className = "map-style-switcher-header"

    const title = document.createElement("span")
    title.textContent = "Legenda"

    const toggleIcon = document.createElement("span")
    toggleIcon.className = "map-style-switcher-toggle-icon"
    toggleIcon.textContent = "−"
    toggleIcon.setAttribute("aria-hidden", "true")

    header.appendChild(title)
    header.appendChild(toggleIcon)

    const body = document.createElement("div")
    body.className = "map-style-switcher-body"

    header.addEventListener("click", () => {
      const collapsed = container.classList.toggle("collapsed")
      toggleIcon.textContent = collapsed ? "+" : "−"
      header.setAttribute("aria-expanded", String(!collapsed))
    })
    header.setAttribute("aria-expanded", "true")

    container.appendChild(header)

    ;(Object.keys(BASEMAP_STYLE_URLS) as BasemapStyleKey[]).forEach((key) => {
      const button = document.createElement("button")
      button.type = "button"
      button.title = BASEMAP_STYLE_LABELS[key]
      button.setAttribute("aria-label", BASEMAP_STYLE_LABELS[key])
      if (key === this.current) button.classList.add("active")
      button.textContent = BASEMAP_STYLE_LABELS[key]
      button.addEventListener("click", () => {
        if (key === this.current) return
        this.current = key
        body.querySelectorAll("button").forEach((b) => b.classList.remove("active"))
        button.classList.add("active")
        map.setStyle(BASEMAP_STYLE_URLS[key])
      })
      body.appendChild(button)
    })

    container.appendChild(body)

    this.container = container
    return container
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container)
  }
}

// Same Nominatim geocoder as the old app: jsonv2, restricted to Italy,
// fitBounds on the result's own bounding box, closes on outside click, drops
// stale out-of-order responses.
const MAX_SEARCH_RESULT_ZOOM = 17

class MapSearchControl implements IControl {
  private container?: HTMLDivElement
  private button?: HTMLButtonElement
  private panel?: HTMLDivElement
  private input?: HTMLInputElement
  private resultsList?: HTMLDivElement
  private debounceHandle?: number
  private requestId = 0
  private outsideClickHandler?: (e: MouseEvent) => void

  onAdd(map: Map): HTMLElement {
    const container = document.createElement("div")
    container.className = "maplibregl-ctrl maplibregl-ctrl-group map-search-ctrl"

    const button = document.createElement("button")
    button.type = "button"
    button.title = "Cerca un indirizzo o un luogo"
    button.setAttribute("aria-label", "Cerca un indirizzo o un luogo")
    button.textContent = "🔍"
    button.addEventListener("click", () => this.toggle())

    const panel = document.createElement("div")
    panel.className = "map-search-panel hidden"

    const input = document.createElement("input")
    input.type = "text"
    input.autocomplete = "off"
    input.setAttribute("aria-label", "Cerca indirizzo o luogo")

    const resultsList = document.createElement("div")
    resultsList.className = "map-search-results hidden"

    input.addEventListener("input", () => this.onInput(map))

    this.outsideClickHandler = (e: MouseEvent) => {
      if (!container.contains(e.target as Node)) this.close()
    }
    document.addEventListener("click", this.outsideClickHandler)

    panel.appendChild(input)
    panel.appendChild(resultsList)
    container.appendChild(button)
    container.appendChild(panel)

    this.container = container
    this.button = button
    this.panel = panel
    this.input = input
    this.resultsList = resultsList
    return container
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container)
    if (this.outsideClickHandler) document.removeEventListener("click", this.outsideClickHandler)
  }

  private toggle(): void {
    if (this.panel?.classList.contains("hidden")) this.open()
    else this.close()
  }

  private open(): void {
    this.panel?.classList.remove("hidden")
    this.button?.classList.add("active")
    this.input?.focus()
  }

  private close(): void {
    this.panel?.classList.add("hidden")
    this.button?.classList.remove("active")
    this.hideResults()
  }

  private hideResults(): void {
    this.resultsList?.classList.add("hidden")
    if (this.resultsList) this.resultsList.innerHTML = ""
  }

  private onInput(map: Map): void {
    window.clearTimeout(this.debounceHandle)
    const query = this.input?.value.trim() ?? ""
    if (query.length < 3) {
      this.hideResults()
      return
    }
    this.debounceHandle = window.setTimeout(() => this.search(map, query), 400)
  }

  private async search(map: Map, query: string): Promise<void> {
    const requestId = ++this.requestId
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("q", query)
    url.searchParams.set("countrycodes", "it")
    url.searchParams.set("limit", "6")
    url.searchParams.set("accept-language", "it")

    type NominatimResult = { display_name: string; boundingbox: [string, string, string, string] }
    let results: NominatimResult[]
    try {
      const response = await fetch(url)
      results = await response.json()
    } catch {
      return
    }
    if (requestId !== this.requestId || !this.resultsList) return

    this.resultsList.innerHTML = ""
    if (!results.length) {
      this.hideResults()
      return
    }
    for (const result of results) {
      const item = document.createElement("div")
      item.className = "map-search-result-item"
      item.textContent = result.display_name
      item.addEventListener("click", () => {
        const [south, north, west, east] = result.boundingbox.map(Number)
        map.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          { padding: 60, maxZoom: MAX_SEARCH_RESULT_ZOOM, duration: 800 }
        )
        if (this.input) this.input.value = result.display_name
        this.close()
      })
      this.resultsList.appendChild(item)
    }
    this.resultsList.classList.remove("hidden")
  }
}

// Custom (not MapLibre's built-in TerrainControl) to match the old app's own
// terrain button exactly. setStyle() (the basemap switcher) replaces the
// whole style document, which silently drops map.setTerrain(...) - the
// camera stays tilted but the relief disappears until re-toggled.
class MapTerrainControl implements IControl {
  private container?: HTMLDivElement
  private onTerrainChange: (on: boolean) => void

  constructor(onTerrainChange: (on: boolean) => void) {
    this.onTerrainChange = onTerrainChange
  }

  onAdd(map: Map): HTMLElement {
    const container = document.createElement("div")
    container.className = "maplibregl-ctrl maplibregl-ctrl-group"

    const button = document.createElement("button")
    button.type = "button"
    button.title = "Terreno 3D"
    button.setAttribute("aria-label", "Terreno 3D")
    button.textContent = "🏔️"
    button.addEventListener("click", () => {
      const isOn = !!map.getTerrain()
      const nextOn = !isOn
      map.setTerrain(nextOn ? { source: TERRAIN_SOURCE_ID, exaggeration: 1.3 } : null)
      button.classList.toggle("active", nextOn)
      map.easeTo({ pitch: nextOn ? 60 : 0, duration: 800 })
      this.onTerrainChange(nextOn)
    })

    container.appendChild(button)
    this.container = container
    return container
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container)
  }
}

// Ground resolution (metres per CSS pixel) of standard Web Mercator tiles at
// a given latitude/zoom - used to turn the on-screen map into a real
// cartographic scale ("1:25 000") on the printed PDF page.
function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom)
}

function formatCoord(value: number, positiveSuffix: string, negativeSuffix: string): string {
  return `${Math.abs(value).toFixed(4)}°${value >= 0 ? positiveSuffix : negativeSuffix}`
}

async function exportMapToPdf(map: Map, moduleLabel: string, productName: string): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const canvas = map.getCanvas()
  const imgData = canvas.toDataURL("image/png")
  const orientation = canvas.width >= canvas.height ? "l" : "p"
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const titleHeight = 12
  const footerHeight = 12

  doc.setFontSize(16)
  doc.setTextColor(30)
  doc.text(productName, margin, margin + 6)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${moduleLabel} - ${new Date().toLocaleDateString("it-IT")}`, margin, margin + 11)

  const availableWidth = pageWidth - margin * 2
  const availableHeight = pageHeight - margin * 2 - titleHeight - footerHeight
  const imgAspect = canvas.width / canvas.height
  let imgWidth = availableWidth
  let imgHeight = imgWidth / imgAspect
  if (imgHeight > availableHeight) {
    imgHeight = availableHeight
    imgWidth = imgHeight * imgAspect
  }
  const imgX = margin + (availableWidth - imgWidth) / 2
  const imgY = margin + titleHeight
  doc.addImage(imgData, "PNG", imgX, imgY, imgWidth, imgHeight)

  const center = map.getCenter()
  const groundWidthMm = metersPerPixel(center.lat, map.getZoom()) * canvas.clientWidth * 1000
  const scaleDenominator = Math.round(groundWidthMm / imgWidth)
  const centerText = `Centro: ${formatCoord(center.lat, "N", "S")}, ${formatCoord(center.lng, "E", "O")}`
  const scaleText = `Scala 1:${scaleDenominator.toLocaleString("it-IT")}`

  doc.setFontSize(8)
  doc.setTextColor(130)
  doc.text(`${centerText}  ·  ${scaleText}`, margin, pageHeight - 10)
  doc.text("© Maptoolkit © OpenStreetMap contributors", margin, pageHeight - 5)

  const fileSlug = moduleLabel.toLowerCase().replace(/\s+/g, "-")
  doc.save(`mappa-civica-${fileSlug}.pdf`)
}

class MapPrintControl implements IControl {
  private container?: HTMLDivElement
  private moduleLabel: string
  private productName: string

  constructor(moduleLabel: string, productName: string) {
    this.moduleLabel = moduleLabel
    this.productName = productName
  }

  onAdd(map: Map): HTMLElement {
    const container = document.createElement("div")
    container.className = "maplibregl-ctrl maplibregl-ctrl-group"

    const button = document.createElement("button")
    button.type = "button"
    button.title = "Stampa mappa"
    button.setAttribute("aria-label", "Stampa mappa")
    button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 2 H14 L19 7 V22 H5 Z" fill="#f5f5f5" stroke="#888" stroke-width="1" stroke-linejoin="round"></path>
      <path d="M14 2 L19 7 H14 Z" fill="#cccccc"></path>
      <rect x="4" y="13" width="15" height="6" rx="1" fill="#E31B1C"></rect>
      <text x="11.5" y="17.6" font-size="5.5" font-family="Arial, sans-serif" font-weight="bold" fill="white" text-anchor="middle">PDF</text>
    </svg>`
    button.addEventListener("click", () => {
      button.disabled = true
      exportMapToPdf(map, this.moduleLabel, this.productName)
        .catch((err) => console.error("PDF export failed", err))
        .finally(() => {
          button.disabled = false
        })
    })

    container.appendChild(button)
    this.container = container
    return container
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container)
  }
}

// Runs `fn` once immediately if the style is already loaded, and again after
// every future style load - the basemap switcher's setStyle() wipes any
// overlay source/layer not part of the new style document, so overlays must
// be re-added on every style load, not just the first one.
export function onStyleReady(map: Map, fn: () => void): () => void {
  if (map.isStyleLoaded()) fn()
  map.on("style.load", fn)
  return () => map.off("style.load", fn)
}

export function createBaseMap(container: HTMLElement, printLabel: string, productName: string): Map {
  const map = new maplibregl.Map({
    container,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    style: BASEMAP_STYLE_URLS[DEFAULT_BASEMAP_STYLE],
    attributionControl: false,
    // Needed for the print/export control to read back a valid PNG from the
    // WebGL canvas via toDataURL().
    canvasContextAttributes: { preserveDrawingBuffer: true },
  })

  let terrainOn = false

  map.on("style.load", () => {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: "raster-dem",
        tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"],
        tileSize: 512,
        encoding: "terrarium",
        maxzoom: 13,
      })
    }
    if (terrainOn) {
      map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.3 })
    }
  })

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")
  map.addControl(new maplibregl.FullscreenControl(), "top-right")
  map.addControl(new MapSearchControl(), "top-right")
  map.addControl(
    new MapTerrainControl((on) => {
      terrainOn = on
    }),
    "top-right"
  )
  map.addControl(new MapPrintControl(printLabel, productName), "top-right")
  map.addControl(new MapStyleControl(DEFAULT_BASEMAP_STYLE), "top-left")
  map.addControl(new maplibregl.AttributionControl(), "bottom-right")

  return map
}

// --- Overlays ---------------------------------------------------------
//
// The old app recreated the whole map per module/section. This app keeps a
// single persistent map, so overlays are added once (idempotently, since
// setStyle() wipes anything not part of the new style document and
// onStyleReady re-runs this on every style load) and toggled on/off by
// layout.visibility depending on the current route.

// Sets a MapLibre layer's visibility, ignoring layers that don't exist yet
// (e.g. the style hasn't finished loading, or this overlay hasn't been
// added). Shared by every overlay's route-driven show/hide.
export function setOverlayVisibility(map: Map, layerIds: string[], visible: boolean): void {
  for (const id of layerIds) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none")
    }
  }
}

// "Rii a rischio esondazione" - the volunteer stream census (Censimento
// RII) from the old app's RescueModule. Geometry is a mix: the real
// watercourse line from OpenStreetMap where it has the named stream,
// otherwise a single point (faded when its position is only approximate).
// Colour encodes how current the survey is.
export const RII_LAYER_IDS = ["rii-line-casing", "rii-line", "rii-points", "rii-labels"]

const RII_SOURCE_ID = "rii"

const RII_COLOR: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "stato"],
  "aggiornato_2024", "#1c7ed6",
  "solo_foto_2024", "#4dabf7",
  "storico_2013", "#f59f00",
  "storico_2007", "#e8590c",
  "#868e96",
]

export function addRiiOverlay(map: Map): void {
  if (!map.getSource(RII_SOURCE_ID)) {
    map.addSource(RII_SOURCE_ID, {
      type: "geojson",
      data: "/data/rescue/rii.geojson",
    })
  }

  if (!map.getLayer("rii-line-casing")) {
    // White casing under the stream line, for legibility over the basemap.
    map.addLayer({
      id: "rii-line-casing",
      type: "line",
      source: RII_SOURCE_ID,
      filter: ["==", ["geometry-type"], "LineString"],
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 0.7,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 4.5, 15, 9],
      },
    })
  }

  if (!map.getLayer("rii-line")) {
    map.addLayer({
      id: "rii-line",
      type: "line",
      source: RII_SOURCE_ID,
      filter: ["==", ["geometry-type"], "LineString"],
      layout: { "line-cap": "round", "line-join": "round", visibility: "none" },
      paint: {
        "line-color": RII_COLOR,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2.5, 15, 5.5],
      },
    })
  }

  if (!map.getLayer("rii-points")) {
    map.addLayer({
      id: "rii-points",
      type: "circle",
      source: RII_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Point"],
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 6, 15, 11],
        "circle-color": RII_COLOR,
        "circle-opacity": ["case", ["boolean", ["get", "pos_approssimata"], false], 0.5, 0.9],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.8,
      },
    })
  }

  if (!map.getLayer("rii-labels")) {
    map.addLayer({
      id: "rii-labels",
      type: "symbol",
      source: RII_SOURCE_ID,
      minzoom: 12,
      layout: {
        visibility: "none",
        "text-field": ["get", "nome"],
        "text-offset": [0, 1.3],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 15, 13],
        "text-font": ["Noto Sans Regular"],
        "text-optional": true,
      },
      paint: {
        "text-color": "#1b3a4b",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.6,
      },
    })
  }
}

// Forest fire perimeters (IRDAT FVG) from the old app's RescueModule.
// Historical burned areas, coloured by ignition cause. Danger zonation,
// ignition points, and the NBR burn index are optional overlays that were
// off by default behind checkboxes in the old app - added here (so the
// route-level toggle works once that UI exists) but kept hidden for now,
// since only the main perimeters are shown when this route is active.
export const FIRE_LAYER_IDS = ["fire-perimeters-fill", "fire-perimeters-outline"]

const FIRE_COLOR: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "causa_classe"],
  "dolosa", "#e03131",
  "colposa", "#f76707",
  "naturale", "#7048e8",
  "#868e96",
]

const FIRE_DANGER_COLOR: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "grado"],
  "alta", "#e03131",
  "medio", "#f59f00",
  "#adb5bd",
]

export function addFireOverlay(map: Map): void {
  if (!map.getSource("firePerimeters")) {
    map.addSource("firePerimeters", { type: "geojson", data: "/data/rescue/fire_perimeters.geojson" })
  }
  if (!map.getSource("fireDanger")) {
    map.addSource("fireDanger", { type: "geojson", data: "/data/rescue/fire_danger.geojson" })
  }
  if (!map.getSource("fireIgnition")) {
    map.addSource("fireIgnition", { type: "geojson", data: "/data/rescue/fire_ignition_points.geojson" })
  }
  // Shared with the Green module's NBR tab once that's ported - same source,
  // different (uniquely-named) layers, so both can toggle independently.
  if (!map.getSource("nbr")) {
    map.addSource("nbr", { type: "geojson", data: "/data/nbr.geojson" })
  }

  if (!map.getLayer("fire-danger-fill")) {
    map.addLayer({
      id: "fire-danger-fill",
      type: "fill",
      source: "fireDanger",
      layout: { visibility: "none" },
      paint: { "fill-color": FIRE_DANGER_COLOR, "fill-opacity": 0.18 },
    })
  }
  if (!map.getLayer("fire-danger-outline")) {
    map.addLayer({
      id: "fire-danger-outline",
      type: "line",
      source: "fireDanger",
      layout: { visibility: "none" },
      paint: { "line-color": FIRE_DANGER_COLOR, "line-width": 1.2, "line-dasharray": [3, 2] },
    })
  }

  if (!map.getLayer("rescue-nbr-fill")) {
    map.addLayer({
      id: "rescue-nbr-fill",
      type: "fill",
      source: "nbr",
      layout: { visibility: "none" },
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.5 },
    })
  }
  if (!map.getLayer("rescue-nbr-outline")) {
    map.addLayer({
      id: "rescue-nbr-outline",
      type: "line",
      source: "nbr",
      layout: { visibility: "none" },
      paint: { "line-color": "#ffffff", "line-width": 0.3, "line-opacity": 0.35 },
    })
  }

  if (!map.getLayer("fire-perimeters-fill")) {
    map.addLayer({
      id: "fire-perimeters-fill",
      type: "fill",
      source: "firePerimeters",
      layout: { visibility: "none" },
      paint: { "fill-color": FIRE_COLOR, "fill-opacity": 0.25 },
    })
  }
  if (!map.getLayer("fire-perimeters-outline")) {
    map.addLayer({
      id: "fire-perimeters-outline",
      type: "line",
      source: "firePerimeters",
      layout: { visibility: "none" },
      paint: { "line-color": FIRE_COLOR, "line-width": 1.1 },
    })
  }

  if (!map.getLayer("fire-ignition-points")) {
    map.addLayer({
      id: "fire-ignition-points",
      type: "circle",
      source: "fireIgnition",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 6],
        "circle-color": "#7a1f1f",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.4,
        "circle-opacity": 0.95,
      },
    })
  }
}

// "Presidi di soccorso" from the old app's RescueModule: AED defibrillators,
// HEMS heliports, fire hydrants, and emergency assembly points. All four
// were visible by default (no checkbox unchecked initially), so all four
// are shown together when this route is active.
export const ASSETS_LAYER_IDS = [
  "aed-sites",
  "aed-labels",
  "hems-sites",
  "hems-labels",
  "fire-hydrant-sites",
  "fire-hydrant-labels",
  "assembly-point-sites",
  "assembly-point-labels",
]

function addEmergencyLayers(
  map: Map,
  sourceId: string,
  layerId: string,
  labelId: string,
  color: string,
  labelColor: string
): void {
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 5, 15, 10],
        "circle-color": color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.6,
        "circle-opacity": 0.95,
      },
    })
  }

  if (!map.getLayer(labelId)) {
    map.addLayer({
      id: labelId,
      type: "symbol",
      source: sourceId,
      layout: {
        visibility: "none",
        "text-field": ["coalesce", ["get", "name:it"], ["get", "name"], ""],
        "text-offset": [0, 1.15],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 15, 12],
        "text-font": ["Noto Sans Regular"],
      },
      paint: {
        "text-color": labelColor,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    })
  }
}

export function addAssetsOverlay(map: Map): void {
  if (!map.getSource("aed")) {
    map.addSource("aed", { type: "geojson", data: "/data/rescue/aed.geojson" })
  }
  if (!map.getSource("hems")) {
    map.addSource("hems", { type: "geojson", data: "/data/rescue/hems.geojson" })
  }
  if (!map.getSource("fireHydrants")) {
    map.addSource("fireHydrants", { type: "geojson", data: "/data/rescue/fire_hydrants.geojson" })
  }
  if (!map.getSource("assemblyPoints")) {
    map.addSource("assemblyPoints", { type: "geojson", data: "/data/rescue/emergency_assembly_points.geojson" })
  }

  addEmergencyLayers(map, "aed", "aed-sites", "aed-labels", "#e03131", "#7f1d1d")
  addEmergencyLayers(map, "hems", "hems-sites", "hems-labels", "#f59f00", "#7a4d00")
  addEmergencyLayers(map, "fireHydrants", "fire-hydrant-sites", "fire-hydrant-labels", "#0b7285", "#0b4f61")
  addEmergencyLayers(map, "assemblyPoints", "assembly-point-sites", "assembly-point-labels", "#2f9e44", "#1b5e20")
}

// "Sentieri e punti acqua" from the old app's OutdoorModule: hiking/MTB
// trail network (casing + coloured line + label per category) plus
// drinking water, springs, and picnic areas.
export const TRAILS_WATER_LAYER_IDS = [
  "trail-casing-hiking",
  "trail-network-hiking",
  "trail-labels-hiking",
  "trail-casing-mtb",
  "trail-network-mtb",
  "trail-labels-mtb",
  "water-poi-drinking-water",
  "water-poi-labels-drinking-water",
  "water-poi-spring",
  "water-poi-labels-spring",
  "water-poi-picnic",
  "water-poi-labels-picnic",
]

function addTrailLayers(
  map: Map,
  sourceId: string,
  categoryId: string,
  filter: maplibregl.FilterSpecification,
  options: { casingColor: string; lineColor: string; labelColor: string; dasharray: number[] }
): void {
  if (!map.getLayer(`trail-casing-${categoryId}`)) {
    map.addLayer({
      id: `trail-casing-${categoryId}`,
      type: "line",
      source: sourceId,
      filter,
      layout: { visibility: "none" },
      paint: {
        "line-color": options.casingColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 3.4, 14, 7.8],
        "line-opacity": 0.9,
      },
    })
  }

  if (!map.getLayer(`trail-network-${categoryId}`)) {
    map.addLayer({
      id: `trail-network-${categoryId}`,
      type: "line",
      source: sourceId,
      filter,
      layout: { visibility: "none" },
      paint: {
        "line-color": options.lineColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.9, 14, 2.4],
        "line-opacity": 1,
        "line-dasharray": options.dasharray,
      },
    })
  }

  if (!map.getLayer(`trail-labels-${categoryId}`)) {
    map.addLayer({
      id: `trail-labels-${categoryId}`,
      type: "symbol",
      source: sourceId,
      filter,
      layout: {
        visibility: "none",
        "symbol-placement": "line",
        "text-field": ["coalesce", ["get", "name:it"], ["get", "name"], ""],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 15, 13],
        "text-font": ["Noto Sans Regular"],
      },
      paint: {
        "text-color": options.labelColor,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.8,
      },
    })
  }
}

function addWaterLayers(
  map: Map,
  sourceId: string,
  categoryId: string,
  filter: maplibregl.FilterSpecification,
  color: string
): void {
  if (!map.getLayer(`water-poi-${categoryId}`)) {
    map.addLayer({
      id: `water-poi-${categoryId}`,
      type: "circle",
      source: sourceId,
      filter,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 7],
        "circle-color": color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.95,
      },
    })
  }

  if (!map.getLayer(`water-poi-labels-${categoryId}`)) {
    map.addLayer({
      id: `water-poi-labels-${categoryId}`,
      type: "symbol",
      source: sourceId,
      filter,
      layout: {
        visibility: "none",
        "text-field": ["coalesce", ["get", "name:it"], ["get", "name"], ""],
        "text-offset": [0, 1.2],
        "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 15, 12],
        "text-font": ["Noto Sans Regular"],
      },
      paint: {
        "text-color": "#7a4d00",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    })
  }
}

export function addTrailsWaterOverlay(map: Map): void {
  if (!map.getSource("trails")) {
    map.addSource("trails", { type: "geojson", data: "/data/outdoor/trails_shaded.geojson" })
  }
  if (!map.getSource("water")) {
    map.addSource("water", { type: "geojson", data: "/data/outdoor/water.geojson" })
  }

  addTrailLayers(map, "trails", "hiking", ["in", ["get", "class"], ["literal", ["path", "track", "bridleway"]]], {
    casingColor: "#dfe9d8",
    lineColor: "#4f7b3a",
    labelColor: "#436432",
    dasharray: [1, 0],
  })
  addTrailLayers(map, "trails", "mtb", ["in", ["get", "class"], ["literal", ["track", "cycleway"]]], {
    casingColor: "#d9e7f4",
    lineColor: "#2f78c4",
    labelColor: "#245c99",
    dasharray: [1.8, 1],
  })

  addWaterLayers(map, "water", "drinking-water", ["==", ["get", "class"], "drinking_water"], "#2b8a3e")
  addWaterLayers(map, "water", "spring", ["==", ["get", "class"], "spring"], "#74c0fc")
  addWaterLayers(
    map,
    "water",
    "picnic",
    ["in", ["get", "class"], ["literal", ["picnic_site", "picnic_area"]]],
    "#f59f00"
  )
}
