"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Quiet entrance: fade + small rise. Used with a capped stagger so chrome stays
// calm (the heroes are the card-flip and stroke-draw, not list entrances).
export function Reveal({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: Math.min(delay, 0.28) }}
    >
      {children}
    </motion.div>
  );
}
