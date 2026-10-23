# Mobile layout

One breakpoint: Tailwind's default `md` (48rem / 768px). Desktop at `md` and above was kept
pixel-identical to the pre-mobile build. The reasoning is in the 2026-09-07 ADR in `PROGRESS.md`;
this doc is the current state.

## Where mobile differs

| Concern | Below `md` | `md` and up | Where |
|---|---|---|---|
| Font scale | `html` 100% | `html` 118% | `app/globals.css` (CSS only) |
| Navigation | Hamburger + right drawer | `NavigationMenu` bar | `components/site-header/mobile-nav.tsx` |
| Route panel | Bottom sheet, collapsed to a peek bar on every route entry | Floating card, bottom-left | `components/panel-frame.tsx`, `components/mobile-panel-sheet.tsx` |
| Home | Stacked sections inside the sheet (`md:contents`) | Absolutely positioned cards | `components/home-panel.tsx` |
| Map camera | Flat (pitch 0), terrain off | Pitch 60, terrain on | `lib/map/base/index.ts` |
| Map controls | No Fullscreen, no Print; attribution and Legenda collapsed | All controls | `lib/map/base/index.ts` |
| Weather card | Collapsed to temperature + condition | Full | `components/weather-card/index.tsx` |
| Segnala / route planner | Two-step: fold the sheet, show a hint over the map, tap to pick | Drawer/panel stays open, map clickable behind | `components/report-drawer/index.tsx`, `components/route-planner/index.tsx` |

## Runtime check

Prefer `md:` classes. `useIsMobile()` (`lib/use-is-mobile.ts`) is for the few places that render a
different tree: sheet vs card, the two-step flows. It uses `useSyncExternalStore` over
`matchMedia("(max-width: 47.999rem)")` and returns `false` on the server and the first client
render, so the swap happens after hydration without a mismatch. `createBaseMap` reads the same
media query once, at map creation.

## The sheet API

`usePanelSheet()` returns `{ collapse, expand }` inside the mobile sheet and `null` on desktop, so
callers use optional chaining (`sheet?.collapse()`):

- `collapse`: the two-step flows (map must be visible to pick a point), frazioni (to show the
  fly-to).
- `expand`: `MapFeatureDetail`, so a map tap that selects a feature shows its detail card.

The sheet's content stays mounted (just hidden) when collapsed, so picking mode and form state
survive a collapse. Overlays that must stay visible while the sheet is collapsed (the "tap the
map" hints) are portaled to `<body>`.
