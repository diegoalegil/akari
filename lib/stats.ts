import "server-only";
import { getDb } from "./db";
import { computeStreak, seeded } from "./queries";

type Row = Record<string, unknown>;
const n = (db: ReturnType<typeof getDb>, sql: string, ...p: unknown[]) =>
  (db.prepare(sql).get(...p) as { c: number }).c;

export type Stats = {
  retention: number | null; // 0–1, pass rate of reviews
  streak: number;
  viewsToday: number;
  mastery: number | null; // 0–1, introduced cards in Review state
  totalReviews: number;
  heatmap: { date: string; count: number }[]; // last 53 weeks, week-aligned
  heatmapMax: number;
  jlpt: { level: string; total: number; known: number }[];
  forecast: { date: string; count: number }[]; // next 14 days
};

const EMPTY: Stats = {
  retention: null, streak: 0, viewsToday: 0, mastery: null, totalReviews: 0,
  heatmap: [], heatmapMax: 0, jlpt: [5, 4, 3, 2, 1].map((l) => ({ level: `N${l}`, total: 0, known: 0 })), forecast: [],
};

export function getStats(): Stats {
  const db = getDb();
  if (!seeded(db)) return EMPTY;
  const totalReviews = n(db, "SELECT count(*) c FROM review_log");
  const passed = n(db, "SELECT count(*) c FROM review_log WHERE grade >= 3");
  // Word-scoped, mirroring the (word-only) dashboard so "dominio" is a vocab figure.
  const introduced = n(db, "SELECT count(*) c FROM card_state WHERE card_type='word' AND introduced_at IS NOT NULL");
  const known = n(db, "SELECT count(*) c FROM card_state WHERE card_type='word' AND introduced_at IS NOT NULL AND state = 2");

  // heatmap: counts per day, then fill the last 53 week-aligned weeks
  const counts = new Map<string, number>();
  for (const r of db.prepare("SELECT date(reviewed_at,'localtime') d, count(*) c FROM review_log GROUP BY d").all() as Row[]) {
    counts.set(r.d as string, r.c as number);
  }
  const today = new Date((db.prepare("SELECT date('now','localtime') d").get() as Row).d + "T00:00:00Z");
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay())); // pad to end of week (Sat)
  const heatmap: { date: string; count: number }[] = [];
  let heatmapMax = 0;
  for (let i = 53 * 7 - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const c = counts.get(key) ?? 0;
    heatmapMax = Math.max(heatmapMax, c);
    heatmap.push({ date: key, count: c });
  }

  // JLPT mastery from words.jlpt (null until the JLPT dataset is integrated)
  const jlptRows = db
    .prepare(
      `SELECT w.jlpt lvl, count(*) total, sum(CASE WHEN cs.state = 2 THEN 1 ELSE 0 END) known
       FROM words w LEFT JOIN card_state cs ON cs.card_type='word' AND cs.card_id = w.id
       WHERE w.jlpt IS NOT NULL GROUP BY w.jlpt`,
    )
    .all() as Row[];
  const byLvl = new Map<number, { total: number; known: number }>();
  for (const r of jlptRows) byLvl.set(r.lvl as number, { total: r.total as number, known: (r.known as number) || 0 });
  const jlpt = [5, 4, 3, 2, 1].map((lvl) => ({ level: `N${lvl}`, total: byLvl.get(lvl)?.total ?? 0, known: byLvl.get(lvl)?.known ?? 0 }));

  // forecast: due counts for the next 14 days
  const dueCounts = new Map<string, number>();
  for (const r of db
    .prepare(
      "SELECT date(due,'localtime') d, count(*) c FROM card_state WHERE introduced_at IS NOT NULL AND due IS NOT NULL GROUP BY d",
    )
    .all() as Row[]) {
    dueCounts.set(r.d as string, r.c as number);
  }
  const forecast: { date: string; count: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    let c = dueCounts.get(key) ?? 0;
    if (i === 0) {
      // fold overdue into today
      for (const [k, v] of dueCounts) if (k < key) c += v;
    }
    forecast.push({ date: key, count: c });
  }

  return {
    retention: totalReviews ? passed / totalReviews : null,
    streak: computeStreak(db),
    viewsToday: n(db, "SELECT count(*) c FROM review_log WHERE date(reviewed_at,'localtime') = date('now','localtime')"),
    mastery: introduced ? known / introduced : null,
    totalReviews,
    heatmap,
    heatmapMax,
    jlpt,
    forecast,
  };
}
