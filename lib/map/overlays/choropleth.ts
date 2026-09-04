// lib\map\overlays\choropleth.ts
import type { ExpressionSpecification, Map } from "maplibre-gl"
import { COLORS } from "@/lib/colors"

// Shared shape behind the Green module's class-coloured polygon overlays
// (vegetation, vegetation-health, soil-temperature): one GeoJSON source, a
// class-coloured fill, and a thin white outline - each added idempotently
// and starting hidden so lib/map/index.ts can show them per route. Only the
// ids, the data URL and the fill paint differ between the three; the outline
// is identical in all of them.

// Most of these layers paint straight from the `color` property the Python
// pipeline bakes into every feature (pipeline/scripts/process_nbr.py,
// process_lst.py), so the legend swatches and the polygons can't disagree.
// NDVI is the exception and passes its own match expression - see
// overlays/vegetation.ts for why.
const DATA_BAKED_COLOR: ExpressionSpecification = ["get", "color"]

export function addChoroplethOverlay(
  map: Map,
  options: {
    sourceId: string
    dataUrl: string
    fillLayerId: string
    outlineLayerId: string
    fillColor?: ExpressionSpecification
    fillOpacity?: ExpressionSpecification | number
  }
): void {
  const {
    sourceId,
    dataUrl,
    fillLayerId,
    outlineLayerId,
    fillColor = DATA_BAKED_COLOR,
    fillOpacity = 0.65,
  } = options

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: "geojson", data: dataUrl })
  }

  if (!map.getLayer(fillLayerId)) {
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      layout: { visibility: "none" },
      paint: { "fill-color": fillColor, "fill-opacity": fillOpacity },
    })
  }

  if (!map.getLayer(outlineLayerId)) {
    map.addLayer({
      id: outlineLayerId,
      type: "line",
      source: sourceId,
      layout: { visibility: "none" },
      paint: { "line-color": COLORS.white, "line-width": 0.3, "line-opacity": 0.4 },
    })
  }
}
