"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Lantern } from "./Lantern";

type Item = { href: string; label: string; icon: ReactNode };

// Small line icons (stroke = currentColor). Kana/kanji use glyphs, on-brand.
const I = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" />
    </svg>
  ),
  review: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="14" height="16" rx="2.5" /><path d="M7 9h6M7 13h6M7 17h3" /><path d="M17 5h2a2 2 0 0 1 2 2v10" opacity=".5" />
    </svg>
  ),
  stats: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  gear: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" />
    </svg>
  ),
  glyph: (ch: string) => <span className="font-jp text-[19px] leading-none">{ch}</span>,
};

const ITEMS: Item[] = [
  { href: "/", label: "Inicio", icon: I.home },
  { href: "/review", label: "Repaso", icon: I.review },
  { href: "/kana", label: "Kana", icon: I.glyph("あ") },
  { href: "/kanji", label: "Kanji", icon: I.glyph("字") },
  { href: "/stats", label: "Progreso", icon: I.stats },
  { href: "/settings", label: "Ajustes", icon: I.gear },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav({ streak = 0 }: { streak?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  // ⌘K / Ctrl-K opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex flex-row items-center justify-around border-t border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_85%,transparent)] px-2 py-1 backdrop-blur-xl
                 md:inset-y-0 md:left-0 md:right-auto md:w-64 md:flex-col md:items-stretch md:justify-start md:gap-1 md:border-r md:border-t-0 md:px-3 md:py-5"
    >
      <Link href="/" className="mb-2 hidden items-center gap-2 px-3 py-2 md:flex" aria-label="Akari — inicio">
        <Lantern size={26} />
        <span className="text-[17px] font-semibold tracking-tight text-[var(--color-fg)]">Akari</span>
        <span className="font-jp ml-auto text-sm text-[var(--color-fg-faint)]">灯</span>
      </Link>

      {ITEMS.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[11px] transition-colors duration-[var(--motion-fast)] md:flex-row md:gap-3 md:text-sm
              ${active ? "text-[var(--color-fg)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}`}
          >
            {active && (
              <span className="absolute inset-0 -z-10 rounded-xl bg-[color-mix(in_oklab,var(--color-indigo)_16%,transparent)] ring-1 ring-[color-mix(in_oklab,var(--color-indigo)_30%,transparent)]" />
            )}
            <span className={active ? "text-[var(--color-indigo)]" : ""}>{it.icon}</span>
            <span className="md:font-medium">{it.label}</span>
          </Link>
        );
      })}

      {/* arc streak + search (sidebar only) */}
      <div className="mt-auto hidden flex-col gap-3 border-t border-[var(--color-line)] pt-4 md:flex">
        <div className="flex items-center gap-2.5 px-1">
          <Lantern size={26} animated={streak > 0} intensity={Math.min(1, streak / 30)} />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-ember)]">Arco en desarrollo</div>
            <div className="text-sm font-semibold text-[var(--color-fg)]">
              {streak} <span className="font-normal text-[var(--color-fg-faint)]">días</span>
            </div>
          </div>
        </div>
        <Link
          href="/search"
          className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-fg-faint)] transition-colors hover:border-[var(--color-line-strong)]"
        >
          Buscar
          <kbd className="rounded border border-[var(--color-line-strong)] px-1.5 py-0.5 font-sans text-[10px]">⌘K</kbd>
        </Link>
      </div>
    </nav>
  );
}
