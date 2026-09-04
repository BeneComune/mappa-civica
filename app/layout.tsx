// app\layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import { MapShell } from "@/components/map-shell"
import { MapProvider } from "@/components/map-provider"
import { PanelFrame } from "@/components/panel-frame"
import { STRINGS } from "@/lib/strings"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: STRINGS.appName,
  description: STRINGS.appName,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden">
        <MapProvider>
          <SiteHeader />
          <main className="relative min-h-0 flex-1">
            <MapShell />
            <PanelFrame>{children}</PanelFrame>
          </main>
        </MapProvider>
      </body>
    </html>
  )
}
