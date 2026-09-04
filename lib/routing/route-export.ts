// lib\routing\route-export.ts
// Turn a computed route into a downloadable file. GeoJSON keeps the summary
// numbers as properties; GPX/KML are the line as a track; CSV is the
// elevation/grade profile, one row per sampled point.

import type { RouteSummary } from "./types"

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

function routeToGeoJSON(summary: RouteSummary): string {
  const fc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: summary.line.geometry,
        properties: {
          distanza_km: Number(summary.distanceKm.toFixed(3)),
          tempo_piedi_min: Math.round(summary.times.walking),
          tempo_bici_min: Math.round(summary.times.biking),
          tempo_ebike_min: Math.round(summary.times.ebike),
          dislivello_positivo_m: Math.round(summary.elevationGainM),
          dislivello_negativo_m: Math.round(summary.elevationLossM),
          fondo: summary.surfaceBreakdown.map((r) => `${r.label}: ${r.km.toFixed(2)} km`).join("; "),
        },
      },
      ...summary.points.features,
    ],
  }
  return JSON.stringify(fc, null, 2)
}

function routeToGPX(summary: RouteSummary): string {
  const pts = summary.line.geometry.coordinates.map(([lon, lat]) => `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"/>`).join("\n")
  const wpts = summary.points.features
    .map((f) => {
      const [lon, lat] = f.geometry.coordinates
      return `  <wpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"><name>${xmlEscape(f.properties.label)}</name></wpt>`
    })
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Mappa Civica" xmlns="http://www.topografix.com/GPX/1/1">
${wpts}
  <trk><name>Percorso</name><trkseg>
${pts}
  </trkseg></trk>
</gpx>
`
}

function routeToKML(summary: RouteSummary): string {
  const coords = summary.line.geometry.coordinates.map(([lon, lat]) => `${lon.toFixed(7)},${lat.toFixed(7)},0`).join(" ")
  const marks = summary.points.features
    .map((f) => {
      const [lon, lat] = f.geometry.coordinates
      return `    <Placemark><name>${xmlEscape(f.properties.label)}</name><Point><coordinates>${lon.toFixed(7)},${lat.toFixed(7)},0</coordinates></Point></Placemark>`
    })
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Percorso</name>
${marks}
    <Placemark><name>Percorso</name><LineString><tessellate>1</tessellate><coordinates>${coords}</coordinates></LineString></Placemark>
  </Document>
</kml>
`
}

function routeToCSV(summary: RouteSummary): string {
  // elevationM is cumulative height change from the start (can be negative),
  // not an absolute altitude - the source data only carries per-edge grade.
  const header = "distanza_km,dislivello_dalla_partenza_m,pendenza_pct"
  const rows = summary.profile.map((p) => `${p.distanceKm.toFixed(3)},${p.elevationM.toFixed(1)},${p.grade.toFixed(1)}`)
  return [header, ...rows].join("\n") + "\n"
}

function downloadTextFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type RouteExportFormat = "geojson" | "gpx" | "kml" | "csv"

export function exportRoute(summary: RouteSummary, format: RouteExportFormat): void {
  const map: Record<RouteExportFormat, [string, string, string]> = {
    geojson: ["percorso.geojson", "application/geo+json", routeToGeoJSON(summary)],
    gpx: ["percorso.gpx", "application/gpx+xml", routeToGPX(summary)],
    kml: ["percorso.kml", "application/vnd.google-earth.kml+xml", routeToKML(summary)],
    csv: ["percorso-altimetria.csv", "text/csv", routeToCSV(summary)],
  }
  const [name, mime, content] = map[format]
  downloadTextFile(name, mime, content)
}
