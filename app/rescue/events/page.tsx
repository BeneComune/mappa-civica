"use client"

import { ClickPopupLayer } from "@/components/click-popup-layer"
import { Faq } from "@/components/faq"
import { HoverHighlightLayer } from "@/components/hover-highlight-layer"
import { PageHeader } from "@/components/page-header"
import { RiiRecencyFilter } from "@/components/rii-recency-filter"
import { ICONS } from "@/lib/ICONS"
import { riiPopupHTML } from "@/lib/rescue-popups"
import { STRINGS } from "@/lib/strings"

export default function RescueEventsPage() {
  return (
    <div>
      <ClickPopupLayer layerId="rii-points" render={riiPopupHTML} />
      <ClickPopupLayer layerId="rii-line" render={riiPopupHTML} />
      <HoverHighlightLayer sourceId="rii" layerIds={["rii-points", "rii-line"]} />
      <PageHeader icon={ICONS.riverRisk} title={STRINGS.riverRisk} description={STRINGS.riverRiskDescription} />
      <div className="mt-3">
        <RiiRecencyFilter />
      </div>
      <Faq>
        Il censimento nasce nel 2013 su 10 corsi d&apos;acqua; nel 2024 il Gruppo Comunale di Protezione Civile ne
        ha rilevati nuovamente 3 (Povoleit, Spia, sistema Cian/Cjasarile) dopo le allerte del novembre 2023 e la
        piena del 10 ottobre 2024. In questa visualizzazione, dove OpenStreetMap ha il corso d&apos;acqua (Rio
        Spia, Rio Ciasarile, Rio Bennata, e il rio senza nome presso Cao Malnisio) abbiamo usato il suo tracciato.
        Un ulteriore rio censito nel 2013 non compare in mappa perché privo di coordinate e di nome certo (foto
        datate 2007). Il documento di riferimento è il «Censimento RII», in gestione al Gruppo Comunale di
        Protezione Civile di Montereale Valcellina.
      </Faq>
    </div>
  )
}
