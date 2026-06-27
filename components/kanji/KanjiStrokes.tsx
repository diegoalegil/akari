"use client";
import { useReducedMotionConfig } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * REDISEÑO — KanjiVG stroke order, with a luminous brush tip. Each stroke draws
 * via stroke-dashoffset (unchanged), and now an ember-haloed point travels along
 * the stroke as it's written (CSS offset-path synced to the same duration),
 * lifting off like a brush at the end. The stroke numbers fade in when the brush
 * reaches their origin. Replayable; honours reduced-motion (full glyph, no draw).
 */
export function KanjiStrokes({ strokes, size = 300 }: { strokes: string[]; size?: number }) {
  const reduce = useReducedMotionConfig();
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const numRefs = useRef<(SVGTextElement | null)[]>([]);
  const tipRefs = useRef<(SVGCircleElement | null)[]>([]);
  const [playing, setPlaying] = useState(false);
  const [nums, setNums] = useState<{ x: number; y: number }[]>([]);
  const didAutoPlay = useRef(false);
  const strokeNoun = strokes.length === 1 ? "trazo" : "trazos";

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
      const tip = tipRefs.current[i];
      const dur = Math.max(240, len * 7);
      el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay, fill: "forwards", easing: "cubic-bezier(0.22,1,0.36,1)" });
      if (num) num.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: delay + dur * 0.3, fill: "forwards" });
      // brush tip rides the stroke, then lifts off
      if (tip) {
        tip.style.offsetPath = `path("${strokes[i]}")`;
        tip.animate(
          [
            { offsetDistance: "0%", opacity: 0, offset: 0 },
            { opacity: 1, offset: 0.08 },
            { opacity: 1, offset: 0.85 },
            { offsetDistance: "100%", opacity: 0, offset: 1 },
          ],
          { duration: dur, delay, fill: "forwards", easing: "cubic-bezier(0.22,1,0.36,1)" },
        );
      }
      delay += dur + 90;
    });
    window.setTimeout(() => setPlaying(false), delay);
  }, [reduce, playing, strokes]);

  useEffect(() => {
    if (!nums.length && pathRefs.current.length) {
      setNums(
        pathRefs.current.map((el) => {
          if (!el) return { x: 0, y: 0 };
          const p = el.getPointAtLength(0);
          return { x: p.x, y: p.y };
        }),
      );
      return;
    }
    if (nums.length && !didAutoPlay.current && !reduce) {
      didAutoPlay.current = true;
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nums, reduce]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="surface ambient-lantern relative grid aspect-square w-full place-items-center overflow-hidden" style={{ maxWidth: size }}>
        <svg viewBox="0 0 109 109" width="86%" height="86%" role="img" aria-label={`Orden de trazos (${strokes.length} ${strokeNoun})`}>
          {/* faint ghost of the full glyph */}
          <g stroke="var(--color-line-strong)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.22">
            {strokes.map((d, i) => (
              <path key={`g${i}`} d={d} />
            ))}
          </g>
          {/* the animated, glowing strokes */}
          <g stroke="var(--color-fg)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 4px color-mix(in oklab, var(--color-ember) 55%, transparent))" }}>
            {strokes.map((d, i) => (
              <path key={i} ref={(el) => { pathRefs.current[i] = el; }} d={d} style={reduce ? undefined : { strokeDashoffset: 0 }} />
            ))}
          </g>
          {/* brush tips — one per stroke, hidden until its stroke draws */}
          {!reduce && (
            <g style={{ filter: "drop-shadow(0 0 5px color-mix(in oklab, var(--color-ember) 85%, transparent))" }}>
              {strokes.map((_, i) => (
                <circle key={`t${i}`} ref={(el) => { tipRefs.current[i] = el; }} r="2.2" fill="var(--color-ember)" style={{ opacity: 0, offsetRotate: "0deg" }} />
              ))}
            </g>
          )}
          {/* stroke numbers */}
          <g fontSize="5.5" fontWeight="700" fill="var(--color-indigo)" style={{ fontFamily: "var(--font-sans)" }}>
            {nums.map((n, i) => (
              <text key={i} ref={(el) => { numRefs.current[i] = el; }} x={n.x} y={n.y} dx="-3.5" dy="-1.5">
                {i + 1}
              </text>
            ))}
          </g>
        </svg>
      </div>

      {!reduce && strokes.length > 0 && (
        <button onClick={play} disabled={playing} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 py-1.5 text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-ember)] hover:text-[var(--color-ember)] disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          Reproducir · {strokes.length} {strokeNoun}
        </button>
      )}
    </div>
  );
}
