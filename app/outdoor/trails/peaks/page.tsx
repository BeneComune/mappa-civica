// app\outdoor\trails\peaks\page.tsx
"use client"

import { Faq } from "@/components/faq"
import { PageHeader } from "@/components/page-header"
import { ICONS } from "@/lib/ICONS"
import { STRINGS } from "@/lib/strings"

export default function TrailsPeaksPage() {
  return (
    <div>
      <PageHeader icon={ICONS.peaks} title={STRINGS.peaks} description={STRINGS.peaksDescription} />
      <Faq>
        Le vette del comune, da OpenStreetMap. Ogni cima è segnata da un punto e
        un&apos;etichetta con la quota, sormontati da un&apos;asta bianca la cui altezza è
        proporzionale alla quota relativa fra le cime (non in scala reale col terreno).
      </Faq>
    </div>
  )
}
