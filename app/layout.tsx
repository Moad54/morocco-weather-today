import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#0b0b0e", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "Morocco Weather Today",
  description: "Live weather, 7-day forecasts, rain probability, radar and alerts across Morocco. Powered by Open-Meteo.",
  applicationName: "Morocco Weather Today",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }], apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: "Maroc Météo", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${arabic.variable}`}>
      <body><div className="bg-orbs" />{children}<RegisterSW /></body>
    </html>
  );
}
