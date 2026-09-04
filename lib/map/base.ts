import * as maplibregl from "maplibre-gl"
import type { Map, IControl } from "maplibre-gl"
import { createElement as createLucideElement, ChevronDown, ChevronUp, Mountain, Palette, Printer, Search } from "lucide"
import { MUNICIPALITY_CENTER, MUNICIPALITY_ZOOM } from "@/lib/config"

// Ported from the old app's lib/map.ts. Base map: basemap style, controls
// (style switcher, search, terrain, print), worker setup.

// The custom controls below build plain DOM (MapLibre's IControl API, not
// React), so they use the framework-agnostic `lucide` package instead of
// lucide-react - createElement(iconNode) returns a real SVGElement.
function icon(node: Parameters<typeof createLucideElement>[0], size = 16): SVGElement {
  return createLucideElement(node, { width: size, height: size, "stroke-width": 1.75 })
}

// maplibre-gl-worker.mjs imports a sibling chunk (maplibre-gl-shared.mjs) via
// a relative import that Vite historically didn't resolve correctly (see the
// old app's lib/map.ts). Both files are copied verbatim into
// public/maplibre-gl/ as a precaution. Re-copy them from
// node_modules/maplibre-gl/dist/ if maplibre-gl is upgraded.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl/maplibre-gl-worker.mjs")
}

const DEFAULT_CENTER = MUNICIPALITY_CENTER
const DEFAULT_ZOOM = MUNICIPALITY_ZOOM

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

const DEFAULT_BASEMAP_STYLE: BasemapStyleKey = "dark"

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
    title.className = "map-style-switcher-title"
    title.appendChild(icon(Palette, 15))
    title.appendChild(document.createTextNode("Legenda"))

    let toggleIcon = icon(ChevronUp, 15)
    toggleIcon.setAttribute("aria-hidden", "true")

    header.appendChild(title)
    header.appendChild(toggleIcon)

    const body = document.createElement("div")
    body.className = "map-style-switcher-body"

    header.addEventListener("click", () => {
      const collapsed = container.classList.toggle("collapsed")
      const nextIcon = icon(collapsed ? ChevronDown : ChevronUp, 15)
      nextIcon.setAttribute("aria-hidden", "true")
      toggleIcon.replaceWith(nextIcon)
      toggleIcon = nextIcon
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
    button.appendChild(icon(Search))
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
  private initial: boolean
  private onTerrainChange: (on: boolean) => void

  constructor(initial: boolean, onTerrainChange: (on: boolean) => void) {
    this.initial = initial
    this.onTerrainChange = onTerrainChange
  }

  onAdd(map: Map): HTMLElement {
    const container = document.createElement("div")
    container.className = "maplibregl-ctrl maplibregl-ctrl-group"

    const button = document.createElement("button")
    button.type = "button"
    button.title = "Terreno 3D"
    button.setAttribute("aria-label", "Terreno 3D")
    button.appendChild(icon(Mountain))
    button.classList.toggle("active", this.initial)
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

  // Preview in a new tab (the browser's own PDF viewer) instead of forcing
  // an immediate download - the user can save/print from there if they want
  // to keep it.
  const blobUrl = doc.output("bloburl")
  window.open(blobUrl, "_blank")
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
    button.appendChild(icon(Printer))
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
    pitch: 60,
    style: BASEMAP_STYLE_URLS[DEFAULT_BASEMAP_STYLE],
    attributionControl: false,
    // Needed for the print/export control to read back a valid PNG from the
    // WebGL canvas via toDataURL().
    canvasContextAttributes: { preserveDrawingBuffer: true },
  })

  let terrainOn = true

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
    new MapTerrainControl(terrainOn, (on) => {
      terrainOn = on
    }),
    "top-right"
  )
  map.addControl(new MapPrintControl(printLabel, productName), "top-right")
  map.addControl(new MapStyleControl(DEFAULT_BASEMAP_STYLE), "top-left")
  map.addControl(new maplibregl.AttributionControl(), "bottom-right")

  return map
}
