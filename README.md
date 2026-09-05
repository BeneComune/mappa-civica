# Mappa Civica

Piattaforma civica open-source per la mobilità sostenibile, l'ambiente, la resilienza del
territorio e la partecipazione della comunità, sviluppata per il Comune di Montereale Valcellina
(PN). Porting in corso dal prototipo Vite + React `montereale-valcellina-frontend` a Next.js 16.

## Moduli

- **Outdoor** — stress da traffico in bici, infrastrutture ciclabili, sentieri e punti acqua,
  pendenza, cime principali, pianificazione percorsi (bici/a piedi) con profilo altimetrico.
- **Soccorso ed Emergenza** — rii a rischio esondazione, incendi boschivi (perimetri, classe di
  pericolo, indice NBR), defibrillatori/elisoccorso/idranti/punti di raccolta, ospedale più vicino.
- **Verde** — vegetazione (NDVI), salute della vegetazione (NBR), temperatura del suolo (LST),
  ombra naturale su strade e sentieri.
- **Segnala** — partecipazione della comunità.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19
- [MapLibre GL](https://maplibre.org/) per la mappa, dati serviti come GeoJSON/PMTiles
- [DuckDB-Wasm](https://duckdb.org/docs/api/wasm/overview) per query in-browser sui dataset
- [shadcn/ui](https://ui.shadcn.com) (Base UI) + Tailwind CSS

## Getting Started

```bash
pnpm install
pnpm dev
```

Apri [http://localhost:3000](http://localhost:3000).

Altri comandi utili:

```bash
pnpm build          # build di produzione
pnpm test           # test (vitest)
pnpm lint           # eslint
```

## Documentazione

Storia del progetto e decisioni architetturali in [`docs/PROGRESS.md`](docs/PROGRESS.md).
