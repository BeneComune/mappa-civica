// components\map-provider\interactions.test.ts
// Cover for the interaction recipes lifted out of MapProvider. These are the
// part of that split with real behaviour - listener wiring, cursor state and
// feature-state bookkeeping - so they are exercised against a stub Map.
import { beforeEach, describe, expect, it, vi } from "vitest"

const popups: Array<{ html?: string; added: boolean; removed: boolean }> = []

vi.mock("maplibre-gl", () => ({
  Popup: class {
    entry = { added: false, removed: false } as { html?: string; added: boolean; removed: boolean }
    constructor() {
      popups.push(this.entry)
    }
    setLngLat() {
      return this
    }
    setHTML(html: string) {
      this.entry.html = html
      return this
    }
    addTo() {
      this.entry.added = true
      return this
    }
    remove() {
      this.entry.removed = true
      return this
    }
  },
}))

// onStyleReady runs its callback immediately when the style is loaded; the
// real one also re-runs on every style.load. Here it just attaches once.
vi.mock("@/lib/map", () => ({
  onStyleReady: (_map: unknown, fn: () => void) => {
    fn()
    return () => {}
  },
}))

const { attachClickPopup, attachHoverHighlight, attachHoverPopup } = await import("./interactions")

type Listener = { event: string; layer?: string; fn: (...a: unknown[]) => void }

function stubMap() {
  const listeners: Listener[] = []
  const canvas = { style: { cursor: "" } }
  const featureStates: Array<{ target: unknown; state: unknown }> = []
  return {
    listeners,
    canvas,
    featureStates,
    rendered: [] as Array<{ id?: string | number }>,
    layers: new Set<string>(),
    on(event: string, a: unknown, b?: unknown) {
      listeners.push(
        typeof a === "string"
          ? { event, layer: a, fn: b as () => void }
          : { event, fn: a as () => void }
      )
    },
    off(event: string, a: unknown, b?: unknown) {
      const fn = typeof a === "string" ? b : a
      const i = listeners.findIndex((l) => l.event === event && l.fn === fn)
      if (i >= 0) listeners.splice(i, 1)
    },
    getCanvas: () => canvas,
    getLayer(id: string) {
      return this.layers.has(id) ? { id } : undefined
    },
    queryRenderedFeatures() {
      return this.rendered
    },
    setFeatureState(target: unknown, state: unknown) {
      featureStates.push({ target, state })
    },
  }
}

function fire(map: ReturnType<typeof stubMap>, event: string, payload: unknown = {}) {
  for (const l of [...map.listeners]) if (l.event === event) l.fn(payload)
}

beforeEach(() => {
  popups.length = 0
})

describe("attachHoverPopup", () => {
  it("opens a popup with the rendered html and points the cursor", () => {
    const map = stubMap()
    attachHoverPopup(map as never, "layer-a", (p) => `<b>${p.name}</b>`)

    fire(map, "mousemove", { features: [{ properties: { name: "Rio" } }], lngLat: {} })

    expect(popups).toHaveLength(1)
    expect(popups[0].html).toBe("<b>Rio</b>")
    expect(popups[0].added).toBe(true)
    expect(map.canvas.style.cursor).toBe("pointer")
  })

  it("reuses one popup across consecutive hovers", () => {
    const map = stubMap()
    attachHoverPopup(map as never, "layer-a", () => "x")
    fire(map, "mousemove", { features: [{ properties: {} }], lngLat: {} })
    fire(map, "mousemove", { features: [{ properties: {} }], lngLat: {} })
    expect(popups).toHaveLength(1)
  })

  it("skips the hover when the renderer declines it", () => {
    const map = stubMap()
    attachHoverPopup(map as never, "layer-a", () => null)
    fire(map, "mousemove", { features: [{ properties: {} }], lngLat: {} })
    expect(popups).toHaveLength(0)
    expect(map.canvas.style.cursor).toBe("")
  })

  it("clears the cursor and popup on mouseleave", () => {
    const map = stubMap()
    attachHoverPopup(map as never, "layer-a", () => "x")
    fire(map, "mousemove", { features: [{ properties: {} }], lngLat: {} })
    fire(map, "mouseleave")
    expect(map.canvas.style.cursor).toBe("")
    expect(popups[0].removed).toBe(true)
  })

  it("detaches every listener and closes the popup", () => {
    const map = stubMap()
    const detach = attachHoverPopup(map as never, "layer-a", () => "x")
    fire(map, "mousemove", { features: [{ properties: {} }], lngLat: {} })
    expect(map.listeners.length).toBe(2)
    detach()
    expect(map.listeners).toHaveLength(0)
    expect(popups[0].removed).toBe(true)
  })

  it("tolerates a feature with no properties", () => {
    const map = stubMap()
    const seen: Record<string, unknown>[] = []
    attachHoverPopup(map as never, "layer-a", (p) => {
      seen.push(p)
      return "x"
    })
    fire(map, "mousemove", { features: [], lngLat: {} })
    expect(seen[0]).toEqual({})
  })
})

describe("attachClickPopup", () => {
  it("opens a fresh popup per click", () => {
    const map = stubMap()
    attachClickPopup(map as never, "layer-b", (p) => `${p.title}`)
    fire(map, "click", { features: [{ properties: { title: "one" } }], lngLat: {} })
    fire(map, "click", { features: [{ properties: { title: "two" } }], lngLat: {} })
    expect(popups.map((p) => p.html)).toEqual(["one", "two"])
  })

  it("does not open one when the renderer declines", () => {
    const map = stubMap()
    attachClickPopup(map as never, "layer-b", () => undefined)
    fire(map, "click", { features: [{ properties: {} }], lngLat: {} })
    expect(popups).toHaveLength(0)
  })

  it("toggles the cursor on enter and leave, and detaches all three listeners", () => {
    const map = stubMap()
    const detach = attachClickPopup(map as never, "layer-b", () => "x")
    expect(map.listeners).toHaveLength(3)
    fire(map, "mouseenter")
    expect(map.canvas.style.cursor).toBe("pointer")
    fire(map, "mouseleave")
    expect(map.canvas.style.cursor).toBe("")
    detach()
    expect(map.listeners).toHaveLength(0)
  })
})

describe("attachHoverHighlight", () => {
  it("sets hover state on the feature under the cursor", () => {
    const map = stubMap()
    map.layers.add("l1")
    map.rendered = [{ id: 7 }]
    attachHoverHighlight(map as never, "src", ["l1"])

    fire(map, "mousemove", { point: {} })

    expect(map.featureStates).toEqual([{ target: { source: "src", id: 7 }, state: { hover: true } }])
    expect(map.canvas.style.cursor).toBe("pointer")
  })

  it("clears the previous feature when moving to a new one", () => {
    const map = stubMap()
    map.layers.add("l1")
    attachHoverHighlight(map as never, "src", ["l1"])

    map.rendered = [{ id: 1 }]
    fire(map, "mousemove", { point: {} })
    map.rendered = [{ id: 2 }]
    fire(map, "mousemove", { point: {} })

    expect(map.featureStates).toContainEqual({ target: { source: "src", id: 1 }, state: { hover: false } })
    expect(map.featureStates.at(-1)).toEqual({ target: { source: "src", id: 2 }, state: { hover: true } })
  })

  it("clears hover when nothing is under the cursor", () => {
    const map = stubMap()
    map.layers.add("l1")
    attachHoverHighlight(map as never, "src", ["l1"])
    map.rendered = [{ id: 1 }]
    fire(map, "mousemove", { point: {} })
    map.rendered = []
    fire(map, "mousemove", { point: {} })
    expect(map.featureStates.at(-1)).toEqual({ target: { source: "src", id: 1 }, state: { hover: false } })
    expect(map.canvas.style.cursor).toBe("")
  })

  it("ignores layers that are not on the map yet", () => {
    const map = stubMap()
    map.rendered = [{ id: 1 }]
    attachHoverHighlight(map as never, "src", ["absent"])
    fire(map, "mousemove", { point: {} })
    expect(map.featureStates).toHaveLength(0)
  })

  it("ignores features with no stable id", () => {
    const map = stubMap()
    map.layers.add("l1")
    map.rendered = [{}]
    attachHoverHighlight(map as never, "src", ["l1"])
    fire(map, "mousemove", { point: {} })
    expect(map.featureStates).toHaveLength(0)
  })

  it("releases hover state and listeners on detach", () => {
    const map = stubMap()
    map.layers.add("l1")
    map.rendered = [{ id: 3 }]
    const detach = attachHoverHighlight(map as never, "src", ["l1"])
    fire(map, "mousemove", { point: {} })
    detach()
    expect(map.featureStates.at(-1)).toEqual({ target: { source: "src", id: 3 }, state: { hover: false } })
    expect(map.listeners).toHaveLength(0)
  })
})
