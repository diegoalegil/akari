"use client";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// Honors the persisted "Movimiento reducido" setting for ALL framer-motion
// animations (the card flip, splash, stroke draw, panels) — not just the
// OS-level prefers-reduced-motion. "always" forces reduced; "user" defers to OS.
export function MotionProvider({ reduced, children }: { reduced: boolean; children: ReactNode }) {
  return <MotionConfig reducedMotion={reduced ? "always" : "user"}>{children}</MotionConfig>;
}
