/** Parse a JSON string-array column defensively. The deck is seeded from
 *  validated data so these are always valid, but the whole SQLite image is
 *  persisted to / re-imported from IndexedDB; a truncated or corrupted blob
 *  could yield malformed text. One bad row then degrades to an empty array
 *  instead of throwing the entire page render (mirrors previewIntervals). */
export function safeParseArray(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
