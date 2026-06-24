"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { searchAll, type SearchResults } from "@/app/search/actions";
import { Furigana } from "@/components/Furigana";

export function SearchClient() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchResults>({ words: [], kanji: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setRes({ words: [], kanji: [] });
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      void searchAll(q).then((r) => {
        if (active) setRes(r); // ignore stale out-of-order responses
      });
    }, 180);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-4 py-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-fg-faint)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar"
          placeholder="Busca una palabra, lectura, kanji o significado…"
          className="flex-1 bg-transparent text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:outline-none"
        />
      </div>

      {!q.trim() && (
        <div className="mt-7">
          <p className="text-sm text-[var(--color-fg-muted)]">Busca en japonés, en romaji o en español. Prueba:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["水", "tomodachi", "agua", "日本語", "rojo"].map((ex) => (
              <button
                key={ex}
                onClick={() => { setQ(ex); inputRef.current?.focus(); }}
                lang={/[ぁ-んァ-ヶ㐀-鿿]/.test(ex) ? "ja" : undefined}
                className="rounded-full border border-[var(--color-line-strong)] px-3 py-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-fg)]"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {q.trim() && res.kanji.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Kanji</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {res.kanji.map((k) => (
              <Link key={k.literal} href={`/kanji/${encodeURIComponent(k.literal)}`} className="surface group flex flex-col items-center gap-1 p-3 transition-colors hover:border-[var(--color-line-strong)]">
                <span lang="ja" className="font-jp text-3xl text-[var(--color-fg)] group-hover:text-[var(--color-ember)]">{k.literal}</span>
                <span className="line-clamp-1 w-full text-center text-[11px] text-[var(--color-fg-faint)]">{k.meaning}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {q.trim() && res.words.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">Vocabulario</h2>
          <ul className="divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            {res.words.map((w, i) => (
              <li key={w.expression + i} className="flex items-center justify-between gap-4 px-5 py-3">
                <div lang="ja" className="min-w-0 font-jp text-lg leading-relaxed text-[var(--color-fg)]">
                  <Furigana text={w.furigana} fallback={w.expression} />
                </div>
                <span className="max-w-[50%] truncate text-right text-sm text-[var(--color-fg-muted)]">{w.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q.trim() && res.words.length === 0 && res.kanji.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--color-fg-faint)]">Sin resultados para «{q}».</p>
      )}
    </div>
  );
}
