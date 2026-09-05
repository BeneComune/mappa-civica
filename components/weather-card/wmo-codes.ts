// components\weather-card\wmo-codes.ts
// WMO weather interpretation codes as returned by Open-Meteo, mapped to an
// Italian label and an icon.
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Sun,
  Thermometer,
} from "lucide-react"

const WMO: Record<number, { label: string; icon: typeof Sun }> = {
  0: { label: "Sereno", icon: Sun },
  1: { label: "Prevalentemente sereno", icon: Sun },
  2: { label: "Parzialmente nuvoloso", icon: CloudSun },
  3: { label: "Coperto", icon: Cloud },
  45: { label: "Nebbia", icon: CloudFog },
  48: { label: "Nebbia con brina", icon: CloudFog },
  51: { label: "Pioviggine debole", icon: CloudDrizzle },
  53: { label: "Pioviggine", icon: CloudDrizzle },
  55: { label: "Pioviggine intensa", icon: CloudDrizzle },
  61: { label: "Pioggia debole", icon: CloudRain },
  63: { label: "Pioggia", icon: CloudRain },
  65: { label: "Pioggia forte", icon: CloudRainWind },
  66: { label: "Pioggia gelata", icon: CloudHail },
  67: { label: "Pioggia gelata forte", icon: CloudHail },
  71: { label: "Neve debole", icon: CloudSnow },
  73: { label: "Neve", icon: CloudSnow },
  75: { label: "Neve forte", icon: CloudSnow },
  77: { label: "Nevischio", icon: CloudSnow },
  80: { label: "Rovesci deboli", icon: CloudRain },
  81: { label: "Rovesci", icon: CloudRain },
  82: { label: "Rovesci violenti", icon: CloudRainWind },
  85: { label: "Rovesci di neve", icon: CloudSnow },
  86: { label: "Rovesci di neve forti", icon: CloudSnow },
  95: { label: "Temporale", icon: CloudLightning },
  96: { label: "Temporale con grandine", icon: CloudLightning },
  99: { label: "Temporale con grandine forte", icon: CloudLightning },
}

export function describe(code: number): { label: string; icon: typeof Sun } {
  return WMO[code] ?? { label: "Dati meteo", icon: Thermometer }
}
