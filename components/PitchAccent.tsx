import { splitMorae, pitchPattern, pitchName } from "@/lib/pitch";

// Render a kana reading with its Tokyo pitch-accent contour: an overline over the
// high morae and a downstep bar after the accented mora. Falls back to the plain
// reading when there's no accent data or the reading doesn't align mora-for-mora
// with the one the accent was derived from (so the line never lands wrong).
export function PitchAccent({ reading, accent, pitchReading }: { reading: string; accent?: number | null; pitchReading?: string | null }) {
  const morae = splitMorae(reading);
  const aligned = accent != null && morae.length > 0 && (!pitchReading || splitMorae(pitchReading).length === morae.length);
  if (!aligned) return <>{reading}</>;

  const highs = pitchPattern(morae.length, accent);
  return (
    <span className="pitch" role="img" aria-label={`${reading} · acento ${pitchName(accent, morae.length)}`}>
      {morae.map((mo, i) => (
        <span
          key={i}
          aria-hidden
          className={`pitch-mora${highs[i] ? " is-high" : ""}${accent > 0 && i + 1 === accent ? " is-drop" : ""}`}
        >
          {mo}
        </span>
      ))}
    </span>
  );
}
