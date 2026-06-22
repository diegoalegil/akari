// Placeholder home — becomes the dashboard in Phase 2.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-6xl" style={{ color: "var(--color-ember)" }}>
        灯
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Akari</h1>
      <p className="text-[var(--color-fg-muted)]">
        Scaffold listo. La pipeline de datos (Fase 1) llega a continuación.
      </p>
    </main>
  );
}
