// lib\map\overlays\shared.test.ts
// The idempotent adds every overlay relies on: re-running an overlay's add()
// after a style reload must not re-add what's already on the map.
import { describe, expect, it, vi } from "vitest"
import type { Map } from "maplibre-gl"
import { addLayerOnce, addSourceOnce } from "./shared"

function stubMap(existing: { sources?: string[]; layers?: string[] } = {}) {
  const sources = new Set(existing.sources)
  const layers = new Set(existing.layers)
  const map = {
    getSource: (id: string) => (sources.has(id) ? {} : undefined),
    getLayer: (id: string) => (layers.has(id) ? {} : undefined),
    addSource: vi.fn((id: string) => sources.add(id)),
    addLayer: vi.fn((layer: { id: string }) => layers.add(layer.id)),
  }
  return { map, asMap: map as unknown as Map }
}

describe("addSourceOnce", () => {
  it("adds a missing source, then leaves it alone", () => {
    const { map, asMap } = stubMap()
    addSourceOnce(asMap, "aed", { type: "geojson", data: "/data/rescue/aed.geojson" })
    addSourceOnce(asMap, "aed", { type: "geojson", data: "/data/rescue/aed.geojson" })
    expect(map.addSource).toHaveBeenCalledTimes(1)
  })
})

describe("addLayerOnce", () => {
  it("checks the id carried by the layer itself", () => {
    const { map, asMap } = stubMap({ layers: ["aed-sites"] })
    addLayerOnce(asMap, { id: "aed-sites", type: "circle", source: "aed" })
    addLayerOnce(asMap, { id: "aed-labels", type: "symbol", source: "aed" })
    expect(map.addLayer).toHaveBeenCalledTimes(1)
    expect(map.addLayer.mock.calls[0][0].id).toBe("aed-labels")
  })
})
