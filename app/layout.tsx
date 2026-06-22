import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Akari 灯 — Japonés",
  description:
    "App personal de japonés con SRS (FSRS). Contenido 100% de datasets validados.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
