// lib\map\base\dom.ts
// DOM helpers shared by the custom IControl classes. They build plain DOM
// (MapLibre's IControl API, not React), so they use the framework-agnostic
// `lucide` package instead of lucide-react - createElement(iconNode)
// returns a real SVGElement.
import { createElement as createLucideElement } from "lucide"

export function icon(node: Parameters<typeof createLucideElement>[0], size = 16): SVGElement {
  return createLucideElement(node, { width: size, height: size, "stroke-width": 1.75 })
}

// Shared onAdd() scaffolding for the single-button IControl classes below:
// a "maplibregl-ctrl-group" container wrapping one titled, icon-only button.
export function createControlButton(
  iconNode: Parameters<typeof icon>[0],
  title: string
): { container: HTMLDivElement; button: HTMLButtonElement } {
  const container = document.createElement("div")
  container.className = "maplibregl-ctrl maplibregl-ctrl-group"

  const button = document.createElement("button")
  button.type = "button"
  button.title = title
  button.setAttribute("aria-label", title)
  button.appendChild(icon(iconNode))

  container.appendChild(button)
  return { container, button }
}
