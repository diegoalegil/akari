// Client-side SQLite for the offline PWA build. Loads the seeded database into
// sql.js (SQLite compiled to WASM), exposing a tiny better-sqlite3-compatible
// surface (prepare().get/all/run, exec, transaction, pragma) so the existing
// query modules work unchanged. The user's progress (card_state, review_log,
// settings) is persisted back to IndexedDB after every write, so it survives
// reloads and works fully offline.
//
// Persistence is split so the core review loop stays cheap: only the three
// progress tables change while studying, so every grade rewrites just those
// (a small "overlay", IDB key `progress`). The full 12.7 MB database (`sqlite`)
// is re-exported only on seed, content upgrade, or an explicit flush. On load
// the overlay is folded back over the full checkpoint — see loadClientDb.
import initSqlJs, { type Database as SqlJsDatabase, type Statement as SqlJsStatement } from "sql.js";

const IDB_NAME = "akari-db";
const IDB_STORE = "kv";
const IDB_KEY_FULL = "sqlite"; // { gen, bytes } — whole DB; written on seed/upgrade/flush only
const IDB_KEY_PROGRESS = "progress"; // { gen, contentVersion, tables } — the 3 progress tables; every grade

// Bump whenever the shipped seed adds/changes CONTENT (new columns, new cards,
// corrected data). Also versions the seed-fetch URL so a stale service worker
// can't hand back the previous deploy's DB during an upgrade.
const SEED_VERSION = 3;

// Only these tables change during study; the overlay snapshots exactly them.
const PROGRESS_TABLES = ["card_state", "review_log", "settings"] as const;

let instance: ClientDb | null = null;
let loading: Promise<ClientDb> | null = null;

// Monotonic persistence generation. Every overlay/full write stamps the current
// gen; load() uses it to tell which of the two on-disk copies of progress is
// newer (the overlay almost always is) and to ignore a stale overlay left by a
// crash mid-checkpoint. Resumed from disk on load so this session supersedes it.
let persistGen = 0;
function nextGen(): number {
  return ++persistGen;
}

// Whether THIS tab has progress changes not yet written to IndexedDB. Guards a
// multi-tab hazard: with two tabs/PWA windows open over the one shared DB, an
// idle tab's visibilitychange→flush would otherwise rewrite the shared overlay
// (and 12.7 MB blob) from its OWN stale in-memory state, silently burying the
// other tab's whole study session. An idle tab never makes a change, so it never
// becomes dirty, so it never writes — the clobber can't happen.
let dirty = false;

// Set when a persist hits the storage quota — surfaced so a failed durable write is
// a known, queryable state instead of a silently-swallowed rejection.
let storageFull = false;
/** Whether a write has hit the IndexedDB quota (progress may not be fully durable). */
export function isStorageFull(): boolean {
  return storageFull;
}
function noteWriteError(e: unknown): void {
  if ((e as { name?: string } | null)?.name === "QuotaExceededError") {
    storageFull = true;
    console.error("akari: storage is full — your progress may not be saved. Free up space or export a backup.", e);
  }
}

// ── progress snapshot/apply (pure sql.js; exported for the round-trip tests) ──
type TableSnapshot = { columns: string[]; values: unknown[][] };
export type ProgressSnapshot = { contentVersion: number; tables: Record<string, TableSnapshot> };
type ProgressOverlay = ProgressSnapshot & { gen: number };
type FullCheckpoint = { gen: number; bytes: Uint8Array };

/** Whether the saved overlay may REPLACE the checkpoint's progress on load. It
 *  must be at least as new (gen) — so a stale overlay left by a crash mid-
 *  checkpoint can never regress progress — and describe the same content
 *  version, so its full-table replace is a faithful swap (a different version
 *  goes through the merge path instead). Exported for the persistence tests. */
export function overlayReplaces(baseGen: number, overlay: ProgressOverlay | null, baseVersion: number): boolean {
  return !!overlay && overlay.gen >= baseGen && overlay.contentVersion === baseVersion;
}

/** Snapshot the three progress tables (full contents, not a delta) so applying
 *  the result reproduces them exactly — including row deletions. Cheap: these
 *  tables are tiny next to the content the rest of the DB carries. */
export function snapshotProgress(db: SqlJsDatabase): ProgressSnapshot {
  const tables: Record<string, TableSnapshot> = {};
  for (const t of PROGRESS_TABLES) {
    const res = db.exec(`SELECT * FROM "${t}"`);
    tables[t] = res.length ? { columns: res[0].columns, values: res[0].values as unknown[][] } : { columns: [], values: [] };
  }
  return { contentVersion: readVersion(db), tables };
}

/** Write a progress snapshot back onto a DB.
 *  - "replace": make each table EXACTLY equal the snapshot (DELETE then INSERT).
 *    Used when the snapshot and target share the same content version, so it
 *    round-trips byte-for-byte and honours deletions (cleared API key, reset).
 *  - "merge":   INSERT OR REPLACE only, keeping rows the snapshot lacks. Used to
 *    carry progress onto a NEWER seed (new cards must survive) — same semantics
 *    as the content-upgrade copyTable. Runs in one transaction; rolls back on
 *    any error so a bad snapshot can never leave a half-applied table. */
export function applyProgressSnapshot(db: SqlJsDatabase, snap: ProgressSnapshot, mode: "replace" | "merge"): void {
  db.run("BEGIN");
  try {
    for (const t of PROGRESS_TABLES) {
      const snapT = snap.tables[t];
      if (!snapT) continue;
      // DELETE must precede the empty-values short-circuit below: an empty
      // snapshot table must still empty a populated target (that's how "replace"
      // honours deletions / a reset). Do not hoist the empty check above this.
      if (mode === "replace") db.run(`DELETE FROM "${t}"`);
      if (!snapT.values.length) continue;
      const cols = snapT.columns;
      const colList = cols.map((c) => `"${c}"`).join(",");
      const sql = `INSERT OR REPLACE INTO "${t}" (${colList}) VALUES (${cols.map(() => "?").join(",")})`;
      for (const row of snapT.values) db.run(sql, row as never);
    }
    db.run("COMMIT");
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }
}

// ── IndexedDB (stores the full checkpoint + the progress overlay) ────────────
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key: string): Promise<unknown> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
    r.onsuccess = () => resolve(r.result ?? null);
    r.onerror = () => reject(r.error);
  });
}
async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetFull(): Promise<FullCheckpoint | null> {
  const v = await idbGet(IDB_KEY_FULL);
  if (!v) return null;
  if (v instanceof Uint8Array) return { gen: 0, bytes: v }; // legacy: bare bytes from before the overlay split
  const o = v as { gen?: number; bytes?: unknown };
  return o.bytes instanceof Uint8Array ? { gen: typeof o.gen === "number" ? o.gen : 0, bytes: o.bytes } : null;
}
/** A stored overlay is well-formed: each table is {columns:string[], values:rows}
 *  and every row matches the column count. Rejects a truncated/corrupt overlay so
 *  it's never applied (which would throw mid-load or silently skip rows). */
function validTables(tables: unknown): tables is Record<string, TableSnapshot> {
  if (!tables || typeof tables !== "object") return false;
  for (const t of Object.values(tables as Record<string, unknown>)) {
    const ts = t as Partial<TableSnapshot>;
    if (!ts || !Array.isArray(ts.columns) || !Array.isArray(ts.values)) return false;
    if (ts.columns.some((c) => typeof c !== "string")) return false;
    if (ts.values.some((row) => !Array.isArray(row) || row.length !== ts.columns!.length)) return false;
  }
  return true;
}
async function idbGetOverlay(): Promise<ProgressOverlay | null> {
  const v = await idbGet(IDB_KEY_PROGRESS);
  if (!v || typeof v !== "object") return null;
  const o = v as Partial<ProgressOverlay>;
  if (typeof o.gen !== "number" || !validTables(o.tables)) return null; // malformed — reject, don't apply
  return { gen: o.gen, contentVersion: typeof o.contentVersion === "number" ? o.contentVersion : 0, tables: o.tables };
}

// ── persistence ──────────────────────────────────────────────────────────────
// Before writing our overlay, fold in any NEWER overlay another tab/window wrote to
// the shared store — otherwise this tab buries that tab's grades under its own older
// state. At runtime both tabs are the same content version, so ids line up and a
// plain merge is correct. The dirty/idle guard already stops an idle tab from
// clobbering; this covers the harder case of two ACTIVE tabs. (Lock-free: the
// idbGet→idbSet gap is a tiny TOCTOU window; a navigator.locks read-modify-write
// would close it fully but is deliberately omitted so the pagehide write stays fast.)
async function foldConcurrentOverlay(): Promise<void> {
  if (!instance) return;
  const disk = await idbGetOverlay().catch(() => null);
  if (!disk || disk.gen <= persistGen) return; // ours is already current — nothing to fold
  try {
    applyProgressSnapshot(instance.raw, disk, "merge");
  } catch (e) {
    console.warn("akari: could not fold a concurrent tab's progress", e);
  }
  persistGen = Math.max(persistGen, disk.gen);
}

/** Write just the progress overlay (the hot path: runs after every grade). */
async function persistOverlay(): Promise<void> {
  if (!instance || !dirty) return;
  await foldConcurrentOverlay();
  dirty = false; // cleared at snapshot time; a write during the await re-sets it
  try {
    const snap = snapshotProgress(instance.raw);
    await idbSet(IDB_KEY_PROGRESS, { gen: nextGen(), contentVersion: snap.contentVersion, tables: snap.tables });
  } catch (e) {
    dirty = true; // write failed — keep us dirty so the next flush/grade retries
    noteWriteError(e);
    throw e;
  }
}
/** Write a full checkpoint: refresh the overlay AND the whole-DB blob. Overlay
 *  first so that on a fire-and-forget pagehide the small write — which carries
 *  the last grade — is the one most likely to finish before the page dies. */
async function persistFull(): Promise<void> {
  if (!instance) return;
  dirty = false;
  // Capture BOTH the overlay snapshot and the full bytes synchronously, before
  // any await — otherwise a grade slipping in between the two writes would make
  // the same-gen overlay and checkpoint disagree, and load would pick the
  // overlay and drop that grade.
  const gen = nextGen();
  const snap = snapshotProgress(instance.raw);
  let bytes: Uint8Array;
  try {
    bytes = instance.export();
    await idbSet(IDB_KEY_PROGRESS, { gen, contentVersion: snap.contentVersion, tables: snap.tables });
    await idbSet(IDB_KEY_FULL, { gen, bytes });
  } catch (e) {
    dirty = true;
    noteWriteError(e);
    throw e;
  }
}

// Debounced: a burst of writes within a session coalesces into one overlay write.
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (!instance) return;
  dirty = true;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistOverlay().catch((e) => console.warn("akari: progress may not be saved — IndexedDB write failed", e));
  }, 600);
}

/** Flush any pending progress write now (on pagehide / visibilitychange→hidden, or
 *  before a backup export). No-op when this tab has no unsaved change — so an idle
 *  background tab can't overwrite another open tab's freshly-graded progress.
 *
 *  The overlay is written FIRST and awaited: it's small enough to win the race
 *  against the page being torn down, and the load path folds it back over the
 *  checkpoint, so it alone makes the last grade durable. The full 12.7 MB checkpoint
 *  is then refreshed best-effort — keeping the fallback blob fresh when there's time,
 *  but never being the thing that races teardown (the old code did the export first,
 *  which routinely lost that race and took the last grade with it). */
export async function flushClientDb(): Promise<void> {
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
  if (!instance || !dirty) return;
  await persistOverlay();
  await persistFull();
}

// ── better-sqlite3-compatible surface over a sql.js Database ─────────────────
class Statement {
  constructor(private db: ClientDb, private sql: string) {}
  get(...params: unknown[]): Record<string, unknown> | undefined {
    const s = this.db.cachedStmt(this.sql);
    try {
      s.reset();
      if (params.length) s.bind(params as never);
      return s.step() ? (s.getAsObject() as Record<string, unknown>) : undefined;
    } finally {
      s.reset(); // release the read cursor's lock so a later write/COMMIT can't hit "statements in progress"
    }
  }
  all(...params: unknown[]): Record<string, unknown>[] {
    const s = this.db.cachedStmt(this.sql);
    const out: Record<string, unknown>[] = [];
    try {
      s.reset();
      if (params.length) s.bind(params as never);
      while (s.step()) out.push(s.getAsObject() as Record<string, unknown>);
    } finally {
      s.reset();
    }
    return out;
  }
  run(...params: unknown[]): { changes: number } {
    // Writes stay on sql.js's own prepare/step/free (not the read-statement
    // cache) so the progress hot path keeps its exact, proven semantics.
    this.db.raw.run(this.sql, params as never);
    schedulePersist();
    return { changes: this.db.raw.getRowsModified() };
  }
}

export class ClientDb {
  // Compiled read statements, cached per SQL string. Reused via reset()+bind()
  // instead of re-preparing on every get()/all(). The cache lives only as long
  // as the in-memory DB; all DDL (ensureColumns/migrations) runs before the
  // instance exists, and exec() (the only post-construction DDL path) clears it.
  private stmts = new Map<string, SqlJsStatement>();
  constructor(public raw: SqlJsDatabase) {}
  cachedStmt(sql: string): SqlJsStatement {
    let s = this.stmts.get(sql);
    if (!s) {
      s = this.raw.prepare(sql);
      this.stmts.set(sql, s);
    }
    return s;
  }
  private clearStmts(): void {
    for (const s of this.stmts.values()) s.free();
    this.stmts.clear();
  }
  prepare(sql: string): Statement {
    return new Statement(this, sql);
  }
  exec(sql: string): void {
    this.clearStmts(); // exec may run DDL; never let a cached statement outlive a schema change
    this.raw.exec(sql);
    schedulePersist();
  }
  /** Serialize the whole DB. sql.js's export() FINALIZES every prepared
   *  statement and reopens the connection, so our cached statements are stale
   *  afterwards — drop them (they're already freed) so the next query re-prepares
   *  against the new handle instead of touching freed memory. Always export
   *  through here, never raw.export() directly, or the cache will dangle. */
  export(): Uint8Array {
    const bytes = this.raw.export();
    this.stmts.clear();
    return bytes;
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

// Thrown when the browser can't gunzip the seed (DecompressionStream landed in
// Safari/iOS 16.4; every other Akari prerequisite runs on iOS 15–16.3). The UI
// shows this message instead of an endless splash. See lib/useDb.ts.
export const UNSUPPORTED_BROWSER = "Akari necesita un navegador más reciente (iOS 16.4 o posterior). Actualiza para empezar.";

async function fetchSeedBytes(): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") throw new Error(UNSUPPORTED_BROWSER);
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
/** Copy every row of a table from one DB to another (INSERT OR REPLACE by PK).
 *  Skips only a genuinely-absent table; a read failure on a PRESENT table means
 *  corruption and is allowed to throw so the caller aborts rather than silently
 *  dropping the user's progress. */
export function copyTable(from: SqlJsDatabase, to: SqlJsDatabase, table: string): void {
  const exists = from.exec(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='${table}'`).length > 0;
  if (!exists) return;
  const res = from.exec(`SELECT * FROM "${table}"`);
  if (!res.length) return;
  const { columns, values } = res[0];
  const colList = columns.map((c) => `"${c}"`).join(",");
  const sql = `INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${columns.map(() => "?").join(",")})`;
  to.run("BEGIN");
  for (const row of values) to.run(sql, row as never);
  to.run("COMMIT");
}
// ── content-version id remap ──────────────────────────────────────────────────
// card_state/review_log key progress to a content row by integer id. Those ids are
// NOT stable across content versions — word ids track kaishi_order and kana ids the
// fixed gojūon index (both stable), but kanji ids are assigned in discovery order,
// so adding/removing a word can shift them. Carrying progress across an upgrade by
// raw id would silently re-attach a card to the WRONG entry. So translate each
// card_id through its NATURAL key (what the row actually is) old→new instead.
export type CardIdRemap = { word: Map<number, number>; kanji: Map<number, number>; kana: Map<number, number> };
const REMAP_SPECS = [
  { type: "word", table: "words", key: ["expression", "reading"] },
  { type: "kanji", table: "kanji", key: ["literal"] },
  { type: "kana", table: "kana", key: ["char"] },
] as const;

function naturalKeyRows(db: SqlJsDatabase, table: string, keyCols: readonly string[]): [number, string][] {
  const res = db.exec(`SELECT id, ${keyCols.map((c) => `"${c}"`).join(",")} FROM "${table}"`);
  if (!res.length) return [];
  return (res[0].values as unknown[][]).map((row) => [row[0] as number, row.slice(1).map((v) => String(v ?? "")).join(" ")]);
}

/** Map each old content id to its new id by natural key, per card type. Ids whose
 *  natural key no longer exists in the new seed are simply absent (their progress
 *  is dropped on copy — no orphan rows pointing at nothing). Exported for tests. */
export function buildCardIdRemap(oldDb: SqlJsDatabase, newDb: SqlJsDatabase): CardIdRemap {
  const out: CardIdRemap = { word: new Map(), kanji: new Map(), kana: new Map() };
  for (const s of REMAP_SPECS) {
    const keyToNewId = new Map(naturalKeyRows(newDb, s.table, s.key).map(([id, key]) => [key, id] as const));
    for (const [oldId, key] of naturalKeyRows(oldDb, s.table, s.key)) {
      const newId = keyToNewId.get(key);
      if (newId !== undefined) out[s.type].set(oldId, newId);
    }
  }
  return out;
}

/** Rewrite a progress snapshot's card_state/review_log card_id through the remap,
 *  dropping rows whose card no longer exists. settings (no card_id) passes through
 *  untouched. Pure — exported for tests. */
export function remapProgressSnapshot(snap: ProgressSnapshot, remap: CardIdRemap): ProgressSnapshot {
  const tables: Record<string, TableSnapshot> = {};
  for (const [name, t] of Object.entries(snap.tables)) {
    const typeIdx = t.columns.indexOf("card_type");
    const idIdx = t.columns.indexOf("card_id");
    if (typeIdx < 0 || idIdx < 0) { tables[name] = t; continue; } // e.g. settings
    const values: unknown[][] = [];
    for (const row of t.values) {
      const newId = remap[row[typeIdx] as keyof CardIdRemap]?.get(row[idIdx] as number);
      if (newId === undefined) continue; // card vanished from the new seed — drop it
      const out = row.slice();
      out[idIdx] = newId;
      values.push(out);
    }
    tables[name] = { columns: t.columns, values };
  }
  return { contentVersion: snap.contentVersion, tables };
}

/** Build the new seed DB and carry the user's progress + settings into it. */
async function upgradeToSeed(
  SQL: Awaited<ReturnType<typeof initSqlJs>>,
  oldDb: SqlJsDatabase,
  overlay: ProgressOverlay | null,
  baseGen: number,
): Promise<SqlJsDatabase> {
  const newDb = new SQL.Database(await fetchSeedBytes());
  // Don't commit the version bump against a STALE seed (e.g. a service worker
  // briefly served the previous deploy). If it isn't the expected version, bail and
  // retry next load instead of pinning bad content. Prefer the seed's OWN declared
  // version (build-db now stamps content_version); fall back to a content marker for
  // an older, pre-stamp seed — that fallback can go once the deployed seed is stamped.
  const declared = readVersion(newDb);
  const hasV3Marker = (newDb.exec("PRAGMA table_info(words)")[0]?.values as unknown[][] | undefined)?.some((c) => c[1] === "pitch_accent");
  const fresh = declared === SEED_VERSION || (declared === 0 && hasV3Marker);
  if (!fresh) {
    newDb.close();
    throw new Error("seed missing expected content — retry later");
  }
  // Carry progress by NATURAL KEY rather than raw id (kanji ids in particular can
  // shift between content versions), translating card_state/review_log card_id
  // old→new and dropping cards that no longer exist. settings passes through. The
  // new seed already ships a fresh card_state for every current card; merging over
  // it keeps those rows for new cards and overwrites the ones the user has touched.
  const remap = buildCardIdRemap(oldDb, newDb);
  applyProgressSnapshot(newDb, remapProgressSnapshot(snapshotProgress(oldDb), remap), "merge");
  // The overlay can be fresher than the cached base — e.g. a crash between the
  // overlay and full-DB writes of a prior checkpoint leaves the overlay a
  // generation ahead. Fold it in (also remapped) so no graded card is left behind.
  if (overlay && overlay.gen >= baseGen) {
    try {
      applyProgressSnapshot(newDb, remapProgressSnapshot(overlay, remap), "merge");
    } catch (e) {
      console.warn("akari: overlay merge during upgrade failed — base progress kept", e);
    }
  }
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
 *  A stale cached DB is upgraded to the current seed, preserving progress. The
 *  small progress overlay (newer than the full checkpoint) is folded back in
 *  before any version copy reads progress out of the DB. */
export async function loadClientDb(): Promise<ClientDb> {
  if (instance) return instance;
  if (loading) return loading;
  loading = (async () => {
    // Ask the browser to make our storage persistent so IndexedDB isn't silently
    // evicted (WebKit's ~7-day script-storage cap, or eviction under storage
    // pressure) — that would wipe the user's ONLY copy of their FSRS progress
    // with no error. Best-effort + fire-and-forget: a denial changes nothing, a
    // grant prevents silent total loss.
    try { void navigator.storage?.persist?.(); } catch { /* unsupported — ignore */ }
    const SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
    const full = await idbGetFull().catch(() => null);
    const overlay = await idbGetOverlay().catch(() => null);
    const baseGen = full?.gen ?? 0;
    // Resume the counter so this session's writes strictly supersede what's on disk.
    persistGen = Math.max(persistGen, baseGen, overlay?.gen ?? 0);

    // Open the cached full checkpoint, but sanity-check it — a corrupt blob must
    // NOT get the app stuck (it would re-throw forever); fall back to the seed.
    let db: SqlJsDatabase | null = null;
    if (full?.bytes) {
      try {
        const d = new SQL.Database(full.bytes);
        d.exec("SELECT 1 FROM card_state LIMIT 1");
        db = d;
      } catch {
        db = null; // corrupt checkpoint — load the seed below (don't overwrite the cache)
      }
    }

    if (db) {
      // The overlay holds the freshest progress; fold it over the checkpoint
      // before the version check possibly copies progress out of this DB.
      if (overlayReplaces(baseGen, overlay, readVersion(db))) {
        try {
          applyProgressSnapshot(db, overlay!, "replace");
        } catch (e) {
          console.warn("akari: progress overlay unreadable — using last full checkpoint", e);
        }
      }
      let builtNew = false;
      if (readVersion(db) < SEED_VERSION) {
        try {
          const upgraded = await upgradeToSeed(SQL, db, overlay, baseGen);
          db.close();
          db = upgraded;
          builtNew = true;
        } catch {
          // Offline / seed unavailable / corrupt source: keep the user's DB;
          // ensureColumns below makes it query-safe; it upgrades next online load.
        }
      }
      ensureColumns(db);
      instance = new ClientDb(db);
      // Only the upgrade rebuilt content — refresh the full checkpoint then. A
      // valid current-version base is left untouched: that's the whole point —
      // grading rewrites only the cheap overlay, never the 12.7 MB blob.
      if (builtNew) await persistFull().catch((e) => console.warn("akari: persist after upgrade failed", e));
    } else {
      const hadCache = !!full?.bytes;
      db = new SQL.Database(await fetchSeedBytes());
      // Recover progress saved in the overlay onto the fresh seed (best-effort).
      if (overlay) {
        try {
          applyProgressSnapshot(db, overlay, "merge");
        } catch (e) {
          console.warn("akari: could not recover progress overlay onto seed", e);
        }
      }
      // Stamp AFTER the merge: the overlay carries the OLD content_version, which
      // a merge would otherwise write back over the fresh seed, forcing a need-
      // less re-upgrade next load. This is THIS seed, so it is SEED_VERSION.
      stampVersion(db, SEED_VERSION);
      ensureColumns(db);
      instance = new ClientDb(db);
      // Only persist when there was NO cache — never overwrite a corrupt one
      // (a transient corruption may still be recoverable; the overlay holds
      // progress regardless and the next grade refreshes it).
      if (!hadCache) await persistFull().catch((e) => console.warn("akari: initial persist failed", e));
    }
    return instance;
  })().catch((e) => {
    // Don't cache a rejection (e.g. first-ever load while offline) — null the
    // memo so a later call retries instead of replaying the failure forever.
    loading = null;
    throw e;
  });
  return loading;
}

/** Synchronous handle — only valid after loadClientDb() has resolved. */
export function getClientDb(): ClientDb {
  if (!instance) throw new Error("client DB not loaded yet — await loadClientDb() first");
  return instance;
}
