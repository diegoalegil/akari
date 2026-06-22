import "server-only";
import Database from "better-sqlite3";
import path from "node:path";

// Server-only SQLite handle. Imported by server actions / route handlers — never
// by client components. The database file is produced by `npm run seed`.
export const DB_PATH = path.join(process.cwd(), "data", "app.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH, { fileMustExist: false });
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  return _db;
}
