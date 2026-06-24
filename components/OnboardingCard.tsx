"use client";
import { useState } from "react";

// Shown on the dashboard only for a brand-new account (no reviews yet), so a
// first-time user isn't dropped cold into SRS jargon. Dismissible; it also stops
// appearing once the user has done their first review (everReviewed gate).
export function OnboardingCard() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("akari:onboarded") === "1"; } catch { return false; }
  });
  if (dismissed) return null;
  const close = () => {
    try { localStorage.setItem("akari:onboarded", "1"); } catch { /* private mode — fine */ }
    setDismissed(true);
  };
  return (
    <div className="surface relative overflow-hidden p-5">
      <button onClick={close} aria-label="Cerrar bienvenida" className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-lg text-[var(--color-fg-faint)] transition-colors hover:text-[var(--color-fg)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <div className="flex items-center gap-2">
        <span lang="ja" className="font-jp text-xl text-[var(--color-ember)]">灯</span>
        <h2 className="font-medium text-[var(--color-fg)]">Te damos la bienvenida a Akari</h2>
      </div>
      <p className="mt-2 max-w-prose text-pretty text-sm text-[var(--color-fg-muted)]">
        Aprendes japonés con <span className="text-[var(--color-fg)]">repetición espaciada</span>: ves una palabra, intentas recordarla, y te la mostramos justo cuando estás a punto de olvidarla.
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-fg-muted)]">
        <li>· Toca <span className="text-[var(--color-fg)]">«Empezar sesión»</span>, luego «Mostrar respuesta».</li>
        <li>· Di qué tal la recordaste — <span className="text-[var(--color-fg)]">Otra vez · Difícil · Bien · Fácil</span>; el tiempo bajo cada botón es cuándo volverá.</li>
        <li>· Vuelve cada día: tu racha (🏮) crece y la luz brilla más.</li>
      </ul>
    </div>
  );
}
