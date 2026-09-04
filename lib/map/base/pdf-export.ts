// lib\map\base\pdf-export.ts
// Render the current map canvas into an A4 PDF with a title block and a
// real cartographic scale, then open it in a new tab.
import type { Map } from "maplibre-gl"

// Ground resolution (metres per CSS pixel) of standard Web Mercator tiles at
// a given latitude/zoom - used to turn the on-screen map into a real
// cartographic scale ("1:25 000") on the printed PDF page.
function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom)
}

function formatCoord(value: number, positiveSuffix: string, negativeSuffix: string): string {
  return `${Math.abs(value).toFixed(4)}°${value >= 0 ? positiveSuffix : negativeSuffix}`
}

export async function exportMapToPdf(
  map: Map,
  moduleLabel: string,
  productName: string
): Promise<void> {
  const { jsPDF } = await import("jspdf")

  const canvas = map.getCanvas()
  const imgData = canvas.toDataURL("image/png")
  const orientation = canvas.width >= canvas.height ? "l" : "p"
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const titleHeight = 12
  const footerHeight = 12

  doc.setFontSize(16)
  doc.setTextColor(30)
  doc.text(productName, margin, margin + 6)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${moduleLabel} - ${new Date().toLocaleDateString("it-IT")}`, margin, margin + 11)

  const availableWidth = pageWidth - margin * 2
  const availableHeight = pageHeight - margin * 2 - titleHeight - footerHeight
  const imgAspect = canvas.width / canvas.height
  let imgWidth = availableWidth
  let imgHeight = imgWidth / imgAspect
  if (imgHeight > availableHeight) {
    imgHeight = availableHeight
    imgWidth = imgHeight * imgAspect
  }
  const imgX = margin + (availableWidth - imgWidth) / 2
  const imgY = margin + titleHeight
  doc.addImage(imgData, "PNG", imgX, imgY, imgWidth, imgHeight)

  const center = map.getCenter()
  const groundWidthMm = metersPerPixel(center.lat, map.getZoom()) * canvas.clientWidth * 1000
  const scaleDenominator = Math.round(groundWidthMm / imgWidth)
  const centerText = `Centro: ${formatCoord(center.lat, "N", "S")}, ${formatCoord(center.lng, "E", "O")}`
  const scaleText = `Scala 1:${scaleDenominator.toLocaleString("it-IT")}`

  doc.setFontSize(8)
  doc.setTextColor(130)
  doc.text(`${centerText}  ·  ${scaleText}`, margin, pageHeight - 10)
  doc.text("© Maptoolkit © OpenStreetMap contributors", margin, pageHeight - 5)

  // Preview in a new tab (the browser's own PDF viewer) instead of forcing
  // an immediate download - the user can save/print from there if they want
  // to keep it.
  const blobUrl = doc.output("bloburl")
  window.open(blobUrl, "_blank")
}
