# Segnalazioni validate del Comune

`reports.csv` è l'elenco curato a mano delle segnalazioni che il Comune ha
deciso di pubblicare. `pipeline/scripts/build_community_duckdb.py` lo
trasforma in `public/data/community_data.duckdb`, il file in sola lettura che
l'app carica nel browser (`lib/duckdb.ts`). Le segnalazioni ancora da
validare non sono qui: restano nel `localStorage` del browser di chi le ha
scritte e arrivano al Comune via email (l'app non ha backend).

## Flusso di ingestion

1. Una persona del Comune legge le email a `info@comune.montereale-valcellina.pn.it`.
2. Per ogni segnalazione da pubblicare, aggiunge **una riga** a `reports.csv`.
3. Se c'è una foto, la salva in `public/data/community/<id>.jpg` e mette il
   percorso relativo (`community/<id>.jpg`) nella colonna `photo`.
4. `cd pipeline && make community` rigenera `community_data.duckdb`.
5. `git commit` + `git push` -> Vercel fa il deploy, la segnalazione diventa
   pubblica.

Per togliere una segnalazione: cancella la riga (o metti `status` a
`resolved` per lasciarla visibile ma segnata come chiusa), poi ripeti 4-5.

## Colonne

| colonna | note |
|---|---|
| `id` | identificatore univoco della riga (UUID dell'app, o una stringa breve scelta a mano) |
| `category` | una di: `strade`, `natura`, `rifiuti`, `illuminazione`, `segnaletica`, `proposta` |
| `title` | obbligatorio |
| `description` | testo libero |
| `lon`, `lat` | WGS84, gradi decimali |
| `created_at` | ISO 8601 (es. `2026-09-06T09:00:00Z`) |
| `status` | `open` (default), `in_progress`, `resolved` |
| `foglio`, `particella` | catasto, opzionali |
| `photo` | percorso relativo dentro `public/data/`, es. `community/<id>.jpg`, opzionale |

Lo schema delle colonne è volutamente a forma di risposta di una futura API
`/api/reports`: se un domani si aggiunge un backend vero, cambia solo il
corpo di `loadCommunityReports()` in `lib/duckdb.ts`, non il resto dell'app.

## Attenzione: la repo è pubblica

`reports.csv` e tutta la sua storia git sono pubblici. Una riga rimossa
**resta per sempre nella storia**. Non inserire mai dati personali in chiaro
(nomi, contatti, targhe): solo categoria, titolo, descrizione, posizione,
data.
