// Deterministic gojūon reference table. NOT generated content — this is the
// fixed Japanese syllabary. Hiragana + Hepburn romaji are authored here;
// katakana is derived by Unicode shift (hiragana + 0x60) so it cannot drift.

export type KanaEntry = {
  char: string;
  romaji: string;
  type: "hiragana" | "katakana";
  row: number;
  col: number;
  group_tag: "gojuon" | "dakuten" | "handakuten" | "combo";
};

type Base = { romaji: string; hira: string; row: number; col: number; group: KanaEntry["group_tag"] };

// [romaji, hiragana] grouped by gojūon row.
const GOJUON: [string, string][][] = [
  [["a", "あ"], ["i", "い"], ["u", "う"], ["e", "え"], ["o", "お"]],
  [["ka", "か"], ["ki", "き"], ["ku", "く"], ["ke", "け"], ["ko", "こ"]],
  [["sa", "さ"], ["shi", "し"], ["su", "す"], ["se", "せ"], ["so", "そ"]],
  [["ta", "た"], ["chi", "ち"], ["tsu", "つ"], ["te", "て"], ["to", "と"]],
  [["na", "な"], ["ni", "に"], ["nu", "ぬ"], ["ne", "ね"], ["no", "の"]],
  [["ha", "は"], ["hi", "ひ"], ["fu", "ふ"], ["he", "へ"], ["ho", "ほ"]],
  [["ma", "ま"], ["mi", "み"], ["mu", "む"], ["me", "め"], ["mo", "も"]],
  [["ya", "や"], ["yu", "ゆ"], ["yo", "よ"]],
  [["ra", "ら"], ["ri", "り"], ["ru", "る"], ["re", "れ"], ["ro", "ろ"]],
  [["wa", "わ"], ["wo", "を"]],
  [["n", "ん"]],
];

const DAKUTEN: [string, string][][] = [
  [["ga", "が"], ["gi", "ぎ"], ["gu", "ぐ"], ["ge", "げ"], ["go", "ご"]],
  [["za", "ざ"], ["ji", "じ"], ["zu", "ず"], ["ze", "ぜ"], ["zo", "ぞ"]],
  [["da", "だ"], ["ji", "ぢ"], ["zu", "づ"], ["de", "で"], ["do", "ど"]],
  [["ba", "ば"], ["bi", "び"], ["bu", "ぶ"], ["be", "べ"], ["bo", "ぼ"]],
];

const HANDAKUTEN: [string, string][][] = [
  [["pa", "ぱ"], ["pi", "ぴ"], ["pu", "ぷ"], ["pe", "ぺ"], ["po", "ぽ"]],
];

const COMBO: [string, string][][] = [
  [["kya", "きゃ"], ["kyu", "きゅ"], ["kyo", "きょ"]],
  [["sha", "しゃ"], ["shu", "しゅ"], ["sho", "しょ"]],
  [["cha", "ちゃ"], ["chu", "ちゅ"], ["cho", "ちょ"]],
  [["nya", "にゃ"], ["nyu", "にゅ"], ["nyo", "にょ"]],
  [["hya", "ひゃ"], ["hyu", "ひゅ"], ["hyo", "ひょ"]],
  [["mya", "みゃ"], ["myu", "みゅ"], ["myo", "みょ"]],
  [["rya", "りゃ"], ["ryu", "りゅ"], ["ryo", "りょ"]],
  [["gya", "ぎゃ"], ["gyu", "ぎゅ"], ["gyo", "ぎょ"]],
  [["ja", "じゃ"], ["ju", "じゅ"], ["jo", "じょ"]],
  [["bya", "びゃ"], ["byu", "びゅ"], ["byo", "びょ"]],
  [["pya", "ぴゃ"], ["pyu", "ぴゅ"], ["pyo", "ぴょ"]],
];

function flatten(groups: [string, string][][], group: KanaEntry["group_tag"], rowBase: number): Base[] {
  const out: Base[] = [];
  groups.forEach((row, r) =>
    row.forEach(([romaji, hira], c) => out.push({ romaji, hira, row: rowBase + r, col: c, group })),
  );
  return out;
}

/** hiragana char -> katakana char (per code point; non-hiragana passes through). */
function toKatakana(hira: string): string {
  let out = "";
  for (const ch of hira) {
    const cp = ch.codePointAt(0)!;
    out += cp >= 0x3041 && cp <= 0x3096 ? String.fromCodePoint(cp + 0x60) : ch;
  }
  return out;
}

export function buildKana(): KanaEntry[] {
  const base: Base[] = [
    ...flatten(GOJUON, "gojuon", 0),
    ...flatten(DAKUTEN, "dakuten", 100),
    ...flatten(HANDAKUTEN, "handakuten", 200),
    ...flatten(COMBO, "combo", 300),
  ];
  const entries: KanaEntry[] = [];
  for (const b of base) {
    entries.push({ char: b.hira, romaji: b.romaji, type: "hiragana", row: b.row, col: b.col, group_tag: b.group });
    entries.push({ char: toKatakana(b.hira), romaji: b.romaji, type: "katakana", row: b.row, col: b.col, group_tag: b.group });
  }
  return entries;
}
