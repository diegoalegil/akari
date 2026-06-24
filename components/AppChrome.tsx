"use client";
import { useEffect } from "react";
import { Nav } from "./Nav";
import { Splash } from "./Splash";
import { MotionProvider } from "./MotionProvider";
import { getSettings, getStreak } from "@/lib/queries";
import { useDbReady, useDbError } from "@/lib/useDb";
import { setSoundEnabled } from "@/lib/sound";
import { flushClientDb } from "@/lib/clientDb";

// Client app shell: once the DB is open it reads the user's settings and applies
// theme, reduced-motion and sound, and feeds the streak to the nav. The chrome
// (nav, splash) renders immediately so the app never looks empty while loading.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const ready = useDbReady();
  const dbError = useDbError();
  const settings = ready ? getSettings() : null;
  const streak = ready ? getStreak() : 0;

  useEffect(() => {
    if (!settings) return;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.classList.toggle("reduce-motion", settings.reducedMotion);
    document.documentElement.classList.toggle("no-furigana", !settings.furigana);
    document.documentElement.classList.toggle("no-pitch", !settings.pitch);
    setSoundEnabled(settings.sound);
  }, [settings?.theme, settings?.reducedMotion, settings?.sound, settings?.furigana, settings?.pitch]);

  // Persist any debounced write before the tab is hidden or closed. The 600ms
  // persist debounce in clientDb would otherwise drop the last grade if the user
  // backgrounds the PWA or closes the tab right after answering a card.
  useEffect(() => {
    const flush = () => { void flushClientDb(); };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // A fatal load error (unsupported browser, or a first-ever offline visit with
  // no seed) would otherwise leave every page stuck on its splash — show why.
  if (dbError) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-sm text-center">
          <p lang="ja" className="font-jp text-4xl text-[var(--color-ember)]">灯</p>
          <p className="mt-4 text-pretty text-sm text-[var(--color-fg-muted)]">{dbError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <MotionProvider reduced={settings?.reducedMotion ?? false}>
      <Splash />
      <Nav streak={streak} />
      <main className="min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64">{children}</main>
    </MotionProvider>
  );
}
