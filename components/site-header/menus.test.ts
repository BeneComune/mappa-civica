// components\site-header\menus.test.ts
// The nav tree is plain data now, which makes its invariants checkable.
// These catch the mistakes that are easy to make when adding a page: a
// duplicated or mistyped href, a menu entry pointing outside its own
// section, or a missing label/description.
import { describe, expect, it } from "vitest"
import { GREEN_MENU, OUTDOOR_GROUPS, RESCUE_MENU } from "./menus"

// The menus are declared `as const`, so their item types are narrow string
// literals. Widen to a structural shape here, otherwise flatMap infers the
// first entry's exact literal type as the target for every other entry.
type NavItemLike = {
  title: string
  href: string
  icon: unknown
  description: string
  external?: boolean
}
type SimpleMenuLike = {
  label: string
  icon: unknown
  basePath: string
  items: readonly NavItemLike[]
}

const SIMPLE_MENUS: SimpleMenuLike[] = [RESCUE_MENU, GREEN_MENU]
const OUTDOOR: Array<{ title: string; icon: unknown; items: readonly NavItemLike[] }> = [
  ...OUTDOOR_GROUPS,
]
const ALL_ITEMS: NavItemLike[] = [
  ...OUTDOOR.flatMap((g) => [...g.items]),
  ...SIMPLE_MENUS.flatMap((m) => [...m.items]),
]

describe("navigation data", () => {
  it("has no duplicate hrefs across the whole tree", () => {
    const hrefs = ALL_ITEMS.map((i) => i.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it("gives every item a title, description and icon", () => {
    for (const item of ALL_ITEMS) {
      expect(item.title, `title for ${item.href}`).toBeTruthy()
      expect(item.description, `description for ${item.href}`).toBeTruthy()
      expect(item.icon, `icon for ${item.href}`).toBeTruthy()
    }
  })

  it("uses absolute in-app paths", () => {
    for (const item of ALL_ITEMS) {
      expect(item.href.startsWith("/"), `${item.href} should be app-absolute`).toBe(true)
    }
  })

  it("keeps every simple menu's items under its own basePath", () => {
    for (const menu of SIMPLE_MENUS) {
      for (const item of menu.items) {
        expect(item.href.startsWith(menu.basePath), `${item.href} vs ${menu.basePath}`).toBe(true)
      }
    }
  })

  it("keeps every outdoor item under /outdoor", () => {
    for (const group of OUTDOOR) {
      for (const item of group.items) {
        expect(item.href.startsWith("/outdoor")).toBe(true)
      }
    }
  })

  it("titles each outdoor group and gives the simple menus a label", () => {
    for (const group of OUTDOOR) {
      expect(group.title).toBeTruthy()
      expect(group.icon).toBeTruthy()
      expect(group.items.length).toBeGreaterThan(0)
    }
    for (const menu of SIMPLE_MENUS) {
      expect(menu.label).toBeTruthy()
      expect(menu.items.length).toBeGreaterThan(0)
    }
  })

  it("marks only the off-site link as external", () => {
    const external = ALL_ITEMS.filter((i) => "external" in i && i.external)
    expect(external).toHaveLength(1)
    expect(external[0].href).toBe("/outdoor/cyclability/lts")
  })
})
