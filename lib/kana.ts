import { getDb } from "./db";
import { seeded } from "./queries";
import { previewIntervals, type Intervals } from "./fsrs";

export type KanaType = "hiragana" | "katakana";
export type Mastery = "new" | "learning" | "known" | "due";

export type KanaCell = {
  id: number;
  char: string;
  romaji: string;
  row: number;
  col: number;
  group: string;
  mastery: Mastery;
};

type Row = Record<string, unknown>;

/** The gojūon grid for one script, each cell tagged with its mastery state. */
export function getKanaGrid(type: KanaType): KanaCell[] {
  const db = getDb();
  if (!seeded(db)) return [];
  const now = Date.now();
  const rows = db
    .prepare(
      `SELECT k.id id, k.char char, k.romaji romaji, k.row row, k.col col, k.group_tag grp,
              cs.introduced_at intro, cs.due due, cs.state state
       FROM kana k LEFT JOIN card_state cs ON cs.card_type='kana' AND cs.card_id = k.id
       WHERE k.type = ? ORDER BY k.group_tag, k.row, k.col`,
    )
    .all(type) as Row[];

  return rows.map((r) => {
    let mastery: Mastery = "new";
    if (r.intro) {
      if (r.due && new Date(r.due as string).getTime() <= now) mastery = "due";
      else if (r.state === 2) mastery = "known";
      else mastery = "learning";
    }
    return {
      id: r.id as number,
      char: r.char as string,
      romaji: r.romaji as string,
      row: r.row as number,
      col: r.col as number,
      group: r.grp as string,
      mastery,
    };
  });
}

export type KanaQueueItem = {
  id: number;
  char: string;
  romaji: string;
  isNew: boolean;
  intervals: Intervals;
};

/** Drill queue for one script: due reviews + new kana up to a session limit. */
export function getKanaQueue(type: KanaType, limitNew = 20): KanaQueueItem[] {
  const db = getDb();
  if (!seeded(db)) return [];
  // Daily cap: don't keep introducing fresh kana every visit.
  const introducedToday = (
    db
      .prepare(
        `SELECT count(*) c FROM card_state cs JOIN kana k ON k.id = cs.card_id
         WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NOT NULL
           AND date(cs.introduced_at,'localtime') = date('now','localtime')`,
      )
      .get(type) as { c: number }
  ).c;
  const freshLimit = Math.max(0, limitNew - introducedToday);
  const due = db
    .prepare(
      `SELECT k.id id, k.char char, k.romaji romaji, cs.fsrs_card fc
       FROM card_state cs JOIN kana k ON k.id = cs.card_id
       WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NOT NULL
         AND cs.due IS NOT NULL AND datetime(cs.due) <= datetime('now')
       ORDER BY datetime(cs.due) ASC`,
    )
    .all(type) as Row[];
  const fresh = db
    .prepare(
      `SELECT k.id id, k.char char, k.romaji romaji, cs.fsrs_card fc
       FROM card_state cs JOIN kana k ON k.id = cs.card_id
       WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NULL
       ORDER BY k.row, k.col LIMIT ?`,
    )
    .all(type, freshLimit) as Row[];

  const now = new Date();
  return [...due.map((r) => ({ r, isNew: false })), ...fresh.map((r) => ({ r, isNew: true }))].map(({ r, isNew }) => ({
    id: r.id as number,
    char: r.char as string,
    romaji: r.romaji as string,
    isNew,
    intervals: previewIntervals(r.fc as string, now),
  }));
}

export function kanaMastery(type: KanaType): { known: number; total: number } {
  const grid = getKanaGrid(type);
  return { known: grid.filter((c) => c.mastery === "known").length, total: grid.length };
}

/** Combined kana practice load (due reviews + new available) across both scripts,
 *  plus the script with the most to do — so the daily chain can deep-link
 *  straight into a drill instead of the trainer hub. */
export function kanaCounts(limitNew = 20): { due: number; newAvail: number; script: KanaType } {
  const db = getDb();
  if (!seeded(db)) return { due: 0, newAvail: 0, script: "hiragana" };
  let due = 0, newAvail = 0, bestScript: KanaType = "hiragana", bestLoad = -1;
  for (const t of ["hiragana", "katakana"] as KanaType[]) {
    const dueT = (
      db
        .prepare(
          `SELECT count(*) c FROM card_state cs JOIN kana k ON k.id = cs.card_id
           WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NOT NULL
             AND cs.due IS NOT NULL AND datetime(cs.due) <= datetime('now')`,
        )
        .get(t) as { c: number }
    ).c;
    const introToday = (
      db
        .prepare(
          `SELECT count(*) c FROM card_state cs JOIN kana k ON k.id = cs.card_id
           WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NOT NULL
             AND date(cs.introduced_at,'localtime') = date('now','localtime')`,
        )
        .get(t) as { c: number }
    ).c;
    const notIntro = (
      db
        .prepare(
          `SELECT count(*) c FROM card_state cs JOIN kana k ON k.id = cs.card_id
           WHERE cs.card_type='kana' AND k.type = ? AND cs.introduced_at IS NULL`,
        )
        .get(t) as { c: number }
    ).c;
    const newT = Math.max(0, Math.min(limitNew - introToday, notIntro));
    due += dueT;
    newAvail += newT;
    if (dueT + newT > bestLoad) {
      bestLoad = dueT + newT;
      bestScript = t;
    }
  }
  return { due, newAvail, script: bestScript };
}
