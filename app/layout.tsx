import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Splash } from "@/components/Splash";
import { getStreak } from "@/lib/queries";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Akari 灯 — Japonés", template: "%s · Akari" },
  description: "App personal de japonés con SRS (FSRS). Contenido 100% de datasets validados.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} dark`}>
      <head>
        {/* Japanese display face when online; macOS Hiragino is the offline fallback. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Splash />
        <Nav streak={getStreak()} />
        <main className="min-h-screen pb-24 md:pb-0 md:pl-64">{children}</main>
      </body>
    </html>
  );
}
