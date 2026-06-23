"use client";
import { useEffect, useState } from "react";
import { loadClientDb } from "./clientDb";

// Gate for data pages: returns true once the client SQLite DB is open. The load
// is a singleton (loadClientDb caches), so only the first page after a hard
// reload actually waits; client navigations are instant.
export function useDbReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let on = true;
    loadClientDb()
      .then(() => { if (on) setReady(true); })
      .catch((e) => console.error("[akari] DB load failed", e));
    return () => { on = false; };
  }, []);
  return ready;
}
