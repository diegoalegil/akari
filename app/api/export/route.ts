import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Download the user's SRS progress (history + card state) as JSON.
export async function GET() {
  const db = getDb();
  const data = {
    app: "akari",
    exported_at: new Date().toISOString(),
    review_log: db.prepare("SELECT * FROM review_log").all(),
    card_state: db.prepare("SELECT * FROM card_state").all(),
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="akari-progreso.json"',
    },
  });
}
