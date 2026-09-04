import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { MapShell } from "@/components/map-shell";
import { STRINGS } from "@/lib/strings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: STRINGS.appName,
  description: STRINGS.appName,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden">
        <SiteHeader />
        <main className="relative min-h-0 flex-1">
          <MapShell />
          <div className="pointer-events-none absolute inset-0 flex items-end p-4">
            <div className="pointer-events-auto w-full max-w-sm rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
