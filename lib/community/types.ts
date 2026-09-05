// lib\community\types.ts
import type { CategoryId } from "./categories"

export type CommunityReport = {
  id: string
  category: CategoryId
  title: string
  description: string
  lon: number
  lat: number
  createdAt: string
  photoDataUrl?: string
  foglio?: string
  particella?: string
}

// Downscales + re-encodes an uploaded photo client-side before it's stored
