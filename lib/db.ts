// Database handle. Akari runs entirely in the browser (offline PWA): getDb()
// returns the sql.js-backed client database, which loadClientDb() opens once
// (from IndexedDB or the seed asset) before any data-reading page renders. The
// query modules call this and stay driver-agnostic via the better-sqlite3-
// compatible shim in clientDb.ts.
import { getClientDb, type ClientDb } from "./clientDb";

export function getDb(): ClientDb {
  return getClientDb();
}

export type Db = ClientDb;
