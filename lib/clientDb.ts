// Client-side SQLite for the offline PWA build. Loads the seeded database into
// sql.js (SQLite compiled to WASM), exposing a tiny better-sqlite3-compatible
// surface (prepare().get/all/run, exec, transaction, pragma) so the existing
// query modules work unchanged. The user's progress (card_state, review_log,
// settings) is persisted back to IndexedDB after every write, so it survives
// reloads and works fully offline.
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";

const IDB_NAME = "akari-db";
const IDB_STORE = "kv";
const IDB_KEY = "sqlite";

// Bump whenever the shipped seed adds/changes CONTENT (new columns, new cards,
// corrected data). Also versions the seed-fetch URL so a stale service worker
// can't hand back the previous deploy's DB during an upgrade.
const SEED_VERSION = 3;

let instance: ClientDb | null = null;
let loading: Promise<ClientDb> | null = null;

// ── IndexedDB (stores the exported DB bytes) ────────────────────────────────
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(): Promise<Uint8Array | null> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(IDB_KEY);
    r.onsuccess = () => resolve((r.result as Uint8Array) ?? null);
    r.onerror = () => reject(r.error);
  });
}
async function idbSet(bytes: Uint8Array): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── persistence (debounced; export() on a 12MB DB isn't free) ───────────────
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (!instance) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (instance) void idbSet(instance.raw.export());
  }, 600);
}

/** Force any pending write to flush (e.g. on pagehide). */
export async function flushClientDb(): Promise<void> {
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
  if (instance) await idbSet(instance.raw.export());
}

// ── better-sqlite3-compatible surface over a sql.js Database ─────────────────
class Statement {
  constructor(private raw: SqlJsDatabase, private sql: string) {}
  get(...params: unknown[]): Record<string, unknown> | undefined {
    const s = this.raw.prepare(this.sql);
    try {
      if (params.length) s.bind(params as never);
      return s.step() ? (s.getAsObject() as Record<string, unknown>) : undefined;
    } finally {
      s.free();
    }
  }
  all(...params: unknown[]): Record<string, unknown>[] {
    const s = this.raw.prepare(this.sql);
    const out: Record<string, unknown>[] = [];
    try {
      if (params.length) s.bind(params as never);
      while (s.step()) out.push(s.getAsObject() as Record<string, unknown>);
    } finally {
      s.free();
    }
    return out;
  }
  run(...params: unknown[]): { changes: number } {
    this.raw.run(this.sql, params as never);
    schedulePersist();
    return { changes: this.raw.getRowsModified() };
  }
}

export class ClientDb {
  constructor(public raw: SqlJsDatabase) {}
  prepare(sql: string): Statement {
    return new Statement(this.raw, sql);
  }
  exec(sql: string): void {
    this.raw.exec(sql);
    schedulePersist();
  }
  pragma(_: string): void {
    /* no-op: sql.js has no WAL/foreign-key pragmas we depend on */
  }
  transaction<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    return (...args: A): R => {
      this.raw.exec("BEGIN");
      try {
        const r = fn(...args);
        this.raw.exec("COMMIT");
        schedulePersist();
        return r;
      } catch (e) {
        this.raw.exec("ROLLBACK");
        throw e;
      }
    };
  }
}

async function fetchSeedBytes(): Promise<Uint8Array> {
  // The ?v= busts a stale service-worker cache so an upgrade always pulls THIS
  // deploy's seed (static hosts ignore the query string and serve the file).
  const res = await fetch(`/akari.db.gz?v=${SEED_VERSION}`);
  if (!res.ok || !res.body) throw new Error("could not fetch seed DB");
  const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ── content versioning ───────────────────────────────────────────────────────
// A cached DB below SEED_VERSION is upgraded to the new seed with the user's
// PROGRESS carried over — so content updates never wipe streaks, SRS state,
// settings or the API key.
const PROGRESS_TABLES = ["card_state", "review_log", "settings"] as const;

// Exported for the migration test (pure sql.js helpers).
export function readVersion(db: SqlJsDatabase): number {
  try {
    const r = db.exec("SELECT value FROM settings WHERE key='content_version'");
    if (r.length && r[0].values.length) return Number(r[0].values[0][0]) || 0;
  } catch {
    /* no settings table */
  }
  return 0;
}
export function stampVersion(db: SqlJsDatabase, v: number): void {
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('content_version', ?)", [String(v)]);
}
/** Copy every row of a table from one DB to another (INSERT OR REPLACE by PK). */
export function copyTable(from: SqlJsDatabase, to: SqlJsDatabase, table: string): void {
  let res;
  try {
    res = from.exec(`SELECT * FROM ${table}`);
  } catch {
    return;
  }
  if (!res.length) return;
  const { columns, values } = res[0];
  const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
  to.run("BEGIN");
  for (const row of values) to.run(sql, row as never);
  to.run("COMMIT");
}
/** Build the new seed DB and carry the user's progress + settings into it. */
async function upgradeToSeed(SQL: Awaited<ReturnType<typeof initSqlJs>>, oldDb: SqlJsDatabase): Promise<SqlJsDatabase> {
  const newDb = new SQL.Database(await fetchSeedBytes());
  // Don't commit the version bump against a STALE seed (e.g. a service worker
  // briefly served the previous deploy). If the expected new content isn't
  // there, bail so we retry on the next load instead of pinning bad content.
  const fresh = (newDb.exec("PRAGMA table_info(words)")[0]?.values as unknown[][] | undefined)?.some((c) => c[1] === "pitch_accent");
  if (!fresh) {
    newDb.close();
    throw new Error("seed missing expected content — retry later");
  }
  for (const t of PROGRESS_TABLES) copyTable(oldDb, newDb, t);
  stampVersion(newDb, SEED_VERSION);
  return newDb;
}
/** Add any columns a newer build's queries expect, so an un-upgraded (offline)
 *  cached DB doesn't throw — the new fields just read as NULL until upgrade. */
function ensureColumns(db: SqlJsDatabase): void {
  for (const sql of [
    "ALTER TABLE words ADD COLUMN furigana TEXT",
    "ALTER TABLE words ADD COLUMN pitch_accent INTEGER",
    "ALTER TABLE words ADD COLUMN pitch_reading TEXT",
    "ALTER TABLE sentences ADD COLUMN furigana TEXT",
  ]) {
    try {
      db.run(sql);
    } catch {
      /* column already exists */
    }
  }
}

/** Load (once) the client DB: from IndexedDB if present, else the seed asset.
 *  A stale cached DB is upgraded to the current seed, preserving progress. */
export async function loadClientDb(): Promise<ClientDb> {
  if (instance) return instance;
  if (loading) return loading;
  loading = (async () => {
    const SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
    const cached = await idbGet().catch(() => null);
    let db: SqlJsDatabase;
    if (!cached) {
      db = new SQL.Database(await fetchSeedBytes());
      stampVersion(db, SEED_VERSION);
      await idbSet(db.export()).catch(() => {}); // cache so we're offline-ready
    } else {
      db = new SQL.Database(cached);
      if (readVersion(db) < SEED_VERSION) {
        try {
          const upgraded = await upgradeToSeed(SQL, db);
          db.close();
          db = upgraded;
          await idbSet(db.export()).catch(() => {});
        } catch {
          // Offline / seed unavailable: keep the user's DB; ensureColumns below
          // makes it query-safe and it upgrades for real next online load.
        }
      }
    }
    // Safety net: guarantee columns newer queries expect exist, so a stale or
    // un-upgraded DB never throws "no such column" (the field just reads NULL).
    ensureColumns(db);
    instance = new ClientDb(db);
    return instance;
  })();
  return loading;
}

/** Synchronous handle — only valid after loadClientDb() has resolved. */
export function getClientDb(): ClientDb {
  if (!instance) throw new Error("client DB not loaded yet — await loadClientDb() first");
  return instance;
}
