import Anthropic from "@anthropic-ai/sdk";
import { getSetting } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The ONLY runtime LLM in Akari. On-demand grammar/usage explanations, streamed,
// clearly labeled "IA" in the UI. It never writes to the deck — it only reads
// the card context passed in and explains. The API key is the user's own: read
// from ANTHROPIC_API_KEY (.env.local) OR from the in-app setting they enter in
// Ajustes (stored locally, server-side only). This is a per-click feature.
//
// Model = Sonnet 4.6: plenty for short explanations, far cheaper than Opus,
// which matters since the user pays per use. Override with EXPLAIN_MODEL.
const MODEL = process.env.EXPLAIN_MODEL || "claude-sonnet-4-6";

const SYSTEM = `Eres «Sensei», el tutor de japonés de Akari: un sensei con MUCHA personalidad — cálido, ingenioso y con un humor seco y simpático de profe otaku que ha visto demasiado anime (pero que sabe cuándo ponerse serio). Hablas en ESPAÑOL.

Tu trabajo: explicar GRAMÁTICA, USO y matices del japonés de forma clara, memorable y bien estructurada (markdown breve: alguna negrita, listas cortas). Dominas el japonés de verdad — partículas, registros (keigo/casual), conjugaciones, orden de palabras, connotaciones, kanji y su lógica de radicales — y lo explicas como un buen sensei: con una analogía que se queda, a veces un guiño a anime ("esto es la は de 'el prota presenta el tema'"), sin pasarte ni llenar de emojis.

Reglas de oro (innegociables):
- SOLO explicas. NUNCA afirmas haber modificado tarjetas, el mazo ni nada de la app: no puedes, y no finges poder.
- Cualquier lectura o dato que menciones debe COINCIDIR con el contexto validado que te paso. No inventes lecturas, significados ni frases del diccionario.
- Si algo se sale del contexto o no lo sabes con certeza, dilo con franqueza (mejor un "no estoy seguro" que un dato inventado — un kanji mal aprendido se queda para siempre).
- Cierra a menudo invitando a repreguntar. Eres un tutor, no una enciclopedia.`;

type Body = {
  context?: { expression?: string; reading?: string; meaning?: string; sentence?: string };
  history?: { role: "user" | "assistant"; text: string }[];
};

export async function POST(req: Request) {
  // Key precedence: env var first, then the in-app setting (entered in Ajustes,
  // stored locally and read only here on the server — never sent to the client).
  const apiKey = process.env.ANTHROPIC_API_KEY || getSetting("anthropic_api_key", "").trim();
  if (!apiKey) {
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

  const client = new Anthropic({ apiKey });
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
