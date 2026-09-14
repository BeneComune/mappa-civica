---
title: 'Mappa Civica: an open-source, serverless civic platform for small municipalities'
tags:
  - civic technology
  - web GIS
  - open data
  - remote sensing
  - JavaScript
  - Python
authors:
  - name: Leonardo Venturoso
    affiliation: 1
  - name: Emanuele Nardi
    affiliation: 1
affiliations:
  - name: "TODO: fill in institution or 'Independent researcher'"
    index: 1
date: 14 September 2026
bibliography: paper.bib
---

# Summary

Mappa Civica is an open-source web platform that gives a municipality a
single map for mobility, environmental monitoring, territorial risk and
citizen reporting. It is built and deployed for the comune of Montereale
Valcellina, a small municipality in northeastern Italy, and designed from
the start to be reused by other municipalities without touching the
application code: territory-specific values live in one configuration
file, and the raw data each layer needs is documented in a setup guide.

The frontend is a Next.js and MapLibre GL application with no application
server. Map data is served as static GeoJSON, read directly by the
browser; citizen reports are queried client-side from a read-only DuckDB
file using DuckDB-Wasm [@raasveldt2019duckdb], so the platform runs at
near-zero hosting cost on a static CDN. A Python pipeline builds that
static data from a mix of sources: OpenStreetMap [@haklay2008openstreetmap]
for roads, trails and points of interest, national statistical and
cadastral open data, regional and national hazard datasets published by
public administrations, and Sentinel-2 and Landsat imagery for vegetation,
burn severity and land surface temperature. A scheduled job refreshes the
API-derived layers automatically, including a monthly search for the most
recent, sufficiently cloud-free satellite scene, so the environmental
layers do not go stale between manual updates. Every processed layer
carries the acquisition date of the imagery it came from, and the
interface flags it when that date is old enough to be worth a second
look.

# Statement of need

Small municipalities generate and are the subject of a large amount of
open geospatial data: administrative boundaries, cadastral parcels,
hazard zonation, satellite-derived environmental indices, volunteer field
surveys. In practice this data tends to stay scattered across the portals
of the agencies that publish it, in formats and access methods that
differ from one source to the next, and rarely reaches residents in a
form they can actually use. Assembling it into something a citizen or a
small local administration can query on a map usually means either paying
for a commercial GIS platform or dedicating staff a small comune does not
have.

Mappa Civica addresses that gap directly: it is free, requires no server
to operate, and its data pipeline is built specifically around public
APIs and open datasets rather than commercial data providers. Because
territory-specific configuration is isolated from the codebase, adopting
it for a new municipality is a matter of filling in a boundary file, a
few identifiers and a short list of raw data sources, not forking and
rewriting the application.

The platform also addresses a failure mode common to dashboards built on
satellite-derived indices: once a layer is generated, nothing about its
presentation tells a viewer how old the underlying scene is, so a
vegetation index computed months or years earlier can be shown as if it
were current. Mappa Civica treats the acquisition date as data, carrying
it through the processing pipeline into the interface, so that staleness
is visible rather than silent.

# Acknowledgements

We acknowledge the Gruppo Comunale di Protezione Civile di Montereale
Valcellina for the volunteer field survey feeding the flood-prone streams
layer.

# References
