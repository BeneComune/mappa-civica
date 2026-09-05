// lib\community\storage.ts
// Shared localStorage read used by both stores. Returns `fallback` on the
// server (no window) and on malformed JSON.
export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
