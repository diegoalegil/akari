"use client";
import { useEffect, useState } from "react";
import { loadClientDb } from "./clientDb";

// Load result is process-wide (loadClientDb is a singleton), so cache it at the
// module level and let hooks subscribe — every data page shares the one outcome.
let loadError: Error | null = null;
let settled = false;
const listeners = new Set<() => void>();
function startLoad() {
  if (settled || loadError) return;
  loadClientDb().then(
    () => { settled = true; listeners.forEach((l) => l()); },
    (e) => { loadError = e instanceof Error ? e : new Error(String(e)); console.error("[akari] DB load failed", e); listeners.forEach((l) => l()); },
  );
}

/** Retry after a fatal load error — e.g. a first-ever offline visit that couldn't
 *  fetch the seed, once connectivity returns. Clears the latched error and re-enters
 *  the singleton load (which nulled its memo on the prior rejection), so no hard
 *  reload is needed. */
export function retryDbLoad(): void {
  if (settled) return;
  loadError = null;
  listeners.forEach((l) => l()); // clear the error UI immediately
  startLoad();
}

// Gate for data pages: returns true once the client SQLite DB is open. The load
// is a singleton (loadClientDb caches), so only the first page after a hard
// reload actually waits; client navigations are instant.
export function useDbReady(): boolean {
  const [ready, setReady] = useState(settled);
  useEffect(() => {
    let on = true;
    const sync = () => { if (on && settled) setReady(true); };
    listeners.add(sync);
    startLoad();
    sync();
    return () => { on = false; listeners.delete(sync); };
  }, []);
  return ready;
}

/** The fatal DB-load error, if any (e.g. an unsupported browser, or the seed
 *  couldn't be fetched on a first-ever offline visit). Lets the shell show a
 *  clear message instead of an endless splash. */
export function useDbError(): Error | null {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    listeners.add(sync);
    startLoad();
    return () => { listeners.delete(sync); };
  }, []);
  return loadError;
}
