// lib\map\base\search-control.ts
import type { Map, IControl } from "maplibre-gl"
import { Search } from "lucide"
import { icon } from "./dom"

// Same Nominatim geocoder as the old app: jsonv2, restricted to Italy,
// fitBounds on the result's own bounding box, closes on outside click, drops
// stale out-of-order responses.
const MAX_SEARCH_RESULT_ZOOM = 17

export class MapSearchControl implements IControl {
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
