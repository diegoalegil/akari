import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Akari 灯 — Japonés", template: "%s · Akari" },
  description: "App personal de japonés con SRS (FSRS). Contenido 100% de datasets validados.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0E0F13" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The app is fully client-rendered (offline PWA); theme is applied by AppChrome
  // once the DB loads. Default to dark to avoid a flash.
  return (
    <html lang="es" data-theme="dark" className={inter.variable}>
      <head>
        {/* Japanese display face when online; macOS Hiragino is the offline fallback. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* iOS "Add to Home Screen" needs a raster PNG; SVG is ignored there. */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
