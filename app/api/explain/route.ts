import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The ONLY runtime LLM in Akari. On-demand grammar/usage explanations, streamed,
// clearly labeled "IA" in the UI. It never writes to the deck — it only reads
// the card context passed in and explains. Requires ANTHROPIC_API_KEY in
// .env.local (the user's own key; this is a per-click feature).
//
// Model defaults to Sonnet 4.6 — plenty for short explanations and far cheaper
// than Opus, which matters since the user pays per use. Override with EXPLAIN_MODEL.
const MODEL = process.env.EXPLAIN_MODEL || "claude-sonnet-4-6";

const SYSTEM = `Eres «Sensei», el tutor de japonés de la app Akari. Explicas GRAMÁTICA y USO en ESPAÑOL, claro y conciso, en markdown breve.
- Tono cálido con guiños sutiles de anime, sin pasarte, sin emojis excesivos.
- SOLO explicas: nunca afirmas haber modificado tarjetas ni el mazo (no puedes hacerlo).
- Cita el japonés solo como ejemplo; cualquier lectura que menciones debe coincidir con el contexto dado.
- Si no estás seguro de algo, dilo abiertamente.
- No inventes datos del diccionario; si te preguntan por algo fuera del contexto, acláralo.`;

type Body = {
  context?: { expression?: string; reading?: string; meaning?: string; sentence?: string };
  history?: { role: "user" | "assistant"; text: string }[];
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("NO_KEY", { status: 503 });
  }

  // Same-origin guard: this endpoint bills the user's own key, so reject
  // cross-origin callers before reaching Anthropic.
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get("host")) return new Response("forbidden", { status: 403 });
    } catch {
      return new Response("bad request", { status: 400 });
    }
  }

  const { context, history }: Body = await req.json().catch(() => ({}));

  // Clamp input size: cap turns and total characters to avoid abusive payloads.
  if (history) {
    if (history.length > 20) return new Response("demasiados mensajes", { status: 413 });
    const totalChars = history.reduce((n, m) => n + (m.text?.length ?? 0), 0);
    if (totalChars > 8000) return new Response("mensaje demasiado largo", { status: 413 });
  }
  const ctx = context
    ? `Contexto de la tarjeta (datos validados, no los contradigas):
- Expresión: ${context.expression ?? "—"}
- Lectura: ${context.reading ?? "—"}
- Significado: ${context.meaning ?? "—"}${context.sentence ? `\n- Frase: ${context.sentence}` : ""}`
    : "Sin contexto de tarjeta.";

  const messages = (history?.length ? history : [{ role: "user" as const, text: "Explícame la gramática y el uso." }]).map((m) => ({
    role: m.role,
    content: m.text,
  }));

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: `${SYSTEM}\n\n${ctx}`,
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n_(se interrumpió la respuesta)_"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
