"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KanaSpeedGame } from "@/components/kana/KanaSpeedGame";
import { getKanaGameRounds } from "@/lib/kanaGame";
import type { KanaType } from "@/lib/kana";
import { Loading } from "@/components/Loading";
import { useDbReady } from "@/lib/useDb";

export default function KanaSpeedPage() {
  // useSearchParams needs a Suspense boundary for static generation.
  return (
    <Suspense fallback={<Loading />}>
      <SpeedInner />
    </Suspense>
  );
}

function SpeedInner() {
  const sp = useSearchParams();
  const script: KanaType = sp.get("script") === "katakana" ? "katakana" : "hiragana";
  const dbReady = useDbReady();
  if (!dbReady) return <Loading />;
  const rounds = getKanaGameRounds(script);
  return <KanaSpeedGame script={script} rounds={rounds} />;
}
