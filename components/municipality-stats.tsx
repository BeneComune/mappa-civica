import { ChevronRight } from "lucide-react"

export type MunicipalityStats = {
  municipality: { name: string; province: string; region: string }
  geography: {
    waterways: string[]
    peaks: { name: string; elevation_m: number }[]
  }
  demographic: {
    population: number | null
    population_year: number | null
    area_km2: number | null
    population_density_km2: number | null
    localities_count: number | null
    households: number | null
    avg_household_size: number | null
    avg_age: number | null
    avg_age_scope: string | null
    old_age_index: number | null
    old_age_index_scope: string | null
    pct_pop_65_over: number | null
  }
  risk: {
    seismic_zone: string | null
    seismic_zone_label: string | null
    hydrogeological_risk_class: string | null
  }
  services: {
    pharmacy: boolean | null
    pharmacy_name: string | null
    schools: string | null
    nearest_emergency_room: { name: string | null; distance_km: number | null; drive_minutes: number | null }
    bank_branches: number | null
  }
  pipeline_derived: {
    total_area_ha: number
    green_area_pct: number
    trails_cai_km: number
    trails_mtb_km: number
    cycling_km: number | null
  }
}

function fmt(v: number | null | undefined, suffix = ""): string {
  if (v == null) return "-"
  return `${v.toLocaleString("it-IT")}${suffix}`
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer select-none items-center gap-1 text-sm font-semibold marker:content-none">
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" /> {title}
      </summary>
      <table className="mt-1 w-full pl-4 text-sm">
        <tbody>{children}</tbody>
      </table>
    </details>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-1 pr-2 align-baseline text-muted-foreground">{label}</td>
      <td className="py-1 text-right align-baseline">{children}</td>
    </tr>
  )
}

export function MunicipalityStatsPanel({ stats }: { stats: MunicipalityStats }) {
  return (
    <div className="flex flex-col gap-4">
      <StatSection title="Territorio">
        <Stat label="Superficie">{fmt(stats.demographic.area_km2, " km²")}</Stat>
        <Stat label="Densità">{fmt(stats.demographic.population_density_km2, " ab/km²")}</Stat>
        <Stat label="Corsi d'acqua">{stats.geography.waterways.join(", ")}</Stat>
        <Stat label="Cime principali">
          {stats.geography.peaks.map((p) => `${p.name} (${p.elevation_m.toLocaleString("it-IT")} m)`).join(", ")}
        </Stat>
        <Stat label="Vegetazione densa">{fmt(stats.pipeline_derived.green_area_pct, "%")}</Stat>
        <Stat label="Sentieri CAI">{fmt(stats.pipeline_derived.trails_cai_km, " km")}</Stat>
        <Stat label="Percorsi MTB">{fmt(stats.pipeline_derived.trails_mtb_km, " km")}</Stat>
        <Stat label="Piste ciclabili">{fmt(stats.pipeline_derived.cycling_km, " km")}</Stat>
      </StatSection>

      <StatSection title="Popolazione">
        <Stat label="Residenti">
          {stats.demographic.population != null
            ? `${stats.demographic.population.toLocaleString("it-IT")} (${stats.demographic.population_year ?? ""})`
            : "-"}
        </Stat>
        <Stat label="Famiglie">{fmt(stats.demographic.households)}</Stat>
        <Stat label="Componenti medi">{fmt(stats.demographic.avg_household_size)}</Stat>
        <Stat label="Età media">
          {stats.demographic.avg_age != null ? (
            <>
              {stats.demographic.avg_age} anni
              {stats.demographic.avg_age_scope === "provincial" && (
                <span className="text-muted-foreground"> (PN)</span>
              )}
            </>
          ) : (
            "-"
          )}
        </Stat>
        <Stat label="Indice di vecchiaia">
          {stats.demographic.old_age_index != null ? (
            <>
              {stats.demographic.old_age_index}
              {stats.demographic.old_age_index_scope === "provincial" && (
                <span className="text-muted-foreground"> (PN)</span>
              )}
            </>
          ) : (
            "-"
          )}
        </Stat>
        <Stat label="Pop. ≥ 65 anni">
          {stats.demographic.pct_pop_65_over != null ? (
            <>
              {stats.demographic.pct_pop_65_over}%<span className="text-muted-foreground"> (PN)</span>
            </>
          ) : (
            "-"
          )}
        </Stat>
      </StatSection>

      <StatSection title="Rischio territorio">
        <Stat label="Zona sismica">
          {stats.risk.seismic_zone != null ? (
            <>
              Zona {stats.risk.seismic_zone}
              {stats.risk.seismic_zone_label && (
                <span className="text-muted-foreground"> - {stats.risk.seismic_zone_label}</span>
              )}
            </>
          ) : (
            "-"
          )}
        </Stat>
        <Stat label="Rischio idrogeologico">{stats.risk.hydrogeological_risk_class ?? "-"}</Stat>
      </StatSection>

      <StatSection title="Servizi">
        <Stat label="Sportelli bancari">{fmt(stats.services.bank_branches)}</Stat>
        <Stat label="Farmacia">
          {stats.services.pharmacy_name ?? (stats.services.pharmacy ? "Sì" : stats.services.pharmacy === false ? "No" : "-")}
        </Stat>
        <Stat label="Scuole">{stats.services.schools ?? "-"}</Stat>
        <Stat label="Pronto soccorso">
          {stats.services.nearest_emergency_room.name ? (
            <>
              {stats.services.nearest_emergency_room.name}
              <span className="text-muted-foreground">
                {" "}
                ({fmt(stats.services.nearest_emergency_room.distance_km, " km")}, ~
                {stats.services.nearest_emergency_room.drive_minutes} min)
              </span>
            </>
          ) : (
            "-"
          )}
        </Stat>
      </StatSection>
    </div>
  )
}
