"use client";
import { useEffect } from "react";
import { setSoundEnabled } from "@/lib/sound";

// Pushes the persisted "Sonidos" setting into the sound module so playSound()
// respects it everywhere. Renders nothing.
export function SoundProvider({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    setSoundEnabled(enabled);
  }, [enabled]);
  return null;
}
