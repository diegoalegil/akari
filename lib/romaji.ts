// Romaji → hiragana, so a beginner can search "mizu" / "tabemono" and hit 水 /
// 食べ物 without a Japanese keyboard. Deterministic Hepburn (+ common kunrei
// variants si/tu/hu…). Pure; used only to widen search, never to author content.

// Longest-first so multi-letter syllables win the greedy match.
const MAP: Record<string, string> = {
  kya: "きゃ", kyu: "きゅ", kyo: "きょ", sha: "しゃ", shu: "しゅ", sho: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ", nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ", mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ", gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ", jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ", pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  sya: "しゃ", syu: "しゅ", syo: "しょ", tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ",
  shi: "し", chi: "ち", tsu: "つ",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", si: "し", su: "す", se: "せ", so: "そ",
  ta: "た", ti: "ち", tu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を", wi: "ゐ", we: "ゑ",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", zi: "じ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  a: "あ", i: "い", u: "う", e: "え", o: "お", n: "ん",
  "-": "ー",
};

/** Convert a romaji string to hiragana. Unknown characters pass through, so a
 *  partial/odd query degrades gracefully (search just matches less). */
export function romajiToKana(input: string): string {
  let s = input.toLowerCase().replace(/[^a-z-]/g, "");
  let out = "";
  let i = 0;
  while (i < s.length) {
    // ん before a consonant (and not part of a na-row syllable): nk → んk.
    if (s[i] === "n" && i + 1 < s.length && !"aiueoy".includes(s[i + 1])) {
      out += "ん";
      i += 1;
      continue;
    }
    // Double consonant → っ (e.g. "kk", "tt", "ssh", but not "nn").
    if (s[i] === s[i + 1] && !"aiueon".includes(s[i]) && /[a-z]/.test(s[i])) {
      out += "っ";
      i += 1;
      continue;
    }
    let matched = false;
    for (const len of [3, 2, 1]) {
      const chunk = s.slice(i, i + len);
      if (MAP[chunk]) {
        out += MAP[chunk];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += s[i];
      i += 1;
    }
  }
  return out;
}

/** True if the query is plain Latin letters (so it should be romaji-expanded). */
export function isRomaji(q: string): boolean {
  return /^[a-zA-Z][a-zA-Z\s'-]*$/.test(q.trim());
}
