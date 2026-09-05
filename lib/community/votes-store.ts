// lib\community\votes-store.ts
// Upvoting ("Anche a me importa"): the same subscribe/snapshot pattern as
// ./reports-store, over two keys - the per-report tally, and which reports
// this browser has already voted for.
import { readJSON } from "./storage"

type Votes = Record<string, number>

const VOTES_KEY = "mv_report_votes"
const VOTED_IDS_KEY = "mv_voted_ids"
const EMPTY_VOTES: Votes = {}
const EMPTY_VOTED_IDS: string[] = []
const voteListeners = new Set<() => void>()
let cachedVotes: Votes | null = null
let cachedVotedIds: string[] | null = null

export function subscribeVotes(onChange: () => void): () => void {
  voteListeners.add(onChange)
  return () => voteListeners.delete(onChange)
}

export function getVotesSnapshot(): Votes {
  if (cachedVotes === null) cachedVotes = readJSON(VOTES_KEY, {})
  return cachedVotes
}

export function getVotesServerSnapshot(): Votes {
  return EMPTY_VOTES
}

export function getVotedIdsSnapshot(): string[] {
  if (cachedVotedIds === null) cachedVotedIds = readJSON(VOTED_IDS_KEY, [])
  return cachedVotedIds
}

export function getVotedIdsServerSnapshot(): string[] {
  return EMPTY_VOTED_IDS
}

export function toggleVote(reportId: string): void {
  const votes = { ...getVotesSnapshot() }
  const votedIds = new Set(getVotedIdsSnapshot())
  if (votedIds.has(reportId)) {
    votes[reportId] = Math.max(0, (votes[reportId] ?? 1) - 1)
    votedIds.delete(reportId)
  } else {
    votes[reportId] = (votes[reportId] ?? 0) + 1
    votedIds.add(reportId)
  }
  cachedVotes = votes
  cachedVotedIds = [...votedIds]
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
    window.localStorage.setItem(VOTED_IDS_KEY, JSON.stringify(cachedVotedIds))
  }
  for (const listener of voteListeners) listener()
}
