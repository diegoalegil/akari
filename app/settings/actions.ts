import { getDb } from "@/lib/db";
import { emptyCard, cardColumns } from "@/lib/fsrs";

export async function updateSetting(key: string, value: string) {
  getDb().prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
  return { ok: true as const };
}

/**
 * Store (or clear) the user's own Anthropic API key for the Explícame panel.
 * Stored in the in-browser settings table and read client-side only by
 * components/explain/Explain.tsx, which passes it straight to the Anthropic SDK
 * in the browser (dangerouslyAllowBrowser). It never reaches a server of ours
 * and getSettings() only ever exposes a hasApiKey boolean. Basic shape check to
 * catch typos.
 */
export async function setApiKey(raw: string) {
  const key = raw.trim();
  if (key && !/^sk-ant-/.test(key)) return { ok: false as const, reason: "format" as const };
  const db = getDb();
  if (key) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('anthropic_api_key', ?)").run(key);
  else db.prepare("DELETE FROM settings WHERE key = 'anthropic_api_key'").run();
  return { ok: true as const, set: key.length > 0 };
}

/** Wipe review history and reset every card to a fresh FSRS state. */
export async function resetProgress() {
  const db = getDb();
  // Mirror the SAME denormalized columns the seed and grade paths write — an empty
  // card has numeric stability/difficulty, not NULL — so a reset card is byte-for-
  // byte a fresh card, not a subtly different one the queue could treat oddly.
  const col = cardColumns(emptyCard(new Date()));
  const rows = db.prepare("SELECT card_type, card_id FROM card_state").all() as { card_type: string; card_id: number }[];
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM review_log").run();
    const upd = db.prepare(
      `UPDATE card_state SET fsrs_card=?, fsrs_stability=?, fsrs_difficulty=?, fsrs_reps=0,
        fsrs_lapses=0, due=NULL, state=?, last_review=NULL, introduced_at=NULL WHERE card_type=? AND card_id=?`,
    );
    for (const r of rows) upd.run(col.fsrs_card, col.fsrs_stability, col.fsrs_difficulty, col.state, r.card_type, r.card_id);
  });
  tx();
  return { ok: true as const };
}
