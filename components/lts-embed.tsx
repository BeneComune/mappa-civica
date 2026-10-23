// components\lts-embed.tsx
import { LTS_EMBED_VIEW } from "@/lib/config"
import { STRINGS } from "@/lib/strings"

// Replaces the whole map view with the stressinbici.it (LTS) embed, same as
// the old app - this route doesn't show our own map at all.
export function LtsEmbed() {
  const src = `https://stressinbici.it/?${new URLSearchParams({
    area: "italia",
    zoom: String(LTS_EMBED_VIEW.zoom),
    lat: String(LTS_EMBED_VIEW.lat),
    lon: String(LTS_EMBED_VIEW.lon),
    pitch: "0",
    bearing: "0",
    bg: "dark",
    lts: "0,1,2,3,4",
    terrain: "0",
    gap: "0",
    lang: "it",
  }).toString()}`

  return (
    <iframe
      src={src}
      title={STRINGS.ltsEmbedTitle}
      className="absolute inset-0 z-10 h-full w-full border-0"
    />
  )
}
