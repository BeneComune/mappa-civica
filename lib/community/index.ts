// lib\community\index.ts
// Port of the old app's communityStore.ts. Official duckdb-backed reports
// live in lib/duckdb.ts (loadCommunityReports) and are merged in at the
// component level, since they aren't persisted to localStorage.
export { CATEGORIES, categoryLabel, type CategoryId } from "./categories"
export type { CommunityReport } from "./types"
export { resizeImageToDataUrl } from "./resize-image"
export { buildReportMailto } from "./mailto"
export {
  getReportsServerSnapshot,
  getReportsSnapshot,
  saveReports,
  subscribeReports,
} from "./reports-store"
export {
  getVotedIdsServerSnapshot,
  getVotedIdsSnapshot,
  getVotesServerSnapshot,
  getVotesSnapshot,
  subscribeVotes,
  toggleVote,
} from "./votes-store"
