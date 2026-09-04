// lib\map\base\print-control.ts
import type { Map, IControl } from "maplibre-gl"
import { Printer } from "lucide"
import { createControlButton } from "./dom"
import { exportMapToPdf } from "./pdf-export"

export class MapPrintControl implements IControl {
  private container?: HTMLDivElement
  private moduleLabel: string
  private productName: string

  constructor(moduleLabel: string, productName: string) {
    this.moduleLabel = moduleLabel
    this.productName = productName
  }

  onAdd(map: Map): HTMLElement {
    const { container, button } = createControlButton(Printer, "Stampa mappa")
    button.addEventListener("click", () => {
      button.disabled = true
      exportMapToPdf(map, this.moduleLabel, this.productName)
        .catch((err) => console.error("PDF export failed", err))
        .finally(() => {
          button.disabled = false
        })
    })

    this.container = container
    return container
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container)
  }
}
