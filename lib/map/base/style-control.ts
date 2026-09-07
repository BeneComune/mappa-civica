// lib\map\base\style-control.ts
// The "Legenda" basemap switcher: a collapsible panel of style buttons in
// the bottom-right corner.
import type { Map, IControl } from "maplibre-gl"
import { ChevronDown, ChevronUp, Palette } from "lucide"
import { icon } from "./dom"
import {
  BASEMAP_STYLE_LABELS,
  BASEMAP_STYLE_URLS,
  type BasemapStyleKey,
} from "./styles"

export class MapStyleControl implements IControl {
  private container?: HTMLDivElement
  private current: BasemapStyleKey
  private startCollapsed: boolean

  constructor(initial: BasemapStyleKey, startCollapsed = false) {
    this.current = initial
    this.startCollapsed = startCollapsed
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

    if (this.startCollapsed) container.classList.add("collapsed")

    let toggleIcon = icon(this.startCollapsed ? ChevronDown : ChevronUp, 15)
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
    header.setAttribute("aria-expanded", String(!this.startCollapsed))

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
