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
  const res = await fetch("/akari.db.gz");
  if (!res.ok || !res.body) throw new Error("could not fetch seed DB");
  const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Load (once) the client DB: from IndexedDB if present, else the seed asset. */
export async function loadClientDb(): Promise<ClientDb> {
  if (instance) return instance;
  if (loading) return loading;
  loading = (async () => {
    const SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
    let bytes = await idbGet().catch(() => null);
    if (!bytes) {
      bytes = await fetchSeedBytes();
      await idbSet(bytes).catch(() => {}); // cache the seed so we're offline-ready
    }
    instance = new ClientDb(new SQL.Database(bytes));
    return instance;
  })();
  return loading;
}

/** Synchronous handle — only valid after loadClientDb() has resolved. */
export function getClientDb(): ClientDb {
  if (!instance) throw new Error("client DB not loaded yet — await loadClientDb() first");
  return instance;
}

/** Wipe the persisted DB and reload the seed (full reset, offline-safe). */
export async function resetClientDb(): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  instance = null;
  loading = null;
}
