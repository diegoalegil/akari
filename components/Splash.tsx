"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lantern } from "./Lantern";

// Entrance animation: the lantern ignites and the name reveals. Shown once per
// browser session, auto-dismisses, skippable on click/keypress, never blocks.
export function Splash() {
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (sessionStorage.getItem("akari:splash") === "1") return;
    sessionStorage.setItem("akari:splash", "1");
    setShow(true);
    const ms = reduce ? 350 : 1750;
    const t = setTimeout(() => setShow(false), ms);
    const skip = () => setShow(false);
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", skip);
    };
  }, [reduce]);

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 grid cursor-pointer place-items-center bg-[var(--color-ink)]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setShow(false)}
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.55, opacity: 0, filter: "blur(6px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease }}
            >
              <Lantern size={104} />
            </motion.div>
            <div className="flex flex-col items-center gap-2 overflow-hidden">
              <motion.span
                className="font-jp text-3xl tracking-[0.35em] text-[var(--color-fg)]"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.55, ease }}
              >
                アカリ
              </motion.span>
              <motion.span
                className="text-xs font-medium uppercase tracking-[0.45em] text-[var(--color-fg-faint)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                Akari
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
