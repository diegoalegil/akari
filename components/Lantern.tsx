"use client";
import { useId } from "react";

/**
 * The Akari mark: a paper lantern (灯) whose flame breathes and casts a warm
 * glow — the brand's emotional core. Pure SVG + CSS so it renders anywhere.
 *
 * ✦ REDISEÑO vs. the original component:
 *  - `intensity` (0..1, normally streak/30) now drives THREE "temperaturas de
 *    vida de la llama": brasa rojiza (racha corta) → llama estable → llama
 *    dorada plena. The flame gradient's hot stop shifts with the streak, so a
 *    veteran's lantern visibly burns warmer than a novice's, not just brighter.
 *  - The glow radius/opacity scale with intensity (unchanged mapping kept).
 *  - Optional one-shot `milestone` ring (7 / 30 / 100 days) — a single expanding
 *    halo, no looping decoration. Gated by `prefers-reduced-motion`.
 *
 * Drop-in: same public API as the original (`size, glow, animated, intensity,
 * className`) plus the optional `milestone`.
 */
export function Lantern({
  size = 28,
  glow = true,
  animated = true,
  intensity = 1,
  milestone = false,
  className = "",
}: {
  size?: number;
  glow?: boolean;
  animated?: boolean;
  intensity?: number; // 0..1 — scales glow + flame warmth (e.g. streak/30)
  milestone?: boolean; // play a single ignite-ring once (streak hit a threshold)
  className?: string;
}) {
  const t = Math.max(0, Math.min(1, intensity));
  const glowOpacity = 0.3 + 0.7 * t;
  // Three flame temperatures — the hot (top) stop warms with the streak.
  const flameHot = t < 0.34 ? "#e6905a" : t < 0.67 ? "#f2b66b" : "#ffc879";
  const uid = useId().replace(/:/g, "");
  const glowId = `akariGlow-${uid}`;
  const flameId = `akariFlame-${uid}`;

  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-grid", placeItems: "center", lineHeight: 0 }}
    >
      {/* one-shot milestone halo — a single expanding ember ring, then gone */}
      {milestone && animated && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid color-mix(in oklab, var(--color-ember) 60%, transparent)",
            animation: "ignite-ring 700ms cubic-bezier(0.22,1,0.36,1) both",
          }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ position: "relative" }}>
        <defs>
          <radialGradient id={glowId} cx="50%" cy="52%" r="50%">
            <stop offset="0%" stopColor="var(--color-ember)" stopOpacity="0.9" />
            <stop offset="55%" stopColor="var(--color-akari)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-ember)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={flameId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--color-akari)" />
            <stop offset="100%" stopColor={flameHot} />
          </linearGradient>
        </defs>

        {glow && (
          <circle
            cx="24"
            cy="25"
            r="19"
            fill={`url(#${glowId})`}
            opacity={glowOpacity}
            style={animated ? { animation: "glow-pulse 4s ease-in-out infinite", transformOrigin: "center" } : undefined}
          />
        )}

        {/* lantern body + ribs */}
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M20 7h8" />
          <path d="M24 7v2" />
          <path d="M24 9C16 10 14 16.5 14 24c0 7.5 2 13 10 14 8-1 10-6.5 10-14 0-7.5-2-14-10-15Z" fill="var(--color-surface)" />
          <path d="M15 17.5h18" opacity="0.5" />
          <path d="M14.2 24h19.6" opacity="0.5" />
          <path d="M15 30.5h18" opacity="0.5" />
          <path d="M22 38.4h4" />
          <path d="M24 38.4V42" />
        </g>

        {/* flame — colour warms with the streak via flameHot */}
        <path
          d="M24 18.5c-3.2 3-3.4 6.2-.2 8 .2.1.4.1.6 0 3-1.9 2.8-5 .2-8-.1-.1-.5-.1-.6 0Z"
          fill={`url(#${flameId})`}
          style={animated ? { animation: "flame-breathe 3s ease-in-out infinite", transformOrigin: "24px 26px" } : undefined}
        />
      </svg>
    </span>
  );
}
