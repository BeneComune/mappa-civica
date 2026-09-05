// app\rescue\hospital\page.tsx
"use client"

import { Faq } from "@/components/faq"
import { NearestHospital } from "@/components/nearest-hospital"
import { PageHeader } from "@/components/page-header"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function RescueHospitalPage() {
  return (
    <div>
      <PageHeader
        icon={ICONS.nearestHospital}
        title={STRINGS.nearestHospital}
        description={STRINGS.nearestHospitalDescription}
      />
      <div className="mt-3">
        <NearestHospital />
      </div>
      <Faq>
        Percorso stimato sulla rete stradale di OpenStreetMap, con tempo calcolato dai limiti di
        velocità (o una stima quando mancano) scontati per tenere conto di curve e centri abitati:
        è una stima, non una guida turno per turno. In un&apos;emergenza reale chiama sempre il
        112.
      </Faq>
    </div>
  )
}
