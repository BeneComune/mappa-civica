import { execSync } from "node:child_process"
import type { NextConfig } from "next"

// Last commit hash + ISO date, read from git at build time; empty if git is unavailable.
function lastCommit(): { sha: string; date: string } {
  try {
    const [sha, date] = execSync("git log -1 --format=%H%n%cI").toString().trim().split("\n")
    return { sha, date }
  } catch {
    return { sha: "", date: "" }
  }
}

const { sha, date } = lastCommit()

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: sha,
    NEXT_PUBLIC_GIT_COMMIT_DATE: date,
  },
}

export default nextConfig
