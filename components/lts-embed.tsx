import { LTS_EMBED_VIEW } from "@/lib/config"

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
      title="Stress in bici: livello di stress da traffico per la mobilità ciclabile"
      className="absolute inset-0 z-10 h-full w-full border-0"
    />
  )
}
