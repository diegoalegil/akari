"use client";

// Last-resort boundary for errors in the root layout itself. Must render its
// own <html>/<body> (it replaces the root layout).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ background: "#0e0f13", color: "#f4f1ec", fontFamily: "Inter, system-ui, sans-serif", margin: 0, minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, color: "#f2b66b" }}>灯</div>
          <h1 style={{ fontWeight: 600 }}>Algo se apagó</h1>
          <p style={{ color: "#aab0bd" }}>Error inesperado en la aplicación.</p>
          <button onClick={reset} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 12, border: "1px solid #2a2e3a", background: "transparent", color: "#f4f1ec", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
