"use client";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

// Animate KanjiVG strokes in order: each stroke "draws" via stroke-dashoffset,
// its index number fading in with the brush. Replayable. Honors reduced-motion
// (renders the full glyph, no animation).
export function KanjiStrokes({ strokes, size = 300 }: { strokes: string[]; size?: number }) {
  const reduce = useReducedMotion();
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const numRefs = useRef<(SVGTextElement | null)[]>([]);
  const [playing, setPlaying] = useState(false);
  const [nums, setNums] = useState<{ x: number; y: number }[]>([]);

  // Stroke-start points for the numbers (needs the paths in the DOM).
  useEffect(() => {
    setNums(
      pathRefs.current.map((el) => {
        if (!el) return { x: 0, y: 0 };
        const p = el.getPointAtLength(0);
        return { x: p.x, y: p.y };
      }),
    );
  }, [strokes]);

  const play = useCallback(() => {
    if (reduce || playing) return;
    setPlaying(true);
    let delay = 0;
    pathRefs.current.forEach((el, i) => {
      if (!el) return;
      const len = el.getTotalLength();
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
      const num = numRefs.current[i];
      if (num) num.style.opacity = "0";
      const dur = Math.max(240, len * 7);
      el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration: dur,
        delay,
        fill: "forwards",
        easing: "cubic-bezier(0.22,1,0.36,1)",
      });
      if (num) num.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: delay + dur * 0.3, fill: "forwards" });
      delay += dur + 90;
    });
    window.setTimeout(() => setPlaying(false), delay);
  }, [reduce, playing]);

  // Auto-draw once on mount.
  useEffect(() => {
    if (!reduce) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="surface ambient-lantern relative grid aspect-square w-full place-items-center overflow-hidden" style={{ maxWidth: size }}>
        <svg viewBox="0 0 109 109" width="86%" height="86%" role="img" aria-label={`Orden de trazos (${strokes.length} trazos)`}>
          {/* faint ghost of the full glyph */}
          <g stroke="var(--color-line-strong)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.22">
            {strokes.map((d, i) => (
              <path key={`g${i}`} d={d} />
            ))}
          </g>
          {/* the animated, glowing strokes */}
          <g
            stroke="var(--color-fg)"
            strokeWidth="3.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 4px color-mix(in oklab, var(--color-ember) 55%, transparent))" }}
          >
            {strokes.map((d, i) => (
              <path
                key={i}
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                d={d}
                style={reduce ? undefined : { strokeDashoffset: 0 }}
              />
            ))}
          </g>
          {/* stroke numbers */}
          <g fontSize="5.5" fontWeight="700" fill="var(--color-indigo)" style={{ fontFamily: "var(--font-sans)" }}>
            {nums.map((n, i) => (
              <text
                key={i}
                ref={(el) => {
                  numRefs.current[i] = el;
                }}
                x={n.x}
                y={n.y}
                dx="-3.5"
                dy="-1.5"
              >
                {i + 1}
              </text>
            ))}
          </g>
        </svg>
      </div>

      {!reduce && strokes.length > 0 && (
        <button
          onClick={play}
          disabled={playing}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 py-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-ember)] disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
          </svg>
          Reproducir · {strokes.length} trazos
        </button>
      )}
    </div>
  );
}
