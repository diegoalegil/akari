"use client";
import { Lantern } from "./Lantern";

// Shown while the client database loads (first visit / hard reload).
export function Loading({ label = "Encendiendo…" }: { label?: string }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Lantern size={56} />
        <p className="text-sm text-[var(--color-fg-faint)]">{label}</p>
      </div>
    </div>
  );
}
