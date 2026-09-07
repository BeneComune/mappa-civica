# Piano: pipeline dati rigenerabile per mappa-civica (Next.js)

## Istruzioni per Claude Code

Questo piano è diviso in **goal numerati e sequenziali**. Lavora un goal alla
volta, nell'ordine dato: non passare al goal successivo finché il "Criterio di
completamento" del goal corrente non è verificato. Se un goal si blocca su una
decisione che spetta a Leo (segnalato esplicitamente nel goal), fermati e
chiedi invece di procedere con un'assunzione.

**Alla fine di ogni goal, fermati.** Non passare al goal successivo di tua
iniziativa nemmeno se il criterio di completamento ti sembra soddisfatto:
mostra a Leo cosa hai fatto, il risultato del criterio di completamento
(output dei comandi, diff, screenshot se pertinente) e aspetta conferma
esplicita prima di iniziare il goal successivo. Se il criterio fallisce o dà
un risultato ambiguo, dillo chiaramente invece di forzare un modo per farlo
sembrare superato.

**Input disponibili:** questa repo (già aperta) + uno zip della vecchia repo
(root dello zip: `mappa-civica-main/`, sottocartelle `frontend/`, `pipeline/`,
`functions/`, `docs/`). Lavora leggendo dallo zip, non serve clonare nulla da
remoto.

**Nota:** `functions/` e `init_duckdb.py` della vecchia repo — lo scaffolding
abbozzato per il backend del modulo Segnala — sono trattati nel **Goal 6**,
non sono più fuori scope. Sono citati qui perché capirli richiede leggere
tre file diversi che da soli non dicono niente di utile (vedi Goal 6 per la
spiegazione completa).

### Regola trasversale, valida per OGNI goal: non sovrascrivere alla cieca

Ho verificato file per file: quasi tutti gli output che questo piano chiede
di "generare" **esistono già**, committati in `public/data/` (sono stati
copiati dal vecchio disco dati senza passare da nessuno script). Questo vale
per `boundary.geojson`, `frazioni.geojson`, `municipality_stats.json`,
`catasto.geojson`, `transport.geojson`, tutti i `rescue/*.geojson` (inclusi
`peaks.geojson`, `peaks_poles.geojson`, `hospital.geojson` — sì, anche i due
del Goal 3 esistono già) e tutti i `green`/`outdoor/*`.

Quindi in ogni goal il compito **non è "creare il file"**, è "dimostrare che
lo script riproduce quello che c'è già, o capire perché non lo fa". Prima di
scrivere in `public/data/` in un qualsiasi goal:

1. Esegui lo script scrivendo su un path temporaneo (es. `pipeline/data/_tmp/`),
   mai direttamente sull'output finale.
2. Confronta col file già committato: conteggio feature, schema delle
   proprietà, e per i file piccoli anche un diff diretto. Per i file grandi
   (`catasto.geojson`, `transport.geojson`) basta contare le feature e
   controllare un campione di proprietà, non serve un diff riga per riga.
3. Se la differenza è quella attesa (dati più recenti da una fonte che
   cambia — es. nuovi incendi WFS, nuovi nodi OSM), sostituisci pure.
4. Se la differenza è strutturale (proprietà mancanti, geometrie vuote,
   conteggio molto più basso) **non sovrascrivere**: è quasi certamente un
   bug nel porting dello script, non un aggiornamento legittimo del dato.
   Fermati e segnalalo prima di committare.

### Regola trasversale, valida per OGNI goal: rispetta lo stile di QUESTA repo

Il codice che porti viene dalla vecchia repo (Vite), che ha convenzioni
diverse. Prima di scrivere o modificare qualunque `.ts`/`.tsx`, leggi
`CLAUDE.md` e `AGENTS.md` in questa repo (non nella vecchia) e segui le loro
regole, non lo stile del file che stai portando:

- ogni file `.ts`/`.tsx` sotto `app/`, `components/`, `lib/`, `scripts/`
  inizia con un commento che ne riporta il path (es. `// lib\map\overlays\fire.ts`,
  backslash, non slash) — verificato da `pnpm check:paths`, sistemabile con
  `pnpm check:paths:fix`;
- niente punto e virgola, `eqeqeq` (eccetto `== null`/`!= null`), righe da
  100 caratteri;
- `pnpm lint` e `npx tsc --noEmit` sono gate a **zero warning**: qualsiasi
  cosa segnalano va risolta, anche se preesistente e solo toccata di striscio,
  non solo quello che introduci tu.

Questo vale per `lib/config.ts` (Goal 1), per il refactor di
`use-nearest-parcel.ts`/`lib/map/base/index.ts` (Goal 5), e per qualunque
altro file TS/TSX toccato in un goal — aggiungi `pnpm lint` e
`npx tsc --noEmit` al criterio di completamento di quei goal, non solo
`pnpm build`. Gli script Python in `pipeline/` sono un ecosistema separato,
non coperto da queste regole (non sono scansionati da `check:paths`): restano
comunque leggibili e con docstring, sullo stile già usato dalla vecchia repo.



Nella vecchia repo la separazione era:
- `frontend/src/data/` — input curati a mano, versionati (confine comunale,
  frazioni, esclusioni) + input grezzi grandi, NON versionati (Sentinel `.SAFE`, DEM).
- `pipeline/` — script Python che leggono gli input e scrivono l'output.
- `frontend/public/data/` — output generato, servito dal browser.

Nella nuova repo non c'è più `frontend/`, quindi:
- `data/` (nuova cartella in root) — input curati versionati: `comune.config.json`,
  `municipalBoundary.json`, `localities.json`, `exclusions.json` (opzionale),
  eventuali GeoJSON curati a mano (`aed_comune.geojson`, `hems_comune.geojson`).
  Gli input grezzi non versionabili (`.SAFE`, `dem.tif`) vanno dentro `data/raw/`,
  in `.gitignore`.
- `pipeline/` — stessa cosa della vecchia repo, script Python.
- `public/data/` — invariato, è già lì.

Mantieni questa separazione precisa in ogni goal: è quello che rende il
progetto riusabile da un altro comune senza toccare codice applicativo.

---

## Goal 1 — Config unico

**Obiettivo:** un solo file JSON come fonte di verità per i dati del comune,
letto sia dal frontend sia dalla pipeline Python.

Oggi `lib/config.ts` ha i valori del comune hardcoded (`MUNICIPALITY_CENTER`,
`MUNICIPALITY_ZOOM`, `MUNICIPALITY_NAME`, `MUNICIPALITY_CADASTRAL_CODE`,
`LTS_EMBED_VIEW`). Vanno spostati in un JSON unico — esattamente come faceva
`frontend/src/config.ts` + `frontend/src/comune.config.json` nella vecchia repo.

- [ ] Crea `data/comune.config.json` in root, con questo schema (valori presi
  dalla vecchia repo, file `frontend/src/comune.config.json` nello zip):
  ```jsonc
  {
    "name": "Montereale Valcellina",
    "province": "Pordenone",
    "region": "Friuli-Venezia Giulia",
    "istatCode": "093027",
    "provinceIstatCode": "ITD41",
    "cadastralCode": "F596",
    "osmAreaId": 3600179223,
    "email": "info@comune.montereale-valcellina.pn.it",
    "boundaryFile": "data/municipalBoundary.json",
    "map": { "center": [12.664, 46.160], "zoom": 12 },
    "ltsEmbedView": { "lat": 46.15620, "lon": 12.65731, "zoom": 12.86 }
  }
  ```
- [ ] **Non duplicare il confine comunale.** `public/data/boundary.geojson`,
  già presente in questa repo, è byte-identico a
  `frontend/src/data/municipalBoundary.json` della vecchia repo (l'ho
  verificato: stessa dimensione, stesso contenuto). In questa repo il file
  curato e il file servito al browser sono lo stesso file — non crearne una
  seconda copia in `data/`. Punta `boundaryFile` in `comune.config.json`
  direttamente a `"public/data/boundary.geojson"`, e fai leggere da lì anche
  a `pipeline/lib/exclusions.py`/agli script che oggi in `SETUP.md` si
  aspettano `data/municipalBoundary.json`.
- [ ] **Non importare `localities.json`.** Nella vecchia repo era l'input
  curato da cui `build_frazioni_geojson.py` generava l'output. In questa
  repo `public/data/frazioni.geojson` esiste già ed è più ricco dell'input
  vecchio (poligoni per frazione con classificazione `capoluogo`/`frazione`/
  `borgata`, centroide e nome friulano — vedi `components/frazioni-list.tsx`):
  non serve reintrodurre l'input grezzo per uno script che produrrebbe un
  risultato più povero di quello già in uso. Lo script `build_frazioni_geojson.py`
  resta fuori dal porting finché non serve davvero rigenerare le frazioni.
- [ ] Riscrivi `lib/config.ts` perché importi `data/comune.config.json`
  (Next supporta l'import diretto di JSON) e riesponga le stesse costanti
  già usate altrove — zero modifiche al resto dell'app che le importa.
  Mantieni il commento esistente sul perché questo file non importa
  `lib/map/base` (runtime maplibre-gl).
- [ ] Aggiungi `pipeline/lib/comune_config.py`, porting quasi letterale di
  `pipeline/lib/comune_config.py` della vecchia repo — unica modifica:
  `CONFIG_PATH = REPO_ROOT / 'data' / 'comune.config.json'` invece di
  `REPO_ROOT / 'frontend' / 'src' / 'comune.config.json'`. `REPO_ROOT` resta
  `Path(__file__).resolve().parents[2]` (stessa profondità: `pipeline/lib/`).

**Criterio di completamento:** `pnpm build` passa, `pnpm lint` e
`npx tsc --noEmit` sono puliti, `pnpm check:paths` non segnala nulla su
`lib/config.ts`, l'app mostra ancora la mappa centrata su Montereale
Valcellina, e `python -c "from pipeline.lib.comune_config import COMUNE; print(COMUNE['name'])"` stampa `Montereale Valcellina`.

---

## Goal 2 — Script pipeline "CI-safe" (porting diretto)

**Obiettivo:** gli script che non richiedono dati grezzi locali (satellite/DEM)
sono portati e producono lo stesso output oggi committato in `public/data/`.

- [ ] Crea `pipeline/` in root con: `lib/`, `scripts/`, `Makefile`,
  `requirements.txt`, `requirements-ci.txt`, `README.md`.
- [ ] Copia `requirements.txt` e `requirements-ci.txt` dalla vecchia repo
  invariati (verifica solo che le versioni pinnate installino ancora oggi).
- [ ] Copia `pipeline/lib/dem_slope.py` e `pipeline/lib/exclusions.py`
  invariati, tranne il path: in `exclusions.py`,
  `EXCLUSIONS_PATH = REPO_ROOT / 'frontend' / 'src' / 'data' / 'exclusions.json'`
  diventa `REPO_ROOT / 'data' / 'exclusions.json'`.

Per ogni script sotto, la trasformazione meccanica è: ogni occorrenza di
`"frontend" / "public" / "data"` (o equivalente con apici singoli) diventa
`"public" / "data"`, e ogni `"frontend" / "src" / "data"` diventa `"data"`.
Nessun'altra logica cambia. Porta questi script uno per uno, applicando la
regola trasversale in cima al documento: **ogni file in tabella esiste già in
`public/data/`**, quindi genera prima su un path temporaneo e confronta prima
di sovrascrivere.

| Script (vecchia repo, in `pipeline/scripts/`) | Output (path nuovo) | Note |
|---|---|---|
| `fetch_istat_stats.py` | `public/data/municipality_stats.json` | aggiorna solo i campi ISTAT, non tocca i campi manuali — vedi Goal 7 |
| `build_rescue_geojson.py` | `public/data/rescue/aed.geojson`, `hems.geojson`, `fire_hydrants.geojson`, `emergency_assembly_points.geojson` | Overpass + fallback su file committato — vedi nota curati nel Goal 7 |
| `build_fire_geojson.py` | `public/data/rescue/fire_perimeters.geojson`, `fire_danger.geojson`, `fire_ignition_points.geojson` | WFS IRDAT FVG, porting diretto |
| `build_rii_geojson.py` | `public/data/rescue/rii.geojson` + foto in `public/data/rescue/rii/` | richiede input grezzi non versionati, vedi Goal 7 |
| `build_catasto_geojson.py` | `public/data/catasto.geojson` | DuckDB via HTTP range su Parquet onData — **NB**: nel Goal 5 questo script cambierà output |
| `build_outdoor_geojson.py` | `public/data/outdoor/water.geojson`, `public/data/outdoor/trails_routing.geojson` | **cambio rispetto alla vecchia repo**: l'output `trails.geojson` NON va più in `public/data/outdoor/` (nella repo attuale nessuna pagina lo serve direttamente — solo `trails_shaded.geojson` è renderizzato, vedi `lib/map/overlays/trails-water.ts`). Scrivilo invece in `pipeline/data/outdoor/trails.geojson` (gitignored), come intermedio per `process_shade_corridors.py` |
| `build_bike_infra_geojson.py` | `public/data/outdoor/bike_infra.geojson` | porting diretto |
| `build_bike_cyclepaths_geojson.py` | `public/data/outdoor/bike_cyclepaths.geojson` | legge `public/data/transport.geojson` già committato, porting diretto |

- [ ] Copia il `Makefile` della vecchia repo adattando i nomi target invariati;
  lascia già gli slot per i target `peaks` e `hospital` (Goal 3) e per `tiles`
  (Goal 5, va riscritto, non portato).

**Criterio di completamento:** `cd pipeline && make rescue fire cyclepaths base`
gira senza errori su una checkout pulita (senza dati grezzi locali) e per
ciascun output il confronto con il file già committato in `public/data/`
mostra solo differenze attese (dati aggiornati), non differenze strutturali.

---

## Goal 3 — Script nuovi: `peaks` e `hospital`

**Obiettivo:** i due layer aggiunti nella repo attuale senza generatore hanno
ora uno script che li produce.

Questi due layer non esistevano nella vecchia repo — ma **esistono già come
output** in questa: `public/data/outdoor/peaks.geojson`,
`peaks_poles.geojson` e `public/data/rescue/hospital.geojson` sono già
committati (probabilmente creati a mano o con uno script non versionato). Lo
scopo di questo goal non è produrli per la prima volta, è scrivere lo script
che li riproduce: applica la regola trasversale, genera su un path
temporaneo e confronta col file già presente prima di sostituirlo.

- [ ] `pipeline/scripts/build_peaks_geojson.py` → produce
  `public/data/outdoor/peaks.geojson` e `public/data/outdoor/peaks_poles.geojson`.
  Guarda `lib/map/overlays/peaks.ts` per lo schema atteso: `peaks.geojson` è
  punti con proprietà usate per popup/etichetta; `peaks_poles.geojson` sono
  poligoni `fill-extrusion` con una proprietà `poleHeight` scalata tra la
  vetta più bassa e più alta (leggi il commento nel file, spiega la logica).
  Fonte suggerita: Overpass `natural=peak` dentro il confine comunale, con
  eventuale merge su una lista curata in `data/peaks_curated.json` per i casi
  in cui OSM non ha le vette locali importanti — stesso pattern
  "generato + curato" di `aed_comune.geojson`.
- [ ] `pipeline/scripts/build_hospital_geojson.py` → produce
  `public/data/rescue/hospital.geojson`. Guarda `lib/map/overlays/hospital.ts`
  e il componente `nearest-hospital.tsx`: serve un solo punto (l'ospedale più
  vicino), non un elenco. Query Overpass `amenity=hospital` in un raggio
  crescente dal centro comune (`comune.config.json` → `map.center`) finché non
  se ne trova almeno uno, poi scrivi solo il più vicino con `name` e
  coordinate.
- [ ] Aggiungi i due target al `Makefile`.

**Criterio di completamento:** `make peaks hospital` produce entrambi i
GeoJSON, il confronto con `public/data/outdoor/peaks*.geojson` e
`public/data/rescue/hospital.geojson` già committati mostra solo differenze
attese (non feature mancanti o proprietà diverse), e la mappa
(`/outdoor/trails/peaks`, `/rescue/hospital`) li renderizza senza modifiche
al codice frontend.

---

## Goal 4 — CI: rigenerazione automatica

**Obiettivo:** i dati si aggiornano da soli, in produzione, senza intervento
manuale.

- [ ] Porta `.github/workflows/refresh-data.yml` dalla vecchia repo. Unica
  modifica sostanziale: `git add frontend/public/data/` diventa
  `git add public/data/`. La cadenza (settimanale per rescue/fire/catasto/
  cyclepaths, mensile per base) e il trigger manuale restano identici.
- [ ] Aggiungi `peaks` e `hospital` alla lista "CI-safe" del workflow (sono
  Overpass-only, nessun dato grezzo locale necessario) — stessa cadenza di
  `rescue`.
- [ ] **Non serve gestire il deploy dentro questo workflow**: la vecchia repo
  pubblicava su GitHub Pages e doveva gestire il base path (da cui tutto
  `SETUP.md §7` della vecchia repo). Questa repo è su Vercel
  (`mappa-civica.vercel.app`), che fa auto-deploy a ogni push su `main` — il
  commit di `refresh-data.yml` triggera il deploy da solo.
- [ ] Non portare `functions/.github/workflows/rebuild-duckdb.yml` (fuori
  scope, vedi sopra).

**Criterio di completamento:** il workflow gira con successo su
`workflow_dispatch` per almeno un target (es. `rescue`), il commit automatico
appare sul branch, e Vercel avvia un deploy in seguito a quel commit.

---

## Goal 5 — PMTiles per `catasto.geojson` (solo questo file)

**Obiettivo:** `catasto.geojson` (1,9 MB) viene servito come vector tiles
invece che come GeoJSON completo scaricato dal browser.

Nota per Claude Code: la vecchia repo **non risolveva mai questo problema**.
`pipeline/scripts/build_pmtiles.py` è etichettato "Fase 0, legacy" nel suo
stesso docstring e produce un `base_layers.pmtiles` da un CSV di rete
stradale che non esiste più — non tocca `catasto.geojson`. Non c'è niente da
portare da lì: va scritto nuovo.

**Importante — non applicare questo goal a `transport.geojson` (1,7 MB).**
Verifica tu stesso con `grep -rl "transport.geojson"` nella repo attuale:
questo file è usato **solo** da `lib/routing/graph.ts` (e
`lib/routing/driving.ts` di conseguenza) per costruire il grafo di Dijkstra in
memoria — non è mai una source MapLibre, non viene mai renderizzato. Le
vector tiles ottimizzano query per viewport; qui serve l'intero grafo ad ogni
calcolo di percorso, quindi PMTiles non risolve nulla per questo file. Lascia
`transport.geojson` invariato e non aprire questo fronte.

- [ ] Aggiungi la dipendenza npm `pmtiles`.
- [ ] In `lib/map/base/index.ts`, accanto a dove oggi si chiama
  `maplibregl.setWorkerUrl(...)`, registra il protocollo:
  ```ts
  import { Protocol } from "pmtiles"
  const protocol = new Protocol()
  maplibregl.addProtocol("pmtiles", protocol.tile)
  ```
- [ ] `pipeline/scripts/build_catasto_geojson.py`: `public/data/catasto.geojson`
  esiste già (regola trasversale: confronta prima di sostituire l'intermedio).
  Scrivi il GeoJSON intermedio in `pipeline/data/catasto.geojson` (non
  pubblico, non serve più committarlo una volta che c'è il `.pmtiles`), poi aggiungi
  uno step che invoca `tippecanoe` per produrre `public/data/catasto.pmtiles`
  (un solo layer, punti, es. `tippecanoe -o catasto.pmtiles -l catasto -zg
  --drop-densest-as-needed catasto.geojson`). `tippecanoe` non è installato di
  default: nel workflow CI serve uno step `apt-get install -y tippecanoe` (o
  l'action dedicata) prima di `make catasto`.
- [ ] Cambia la source in `lib/map/overlays/home.ts` (o dove oggi viene
  definita la source `catasto`) da
  `{ type: "geojson", data: "/data/catasto.geojson" }` a
  `{ type: "vector", url: "pmtiles:///data/catasto.pmtiles" }`, con
  `source-layer: "catasto"` sui layer che la usano.
- [ ] Riscrivi `components/report-drawer/use-nearest-parcel.ts`: oggi usa
  `loadParcels()`/`nearestParcel()` da `lib/catasto.ts`, che scarica l'intero
  `catasto.geojson` e fa una scansione lineare in JS. Con le vector tiles
  questo pattern non regge più. Sostituiscilo con
  `map.querySourceFeatures("catasto", { sourceLayer: "catasto" })` limitato a
  un bbox intorno al punto cliccato — pattern già usato in
  `catasto-toggle.tsx` per il click-identify (`queryRenderedFeatures` con
  raggio crescente).
- [ ] Dopo questo cambio, `lib/catasto.ts` (`loadParcels`/`nearestParcel`/
  cache) diventa morto: rimuovilo e verifica con `pnpm fallow:dead-code`.

**Criterio di completamento:** `pnpm build` passa, `pnpm lint` e
`npx tsc --noEmit` sono puliti, il layer catasto si vede e si clicca sulla
mappa esattamente come prima, `use-nearest-parcel.ts` funziona nel drawer di
Segnala, e `pnpm fallow:dead-code` non segnala residui.

---

## Goal 6 — Sistemare lo scaffolding abbozzato del backend Segnala (DuckDB)

**Obiettivo:** la parte "ufficiale" del modulo Segnala (le segnalazioni
validate dal Comune, oggi mostrate insieme a quelle pending via
`lib/duckdb.ts`) ha un vero percorso di scrittura, invece di tre file
scollegati che non producono mai un dato reale.

Nota per Claude Code, così non serve ririleggere tre file per ricostruirlo:
nella vecchia repo esistono `functions/dispatch-contract.md` (una spec di un
payload `repository_dispatch` mai inviato da nessun codice),
`pipeline/scripts/init_duckdb.py` (crea 4 tabelle **vuote** — `reports`,
`ideas`, `idea_votes`, `emergency_assets` — non legge mai un report reale) e
`functions/.github/workflows/rebuild-duckdb.yml` (gira `init_duckdb.py` e
carica il risultato come artifact di CI, non lo pubblica, e ignora comunque
il payload dell'evento che lo dovrebbe attivare). Il modulo Segnala reale
della vecchia repo (`frontend/src/modules/community/communityStore.ts`) è
identico, riga per riga nella logica, a quello di questa repo:
`localStorage` + mailto. Il file `public/data/community_data.duckdb` già
committato in questa repo ha lo stesso schema di `init_duckdb.py` e **zero
righe in ogni tabella** — verificato con una query diretta. Quindi
`loadCommunityReports()` in `lib/duckdb.ts` oggi ritorna sempre un array
vuoto, silenziosamente (c'è un `.catch(() => [])`).

Non è un porting: va deciso e costruito un vero percorso di scrittura.
Questo goal non prova a decidere per te — le prime due voci sono decisioni,
non task.

- [ ] **Decisione per Leo (fermati e chiedi):** chi valida una segnalazione e
  con quale strumento? Due strade ragionevoli, coerenti in modo diverso con
  l'architettura "tutto statico" del resto del sito:
  1. **Ingestion manuale + rebuild statico** (più vicino allo spirito attuale
     del progetto: nessun backend live, nessun costo di hosting). Una persona
     del Comune legge le mail, e uno script/piccola pagina interna
     aggiunge la segnalazione validata a un CSV o JSON curato in
     `data/community/reports.csv`; uno script pipeline (nuovo, tipo
     `build_community_duckdb.py`, sostituto reale di `init_duckdb.py`)
     legge quel CSV e scrive `public/data/community_data.duckdb` con le righe
     vere dentro; commit + push = deploy, stesso schema di `refresh-data.yml`.
  2. **Backend reale minimo**: una Route Handler Next.js (`app/api/reports/route.ts`)
     con un semplice storage persistente (Postgres/Supabase, o anche solo
     KV) dietro un'autenticazione per lo staff comunale, che scrive
     direttamente le righe validate; `lib/duckdb.ts` continua a leggere da lì
     (via un export periodico verso `community_data.duckdb`, o sostituendo
     del tutto la lettura DuckDB con una fetch API). Più lavoro, ma toglie il
     passaggio manuale e apre la porta a validazione via web invece che via
     mail.
  **Non scegliere tu**: chiedi a Leo quale delle due (o una terza) prima di
  scrivere codice. Segna la scelta in `docs/PROGRESS.md` (Goal 10) una volta
  presa.
- [ ] **Decisione per Leo (fermati e chiedi):** la foto allegata a una
  segnalazione oggi resta un data-URL nel corpo della mail, che il mailto non
  allega davvero (il testo dice all'utente di allegarla a mano — l'avevamo
  già notato nella prima review). Se si sceglie la strada 1, la foto validata
  va copiata a mano da chi fa l'ingestion; se la strada 2, serve un upload a
  un object storage (es. Vercel Blob) e salvare l'URL nel record. Decidi
  insieme al punto sopra, non separatamente — sono la stessa scelta di
  livello di backend.
- [ ] Rimuovi `functions/` dalla vecchia repo dal porting: non ne resta
  niente di riusabile una volta presa la decisione sopra (né il contratto
  dispatch, né il workflow, sono entrambi legati all'approccio "evento
  GitHub" che nessuna delle due strade usa).
- [ ] Sostituisci `init_duckdb.py`: non deve più creare tabelle vuote, deve
  leggere l'input reale scelto sopra (CSV curato, o export dal backend) e
  scrivere le righe vere in `public/data/community_data.duckdb`.
- [ ] Aggiorna il commento in `lib/duckdb.ts` ("Official reports the
  municipality has ingested...") se il meccanismo di ingestion cambia nome o
  formato rispetto a quanto descritto lì.

**Criterio di completamento:** `select count(*) from reports` su
`public/data/community_data.duckdb` ritorna più di zero dopo aver seguito il
percorso di ingestion scelto con almeno una segnalazione di prova, e quella
segnalazione appare nell'app accanto a quelle pending in `localStorage`.

---

## Goal 7 — Dati curati e statistiche manuali (richiede decisioni di Leo)

**Obiettivo:** i dati che non vengono da un'API pubblica (statistiche
manuali, asset di soccorso curati dal Comune, censimento rii) hanno un posto
definito nella nuova struttura, anche se il dato grezzo non è ancora disponibile.

- [ ] `public/data/municipality_stats.json`: verifica che i campi manuali
  (vette, farmacia, scuole, pronto soccorso più vicino, zona sismica) siano
  già compilati per Montereale Valcellina. `fetch_istat_stats.py` deve
  aggiornare **solo** popolazione/famiglie/densità/età media via API ISTAT
  SDMX, senza toccare il resto — verifica che lo script porti questo
  comportamento invariato.
- [ ] **Decisione per Leo:** portare il pattern "generato + curato" per gli
  asset di soccorso? La vecchia repo aveva `rescue/aed_comune.geojson` e
  `rescue/hems_comune.geojson` (liste comunali geocodificate) che
  `build_rescue_geojson.py` fondeva con OSM (`merge_curated()`: un punto
  curato entra solo se non c'è già un nodo OSM entro ~60 m). Se il Comune ha
  dato un elenco reale di DAE/elisuperfici, copia i due file in
  `data/rescue/aed_comune.geojson` / `hems_comune.geojson` e porta
  `merge_curated()` invariata; altrimenti salta questo punto, lo script
  funziona anche solo con OSM. **Fermati e chiedi a Leo se non è chiaro.**
- [ ] Per `rii.geojson`: serve l'input grezzo
  `data/sources/output_rii_protezione_civile.zip`. Se non è presente nello
  zip fornito, lascia `rii.geojson` come `FeatureCollection` vuota (comportamento
  già previsto per un comune senza questo dato). Porta comunque
  `pipeline/scripts/rii_osm_lines.geojson` (geometria dei corsi d'acqua da
  OSM, arricchisce i punti del censimento quando disponibile).

**Criterio di completamento:** ogni file in `public/data/rescue/` ha una
provenienza documentata (generato, curato, o vuoto-in-attesa-di-dati), senza
ambiguità su come verrebbe rigenerato oggi.

---

## Goal 8 — Script "pesanti" (satellite/DEM, non CI)

**Obiettivo:** i layer ambientali restano rigenerabili da chi ha accesso ai
dati grezzi, anche se non girano in CI.

- [ ] Porta `process_green_layers.py`, `process_nbr.py`, `process_lst.py`,
  `process_shade_corridors.py` con la stessa trasformazione di path del
  Goal 2. Ricorda per `process_shade_corridors.py`: il suo input
  `outdoor/trails.geojson` ora viene da `pipeline/data/outdoor/trails.geojson`
  (vedi nota nella tabella del Goal 2), non da `public/data/`.
- [ ] Questi script restano fuori da CI: richiedono `.SAFE` Sentinel-2 e
  `dem.tif` locali in `data/raw/` (gitignored), da scaricare manualmente
  (Copernicus Browser, USGS EarthExplorer).
- [ ] `greenery.geojson`, `nbr.geojson`, `lst.geojson`,
  `shade_corridors.geojson` esistono già in `public/data/`: regola
  trasversale, confronta prima di sostituire (qui il confronto è più
  delicato, dipende dalla scena Sentinel/Landsat usata — una differenza
  ampia può essere legittima se la scena è di una data diversa, non
  necessariamente un bug).

**Criterio di completamento:** con i dati grezzi presenti in locale,
`make green` produce gli stessi quattro GeoJSON già in `public/data/`.

---

## Goal 9 — `SETUP.md` per la nuova repo

**Obiettivo:** un altro comune può configurare la piattaforma senza toccare
`app/`, `components/`, `lib/`.

- [ ] Riscrivi `SETUP.md` da zero (non copiare): elimina la sezione sul
  deploy GitHub Pages/base path Vite — Vercel fa auto-deploy da `main`, non
  c'è nulla da configurare. Tutto il resto (config, confine, frazioni,
  esclusioni, statistiche, dati satellitari grezzi) resta concettualmente
  identico alla vecchia repo, aggiorna solo i path (`data/comune.config.json`
  invece di `frontend/src/comune.config.json`, ecc. — usa il Goal 1 come
  riferimento).

**Criterio di completamento:** seguendo solo `SETUP.md`, è possibile elencare
tutti i file da compilare/procurarsi per un comune diverso senza dover
leggere il codice sorgente.

---

## Goal 10 — Documentazione

**Obiettivo:** chi arriva dopo capisce perché la pipeline è fatta così.

- [ ] Aggiungi una entry a `docs/PROGRESS.md` (stile ADR già in uso nel file)
  che spiega: perché la pipeline vive in `pipeline/` separata da `app`/`lib`,
  perché `catasto` è passato a PMTiles e `transport` no, perché
  `peaks`/`hospital` sono script nuovi senza corrispondente nella vecchia repo.
- [ ] Aggiorna il `README.md` principale: la sezione "Stack" oggi menziona
  PMTiles come se fosse già usato ovunque ("dati serviti come GeoJSON/PMTiles")
  — dopo questo lavoro è vero solo per catasto, precisalo. Aggiungi una
  sezione "Dati" che rimanda a `pipeline/README.md` e `SETUP.md`.
- [ ] Porta `public/data/rescue/README.md` e simili dalla vecchia repo,
  aggiornando i path — sono la documentazione di provenienza che oggi vive
  solo nelle FAQ a schermo (`app/rescue/fire/page.tsx` ecc.): tienile
  entrambe, non sono ridondanti.

**Criterio di completamento:** `docs/PROGRESS.md` e `README.md` riflettono lo
stato reale della pipeline dopo tutti i goal precedenti, senza affermazioni
non vere (es. PMTiles ovunque).

---

## Definizione di "fatto" per l'intero piano

- [ ] `cd pipeline && make rescue fire cyclepaths base peaks hospital` gira
  pulito su una checkout fresca (senza dati grezzi locali).
- [ ] `refresh-data.yml` passa in CI.
- [ ] `pnpm build` passa dopo il cambio PMTiles su catasto.
- [ ] `pnpm fallow:dead-code` pulito.
- [ ] Un secondo comune può essere configurato seguendo `SETUP.md` senza
  toccare `app/`, `components/`, `lib/`.
- [ ] `public/data/community_data.duckdb` contiene almeno una riga reale in
  `reports`, non più lo schema vuoto ereditato da `init_duckdb.py`.
