import { parseFurigana } from "@/lib/furigana";

// Render Anki ruby ("日本[にほん]語[ご]") as <ruby> with reading annotations.
// The readings (<rt>) are hidden when the user turns furigana off — that's a
// CSS toggle on <html> (.no-furigana), so toggling never re-renders. Pass the
// plain expression as `fallback` for words with no stored furigana.
export function Furigana({ text, fallback, className }: { text?: string | null; fallback?: string; className?: string }) {
  const src = (text && text.trim()) || fallback || "";
  const tokens = parseFurigana(src);
  if (tokens.length === 0) return <span className={className}>{fallback}</span>;
  return (
    <span className={className}>
      {tokens.map((t, i) =>
        "base" in t ? (
          <ruby key={i}>
            {t.base}
            <rt>{t.rt}</rt>
          </ruby>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </span>
  );
}
