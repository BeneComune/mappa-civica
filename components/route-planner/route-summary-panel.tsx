// components\route-planner\route-summary-panel.tsx
// Everything shown once a route actually resolves: headline distance and
// elevation, per-mode travel times, the surface breakdown bar, the elevation
// profile, and the download buttons.
import { Button } from "@/components/ui/button"
import { ElevationProfile } from "@/components/elevation-profile"
import { COLORS } from "@/lib/colors"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"
import { exportRoute, type RouteExportFormat, type RouteSummary } from "@/lib/routing"
import { formatDistance, formatTime } from "./format"
import { StatCard } from "./stat-card"

const EXPORT_FORMATS: RouteExportFormat[] = ["geojson", "gpx", "kml", "csv"]

const SURFACE_COLORS: Record<string, string> = {
  Asfalto: COLORS.surfaceAsfalto,
  Pavimentazione: COLORS.surfacePavimentazione,
  Pavé: COLORS.surfacePave,
  Sterrato: COLORS.surfaceSterrato,
  Ghiaia: COLORS.surfaceGhiaia,
  Prato: COLORS.surfacePrato,
  Sabbia: COLORS.surfaceSabbia,
  "Pista ciclabile": COLORS.surfacePistaCiclabile,
  Sentiero: COLORS.surfaceSentiero,
  "Strada bianca": COLORS.surfaceStradaBianca,
  "Percorso pedonale": COLORS.surfacePedonale,
  "Area pedonale": COLORS.surfacePedonale,
  Scalini: COLORS.surfaceScalini,
  "Strada urbana": COLORS.surfaceStradaUrbana,
  "Strada di servizio": COLORS.surfaceStradaServizio,
  "Strada minore": COLORS.surfaceStradaMinore,
  "Strada extraurbana": COLORS.surfaceStradaExtraurbana,
  "Strada principale": COLORS.surfaceStradaPrincipale,
}

const surfaceColor = (label: string): string => SURFACE_COLORS[label] ?? COLORS.surfaceDefault

function RouteTotals({ summary }: { summary: RouteSummary }) {
  return (
    <div className="grid grid-cols-3">
      <StatCard
        icon={ICONS.routePlannerDistance}
        value={formatDistance(summary.distanceKm)}
        label={STRINGS.routePlannerDistance}
      />
      <StatCard
        icon={ICONS.routePlannerAscent}
        value={`+${Math.round(summary.elevationGainM)} m`}
        label={STRINGS.routePlannerAscent}
      />
      <StatCard
        icon={ICONS.routePlannerDescent}
        value={`-${Math.round(summary.elevationLossM)} m`}
        label={STRINGS.routePlannerDescent}
      />
    </div>
  )
}

function TravelTimes({ summary }: { summary: RouteSummary }) {
  return (
    <div className="grid grid-cols-3">
      <StatCard
        icon={ICONS.routePlannerWalking}
        value={formatTime(summary.times.walking)}
        label={STRINGS.routePlannerWalking}
      />
      <StatCard
        icon={ICONS.routePlannerBiking}
        value={formatTime(summary.times.biking)}
        label={STRINGS.routePlannerBiking}
      />
      <StatCard
        icon={ICONS.routePlannerEbike}
        value={formatTime(summary.times.ebike)}
        label={STRINGS.routePlannerEbike}
      />
    </div>
  )
}

function SurfaceBreakdown({ summary }: { summary: RouteSummary }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium">{STRINGS.routePlannerSurfaceTitle}</span>
      <div className="flex h-2 overflow-hidden rounded-full">
        {summary.surfaceBreakdown.map((run) => (
          <span
            key={run.label}
            className="h-full not-first:border-l not-first:border-background"
            style={{ width: `${(run.km / summary.distanceKm) * 100}%`, backgroundColor: surfaceColor(run.label) }}
            title={`${run.label}: ${run.km.toFixed(2)} km`}
          />
        ))}
      </div>
      <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {summary.surfaceBreakdown.map((run) => (
          <li key={run.label} className="flex justify-between">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: surfaceColor(run.label) }}
                aria-hidden="true"
              />
              {run.label}
            </span>
            <span>{run.km.toFixed(run.km >= 10 ? 1 : 2)} km</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RouteSummaryPanel({ summary }: { summary: RouteSummary }) {
  return (
    <div className="flex flex-col divide-y *:py-3 *:first:pt-0 *:last:pb-0">
      <RouteTotals summary={summary} />

      <TravelTimes summary={summary} />

      {summary.surfaceBreakdown.length > 0 && <SurfaceBreakdown summary={summary} />}

      {summary.profile.length >= 2 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {STRINGS.routePlannerProfileTitle}{" "}
            <span className="text-muted-foreground">({STRINGS.routePlannerProfileSubtitle})</span>
          </span>
          <ElevationProfile summary={summary} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{STRINGS.routePlannerDownloads}</span>
        <div className="grid grid-cols-4 gap-2">
          {EXPORT_FORMATS.map((format) => (
            <Button key={format} size="sm" variant="outline" onClick={() => exportRoute(summary, format)}>
              {format.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
