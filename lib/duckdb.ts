// lib\duckdb.ts
import * as duckdb from "@duckdb/duckdb-wasm"
import type { CategoryId, CommunityReport } from "@/lib/community"

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
const DATABASE_URL = "/data/community_data.duckdb"

async function makeDuckDb(): Promise<{
  db: duckdb.AsyncDuckDB
  worker: Worker
  workerUrl: string
}> {
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
  )
  const worker = new Worker(workerUrl)
  const logger = new duckdb.ConsoleLogger()
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  const absoluteDbUrl = new URL(DATABASE_URL, window.location.href).toString()
  await db.registerFileURL("community_data.duckdb", absoluteDbUrl, duckdb.DuckDBDataProtocol.HTTP, false)
  return { db, worker, workerUrl }
}

// Official reports the municipality has ingested into the read-only DuckDB
// snapshot (distinct from locally-pending, unsubmitted reports stored in
// localStorage - see lib/community.ts). Loaded once on mount and merged with
// the pending list, favoring pending on id collisions.
export async function loadCommunityReports(): Promise<CommunityReport[]> {
  const { db, worker, workerUrl } = await makeDuckDb()
  const conn = await db.connect()
  try {
    await conn.query("ATTACH 'community_data.duckdb' AS community (READ_ONLY);")
    const result = await conn.query(`
      SELECT
        id::VARCHAR         AS id,
        category            AS category,
        title               AS title,
        description         AS description,
        lon                 AS lon,
        lat                 AS lat,
        created_at::VARCHAR AS created_at
      FROM community.reports;
    `)
    return result.toArray().map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id ?? ""),
        category: String(r.category ?? "") as CategoryId,
        title: String(r.title ?? ""),
        description: String(r.description ?? ""),
        lon: Number(r.lon ?? 0),
        lat: Number(r.lat ?? 0),
        createdAt: String(r.created_at ?? ""),
      }
    })
  } catch {
    return []
  } finally {
    await conn.close()
    await db.terminate()
    worker.terminate()
    URL.revokeObjectURL(workerUrl)
  }
}
