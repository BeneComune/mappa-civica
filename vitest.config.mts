import { defineConfig } from "vitest/config"

// Mirrors the "@/*" -> "./*" path alias from tsconfig.json so tests can
// import modules the same way the app does.
export default defineConfig({
  resolve: {
    alias: { "@": import.meta.dirname },
  },
})
