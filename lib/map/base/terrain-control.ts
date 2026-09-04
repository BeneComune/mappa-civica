// lib\map\base\terrain-control.ts
import type { Map, IControl } from "maplibre-gl"
import { Mountain } from "lucide"
import { createControlButton } from "./dom"
import { TERRAIN_SOURCE_ID } from "./styles"

// Custom (not MapLibre's built-in TerrainControl) to match the old app's own
// terrain button exactly. setStyle() (the basemap switcher) replaces the
// whole style document, which silently drops map.setTerrain(...) - the
// camera stays tilted but the relief disappears until re-toggled.
export class MapTerrainControl implements IControl {
  private container?: HTMLDivElement
  private initial: boolean
  private onTerrainChange: (on: boolean) => void

  constructor(initial: boolean, onTerrainChange: (on: boolean) => void) {
    this.initial = initial
    this.onTerrainChange = onTerrainChange
  }

  onAdd(map: Map): HTMLElement {
    const { container, button } = createControlButton(Mountain, "Terreno 3D")
    button.classList.toggle("active", this.initial)
    button.addEventListener("click", () => {
      const isOn = !!map.getTerrain()
      const nextOn = !isOn
      map.setTerrain(nextOn ? { source: TERRAIN_SOURCE_ID, exaggeration: 1.3 } : null)
      button.classList.toggle("active", nextOn)
      map.easeTo({ pitch: nextOn ? 60 : 0, duration: 800 })
      this.onTerrainChange(nextOn)
    })

    this.container = container
    return container
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container)
  }
}
