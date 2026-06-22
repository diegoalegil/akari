"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { playSound } from "@/lib/sound";

// Primary CTA with an `S` keyboard shortcut (ignored while typing in a field).
export function StartSession({ label = "Empezar sesión" }: { label?: string }) {
  const router = useRouter();
  const go = useCallback(() => { playSound("start"); router.push("/review"); }, [router]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        go();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <button
      onClick={go}
      className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-akari)] to-[var(--color-ember)] px-5 py-2.5 font-semibold text-[var(--color-ink-deep)] shadow-[var(--akari-glow)] transition-[filter,transform] duration-[var(--motion-base)] ease-[var(--ease-akari)] hover:brightness-105 active:scale-[0.98]"
    >
      {label}
      <span aria-hidden>→</span>
      <kbd className="ml-1 rounded bg-black/20 px-1.5 py-0.5 font-sans text-xs">S</kbd>
    </button>
  );
}
