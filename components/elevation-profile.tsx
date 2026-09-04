import type { RouteSummary } from "@/lib/routing"

// SVG elevation-vs-distance chart, ported from the old app's ElevationSvg.
export function ElevationProfile({ summary }: { summary: RouteSummary }) {
  const width = 420
  const height = 190
  const margin = { top: 12, right: 14, bottom: 32, left: 48 }
  const minElevation = Math.min(...summary.profile.map((point) => point.elevationM))
  const maxElevation = Math.max(...summary.profile.map((point) => point.elevationM))
  const distanceKm = Math.max(summary.distanceKm, 0.001)
  const elevationRange = Math.max(maxElevation - minElevation, 1)
  const xTicks = [0, 0.25, 0.5, 0.75, 1]
  const yTicks = [0, 0.25, 0.5, 0.75, 1]
  const elevationLabelDigits = elevationRange < 20 ? 1 : 0
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const xFor = (distance: number) => margin.left + (distance / distanceKm) * plotWidth
  const yFor = (elevation: number) => margin.top + plotHeight - ((elevation - minElevation) / elevationRange) * plotHeight
  const linePoints = summary.profile.map((point) => `${xFor(point.distanceKm)} ${yFor(point.elevationM)}`).join(" ")
  const areaPoints = `${margin.left} ${height - margin.bottom} ${linePoints} ${width - margin.right} ${height - margin.bottom}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true" className="w-full">
      <defs>
        <linearGradient id="route-profile-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8ecae6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8ecae6" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {xTicks.map((tick) => {
        const x = margin.left + tick * plotWidth
        return (
          <g key={`x-${tick}`}>
            <line x1={x} y1={margin.top} x2={x} y2={height - margin.bottom} stroke="currentColor" strokeOpacity={0.1} />
            <text x={x} y={height - 12} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.6}>
              {Math.round(distanceKm * tick * 10) / 10} km
            </text>
          </g>
        )
      })}
      {yTicks.map((tick) => {
        const elevation = minElevation + tick * elevationRange
        const y = yFor(elevation)
        return (
          <g key={`y-${tick}`}>
            <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="currentColor" strokeOpacity={0.1} />
            <text x={margin.left - 8} y={y + 3} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.6}>
              {`${elevation.toFixed(elevationLabelDigits)} m`}
            </text>
          </g>
        )
      })}
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="currentColor"
        strokeOpacity={0.3}
      />
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="currentColor" strokeOpacity={0.3} />
      <polygon points={areaPoints} fill="url(#route-profile-fill)" />
      <polyline points={linePoints} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
