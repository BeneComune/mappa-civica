// lib\community\community.test.ts
// Cover for the two localStorage-backed stores split out of lib/community.ts,
// including the snapshot-identity contract useSyncExternalStore depends on:
// a snapshot must be referentially stable between changes, or React re-renders
// forever.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function stubStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  }
  vi.stubGlobal("window", { localStorage })
  return store
}

// The stores cache in module scope, so each test needs a fresh import.
async function freshReports() {
  vi.resetModules()
  return import("./reports-store")
}
async function freshVotes() {
  vi.resetModules()
  return import("./votes-store")
}

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

describe("readJSON", () => {
  it("falls back on the server, where there is no window", async () => {
    vi.stubGlobal("window", undefined)
    const { readJSON } = await import("./storage")
    expect(readJSON("k", "fallback")).toBe("fallback")
  })

  it("falls back on absent and on malformed values", async () => {
    stubStorage({ bad: "{not json" })
    const { readJSON } = await import("./storage")
    expect(readJSON("missing", [])).toEqual([])
    expect(readJSON("bad", { a: 1 })).toEqual({ a: 1 })
  })

  it("parses a stored value", async () => {
    stubStorage({ k: JSON.stringify({ a: 1 }) })
    const { readJSON } = await import("./storage")
    expect(readJSON("k", null)).toEqual({ a: 1 })
  })
})

describe("reports store", () => {
  it("reads pending reports out of localStorage", async () => {
    stubStorage({ mv_pending_reports: JSON.stringify([{ id: "r1", title: "Buca" }]) })
    const { getReportsSnapshot } = await freshReports()
    expect(getReportsSnapshot()).toEqual([{ id: "r1", title: "Buca" }])
  })

  it("returns a referentially stable snapshot between writes", async () => {
    stubStorage({ mv_pending_reports: JSON.stringify([{ id: "r1" }]) })
    const { getReportsSnapshot } = await freshReports()
    expect(getReportsSnapshot()).toBe(getReportsSnapshot())
  })

  it("returns the same empty array every time on the server", async () => {
    const { getReportsServerSnapshot } = await freshReports()
    // A fresh [] here would loop useSyncExternalStore forever.
    expect(getReportsServerSnapshot()).toBe(getReportsServerSnapshot())
    expect(getReportsServerSnapshot()).toEqual([])
  })

  it("persists on save and hands back the new snapshot", async () => {
    const store = stubStorage()
    const { saveReports, getReportsSnapshot } = await freshReports()
    const next = [{ id: "r2" }] as never
    saveReports(next)
    expect(getReportsSnapshot()).toBe(next)
    expect(JSON.parse(store.get("mv_pending_reports")!)).toEqual([{ id: "r2" }])
  })

  it("notifies subscribers on save, and stops after unsubscribe", async () => {
    stubStorage()
    const { saveReports, subscribeReports } = await freshReports()
    const seen = vi.fn()
    const unsubscribe = subscribeReports(seen)
    saveReports([] as never)
    expect(seen).toHaveBeenCalledTimes(1)
    unsubscribe()
    saveReports([] as never)
    expect(seen).toHaveBeenCalledTimes(1)
  })
})

describe("votes store", () => {
  it("starts empty and votes up on first toggle", async () => {
    stubStorage()
    const { toggleVote, getVotesSnapshot, getVotedIdsSnapshot } = await freshVotes()
    expect(getVotesSnapshot()).toEqual({})

    toggleVote("r1")
    expect(getVotesSnapshot()).toEqual({ r1: 1 })
    expect(getVotedIdsSnapshot()).toEqual(["r1"])
  })

  it("withdraws the vote on a second toggle", async () => {
    stubStorage()
    const { toggleVote, getVotesSnapshot, getVotedIdsSnapshot } = await freshVotes()
    toggleVote("r1")
    toggleVote("r1")
    expect(getVotesSnapshot()).toEqual({ r1: 0 })
    expect(getVotedIdsSnapshot()).toEqual([])
  })

  it("never drops a tally below zero", async () => {
    stubStorage({ mv_report_votes: JSON.stringify({ r1: 0 }), mv_voted_ids: JSON.stringify(["r1"]) })
    const { toggleVote, getVotesSnapshot } = await freshVotes()
    toggleVote("r1")
    expect(getVotesSnapshot().r1).toBe(0)
  })

  it("tracks votes per report independently", async () => {
    stubStorage()
    const { toggleVote, getVotesSnapshot } = await freshVotes()
    toggleVote("r1")
    toggleVote("r2")
    toggleVote("r1")
    expect(getVotesSnapshot()).toEqual({ r1: 0, r2: 1 })
  })

  it("persists both keys", async () => {
    const store = stubStorage()
    const { toggleVote } = await freshVotes()
    toggleVote("r1")
    expect(JSON.parse(store.get("mv_report_votes")!)).toEqual({ r1: 1 })
    expect(JSON.parse(store.get("mv_voted_ids")!)).toEqual(["r1"])
  })

  it("returns stable empty server snapshots", async () => {
    const { getVotesServerSnapshot, getVotedIdsServerSnapshot } = await freshVotes()
    expect(getVotesServerSnapshot()).toBe(getVotesServerSnapshot())
    expect(getVotedIdsServerSnapshot()).toBe(getVotedIdsServerSnapshot())
  })

  it("notifies subscribers on a vote", async () => {
    stubStorage()
    const { toggleVote, subscribeVotes } = await freshVotes()
    const seen = vi.fn()
    const unsubscribe = subscribeVotes(seen)
    toggleVote("r1")
    expect(seen).toHaveBeenCalledTimes(1)
    unsubscribe()
    toggleVote("r1")
    expect(seen).toHaveBeenCalledTimes(1)
  })
})

describe("buildReportMailto", () => {
  it("addresses the municipality and encodes the category and title", async () => {
    const { buildReportMailto } = await import("./mailto")
    const url = buildReportMailto({
      id: "r1",
      category: "strade",
      title: "Buca",
      description: "grande",
      lon: 12.6,
      lat: 46.16,
      createdAt: "",
    } as never)

    expect(url.startsWith("mailto:info@comune.montereale-valcellina.pn.it?")).toBe(true)
    expect(decodeURIComponent(url)).toContain("Buca")
    expect(decodeURIComponent(url)).toContain("46.16000")
  })

  it("mentions the parcel only when both parts are known", async () => {
    const { buildReportMailto } = await import("./mailto")
    const base = { id: "r", category: "strade", title: "t", description: "", lon: 1, lat: 2, createdAt: "" }

    expect(decodeURIComponent(buildReportMailto(base as never))).not.toContain("Particella")
    const withParcel = buildReportMailto({ ...base, foglio: "5", particella: "12" } as never)
    expect(decodeURIComponent(withParcel)).toContain("foglio 5, particella 12")
  })

  it("notes an attached photo so the sender remembers to attach it", async () => {
    const { buildReportMailto } = await import("./mailto")
    const base = { id: "r", category: "strade", title: "t", description: "", lon: 1, lat: 2, createdAt: "" }
    expect(decodeURIComponent(buildReportMailto(base as never))).not.toContain("Fotografia")
    expect(
      decodeURIComponent(buildReportMailto({ ...base, photoDataUrl: "data:," } as never))
    ).toContain("Fotografia allegata")
  })

  it("falls back to a placeholder for an empty description", async () => {
    const { buildReportMailto } = await import("./mailto")
    const url = buildReportMailto({
      id: "r", category: "strade", title: "t", description: "", lon: 1, lat: 2, createdAt: "",
    } as never)
    expect(decodeURIComponent(url)).toContain("(nessuna descrizione)")
  })
})
